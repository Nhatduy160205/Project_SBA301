package com.tablemaster.analytics.kafka;

import com.tablemaster.analytics.event.DepositPaidSuccessEvent;
import com.tablemaster.analytics.event.NoShowReportedEvent;
import com.tablemaster.analytics.service.DailyShiftAnalyticsService;
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

    @KafkaListener(topics = "payment.deposit.success", groupId = "analytics-group")
    public void consumeDepositPaid(DepositPaidSuccessEvent event) {
        log.info("[Kafka] Nhận sự kiện payment.deposit.success: bookingId={}, amount={}", event.getBookingId(), event.getDepositAmount());
        handleDepositPaid(event);
    }

    @KafkaListener(topics = "booking.no-show", groupId = "analytics-group")
    public void consumeNoShow(NoShowReportedEvent event) {
        log.info("[Kafka] Nhận sự kiện booking.no-show: bookingId={}, penalty={}", event.getBookingId(), event.getPenaltyAmount());
        handleNoShow(event);
    }

    public void handleDepositPaid(DepositPaidSuccessEvent event) {
        if (event == null || event.getBookingId() == null) {
            log.warn("[Security] Bỏ qua DepositPaidSuccessEvent không hợp lệ");
            return;
        }

        LocalDate date = parseDate(event.getDate());
        UUID slotId = parseUuid(event.getSlotId());

        if (slotId != null) {
            shiftService.recordBookingDeposit(date, slotId, event.getSlotName(), event.getDepositAmount());
        }
    }

    public void handleNoShow(NoShowReportedEvent event) {
        if (event == null || event.getBookingId() == null) {
            log.warn("[Security] Bỏ qua NoShowReportedEvent không hợp lệ");
            return;
        }

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