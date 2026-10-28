package com.tablemaster.booking.scheduler;

import com.tablemaster.booking.service.TableHoldService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * UC-A1: Tiến trình Tự động Giải phóng Bàn quá hạn 5 phút (Auto-Release Worker)
 * Quét định kỳ mỗi 5 giây để kiểm tra và giải phóng bàn nếu khách hàng quá hạn 300s
 * không hoàn tất thanh toán cọc hoặc thoát phiên đặt.
 * Nhả khóa Redlock, bắn WebSocket STOMP đổi màu bàn về XANH LÁ (AVAILABLE).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TableHoldExpirationWorker {

    private final TableHoldService tableHoldService;

    /**
     * Chạy mỗi 5 giây để phát hiện các bàn hết hạn 300s và broadcast ngay lập tức
     */
    @Scheduled(fixedRate = 5000)
    public void scanAndReleaseExpiredTableHolds() {
        try {
            tableHoldService.autoReleaseExpiredHolds();
        } catch (Exception e) {
            log.error("Lỗi trong quá trình quét giải phóng bàn quá hạn: {}", e.getMessage());
        }
    }
}
