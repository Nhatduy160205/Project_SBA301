package com.tablemaster.analytics.service;

import com.tablemaster.analytics.dto.DailyShiftSummaryResponse;
import com.tablemaster.analytics.dto.ShiftMetricItemResponse;
import com.tablemaster.analytics.entity.DailyShiftMetric;
import com.tablemaster.analytics.repository.DailyShiftMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyShiftAnalyticsService {

    private final DailyShiftMetricRepository shiftMetricRepository;

    // Default configuration for Restaurant Floor
    private static final int DEFAULT_AVAILABLE_SEATS = 40;
    private static final double DEFAULT_SLOT_HOURS = 2.0;
    private static final int DEFAULT_TOTAL_TABLES = 18;

    @Transactional(readOnly = true)
    public DailyShiftSummaryResponse getDailySummary(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<DailyShiftMetric> metrics = shiftMetricRepository.findAllByMetricDateOrderByCreatedAtAsc(date);
        List<ShiftMetricItemResponse> shiftResponses = metrics.stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalDeposits = BigDecimal.ZERO;
        int totalBookings = 0;
        int totalSeated = 0;
        int totalNoShows = 0;
        BigDecimal sumRevpash = BigDecimal.ZERO;
        float sumOccupancy = 0.0f;

        for (DailyShiftMetric m : metrics) {
            BigDecimal shiftRevenue = m.getTotalFoodRevenue().add(m.getNoShowPenaltyIncome());
            totalRevenue = totalRevenue.add(shiftRevenue);
            totalDeposits = totalDeposits.add(m.getTotalDepositCollected());
            totalBookings += m.getTotalBookings();
            totalSeated += m.getTotalSeated();
            totalNoShows += m.getTotalNoShows();
            sumRevpash = sumRevpash.add(m.getRevpashScore());
            sumOccupancy += (m.getOccupancyRate() != null ? m.getOccupancyRate() : 0.0f);
        }

        int count = metrics.size();
        BigDecimal avgRevpash = count > 0 ? sumRevpash.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        float avgOccupancy = count > 0 ? (sumOccupancy / count) : 0.0f;
        int totalFinished = totalSeated + totalNoShows;
        float noShowRate = totalFinished > 0 ? ((float) totalNoShows / totalFinished * 100.0f) : 0.0f;

        return DailyShiftSummaryResponse.builder()
                .date(date)
                .shifts(shiftResponses)
                .totalDailyRevenue(totalRevenue)
                .totalDepositCollected(totalDeposits)
                .totalBookings(totalBookings)
                .totalSeated(totalSeated)
                .totalNoShows(totalNoShows)
                .averageRevpash(avgRevpash)
                .averageOccupancyRate(avgOccupancy)
                .noShowRate(noShowRate)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DailyShiftSummaryResponse> getSummaryRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().minusDays(7);
        if (endDate == null) endDate = LocalDate.now();

        LocalDate current = startDate;
        List<DailyShiftSummaryResponse> result = new java.util.ArrayList<>();
        while (!current.isAfter(endDate)) {
            result.add(getDailySummary(current));
            current = current.plusDays(1);
        }
        return result;
    }

    @Transactional
    public DailyShiftMetric getOrCreateShiftMetric(LocalDate date, UUID timeSlotId, String slotName) {
        return shiftMetricRepository.findByMetricDateAndTimeSlotId(date, timeSlotId)
                .orElseGet(() -> {
                    log.info("Creating initial DailyShiftMetric for date={} slot={}", date, slotName);
                    return shiftMetricRepository.save(DailyShiftMetric.builder()
                            .metricDate(date)
                            .timeSlotId(timeSlotId)
                            .slotName(slotName != null ? slotName : "Ca chuẩn (" + timeSlotId + ")")
                            .totalBookings(0)
                            .totalSeated(0)
                            .totalNoShows(0)
                            .totalDepositCollected(BigDecimal.ZERO)
                            .noShowPenaltyIncome(BigDecimal.ZERO)
                            .totalFoodRevenue(BigDecimal.ZERO)
                            .revpashScore(BigDecimal.ZERO)
                            .occupancyRate(0.0f)
                            .build());
                });
    }

    @Transactional
    public DailyShiftMetric recordBookingDeposit(LocalDate date, UUID timeSlotId, String slotName, BigDecimal depositAmount) {
        DailyShiftMetric metric = getOrCreateShiftMetric(date, timeSlotId, slotName);
        metric.setTotalBookings(metric.getTotalBookings() + 1);
        if (depositAmount != null) {
            metric.setTotalDepositCollected(metric.getTotalDepositCollected().add(depositAmount));
        }
        return shiftMetricRepository.save(metric);
    }

    @Transactional
    public DailyShiftMetric recordBookingCompletion(LocalDate date, UUID timeSlotId, String slotName,
                                                     BigDecimal foodBill, int guestCount) {
        DailyShiftMetric metric = getOrCreateShiftMetric(date, timeSlotId, slotName);
        metric.setTotalSeated(metric.getTotalSeated() + 1);
        if (foodBill != null) {
            metric.setTotalFoodRevenue(metric.getTotalFoodRevenue().add(foodBill));
        }

        recalculateMetrics(metric);
        return shiftMetricRepository.save(metric);
    }

    @Transactional
    public DailyShiftMetric recordNoShow(LocalDate date, UUID timeSlotId, String slotName, BigDecimal penaltyAmount) {
        DailyShiftMetric metric = getOrCreateShiftMetric(date, timeSlotId, slotName);
        metric.setTotalNoShows(metric.getTotalNoShows() + 1);
        if (penaltyAmount != null) {
            metric.setNoShowPenaltyIncome(metric.getNoShowPenaltyIncome().add(penaltyAmount));
        }

        recalculateMetrics(metric);
        return shiftMetricRepository.save(metric);
    }

    private void recalculateMetrics(DailyShiftMetric metric) {
        // Formula: RevPASH = (totalFoodRevenue + noShowPenaltyIncome) / (totalAvailableSeats * slotDurationHours)
        BigDecimal totalShiftRevenue = metric.getTotalFoodRevenue().add(metric.getNoShowPenaltyIncome());
        double totalSeatHours = DEFAULT_AVAILABLE_SEATS * DEFAULT_SLOT_HOURS;
        if (totalSeatHours > 0) {
            BigDecimal revpash = totalShiftRevenue.divide(BigDecimal.valueOf(totalSeatHours), 2, RoundingMode.HALF_UP);
            metric.setRevpashScore(revpash);
        }

        // Occupancy Rate (%) = (totalSeated / totalTables) * 100
        float occupancy = ((float) metric.getTotalSeated() / DEFAULT_TOTAL_TABLES) * 100.0f;
        metric.setOccupancyRate(Math.min(occupancy, 100.0f));
    }

    public ShiftMetricItemResponse mapToItemResponse(DailyShiftMetric metric) {
        BigDecimal totalShiftRevenue = metric.getTotalFoodRevenue().add(metric.getNoShowPenaltyIncome());
        return ShiftMetricItemResponse.builder()
                .id(metric.getId())
                .metricDate(metric.getMetricDate())
                .timeSlotId(metric.getTimeSlotId())
                .slotName(metric.getSlotName())
                .totalBookings(metric.getTotalBookings())
                .totalSeated(metric.getTotalSeated())
                .totalNoShows(metric.getTotalNoShows())
                .totalDepositCollected(metric.getTotalDepositCollected())
                .noShowPenaltyIncome(metric.getNoShowPenaltyIncome())
                .totalFoodRevenue(metric.getTotalFoodRevenue())
                .totalShiftRevenue(totalShiftRevenue)
                .revpashScore(metric.getRevpashScore())
                .occupancyRate(metric.getOccupancyRate())
                .build();
    }
}
