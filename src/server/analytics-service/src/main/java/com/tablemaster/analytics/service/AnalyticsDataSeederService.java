package com.tablemaster.analytics.service;

import com.tablemaster.analytics.entity.DailyShiftMetric;
import com.tablemaster.analytics.entity.LoyaltyTier;
import com.tablemaster.analytics.entity.TablePopularityStat;
import com.tablemaster.analytics.entity.VipCustomerInsight;
import com.tablemaster.analytics.repository.DailyShiftMetricRepository;
import com.tablemaster.analytics.repository.TablePopularityStatRepository;
import com.tablemaster.analytics.repository.VipCustomerInsightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsDataSeederService {

    private final DailyShiftMetricRepository shiftRepo;
    private final TablePopularityStatRepository tableRepo;
    private final VipCustomerInsightRepository vipRepo;

    @Transactional
    public void seedMockDataIfEmpty() {
        if (shiftRepo.count() == 0) {
            seedShiftMetrics();
        }
        if (tableRepo.count() == 0) {
            seedTableStats();
        }
        if (vipRepo.count() == 0) {
            seedVipCustomers();
        }
    }

    @Transactional
    public void forceSeedSampleData() {
        seedShiftMetrics();
        seedTableStats();
        seedVipCustomers();
    }

    private void seedShiftMetrics() {
        log.info("Seeding Shift Metrics sample data...");
        LocalDate today = LocalDate.now();

        // 1. Ca trưa
        shiftRepo.save(DailyShiftMetric.builder()
                .metricDate(today)
                .timeSlotId(UUID.fromString("b1000000-0000-0000-0000-000000000001"))
                .slotName("Ca trưa Chuẩn (11:30 - 13:30)")
                .totalBookings(12)
                .totalSeated(12)
                .totalNoShows(0)
                .totalDepositCollected(new BigDecimal("2400000.00"))
                .noShowPenaltyIncome(BigDecimal.ZERO)
                .totalFoodRevenue(new BigDecimal("24000000.00"))
                .revpashScore(new BigDecimal("300000.00"))
                .occupancyRate(66.7f)
                .build());

        // 2. Ca tối Giờ Vàng
        shiftRepo.save(DailyShiftMetric.builder()
                .metricDate(today)
                .timeSlotId(UUID.fromString("b1000000-0000-0000-0000-000000000002"))
                .slotName("Ca tối Giờ Vàng (18:30 - 20:30)")
                .totalBookings(18)
                .totalSeated(17)
                .totalNoShows(1)
                .totalDepositCollected(new BigDecimal("3600000.00"))
                .noShowPenaltyIncome(new BigDecimal("200000.00"))
                .totalFoodRevenue(new BigDecimal("45000000.00"))
                .revpashScore(new BigDecimal("565000.00"))
                .occupancyRate(94.4f)
                .build());

        // 3. Ca tối Muộn
        shiftRepo.save(DailyShiftMetric.builder()
                .metricDate(today)
                .timeSlotId(UUID.fromString("b1000000-0000-0000-0000-000000000003"))
                .slotName("Ca tối Muộn (20:45 - 22:45)")
                .totalBookings(8)
                .totalSeated(7)
                .totalNoShows(1)
                .totalDepositCollected(new BigDecimal("1600000.00"))
                .noShowPenaltyIncome(new BigDecimal("200000.00"))
                .totalFoodRevenue(new BigDecimal("16000000.00"))
                .revpashScore(new BigDecimal("202500.00"))
                .occupancyRate(44.4f)
                .build());
    }

    private void seedTableStats() {
        log.info("Seeding Table Popularity & Heatmap sample data...");
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000001", "VIP-01", "PRIVATE_VIP", 32, 0, new BigDecimal("135000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000002", "VIP-02", "PRIVATE_VIP", 26, 1, new BigDecimal("105000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000003", "OUT-01", "OUTDOOR", 46, 2, new BigDecimal("92000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000004", "OUT-02", "OUTDOOR", 40, 1, new BigDecimal("79000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000005", "BAR-01", "BAR_COUNTER", 35, 3, new BigDecimal("42000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000006", "WIN-01", "WINDOW_VIEW", 38, 1, new BigDecimal("68000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000007", "STD-01", "STANDARD", 20, 2, new BigDecimal("31000000.00"));
        createOrUpdateTableStat("b2000000-0000-0000-0000-000000000008", "STD-02", "STANDARD", 15, 4, new BigDecimal("22000000.00"));
    }

    private void createOrUpdateTableStat(String uuidStr, String code, String zone, int res, int cancel, BigDecimal rev) {
        UUID tableId = UUID.fromString(uuidStr);
        if (tableRepo.findByTableId(tableId).isEmpty()) {
            tableRepo.save(TablePopularityStat.builder()
                    .tableId(tableId)
                    .tableCode(code)
                    .zoneType(zone)
                    .totalReservations(res)
                    .cancelCount(cancel)
                    .totalRevenueGenerated(rev)
                    .build());
        }
    }

    private void seedVipCustomers() {
        log.info("Seeding VIP Customer Insights sample data...");
        createOrUpdateVip("a0000000-0000-0000-0000-000000000001", "+84912345678", "Trần Thị Bích Ngọc (VIP Diamond)", 15, new BigDecimal("68000000.00"), 5.5f, "PRIVATE_VIP", LoyaltyTier.PLATINUM);
        createOrUpdateVip("a0000000-0000-0000-0000-000000000002", "+84901234567", "Nguyễn Văn An (VIP Gold)", 8, new BigDecimal("29500000.00"), 4.0f, "OUTDOOR", LoyaltyTier.GOLD);
        createOrUpdateVip("a0000000-0000-0000-0000-000000000003", "+84987654321", "Lê Hoàng Cường", 5, new BigDecimal("12400000.00"), 2.8f, "BAR_COUNTER", LoyaltyTier.SILVER);
        createOrUpdateVip("a0000000-0000-0000-0000-000000000004", "+84933221100", "Phạm Thu Dung", 2, new BigDecimal("3800000.00"), 2.0f, "STANDARD", LoyaltyTier.BRONZE);
    }

    private void createOrUpdateVip(String uuidStr, String phone, String name, int visits, BigDecimal spent, float party, String zone, LoyaltyTier tier) {
        UUID userId = UUID.fromString(uuidStr);
        if (vipRepo.findByUserId(userId).isEmpty()) {
            vipRepo.save(VipCustomerInsight.builder()
                    .userId(userId)
                    .phoneNumber(phone)
                    .fullName(name)
                    .totalVisits(visits)
                    .totalSpent(spent)
                    .averagePartySize(party)
                    .lastVisitDate(LocalDate.now().minusDays(1))
                    .favoriteZone(zone)
                    .loyaltyTier(tier)
                    .build());
        }
    }
}
