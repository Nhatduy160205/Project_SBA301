package com.tablemaster.analytics.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableHeatmapResponse {
    private UUID id;
    private UUID tableId;
    private String tableCode;
    private String zoneType;
    private Integer totalReservations;
    private Integer cancelCount;
    private BigDecimal totalRevenueGenerated;
    private Double heatScore;
    private String heatLevel;
    private String colorHex;
}