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
public class BookingCompletedEvent {
    private String bookingId;
    private String userId;
    private String customerName;
    private String phoneNumber;
    private String date; // format: YYYY-MM-DD
    private String slotId;
    private String slotName;
    private String tableId;
    private String tableCode;
    private String zoneType;
    @Builder.Default
    private BigDecimal foodBill = BigDecimal.ZERO;
    @Builder.Default
    private Integer guestCount = 2;
}
