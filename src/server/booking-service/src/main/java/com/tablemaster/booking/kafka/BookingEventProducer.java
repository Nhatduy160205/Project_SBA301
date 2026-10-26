package com.tablemaster.booking.kafka;

import com.tablemaster.booking.config.KafkaConfig;
import com.tablemaster.booking.entity.Booking;
import com.tablemaster.booking.entity.OutboxEvent;
import com.tablemaster.booking.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final OutboxEventRepository outboxEventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi event trực tiếp qua Kafka và lưu vào Transactional Outbox để đảm bảo tính tin cậy
     */
    public void publishEvent(String topic, String aggregateType, UUID aggregateId, String eventType, Map<String, Object> payload) {
        // Lưu vào outbox
        OutboxEvent outbox = OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId.toString())
                .eventType(eventType)
                .payload(payload)
                .status("PENDING")
                .retryCount(0)
                .build();

        try {
            kafkaTemplate.send(topic, aggregateId.toString(), payload);
            outbox.setStatus("SENT");
            outbox.setProcessedAt(ZonedDateTime.now());
            log.info("Sent Kafka event to topic [{}]: aggregateId={}, type={}", topic, aggregateId, eventType);
        } catch (Exception e) {
            log.error("Failed to send Kafka event immediately to topic [{}]. Outbox will retry.", topic, e);
        }

        outboxEventRepository.save(outbox);
    }

    private void broadcastWebSocket(String destination, Object payload) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend(destination, payload);
                log.info("Broadcasted WebSocket STOMP message to [{}]", destination);
            } catch (Exception e) {
                log.warn("Không thể broadcast WebSocket tới [{}]: {}", destination, e.getMessage());
            }
        }
    }

    public void publishBookingCreated(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_CREATED, "BOOKING", booking.getId(), "BOOKING_CREATED", payload);
        broadcastWebSocket("/topic/kitchen/kds", payload);
        broadcastWebSocket("/topic/host/table-notes", payload);
        broadcastWebSocket("/topic/bookings", payload);
    }

    public void publishBookingConfirmed(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_CONFIRMED, "BOOKING", booking.getId(), "BOOKING_CONFIRMED", payload);
        broadcastWebSocket("/topic/kitchen/kds", payload);
        broadcastWebSocket("/topic/host/table-notes", payload);
        broadcastWebSocket("/topic/bookings", payload);
    }

    public void publishSpecialRequestsUpdated(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_SPECIAL_REQUESTS, "BOOKING", booking.getId(), "SPECIAL_REQUESTS_UPDATED", payload);
        broadcastWebSocket("/topic/kitchen/kds", payload);
        broadcastWebSocket("/topic/host/table-notes", payload);
        broadcastWebSocket("/topic/bookings", payload);
    }

    public void publishBookingSeated(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_SEATED, "BOOKING", booking.getId(), "BOOKING_SEATED", payload);
    }

    public void publishBookingCompleted(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_COMPLETED, "BOOKING", booking.getId(), "BOOKING_COMPLETED", payload);
    }

    public void publishBookingCancelled(Booking booking, String reason) {
        Map<String, Object> payload = createBookingPayload(booking);
        payload.put("reason", reason);
        publishEvent(KafkaConfig.TOPIC_BOOKING_CANCELLED, "BOOKING", booking.getId(), "BOOKING_CANCELLED", payload);
    }

    public void publishBookingExpired(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_BOOKING_EXPIRED, "BOOKING", booking.getId(), "BOOKING_EXPIRED", payload);
    }

    public void publishTableUpdated(UUID bookingId, UUID fromTableId, UUID toTableId, String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bookingId", bookingId);
        payload.put("fromTableId", fromTableId);
        payload.put("toTableId", toTableId);
        payload.put("reason", reason);
        publishEvent(KafkaConfig.TOPIC_TABLE_UPDATED, "TABLE_OPERATION", bookingId, "TABLE_TRANSFERRED", payload);
    }

    // UC-10: Phát sự kiện Đơn Đặt Tiệc Sự Kiện / Bao Trọn Tầng (EVENT_INQUIRY)
    public void publishEventInquiryCreated(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_EVENT_INQUIRY_CREATED, "BOOKING_EVENT", booking.getId(), "EVENT_INQUIRY_CREATED", payload);

        // Kích hoạt chuông thông báo tới Quản lý ca & Lễ tân qua WebSocket STOMP
        broadcastWebSocket("/topic/manager/event-inquiries", payload);
        broadcastWebSocket("/topic/host/table-notes", payload);
        broadcastWebSocket("/topic/bookings", payload);
    }

    // UC-10: Cập nhật kết quả tư vấn sau cuộc gọi 15 phút của Quản lý ca
    public void publishEventInquiryConsulted(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_EVENT_INQUIRY_CONSULTED, "BOOKING_EVENT", booking.getId(), "EVENT_INQUIRY_CONSULTED", payload);

        broadcastWebSocket("/topic/manager/event-inquiries", payload);
        broadcastWebSocket("/topic/host/table-notes", payload);
        broadcastWebSocket("/topic/bookings", payload);
    }

    // UC-12: Cấp phát vé điện tử kèm mã QR động 64 ký tự chống giả mạo
    public void publishTicketIssued(Booking booking) {
        Map<String, Object> payload = createBookingPayload(booking);
        publishEvent(KafkaConfig.TOPIC_TICKET_ISSUED, "BOOKING_EVENT", booking.getId(), "TICKET_ISSUED", payload);

        broadcastWebSocket("/topic/bookings", payload);
        broadcastWebSocket("/topic/host/checkin", payload);
    }

    // UC-12: Gửi thông báo vé điện tử qua Zalo Notification Service (ZNS)
    public void publishZnsSent(Booking booking, String recipientPhone) {
        Map<String, Object> payload = createBookingPayload(booking);
        payload.put("notificationChannel", "ZNS");
        payload.put("recipientPhone", recipientPhone);
        payload.put("znsTemplateId", "ZNS_ETICKET_CHECKIN_CONFIRMATION");
        publishEvent(KafkaConfig.TOPIC_NOTIFICATION_ZNS_SENT, "NOTIFICATION_EVENT", booking.getId(), "ZNS_SENT", payload);
    }

    // UC-12: Gửi thông báo vé điện tử qua Email
    public void publishEmailSent(Booking booking, String recipientEmail) {
        Map<String, Object> payload = createBookingPayload(booking);
        payload.put("notificationChannel", "EMAIL");
        payload.put("recipientEmail", recipientEmail);
        publishEvent(KafkaConfig.TOPIC_NOTIFICATION_EMAIL_SENT, "NOTIFICATION_EVENT", booking.getId(), "EMAIL_SENT", payload);
    }

    private Map<String, Object> createBookingPayload(Booking booking) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bookingId", booking.getId());
        payload.put("bookingCode", booking.getBookingCode());
        payload.put("userId", booking.getUserId());
        payload.put("guestName", booking.getGuestName());
        payload.put("guestPhone", booking.getGuestPhone());
        payload.put("guestEmail", booking.getGuestEmail());
        payload.put("bookingDate", booking.getBookingDate());
        payload.put("timeSlotId", booking.getTimeSlotId());
        payload.put("guestCount", booking.getGuestCount());
        payload.put("totalDeposit", booking.getTotalDeposit());
        payload.put("status", booking.getStatus().name());
        payload.put("checkinQrToken", booking.getCheckinQrToken());
        payload.put("paymentDeadline", booking.getPaymentDeadline());
        payload.put("occasion", booking.getOccasion());
        payload.put("dietaryNotes", booking.getDietaryNotes());
        payload.put("babyChairCount", booking.getBabyChairCount() != null ? booking.getBabyChairCount() : 0);
        payload.put("candleSetup", Boolean.TRUE.equals(booking.getCandleSetup()));
        payload.put("specialNotes", booking.getSpecialNotes());
        payload.put("staffNotes", booking.getStaffNotes());
        // UC-10: Private Banquet & Event Inquiry
        payload.put("eventType", booking.getEventType());
        payload.put("targetFloor", booking.getTargetFloor());
        payload.put("companyName", booking.getCompanyName());
        payload.put("estimatedBudget", booking.getEstimatedBudget());
        payload.put("stageAudioRequired", Boolean.TRUE.equals(booking.getStageAudioRequired()));
        payload.put("decorationRequired", Boolean.TRUE.equals(booking.getDecorationRequired()));
        payload.put("callbackDeadline", booking.getCallbackDeadline());
        payload.put("managerCallStatus", booking.getManagerCallStatus());
        payload.put("consultationNotes", booking.getConsultationNotes());
        // UC-12: E-Ticket & Dynamic QR 64 ký tự
        payload.put("ticketIssuedAt", booking.getTicketIssuedAt());
        payload.put("ticketZnsStatus", booking.getTicketZnsStatus());
        payload.put("ticketEmailStatus", booking.getTicketEmailStatus());
        payload.put("qrRotationCounter", booking.getQrRotationCounter() != null ? booking.getQrRotationCounter() : 1);
        payload.put("checkinScannedAt", booking.getCheckinScannedAt());

        if (booking.getBookingTables() != null && !booking.getBookingTables().isEmpty()) {
            List<String> tableIds = booking.getBookingTables().stream()
                    .map(bt -> bt.getId().getTableId().toString())
                    .collect(java.util.stream.Collectors.toList());
            payload.put("tableIds", tableIds);
        }

        if (booking.getPreorderItems() != null && !booking.getPreorderItems().isEmpty()) {
            java.util.List<Map<String, Object>> items = booking.getPreorderItems().stream()
                    .map(i -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", i.getId());
                        map.put("menuItemId", i.getMenuItemId());
                        map.put("itemName", i.getItemName());
                        map.put("quantity", i.getQuantity());
                        map.put("unitPrice", i.getUnitPrice());
                        map.put("subtotal", i.getSubtotal());
                        map.put("notes", i.getNotes());
                        return map;
                    })
                    .collect(java.util.stream.Collectors.toList());
            payload.put("preorderItems", items);
        }

        return payload;
    }
}
