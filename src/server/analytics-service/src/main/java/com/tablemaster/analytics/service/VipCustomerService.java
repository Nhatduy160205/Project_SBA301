package com.tablemaster.analytics.service;

import com.tablemaster.analytics.dto.VipCustomerResponse;
import com.tablemaster.analytics.entity.LoyaltyTier;
import com.tablemaster.analytics.entity.VipCustomerInsight;
import com.tablemaster.analytics.repository.VipCustomerInsightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VipCustomerService {

    private final VipCustomerInsightRepository vipRepository;

    @Transactional(readOnly = true)
    public List<VipCustomerResponse> getVipCustomers(LoyaltyTier tier) {
        List<VipCustomerInsight> insights;
        if (tier != null) {
            insights = vipRepository.findAllByLoyaltyTierOrderByTotalSpentDesc(tier);
        } else {
            insights = vipRepository.findAllByOrderByTotalSpentDesc();
        }
        return insights.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VipCustomerResponse> getTopVipCustomers(int limit) {
        return vipRepository.findTop5ByOrderByTotalSpentDesc().stream()
                .limit(limit)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VipCustomerResponse getCustomerInsight(UUID userId) {
        return vipRepository.findByUserId(userId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTierDistribution() {
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (LoyaltyTier t : LoyaltyTier.values()) {
            distribution.put(t.name(), 0L);
        }

        List<Object[]> rows = vipRepository.countByLoyaltyTier();
        for (Object[] row : rows) {
            if (row[0] != null) {
                String tierName = row[0].toString();
                Long count = (Long) row[1];
                distribution.put(tierName, count);
            }
        }
        return distribution;
    }

    @Transactional
    public VipCustomerInsight recordCustomerMeal(UUID userId, String phoneNumber, String fullName,
                                                 int guestCount, BigDecimal foodBill, String zoneType,
                                                 LocalDate visitDate) {
        if (userId == null) {
            log.warn("Cannot record VIP insight without userId");
            return null;
        }

        VipCustomerInsight insight = vipRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new VIP profile for user={}", fullName);
                    return vipRepository.save(VipCustomerInsight.builder()
                            .userId(userId)
                            .phoneNumber(phoneNumber != null ? phoneNumber : "+84900000000")
                            .fullName(fullName != null ? fullName : "Khách Hàng")
                            .totalVisits(0)
                            .totalSpent(BigDecimal.ZERO)
                            .averagePartySize(0.0f)
                            .loyaltyTier(LoyaltyTier.BRONZE)
                            .favoriteZone(zoneType != null ? zoneType : "STANDARD")
                            .build());
                });

        int oldVisits = insight.getTotalVisits();
        int newVisits = oldVisits + 1;
        insight.setTotalVisits(newVisits);

        if (foodBill != null) {
            insight.setTotalSpent(insight.getTotalSpent().add(foodBill));
        }

        // Running average party size
        float oldAvg = insight.getAveragePartySize() != null ? insight.getAveragePartySize() : 0.0f;
        float newAvg = ((oldAvg * oldVisits) + guestCount) / newVisits;
        insight.setAveragePartySize((float) (Math.round(newAvg * 10.0) / 10.0));

        if (visitDate != null) {
            insight.setLastVisitDate(visitDate);
        } else {
            insight.setLastVisitDate(LocalDate.now());
        }

        if (zoneType != null && !zoneType.isBlank()) {
            insight.setFavoriteZone(zoneType);
        }
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            insight.setPhoneNumber(phoneNumber);
        }
        if (fullName != null && !fullName.isBlank()) {
            insight.setFullName(fullName);
        }

        // Re-evaluate Loyalty Tier
        LoyaltyTier newTier = LoyaltyTier.evaluate(insight.getTotalVisits(), insight.getTotalSpent());
        if (insight.getLoyaltyTier() != newTier) {
            log.info("Customer {} upgraded from tier {} to {}", insight.getFullName(), insight.getLoyaltyTier(), newTier);
            insight.setLoyaltyTier(newTier);
        }

        return vipRepository.save(insight);
    }

    private VipCustomerResponse mapToResponse(VipCustomerInsight insight) {
        return VipCustomerResponse.builder()
                .id(insight.getId())
                .userId(insight.getUserId())
                .phoneNumber(insight.getPhoneNumber())
                .fullName(insight.getFullName())
                .totalVisits(insight.getTotalVisits())
                .totalSpent(insight.getTotalSpent())
                .averagePartySize(insight.getAveragePartySize())
                .lastVisitDate(insight.getLastVisitDate())
                .favoriteZone(insight.getFavoriteZone())
                .loyaltyTier(insight.getLoyaltyTier())
                .build();
    }
}
