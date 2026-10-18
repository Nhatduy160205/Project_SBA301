package com.tablemaster.analytics;

import com.tablemaster.analytics.dto.response.DailyShiftSummaryResponse;
import com.tablemaster.analytics.entity.DailyShiftMetric;
import com.tablemaster.analytics.repository.DailyShiftMetricRepository;
import com.tablemaster.analytics.service.DailyShiftAnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceUnitTest {

    @Mock
    private DailyShiftMetricRepository shiftRepo;

    @InjectMocks
    private DailyShiftAnalyticsService shiftService;

    @Test
    @DisplayName("UC-32: Tính toán RevPASH & Tỷ lệ lấp đầy khi khách hoàn tất dùng bữa")
    void testRevpashAndOccupancyCalculation() {
        LocalDate date = LocalDate.of(2026, 10, 24);
        UUID slotId = UUID.randomUUID();

        DailyShiftMetric existingMetric = DailyShiftMetric.builder()
                .metricDate(date)
                .timeSlotId(slotId)
                .slotName("Ca tối Giờ Vàng (18:30 - 20:30)")
                .totalBookings(10)
                .totalSeated(9)
                .totalNoShows(0)
                .totalFoodRevenue(new BigDecimal("30000000.00"))
                .noShowPenaltyIncome(BigDecimal.ZERO)
                .totalDepositCollected(new BigDecimal("2000000.00"))
                .revpashScore(BigDecimal.ZERO)
                .occupancyRate(0.0f)
                .build();

        when(shiftRepo.findByMetricDateAndTimeSlotId(date, slotId)).thenReturn(Optional.of(existingMetric));
        when(shiftRepo.save(any(DailyShiftMetric.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Khách ăn xong hóa đơn 5.000.000 VNĐ
        DailyShiftMetric updated = shiftService.recordBookingCompletion(date, slotId, "Ca tối Giờ Vàng", new BigDecimal("5000000.00"), 4);

        assertNotNull(updated);
        assertEquals(10, updated.getTotalSeated());
        assertEquals(new BigDecimal("35000000.00"), updated.getTotalFoodRevenue());
        // 35.000.000 / (40 ghế * 2h) = 437.500
        assertEquals(new BigDecimal("437500.00"), updated.getRevpashScore());
        // 10 / 18 bàn = 55.55%
        assertTrue(updated.getOccupancyRate() > 55.0f);
    }
}