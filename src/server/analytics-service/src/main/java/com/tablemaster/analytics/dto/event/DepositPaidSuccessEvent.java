package com.tablemaster.analytics.dto.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class DepositPaidSuccessEvent {
    private String transactionId;
    private String bookingId;
    private String userId;
    private String date; // YYYY-MM-DD
    private String slotId;
    private String slotName;
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;
    private String status;
}
