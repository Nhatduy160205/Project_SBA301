package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Phản hồi chi tiết sau khi Redis Redlock cấp quyền giữ bàn thành công (UC-06)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldTableResponse {

    private boolean success;

    /**
     * Mã token định danh phiên giữ bàn (dùng để xác nhận hoặc giải phóng khi hủy)
     */
    private String holdToken;

    private UUID tableId;

    private String tableCode;

    private Integer floorNumber;

    /**
     * Thời điểm hết hạn khóa giữ (300 giây từ lúc bấm chọn)
     */
    private Instant expiresAt;

    /**
     * Thời gian đếm ngược còn lại tính bằng giây (300 giây = 05:00)
     */
    private long holdDurationSeconds;

    /**
     * Trạng thái bàn: "HOLDING"
     */
    private String status;

    /**
     * Màu sắc hiển thị bàn trên UI: "YELLOW" (Vàng nhấp nháy)
     */
    private String color;

    private String message;
}
