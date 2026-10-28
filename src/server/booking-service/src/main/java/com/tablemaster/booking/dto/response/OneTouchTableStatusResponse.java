package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * UC-17: Phản hồi Đổi trạng thái bàn 1 chạm trên Tablet (One-touch Table Status)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneTouchTableStatusResponse {
    private String tableCode;
    private String status;
    private String previousStatus;
    private String color;
    private String updatedBy;
    private String guestName;
    private String message;
    private LocalDateTime timestamp;
    private long latencyGuaranteeMs; // Cam kết <300ms
}
