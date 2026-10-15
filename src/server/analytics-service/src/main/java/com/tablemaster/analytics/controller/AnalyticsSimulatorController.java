package com.tablemaster.analytics.controller;

import com.tablemaster.analytics.dto.ApiResponse;
import com.tablemaster.analytics.dto.event.BookingCompletedEvent;
import com.tablemaster.analytics.dto.event.DepositPaidSuccessEvent;
import com.tablemaster.analytics.dto.event.NoShowReportedEvent;
import com.tablemaster.analytics.kafka.AnalyticsKafkaConsumer;
import com.tablemaster.analytics.service.AnalyticsDataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics/test-simulator")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AnalyticsSimulatorController {

    private final AnalyticsKafkaConsumer kafkaConsumer;
    private final AnalyticsDataSeederService seederService;

    /**
     * Giả lập sự kiện khách ăn xong và thanh toán hóa đơn
     */
    @PostMapping("/simulate-booking-completed")
    public ApiResponse<String> simulateBookingCompleted(@RequestBody BookingCompletedEvent event) {
        log.info("[Simulator] Simulating BookingCompletedEvent: {}", event.getBookingId());
        kafkaConsumer.handleBookingCompleted(event);
        return ApiResponse.ok("Đã giả lập xử lý BookingCompletedEvent thành công", event.getBookingId());
    }

    /**
     * Giả lập sự kiện khách thanh toán tiền cọc thành công
     */
    @PostMapping("/simulate-deposit-paid")
    public ApiResponse<String> simulateDepositPaid(@RequestBody DepositPaidSuccessEvent event) {
        log.info("[Simulator] Simulating DepositPaidSuccessEvent: {}", event.getBookingId());
        kafkaConsumer.handleDepositPaid(event);
        return ApiResponse.ok("Đã giả lập xử lý DepositPaidSuccessEvent thành công", event.getBookingId());
    }

    /**
     * Giả lập sự kiện khách bùng hẹn (No-Show) và phạt cọc
     */
    @PostMapping("/simulate-no-show")
    public ApiResponse<String> simulateNoShow(@RequestBody NoShowReportedEvent event) {
        log.info("[Simulator] Simulating NoShowReportedEvent: {}", event.getBookingId());
        kafkaConsumer.handleNoShow(event);
        return ApiResponse.ok("Đã giả lập xử lý NoShowReportedEvent thành công", event.getBookingId());
    }

    /**
     * Nạp dữ liệu mẫu thực tế vào DB để test ngay các API Dashboard
     */
    @PostMapping("/seed-mock-data")
    public ApiResponse<String> seedMockData() {
        log.info("[Simulator] Seeding mock data for Analytics...");
        seederService.forceSeedSampleData();
        return ApiResponse.ok("Nạp dữ liệu mẫu thành công vào database tablemaster_analytics!", "DONE");
    }
}
