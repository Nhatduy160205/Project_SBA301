package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Phản hồi toàn diện Sơ đồ sàn Live đa tầng trên Tablet Lễ tân (UC-15)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostFloorLiveResponse {
    private List<HostFloorSummaryDto> floors;
    private List<HostTableLiveDto> tables;
    private Instant syncTimestamp;
    private Integer totalTables;
    private Integer availableTables;
    private Integer seatedTables;
    private Integer reservedTables;
    private Integer cleaningTables;
    private Integer activeGuestsCount;
    private BigDecimal totalDepositHeld;
    private Long latencyMs;
}
