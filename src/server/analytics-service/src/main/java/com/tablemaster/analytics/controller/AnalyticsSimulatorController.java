package com.tablemaster.analytics.controller;

import com.tablemaster.analytics.dto.response.ApiResponse;
import com.tablemaster.analytics.event.DepositPaidSuccessEvent;
import com.tablemaster.analytics.event.NoShowReportedEvent;
import com.tablemaster.analytics.kafka.AnalyticsKafkaConsumer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics/test-simulator")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Validated
@Slf4j
public class AnalyticsSimulatorController {

    private final AnalyticsKafkaConsumer kafkaConsumer;

    @PostMapping("/simulate-deposit-paid")
    public ApiResponse<String> simulateDepositPaid(@Valid @RequestBody DepositPaidSuccessEvent event) {
        log.info("[Simulator] Simulating DepositPaidSuccessEvent: {}", event.getBookingId());
        kafkaConsumer.handleDepositPaid(event);
        return ApiResponse.ok("Đã giả lập xử lý DepositPaidSuccessEvent thành công", event.getBookingId());
    }

    @PostMapping("/simulate-no-show")
    public ApiResponse<String> simulateNoShow(@Valid @RequestBody NoShowReportedEvent event) {
        log.info("[Simulator] Simulating NoShowReportedEvent: {}", event.getBookingId());
        kafkaConsumer.handleNoShow(event);
        return ApiResponse.ok("Đã giả lập xử lý NoShowReportedEvent thành công", event.getBookingId());
    }
}