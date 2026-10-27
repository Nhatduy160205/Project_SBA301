package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UC-17: Đổi trạng thái bàn 1 chạm trên Tablet (One-touch Table Status)
 * Chuyển nhanh chu trình phục vụ: SEATED -> CALL_BILL -> CLEANING -> AVAILABLE
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneTouchTableStatusRequest {

    @NotBlank(message = "Trạng thái bàn không được để trống")
    private String status; // SEATED, CALL_BILL, CLEANING, AVAILABLE

    private String updatedBy; // HOST, CASHIER, WAITER

    private String guestName;

    private String notes;
}
