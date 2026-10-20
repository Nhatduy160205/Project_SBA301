package com.tablemaster.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemaster.booking.client.RestaurantServiceClient;
import com.tablemaster.booking.client.model.RestaurantTableInfo;
import com.tablemaster.booking.dto.request.HoldTableRequest;
import com.tablemaster.booking.dto.request.ReleaseHoldRequest;
import com.tablemaster.booking.dto.response.HoldTableResponse;
import com.tablemaster.booking.exception.TableAlreadyBookedException;
import com.tablemaster.booking.exception.TableAlreadyLockedException;
import com.tablemaster.booking.kafka.BookingEventProducer;
import com.tablemaster.booking.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho UC-06: Khóa Giữ bàn 5 phút & Xử lý Tranh chấp (Redlock Concurrency Hold)
 * Kiểm tra BR-02:
 * 1. Khóa thành công trong 200ms -> Trạng thái HOLDING, TTL 300s, broadcast STOMP màu vàng.
 * 2. Tranh chấp thất bại (tryLock false) -> Ném ngoại lệ TableAlreadyLockedException (409 Conflict).
 * 3. Đã có người giữ trước trên Redis -> Báo lỗi 409 Conflict.
 * 4. Đã có đơn đặt trong CSDL -> Báo lỗi bàn đã bị đặt.
 * 5. Giải phóng bàn -> Trả về AVAILABLE, broadcast màu xanh lá.
 */
@ExtendWith(MockitoExtension.class)
class TableHoldServiceTest {

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingEventProducer bookingEventProducer;

    @Mock
    private RestaurantServiceClient restaurantClient;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private RLock lock;

    @InjectMocks
    private TableHoldServiceImpl tableHoldService;

    private UUID tableId;
    private UUID timeSlotId;
    private UUID userId;
    private LocalDate bookingDate;

    @BeforeEach
    void setUp() {
        tableId = UUID.fromString("b3000000-0000-0000-0000-000000000002");
        timeSlotId = UUID.fromString("b1000000-0000-0000-0000-000000000002");
        userId = UUID.fromString("a0000000-0000-0000-0000-000000000005");
        bookingDate = LocalDate.now();

        lenient().when(redissonClient.getLock(anyString())).thenReturn(lock);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("UC-06 [Success]: Khách chọn bàn trống -> Lấy Redlock thành công, giữ 300s, broadcast STOMP màu VÀNG")
    void holdTable_success() throws Exception {
        // Arrange
        HoldTableRequest request = HoldTableRequest.builder()
                .tableId(tableId)
                .tableCode("WIN-01")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(2)
                .floorNumber(1)
                .build();

        when(lock.tryLock(anyLong(), anyLong(), eq(TimeUnit.MILLISECONDS))).thenReturn(true);
        when(lock.isHeldByCurrentThread()).thenReturn(true);
        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(Collections.emptyList());
        when(valueOperations.get("table:hold:" + tableId)).thenReturn(null);
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"holdToken\":\"token-123\"}");

        // Act
        HoldTableResponse response = tableHoldService.holdTable(request, userId);

        // Assert
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("HOLDING", response.getStatus());
        assertEquals("YELLOW", response.getColor());
        assertEquals(300L, response.getHoldDurationSeconds());
        assertNotNull(response.getHoldToken());
        assertNotNull(response.getExpiresAt());

        // Verify Redis set với TTL 300 giây
        verify(valueOperations, times(2)).set(anyString(), anyString(), eq(300L), eq(TimeUnit.SECONDS));

        // Verify broadcast WebSocket STOMP
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/tables/status"), any(Object.class));

        // Verify giải phóng distributed lock sau khi hoàn tất
        verify(lock).unlock();
    }

