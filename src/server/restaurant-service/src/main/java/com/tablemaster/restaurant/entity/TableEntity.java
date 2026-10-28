package com.tablemaster.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "table_code", unique = true, nullable = false, length = 30)
    private String tableCode;

    @Column(name = "zone_type", nullable = false, length = 50)
    @Builder.Default
    private String zoneType = "STANDARD"; // OUTDOOR, BAR_COUNTER, PRIVATE_VIP, WINDOW_VIEW, STANDARD

    @Column(name = "min_capacity", nullable = false)
    @Builder.Default
    private Integer minCapacity = 2;

    @Column(name = "max_capacity", nullable = false)
    @Builder.Default
    private Integer maxCapacity = 4;

    @Column(name = "custom_deposit", precision = 12, scale = 2)
    private BigDecimal customDeposit;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
