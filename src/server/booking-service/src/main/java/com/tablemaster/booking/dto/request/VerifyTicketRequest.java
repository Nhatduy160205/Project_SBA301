package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

/**
 * Request to verify an E-Ticket dynamic 64-char QR code at the door and check-in the guest (UC-12).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyTicketRequest {

    @NotBlank(message = "Mã token QR không được để trống")
    private String qrToken;

    private UUID staffId;

    private String scannerLocation;
}
