package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO broadcast qua WebSocket STOMP (/topic/tables/status & /topic/floor-plan) (UC-06)
 * Đổi màu bàn trên sơ đồ toàn hệ thống theo thời gian thực:
 * - HOLDING   -> Màu vàng nhấp nháy, hiển thị đồng hồ 05:00
 * - AVAILABLE -> Màu xanh lá, bàn trống sẵn sàng chọn
 * - CONFIRMED -> Màu đỏ, đã cọc tiền thành công
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableStateUpdateDto {

    private UUID tableId;

    private String tableCode;

    private UUID floorPlanId;

    private Integer floorNumber;

    /**
     * Trạng thái bàn: AVAILABLE, HOLDING, OCCUPIED, CONFIRMED
     */
    private String status;

    /**
     * Màu sắc: GREEN, YELLOW, RED, BLUE
     */
    private String color;

    private Instant expiresAt;

    private Long remainingSeconds;

    private String holdToken;

    private UUID heldByUserId;

    private String message;
}
