package com.tablemaster.restaurant.controller;

import com.tablemaster.restaurant.dto.request.TimeSlotRequest;
import com.tablemaster.restaurant.dto.response.ApiResponse;
import com.tablemaster.restaurant.dto.response.TimeSlotResponse;
import com.tablemaster.restaurant.service.TimeSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/time-slots", "/api/v1/restaurant/time-slots"})
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getAllTimeSlots(
            @RequestParam(value = "activeOnly", defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.success(timeSlotService.getAllTimeSlots(activeOnly)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeSlotResponse>> getTimeSlotById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(timeSlotService.getTimeSlotById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimeSlotResponse>> createTimeSlot(@Valid @RequestBody TimeSlotRequest request) {
        TimeSlotResponse created = timeSlotService.createTimeSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khung giờ thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeSlotResponse>> updateTimeSlot(
            @PathVariable("id") UUID id,
            @Valid @RequestBody TimeSlotRequest request) {
        TimeSlotResponse updated = timeSlotService.updateTimeSlot(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khung giờ thành công", updated));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<TimeSlotResponse>> toggleStatus(@PathVariable("id") UUID id) {
        TimeSlotResponse updated = timeSlotService.toggleStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Đổi trạng thái khung giờ thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimeSlot(@PathVariable("id") UUID id) {
        timeSlotService.deleteTimeSlot(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khung giờ thành công", null));
    }
}
