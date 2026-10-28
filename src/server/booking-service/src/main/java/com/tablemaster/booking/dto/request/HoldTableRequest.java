package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request yêu cầu khóa giữ bàn 5 phút bằng Redlock (UC-06, BR-02)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldTableRequest {

    @NotNull(message = "tableId không được để trống")
    private UUID tableId;

    private String tableCode;

    private LocalDate bookingDate;

    private UUID timeSlotId;

    private Integer guestCount;

    private UUID floorPlanId;

    private Integer floorNumber;

    /**
     * Mã holdToken trước đó của khách hàng này (nếu đang đổi sang bàn khác)
     * Hệ thống sẽ tự động nhả bàn cũ và giữ bàn mới.
     */
    private String previousHoldToken;

    private UUID previousTableId;
}
