package com.tablemaster.restaurant.controller;

import com.tablemaster.restaurant.dto.request.BlackoutDateRequest;
import com.tablemaster.restaurant.dto.response.ApiResponse;
import com.tablemaster.restaurant.dto.response.BlackoutDateResponse;
import com.tablemaster.restaurant.service.BlackoutDateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/blackout-dates", "/api/v1/restaurant/blackout-dates"})
@RequiredArgsConstructor
public class BlackoutDateController {

    private final BlackoutDateService blackoutDateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BlackoutDateResponse>>> getAllBlackoutDates() {
        return ResponseEntity.ok(ApiResponse.success(blackoutDateService.getAllBlackoutDates()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BlackoutDateResponse>> getBlackoutDateById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(blackoutDateService.getBlackoutDateById(id)));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<BlackoutDateResponse>> checkDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return blackoutDateService.getByDate(date)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Ngày bình thường, không có phụ thu hoặc đóng cửa", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlackoutDateResponse>> createBlackoutDate(@Valid @RequestBody BlackoutDateRequest request) {
        BlackoutDateResponse created = blackoutDateService.createBlackoutDate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cấu hình ngày đặc biệt thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BlackoutDateResponse>> updateBlackoutDate(
            @PathVariable("id") UUID id,
            @Valid @RequestBody BlackoutDateRequest request) {
        BlackoutDateResponse updated = blackoutDateService.updateBlackoutDate(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ngày đặc biệt thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBlackoutDate(@PathVariable("id") UUID id) {
        blackoutDateService.deleteBlackoutDate(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cấu hình ngày đặc biệt thành công", null));
    }
}
