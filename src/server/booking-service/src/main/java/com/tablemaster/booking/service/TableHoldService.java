package com.tablemaster.booking.service;

import com.tablemaster.booking.dto.request.HoldTableRequest;
import com.tablemaster.booking.dto.request.ReleaseHoldRequest;
import com.tablemaster.booking.dto.response.HoldTableResponse;
import com.tablemaster.booking.dto.response.TableStateUpdateDto;

import java.util.UUID;

/**
 * Service quản lý Khóa Giữ bàn 5 phút & Xử lý Tranh chấp bằng Redis Redlock (UC-06, BR-02)
 */
public interface TableHoldService {

    /**
     * Kích hoạt Redis Redlock khóa giữ bàn tạm thời 300 giây khi khách chọn bàn
     * Chống race condition khi nhiều người cùng bấm 1 bàn trong cùng 1 tích tắc.
     *
     * @param request thông tin bàn, ngày giờ, số khách
     * @param userId ID khách hàng (từ X-User-Id hoặc định danh khách)
     * @return HoldTableResponse chứa holdToken, expiresAt, đếm ngược 300s
     */
    HoldTableResponse holdTable(HoldTableRequest request, UUID userId);

    /**
     * Giải phóng khóa giữ bàn khi khách hủy đơn hoặc đổi sang chọn bàn khác
     */
    void releaseHold(ReleaseHoldRequest request, UUID userId);

    /**
     * Giải phóng bàn trực tiếp qua tableId
     */
    void releaseHoldByTableId(UUID tableId, String holdToken);

    /**
     * Lấy thông tin trạng thái giữ chỗ hiện tại của bàn
     */
    TableStateUpdateDto getHoldStatus(UUID tableId);

    /**
     * Tiến trình tự động giải phóng bàn quá hạn 300 giây nếu khách không thanh toán (UC-A1)
     */
    void autoReleaseExpiredHolds();
}
