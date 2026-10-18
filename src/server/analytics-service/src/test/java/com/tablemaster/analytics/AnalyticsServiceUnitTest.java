package com.tablemaster.analytics;

import com.tablemaster.analytics.dto.response.DailyShiftSummaryResponse;
import com.tablemaster.analytics.dto.response.TableHeatmapResponse;
import com.tablemaster.analytics.entity.DailyShiftMetric;
import com.tablemaster.analytics.entity.TablePopularityStat;
import com.tablemaster.analytics.repository.DailyShiftMetricRepository;
import com.tablemaster.analytics.repository.TablePopularityStatRepository;
import com.tablemaster.analytics.service.DailyShiftAnalyticsService;
import com.tablemaster.analytics.service.TablePopularityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceUnitTest {

    @Mock
    private DailyShiftMetricRepository shiftRepo;

    @Mock
    private TablePopularityStatRepository tableRepo;

    @InjectMocks
    private DailyShiftAnalyticsService shiftService;

    @InjectMocks
    private TablePopularityService tableService;

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

        DailyShiftMetric updated = shiftService.recordBookingCompletion(date, slotId, "Ca tối Giờ Vàng", new BigDecimal("5000000.00"), 4);

        assertNotNull(updated);
        assertEquals(10, updated.getTotalSeated());
        assertEquals(new BigDecimal("35000000.00"), updated.getTotalFoodRevenue());
        assertEquals(new BigDecimal("437500.00"), updated.getRevpashScore());
        assertTrue(updated.getOccupancyRate() > 55.0f);
    }

    @Test
    @DisplayName("UC-33: Bản đồ nhiệt Bàn ăn & Tính toán Heat Score")
    void testTableHeatmapCalculation() {
        UUID tableId = UUID.randomUUID();
        TablePopularityStat stat = TablePopularityStat.builder()
                .id(UUID.randomUUID())
                .tableId(tableId)
                .tableCode("VIP-01")
                .zoneType("PRIVATE_VIP")
                .totalReservations(30)
                .cancelCount(1)
                .totalRevenueGenerated(new BigDecimal("120000000.00"))
                .build();

        when(tableRepo.findAllByOrderByTotalRevenueGeneratedDesc()).thenReturn(List.of(stat));

        List<TableHeatmapResponse> heatmap = tableService.getHeatmapData();

        assertEquals(1, heatmap.size());
        assertEquals("VIP-01", heatmap.get(0).getTableCode());
        assertEquals("HOT", heatmap.get(0).getHeatLevel());
        assertEquals("#EF4444", heatmap.get(0).getColorHex());
        assertEquals(100.0, heatmap.get(0).getHeatScore());
    }
}