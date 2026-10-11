package com.tablemaster.analytics.entity;

import java.math.BigDecimal;

public enum LoyaltyTier {
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM;

    public static LoyaltyTier evaluate(int totalVisits, BigDecimal totalSpent) {
        if (totalVisits >= 10 || (totalSpent != null && totalSpent.compareTo(new BigDecimal("20000000")) >= 0)) {
            return PLATINUM;
        }
        if (totalVisits >= 6 || (totalSpent != null && totalSpent.compareTo(new BigDecimal("10000000")) >= 0)) {
            return GOLD;
        }
        if (totalVisits >= 3 || (totalSpent != null && totalSpent.compareTo(new BigDecimal("5000000")) >= 0)) {
            return SILVER;
        }
        return BRONZE;
    }
}
