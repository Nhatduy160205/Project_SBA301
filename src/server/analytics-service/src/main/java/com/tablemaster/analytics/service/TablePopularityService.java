package com.tablemaster.analytics.service;

import com.tablemaster.analytics.dto.TableHeatmapResponse;
import com.tablemaster.analytics.entity.TablePopularityStat;
import com.tablemaster.analytics.repository.TablePopularityStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TablePopularityService {

    private final TablePopularityStatRepository tableStatRepository;

    @Transactional(readOnly = true)
    public List<TableHeatmapResponse> getHeatmapData() {
        List<TablePopularityStat> allStats = tableStatRepository.findAllByOrderByTotalRevenueGeneratedDesc();
        if (allStats.isEmpty()) {
            return List.of();
        }

        // Find max reservations & max revenue to compute normalized heat scores
        int maxReservations = allStats.stream().mapToInt(TablePopularityStat::getTotalReservations).max().orElse(1);
        BigDecimal maxRevenue = allStats.stream()
                .map(TablePopularityStat::getTotalRevenueGenerated)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ONE);

        if (maxReservations == 0) maxReservations = 1;
        if (maxRevenue.compareTo(BigDecimal.ZERO) == 0) maxRevenue = BigDecimal.ONE;

        final int finalMaxRes = maxReservations;
        final BigDecimal finalMaxRev = maxRevenue;

        return allStats.stream()
                .map(stat -> mapToHeatmapResponse(stat, finalMaxRes, finalMaxRev))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TableHeatmapResponse> getTopTables(int limit) {
        List<TableHeatmapResponse> heatmap = getHeatmapData();
        return heatmap.stream().limit(limit).collect(Collectors.toList());
    }

    @Transactional
    public TablePopularityStat recordTableCompletion(UUID tableId, String tableCode, String zoneType, BigDecimal revenue) {
        TablePopularityStat stat = tableStatRepository.findByTableId(tableId)
                .orElseGet(() -> {
                    log.info("Registering new TablePopularityStat for tableCode={}", tableCode);
                    return tableStatRepository.save(TablePopularityStat.builder()
                            .tableId(tableId)
                            .tableCode(tableCode != null ? tableCode : "TABLE-" + tableId.toString().substring(0, 4))
                            .zoneType(zoneType != null ? zoneType : "STANDARD")
                            .totalReservations(0)
                            .cancelCount(0)
                            .totalRevenueGenerated(BigDecimal.ZERO)
                            .build());
                });

        stat.setTotalReservations(stat.getTotalReservations() + 1);
        if (revenue != null) {
            stat.setTotalRevenueGenerated(stat.getTotalRevenueGenerated().add(revenue));
        }
        if (zoneType != null && !zoneType.isBlank()) {
            stat.setZoneType(zoneType);
        }
        if (tableCode != null && !tableCode.isBlank()) {
            stat.setTableCode(tableCode);
        }

        return tableStatRepository.save(stat);
    }

    @Transactional
    public TablePopularityStat recordTableCancellation(UUID tableId) {
        return tableStatRepository.findByTableId(tableId)
                .map(stat -> {
                    stat.setCancelCount(stat.getCancelCount() + 1);
                    return tableStatRepository.save(stat);
                })
                .orElse(null);
    }

    private TableHeatmapResponse mapToHeatmapResponse(TablePopularityStat stat, int maxRes, BigDecimal maxRev) {
        // Compute composite heat score: 50% reservation frequency + 50% revenue
        double resRatio = (double) stat.getTotalReservations() / maxRes;
        double revRatio = stat.getTotalRevenueGenerated().doubleValue() / maxRev.doubleValue();
        double heatScore = Math.min(100.0, Math.round(((resRatio * 0.5) + (revRatio * 0.5)) * 100.0 * 10.0) / 10.0);

        String heatLevel;
        String colorHex;

        if (heatScore >= 75.0) {
            heatLevel = "HOT";
            colorHex = "#EF4444"; // Đỏ rực rỡ
        } else if (heatScore >= 50.0) {
            heatLevel = "WARM";
            colorHex = "#F59E0B"; // Cam / Vàng ấm
        } else if (heatScore >= 25.0) {
            heatLevel = "NORMAL";
            colorHex = "#10B981"; // Xanh ngọc
        } else {
            heatLevel = "COOL";
            colorHex = "#3B82F6"; // Xanh dương nhạt
        }

        return TableHeatmapResponse.builder()
                .id(stat.getId())
                .tableId(stat.getTableId())
                .tableCode(stat.getTableCode())
                .zoneType(stat.getZoneType())
                .totalReservations(stat.getTotalReservations())
                .cancelCount(stat.getCancelCount())
                .totalRevenueGenerated(stat.getTotalRevenueGenerated())
                .heatScore(heatScore)
                .heatLevel(heatLevel)
                .colorHex(colorHex)
                .build();
    }
}
