package com.tablemaster.booking.controller;

import com.tablemaster.booking.dto.request.HoldTableRequest;
import com.tablemaster.booking.dto.request.ReleaseHoldRequest;
import com.tablemaster.booking.dto.response.ApiResponse;
import com.tablemaster.booking.dto.response.HoldTableResponse;
import com.tablemaster.booking.dto.response.TableStateUpdateDto;
import com.tablemaster.booking.service.TableHoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller phục vụ UC-06: Khóa Giữ bàn 5 phút & Xử lý Tranh chấp (Redlock Concurrency Hold)
 * Quy tắc BR-02:
 * - Khi khách bấm chọn bàn, Redis Redlock cấp phát thời hạn đúng 300 giây.
 * - Tránh race condition khi hàng chục người cùng chọn 1 bàn vào cùng 1 mili-giây.
 * - Broadcast WebSocket STOMP đổi màu vàng nhấp nháy, hiển thị đồng hồ 05:00.
 * - Trả về HTTP 409 Conflict khi tranh chấp thất bại.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class TableHoldController {

    private final TableHoldService tableHoldService;

    /**
     * POST /api/v1/bookings/hold
     * Kích hoạt Redis Redlock khóa giữ bàn tạm thời 300 giây khi khách bấm chọn bàn (BR-02)
     */
    @PostMapping("/hold")
    public ResponseEntity<ApiResponse<HoldTableResponse>> holdTable(
            @Valid @RequestBody HoldTableRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        log.info("Yêu cầu khóa giữ bàn: tableId={}, date={}, slot={}, user={}",
                request.getTableId(), request.getBookingDate(), request.getTimeSlotId(), userId);

        HoldTableResponse response = tableHoldService.holdTable(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Khóa giữ bàn 5 phút thành công (Redlock)", response));
    }

    /**
     * POST /api/v1/bookings/release-hold
     * Khách hàng hủy giữ chỗ hoặc đổi sang chọn bàn khác
     */
    @PostMapping("/release-hold")
    public ResponseEntity<ApiResponse<Void>> releaseHold(
            @Valid @RequestBody ReleaseHoldRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        log.info("Yêu cầu giải phóng khóa bàn: tableId={}, user={}", request.getTableId(), userId);
        tableHoldService.releaseHold(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã giải phóng bàn thành công", null));
    }

    /**
     * GET /api/v1/bookings/hold-status/{tableId}
     * Kiểm tra trạng thái và thời gian giữ chỗ còn lại của bàn
     */
    @GetMapping("/hold-status/{tableId}")
    public ResponseEntity<ApiResponse<TableStateUpdateDto>> getHoldStatus(@PathVariable UUID tableId) {
        TableStateUpdateDto response = tableHoldService.getHoldStatus(tableId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
