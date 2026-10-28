package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request yêu cầu hủy giữ chỗ bàn (khách đổi ý hoặc chọn bàn khác)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseHoldRequest {

    @NotNull(message = "tableId không được để trống")
    private UUID tableId;

    private String holdToken;

    private String tableCode;
}
