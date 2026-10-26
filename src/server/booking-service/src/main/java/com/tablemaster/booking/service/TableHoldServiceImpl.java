package com.tablemaster.booking.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemaster.booking.client.RestaurantServiceClient;
import com.tablemaster.booking.client.model.RestaurantTableInfo;
import com.tablemaster.booking.config.KafkaConfig;
import com.tablemaster.booking.dto.request.HoldTableRequest;
import com.tablemaster.booking.dto.request.ReleaseHoldRequest;
import com.tablemaster.booking.dto.response.HoldTableResponse;
import com.tablemaster.booking.dto.response.TableStateUpdateDto;
import com.tablemaster.booking.enums.BookingStatus;
import com.tablemaster.booking.exception.TableAlreadyBookedException;
import com.tablemaster.booking.exception.TableAlreadyLockedException;
import com.tablemaster.booking.kafka.BookingEventProducer;
import com.tablemaster.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Hiện thực UC-06: Khóa Giữ bàn 5 phút & Xử lý Tranh chấp (Redlock Concurrency Hold)
 * Tuân thủ quy tắc BR-02:
 * - Khi khách bấm chọn bàn, Redis Redlock cấp phát thời hạn đúng 300 giây.
 * - Chống race condition tuyệt đối (Double-Booking) qua Distributed Lock.
 * - Broadcast WebSocket STOMP đổi màu bàn sang Vàng (HOLDING) kèm đếm ngược 05:00.
 * - Trả về HTTP 409 Conflict nếu tranh chấp thất bại.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TableHoldServiceImpl implements TableHoldService {

    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final BookingRepository bookingRepository;
    private final BookingEventProducer bookingEventProducer;
    private final RestaurantServiceClient restaurantClient;
    private final ObjectMapper objectMapper;

    // Bộ nhớ đệm cục bộ theo dõi các phiên giữ bàn để auto-release (UC-A1)
    private final Map<UUID, ActiveHoldEntry> activeHolds = new ConcurrentHashMap<>();

    private static final long HOLD_DURATION_SECONDS = 300L; // 5 phút = 300 giây (BR-02)
    private static final long LOCK_WAIT_MS = 200L;          // Thời gian tối đa chờ lock: 200ms
    private static final long LOCK_LEASE_MS = 5000L;        // Thời gian lease tối đa của distributed lock: 5 giây

    private static final List<BookingStatus> OCCUPIED_STATUSES = List.of(
            BookingStatus.CONFIRMED,
            BookingStatus.SEATED,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.PENDING_REVIEW
    );

    private record ActiveHoldEntry(
            UUID tableId,
            String tableCode,
            Integer floorNumber,
            String holdToken,
            UUID userId,
            Instant expiresAt
    ) {}

    @Override
    public HoldTableResponse holdTable(HoldTableRequest request, UUID userId) {
        if (request == null || request.getTableId() == null) {
            throw new IllegalArgumentException("tableId không được để trống");
        }

        UUID tableId = request.getTableId();
        LocalDate bookingDate = request.getBookingDate() != null ? request.getBookingDate() : LocalDate.now();
        UUID timeSlotId = request.getTimeSlotId();
        String slotPart = timeSlotId != null ? timeSlotId.toString() : "all";
        UUID customerId = userId != null ? userId : UUID.fromString("a0000000-0000-0000-0000-000000000005");

        // 1. Nếu khách hàng đang đổi từ bàn khác sang bàn này, giải phóng bàn cũ trước
        if (request.getPreviousTableId() != null && !request.getPreviousTableId().equals(tableId)) {
            log.info("Khách hàng {} đổi bàn từ {} sang {}, giải phóng bàn cũ",
                    customerId, request.getPreviousTableId(), tableId);
            releaseHoldByTableId(request.getPreviousTableId(), request.getPreviousHoldToken());
        }

        // 2. Khóa định danh phân tán Redlock: lock:table:{tableId}:{date}:{slotId}
        String lockKey = String.format("lock:table:%s:%s:%s", tableId, bookingDate, slotPart);
        RLock lock = redissonClient.getLock(lockKey);

        String tableCode = resolveTableCode(request);
        Integer floorNumber = request.getFloorNumber() != null ? request.getFloorNumber() : 1;

        try {
            // 3. Thử acquire lock trong tối đa 200ms (BR-02)
            boolean isLocked = lock.tryLock(LOCK_WAIT_MS, LOCK_LEASE_MS, TimeUnit.MILLISECONDS);
            if (!isLocked) {
                log.warn("⚠️ Tranh chấp bàn: Không lấy được Redlock cho bàn {} ({}) trong 200ms", tableCode, tableId);
                throw new TableAlreadyLockedException(
                        String.format("Bàn %s đang có người thao tác, vui lòng chọn bàn khác!", tableCode));
            }

            // 4. Kiểm tra trong PostgreSQL xem bàn đã bị đặt trước trong ca giờ này chưa
            List<UUID> bookedTableIds = bookingRepository.findBookedTableIds(
                    bookingDate, timeSlotId, OCCUPIED_STATUSES);
            if (bookedTableIds.contains(tableId)) {
                log.warn("⚠️ Bàn {} đã có đơn đặt trong CSDL tại ngày {}, ca {}", tableCode, bookingDate, timeSlotId);
                throw new TableAlreadyBookedException(tableId);
            }

            // 5. Kiểm tra trong Redis xem có khách hàng khác đang HOLDING bàn này không
            String holdKeyGeneric = "table:hold:" + tableId;
            String holdKeySpecific = String.format("table:hold:%s:%s:%s", tableId, bookingDate, slotPart);

            String existingHoldJson = redisTemplate.opsForValue().get(holdKeyGeneric);
            if (existingHoldJson != null && !existingHoldJson.isBlank()) {
                try {
                    Map<String, Object> data = objectMapper.readValue(existingHoldJson, new TypeReference<>() {});
                    String heldToken = (String) data.get("holdToken");
                    String heldUser = (String) data.get("userId");

                    // Nếu người đang giữ không phải là khách này
                    if (request.getPreviousHoldToken() == null || !request.getPreviousHoldToken().equals(heldToken)) {
                        log.warn("⚠️ Bàn {} đang bị giữ chỗ bởi user={}, token={}", tableCode, heldUser, heldToken);
                        throw new TableAlreadyLockedException(
                                String.format("Bàn %s vừa có người chọn trước, vui lòng chọn bàn khác!", tableCode));
                    }
                } catch (TableAlreadyLockedException e) {
                    throw e;
                } catch (Exception e) {
                    log.warn("Lỗi đọc dữ liệu giữ chỗ cũ của bàn {}: {}", tableId, e.getMessage());
                }
            }

            // 6. Tạo phiên giữ bàn mới với TTL 300 giây (05:00)
            String holdToken = UUID.randomUUID().toString();
            Instant now = Instant.now();
            Instant expiresAt = now.plusSeconds(HOLD_DURATION_SECONDS);

            Map<String, Object> holdData = new HashMap<>();
            holdData.put("tableId", tableId.toString());
            holdData.put("tableCode", tableCode);
            holdData.put("floorNumber", floorNumber);
            holdData.put("holdToken", holdToken);
            holdData.put("userId", customerId.toString());
            holdData.put("bookingDate", bookingDate.toString());
            holdData.put("timeSlotId", timeSlotId != null ? timeSlotId.toString() : null);
            holdData.put("heldAt", now.toString());
            holdData.put("expiresAt", expiresAt.toString());

            String holdDataJson = objectMapper.writeValueAsString(holdData);

            // Ghi vào Redis với TTL đúng 300 giây (BR-02)
            redisTemplate.opsForValue().set(holdKeyGeneric, holdDataJson, HOLD_DURATION_SECONDS, TimeUnit.SECONDS);
            redisTemplate.opsForValue().set(holdKeySpecific, holdDataJson, HOLD_DURATION_SECONDS, TimeUnit.SECONDS);

            // Lưu vào map cục bộ phục vụ auto-release
            activeHolds.put(tableId, new ActiveHoldEntry(
                    tableId, tableCode, floorNumber, holdToken, customerId, expiresAt
            ));

            log.info("🔒 [UC-06 Redlock] Giữ bàn thành công: Bàn={}, Token={}, Hết hạn sau 300s ({})",
                    tableCode, holdToken, expiresAt);

            // 7. Broadcast sự kiện WebSocket STOMP tới tất cả client đang xem sơ đồ mặt bằng
            TableStateUpdateDto wsEvent = TableStateUpdateDto.builder()
                    .tableId(tableId)
                    .tableCode(tableCode)
                    .floorPlanId(request.getFloorPlanId())
                    .floorNumber(floorNumber)
                    .status("HOLDING")
                    .color("YELLOW")
                    .expiresAt(expiresAt)
                    .remainingSeconds(HOLD_DURATION_SECONDS)
                    .holdToken(holdToken)
                    .heldByUserId(customerId)
                    .message(String.format("Bàn %s đang được giữ chỗ 5 phút", tableCode))
                    .build();

            broadcastTableState(wsEvent);

            // 8. Bắn event Kafka qua Outbox (đồng bộ microservices khác)
            publishTableHoldKafkaEvent(tableId, tableCode, holdToken, expiresAt, customerId);

            return HoldTableResponse.builder()
                    .success(true)
                    .holdToken(holdToken)
                    .tableId(tableId)
                    .tableCode(tableCode)
                    .floorNumber(floorNumber)
                    .expiresAt(expiresAt)
                    .holdDurationSeconds(HOLD_DURATION_SECONDS)
                    .status("HOLDING")
                    .color("YELLOW")
                    .message(String.format("Đã giữ chỗ bàn %s thành công trong 5 phút. Vui lòng hoàn tất đặt bàn!", tableCode))
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Gián đoạn khi xử lý Redlock cho bàn {}", tableId, e);
            throw new RuntimeException("Hệ thống gián đoạn khi xử lý khóa giữ bàn");
        } catch (TableAlreadyLockedException | TableAlreadyBookedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi không mong muốn khi giữ bàn {}: {}", tableId, e.getMessage(), e);
            throw new RuntimeException("Lỗi hệ thống khi khóa giữ bàn: " + e.getMessage());
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock(); // Luôn giải phóng distributed lock sau khi hoàn tất nghiệp vụ
            }
        }
    }

    @Override
    public void releaseHold(ReleaseHoldRequest request, UUID userId) {
        if (request == null || request.getTableId() == null) return;
        releaseHoldByTableId(request.getTableId(), request.getHoldToken());
    }

    @Override
    public void releaseHoldByTableId(UUID tableId, String holdToken) {
        if (tableId == null) return;

        String lockKey = "lock:table:release:" + tableId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            boolean locked = lock.tryLock(200, 3000, TimeUnit.MILLISECONDS);
            if (locked) {
                String holdKeyGeneric = "table:hold:" + tableId;
                String existing = redisTemplate.opsForValue().get(holdKeyGeneric);
                String tableCode = "Bàn";
                Integer floorNumber = 1;

                if (existing != null) {
                    try {
                        Map<String, Object> data = objectMapper.readValue(existing, new TypeReference<>() {});
                        tableCode = (String) data.getOrDefault("tableCode", "Bàn");
                        Object fn = data.get("floorNumber");
                        if (fn instanceof Number n) floorNumber = n.intValue();
                    } catch (Exception ignored) {}
                }

                // Xóa khỏi Redis
                redisTemplate.delete(holdKeyGeneric);
                activeHolds.remove(tableId);

                log.info("🔓 [UC-06 Release] Đã giải phóng bàn {} ({})", tableCode, tableId);

                // Broadcast WebSocket STOMP đổi màu bàn về XANH (AVAILABLE)
                TableStateUpdateDto wsEvent = TableStateUpdateDto.builder()
                        .tableId(tableId)
                        .tableCode(tableCode)
                        .floorNumber(floorNumber)
                        .status("AVAILABLE")
                        .color("GREEN")
                        .remainingSeconds(0L)
                        .message(String.format("Bàn %s đã trống và sẵn sàng chọn", tableCode))
                        .build();

                broadcastTableState(wsEvent);

                // Bắn Kafka event giải phóng bàn
                Map<String, Object> payload = new HashMap<>();
                payload.put("tableId", tableId);
                payload.put("tableCode", tableCode);
                payload.put("status", "AVAILABLE");
                payload.put("releasedAt", Instant.now().toString());
                bookingEventProducer.publishEvent(
                        KafkaConfig.TOPIC_TABLE_UPDATED, "TABLE_OPERATION", tableId, "TABLE_RELEASED", payload);
            }
        } catch (Exception e) {
            log.error("Lỗi khi giải phóng bàn {}: {}", tableId, e.getMessage());
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    public TableStateUpdateDto getHoldStatus(UUID tableId) {
        if (tableId == null) return null;

        String holdKey = "table:hold:" + tableId;
        String json = redisTemplate.opsForValue().get(holdKey);
        if (json == null || json.isBlank()) {
            return TableStateUpdateDto.builder()
                    .tableId(tableId)
                    .status("AVAILABLE")
                    .color("GREEN")
                    .remainingSeconds(0L)
                    .build();
        }

        try {
            Map<String, Object> data = objectMapper.readValue(json, new TypeReference<>() {});
            String expiresAtStr = (String) data.get("expiresAt");
            Instant expiresAt = expiresAtStr != null ? Instant.parse(expiresAtStr) : Instant.now();
            long remaining = Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());

            String tableCode = (String) data.getOrDefault("tableCode", "Bàn");
            Integer floorNumber = 1;
            Object fn = data.get("floorNumber");
            if (fn instanceof Number n) floorNumber = n.intValue();

            return TableStateUpdateDto.builder()
                    .tableId(tableId)
                    .tableCode(tableCode)
                    .floorNumber(floorNumber)
                    .status("HOLDING")
                    .color("YELLOW")
                    .expiresAt(expiresAt)
                    .remainingSeconds(remaining)
                    .holdToken((String) data.get("holdToken"))
                    .message(String.format("Bàn %s đang được giữ chỗ (%d giây còn lại)", tableCode, remaining))
                    .build();
        } catch (Exception e) {
            log.warn("Lỗi phân giải hold status cho bàn {}: {}", tableId, e.getMessage());
            return TableStateUpdateDto.builder()
                    .tableId(tableId)
                    .status("AVAILABLE")
                    .color("GREEN")
                    .remainingSeconds(0L)
                    .build();
        }
    }

    @Override
    public void autoReleaseExpiredHolds() {
        if (activeHolds.isEmpty()) return;

        Instant now = Instant.now();
        List<UUID> expiredTableIds = new ArrayList<>();

        for (Map.Entry<UUID, ActiveHoldEntry> entry : activeHolds.entrySet()) {
            ActiveHoldEntry hold = entry.getValue();
            if (now.isAfter(hold.expiresAt())) {
                expiredTableIds.add(entry.getKey());
            }
        }

        for (UUID tableId : expiredTableIds) {
            ActiveHoldEntry hold = activeHolds.remove(tableId);
            if (hold != null) {
                log.info("⏰ [UC-A1 Auto-Release] Bàn {} ({}) đã hết hạn 300 giây giữ chỗ. Tự động giải phóng về màu Xanh!",
                        hold.tableCode(), tableId);

                // Xóa khỏi Redis
                redisTemplate.delete("table:hold:" + tableId);

                // Broadcast WebSocket STOMP
                TableStateUpdateDto wsEvent = TableStateUpdateDto.builder()
                        .tableId(tableId)
                        .tableCode(hold.tableCode())
                        .floorNumber(hold.floorNumber())
                        .status("AVAILABLE")
                        .color("GREEN")
                        .remainingSeconds(0L)
                        .message(String.format("Hết hạn 5 phút giữ chỗ. Bàn %s đã tự động giải phóng", hold.tableCode()))
                        .build();

                broadcastTableState(wsEvent);
            }
        }
    }

    private void broadcastTableState(TableStateUpdateDto event) {
        try {
            // Broadcast đến topic chung cho toàn bộ sơ đồ
            messagingTemplate.convertAndSend("/topic/tables/status", event);
            messagingTemplate.convertAndSend("/topic/floor-plan", event);

            // Broadcast theo từng tầng nếu có thông tin floorNumber
            if (event.getFloorNumber() != null) {
                messagingTemplate.convertAndSend("/topic/floor/" + event.getFloorNumber(), event);
            }
        } catch (Exception e) {
            log.warn("Không thể broadcast WebSocket event cho bàn {}: {}", event.getTableId(), e.getMessage());
        }
    }

    private void publishTableHoldKafkaEvent(UUID tableId, String tableCode, String holdToken, Instant expiresAt, UUID customerId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("tableId", tableId);
            payload.put("tableCode", tableCode);
            payload.put("holdToken", holdToken);
            payload.put("userId", customerId);
            payload.put("status", "HOLDING");
            payload.put("expiresAt", expiresAt.toString());

            bookingEventProducer.publishEvent(
                    KafkaConfig.TOPIC_TABLE_UPDATED, "TABLE_OPERATION", tableId, "TABLE_HELD", payload);
        } catch (Exception e) {
            log.warn("Không thể gửi Kafka event cho bàn {}: {}", tableId, e.getMessage());
        }
    }

    private String resolveTableCode(HoldTableRequest request) {
        if (request.getTableCode() != null && !request.getTableCode().isBlank()) {
            return request.getTableCode();
        }
        try {
            List<RestaurantTableInfo> allTables = restaurantClient.getAllTables();
            for (RestaurantTableInfo t : allTables) {
                if (t.getId() != null && t.getId().equals(request.getTableId())) {
                    return t.getTableCode();
                }
            }
        } catch (Exception ignored) {}
        return "T-" + request.getTableId().toString().substring(0, 4).toUpperCase();
    }
}