    @Test
    @DisplayName("UC-06 [Race Condition]: Tranh chấp lock thất bại (>200ms) -> Ném TableAlreadyLockedException (409 Conflict)")
    void holdTable_conflictWhenLockCannotBeAcquired() throws Exception {
        // Arrange
        HoldTableRequest request = HoldTableRequest.builder()
                .tableId(tableId)
                .tableCode("WIN-01")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .build();

        // Mô phỏng 2 khách cùng bấm: luồng này không lấy được lock trong 200ms
        when(lock.tryLock(anyLong(), anyLong(), eq(TimeUnit.MILLISECONDS))).thenReturn(false);
        when(lock.isHeldByCurrentThread()).thenReturn(false);

        // Act & Assert
        TableAlreadyLockedException ex = assertThrows(
                TableAlreadyLockedException.class,
                () -> tableHoldService.holdTable(request, userId)
        );

        assertTrue(ex.getMessage().contains("đang có người thao tác"));
        verify(valueOperations, never()).set(anyString(), anyString(), anyLong(), any());
    }

    @Test
    @DisplayName("UC-06 [Conflict Redis]: Bàn đã bị người khác giữ trước -> Ném TableAlreadyLockedException (409 Conflict)")
    void holdTable_conflictWhenAlreadyHeldInRedis() throws Exception {
        // Arrange
        HoldTableRequest request = HoldTableRequest.builder()
                .tableId(tableId)
                .tableCode("WIN-01")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .build();

        when(lock.tryLock(anyLong(), anyLong(), eq(TimeUnit.MILLISECONDS))).thenReturn(true);
        when(lock.isHeldByCurrentThread()).thenReturn(true);
        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(Collections.emptyList());

        // Đã có JSON giữ chỗ của khách hàng khác
        String otherUserHoldJson = "{\"holdToken\":\"other-token\",\"userId\":\"other-user\"}";
        when(valueOperations.get("table:hold:" + tableId)).thenReturn(otherUserHoldJson);
        when(objectMapper.readValue(eq(otherUserHoldJson), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(java.util.Map.of("holdToken", "other-token", "userId", "other-user"));

        // Act & Assert
        TableAlreadyLockedException ex = assertThrows(
                TableAlreadyLockedException.class,
                () -> tableHoldService.holdTable(request, userId)
        );

        assertTrue(ex.getMessage().contains("vừa có người chọn trước"));
        verify(lock).unlock();
    }

    @Test
    @DisplayName("UC-06 [Conflict DB]: Bàn đã có đơn đặt trong PostgreSQL -> Ném TableAlreadyBookedException")
    void holdTable_conflictWhenBookedInDatabase() throws Exception {
        // Arrange
        HoldTableRequest request = HoldTableRequest.builder()
                .tableId(tableId)
                .tableCode("WIN-01")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .build();

        when(lock.tryLock(anyLong(), anyLong(), eq(TimeUnit.MILLISECONDS))).thenReturn(true);
        when(lock.isHeldByCurrentThread()).thenReturn(true);
        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(List.of(tableId));

        // Act & Assert
        assertThrows(
                TableAlreadyBookedException.class,
                () -> tableHoldService.holdTable(request, userId)
        );

        verify(lock).unlock();
    }

    @Test
    @DisplayName("UC-06 [Release]: Giải phóng bàn thành công -> Xóa Redis & Broadcast STOMP màu XANH LÁ (AVAILABLE)")
    void releaseHold_success() throws Exception {
        // Arrange
        ReleaseHoldRequest request = ReleaseHoldRequest.builder()
                .tableId(tableId)
                .holdToken("token-123")
                .tableCode("WIN-01")
                .build();

        when(lock.tryLock(anyLong(), anyLong(), eq(TimeUnit.MILLISECONDS))).thenReturn(true);
        when(lock.isHeldByCurrentThread()).thenReturn(true);

        // Act
        tableHoldService.releaseHold(request, userId);

        // Assert
        verify(redisTemplate).delete("table:hold:" + tableId);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/tables/status"), any(Object.class));
        verify(lock).unlock();
    }
}
