package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

/**
 * UC-10: DTO Cập nhật kết quả cuộc gọi tư vấn 15 phút của Quản lý ca (Shift Manager)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEventConsultationRequest {

    @NotBlank(message = "Trạng thái cuộc gọi không được để trống")
    private String managerCallStatus; // CALLED, PROPOSAL_SENT, ACCEPTED, REJECTED

    private String consultationNotes;

    private BigDecimal agreedDeposit;

    private BigDecimal agreedBudget;

    private String targetBookingStatus; // AWAITING_PAYMENT, CONFIRMED, REJECTED
}
