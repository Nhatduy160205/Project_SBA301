package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO Thống kê thông tin theo tầng cho Tablet Lễ tân (UC-15)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostFloorSummaryDto {
    private Integer floorNumber;
    private String floorName;
    private String description;
    private String viewTag;
    private Integer totalTables;
    private Integer availableTables;
    private Integer seatedTables;
    private Integer reservedTables;
    private Integer cleaningTables;
    private Integer totalCapacity;
    private Double occupancyRatePercent;
    private BigDecimal floorEstimatedRevenue;
}
