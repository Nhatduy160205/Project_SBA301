package com.tablemaster.analytics.controller;

import com.tablemaster.analytics.dto.response.ApiResponse;
import com.tablemaster.analytics.dto.response.DailyShiftSummaryResponse;
import com.tablemaster.analytics.dto.response.TableHeatmapResponse;
import com.tablemaster.analytics.service.DailyShiftAnalyticsService;
import com.tablemaster.analytics.service.TablePopularityService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Validated
@Slf4j
public class AnalyticsDashboardController {

    private final DailyShiftAnalyticsService shiftService;
    private final TablePopularityService tableService;

    @GetMapping("/shifts/daily")
    public ApiResponse<DailyShiftSummaryResponse> getDailyShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ApiResponse.ok(shiftService.getDailySummary(date));
    }

    @GetMapping("/shifts/range")
    public ApiResponse<List<DailyShiftSummaryResponse>> getShiftRange(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.ok(shiftService.getSummaryRange(startDate, endDate));
    }

    @GetMapping("/tables/heatmap")
    public ApiResponse<List<TableHeatmapResponse>> getTableHeatmap() {
        return ApiResponse.ok("Lấy dữ liệu Heatmap 2D thành công", tableService.getHeatmapData());
    }

    @GetMapping("/tables/ranking")
    public ApiResponse<List<TableHeatmapResponse>> getTopTables(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Số lượng tối thiểu là 1")
            @Max(value = 100, message = "Số lượng tối đa không vượt quá 100") int limit) {
        return ApiResponse.ok(tableService.getTopTables(limit));
    }
}