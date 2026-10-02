package com.tablemaster.analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_shift_metrics", uniqueConstraints = {
    @UniqueConstraint(name = "uq_date_slot", columnNames = {"metric_date", "time_slot_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyShiftMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "time_slot_id", nullable = false)
    private UUID timeSlotId;

    @Column(name = "slot_name", nullable = false, length = 60)
    private String slotName;

    @Column(name = "total_bookings")
    @Builder.Default
    private Integer totalBookings = 0;

    @Column(name = "total_seated")
    @Builder.Default
    private Integer totalSeated = 0;

    @Column(name = "total_no_shows")
    @Builder.Default
    private Integer totalNoShows = 0;

    @Column(name = "total_deposit_collected", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalDepositCollected = BigDecimal.ZERO;

    @Column(name = "no_show_penalty_income", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal noShowPenaltyIncome = BigDecimal.ZERO;

    @Column(name = "total_food_revenue", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalFoodRevenue = BigDecimal.ZERO;

    @Column(name = "revpash_score", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal revpashScore = BigDecimal.ZERO;

    @Column(name = "occupancy_rate")
    @Builder.Default
    private Float occupancyRate = 0.0f;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
