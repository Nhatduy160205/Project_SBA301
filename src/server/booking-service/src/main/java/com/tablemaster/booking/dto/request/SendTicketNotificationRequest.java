package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Request to trigger dispatch or re-send of E-Ticket via Zalo ZNS or Email (UC-12).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendTicketNotificationRequest {

    @NotBlank(message = "Kênh gửi không được để trống ('ZNS', 'EMAIL', hoặc 'BOTH')")
    private String channel;

    private String recipientOverride;
}
