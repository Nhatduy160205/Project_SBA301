package com.tablemaster.analytics.kafka;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tablemaster.analytics.dto.event.BookingCompletedEvent;
import com.tablemaster.analytics.dto.event.DepositPaidSuccessEvent;
import com.tablemaster.analytics.dto.event.NoShowReportedEvent;
import com.tablemaster.analytics.service.DailyShiftAnalyticsService;
import com.tablemaster.analytics.service.TablePopularityService;
import com.tablemaster.analytics.service.VipCustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsKafkaConsumer {

    private final DailyShiftAnalyticsService shiftService;
    private final TablePopularityService tableService;
    private final VipCustomerService vipService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @KafkaListener(topics = "booking-events", groupId = "analytics-service-group")
    public void consumeBookingEvents(String payload) {
        log.info("[Kafka] Received event on 'booking-events': {}", payload);
        try {
            JsonNode root = objectMapper.readTree(payload);
            String status = root.has("status") ? root.get("status").asText() : "";

            if ("COMPLETED".equalsIgnoreCase(status) || root.has("foodBill")) {
                BookingCompletedEvent event = objectMapper.treeToValue(root, BookingCompletedEvent.class);
                handleBookingCompleted(event);
            } else if ("NO_SHOW".equalsIgnoreCase(status)) {
                NoShowReportedEvent event = objectMapper.treeToValue(root, NoShowReportedEvent.class);
                handleNoShow(event);
            } else {
                log.info("[Kafka] Booking event status '{}' ignored by Analytics.", status);
            }
        } catch (Exception e) {
            log.error("[Kafka] Failed to process message from 'booking-events': {}", payload, e);
        }
    }

    @KafkaListener(topics = "payment-events", groupId = "analytics-service-group")
    public void consumePaymentEvents(String payload) {
        log.info("[Kafka] Received event on 'payment-events': {}", payload);
        try {
            JsonNode root = objectMapper.readTree(payload);
            String status = root.has("status") ? root.get("status").asText() : "SUCCESS";

            if ("SUCCESS".equalsIgnoreCase(status) || root.has("depositAmount") || root.has("amount")) {
                DepositPaidSuccessEvent event = objectMapper.treeToValue(root, DepositPaidSuccessEvent.class);
                if (event.getDepositAmount() == null && root.has("amount")) {
                    event.setDepositAmount(new BigDecimal(root.get("amount").asText()));
                }
                handleDepositPaid(event);
            }
        } catch (Exception e) {
            log.error("[Kafka] Failed to process message from 'payment-events': {}", payload, e);
        }
    }

    public void handleBookingCompleted(BookingCompletedEvent event) {
        log.info("Processing BookingCompletedEvent for bookingId={}, foodBill={}", event.getBookingId(), event.getFoodBill());

        LocalDate date = parseDate(event.getDate());
        UUID slotId = parseUuid(event.getSlotId());
        UUID tableId = parseUuid(event.getTableId());
        UUID userId = parseUuid(event.getUserId());

        // 1. Update daily shift revenue & RevPASH
        if (slotId != null) {
            shiftService.recordBookingCompletion(
                    date, slotId, event.getSlotName(),
                    event.getFoodBill(),
                    event.getGuestCount() != null ? event.getGuestCount() : 2
            );
        }

        // 2. Update table popularity stats & heatmap
        if (tableId != null) {
            tableService.recordTableCompletion(
                    tableId,
                    event.getTableCode(),
                    event.getZoneType(),
                    event.getFoodBill()
            );
        }

        // 3. Update VIP customer insights & loyalty tier
        if (userId != null) {
            vipService.recordCustomerMeal(
                    userId,
                    event.getPhoneNumber(),
                    event.getCustomerName(),
                    event.getGuestCount() != null ? event.getGuestCount() : 2,
                    event.getFoodBill(),
                    event.getZoneType(),
                    date
            );
        }
    }

    public void handleDepositPaid(DepositPaidSuccessEvent event) {
        log.info("Processing DepositPaidSuccessEvent for bookingId={}, deposit={}", event.getBookingId(), event.getDepositAmount());

        LocalDate date = parseDate(event.getDate());
        UUID slotId = parseUuid(event.getSlotId());

        if (slotId != null) {
            shiftService.recordBookingDeposit(date, slotId, event.getSlotName(), event.getDepositAmount());
        }
    }

    public void handleNoShow(NoShowReportedEvent event) {
        log.info("Processing NoShowReportedEvent for bookingId={}, penalty={}", event.getBookingId(), event.getPenaltyAmount());

        LocalDate date = parseDate(event.getDate());
        UUID slotId = parseUuid(event.getSlotId());

        if (slotId != null) {
            shiftService.recordNoShow(date, slotId, event.getSlotName(), event.getPenaltyAmount());
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private UUID parseUuid(String uuidStr) {
        if (uuidStr == null || uuidStr.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(uuidStr);
        } catch (Exception e) {
            return UUID.nameUUIDFromBytes(uuidStr.getBytes());
        }
    }
}
