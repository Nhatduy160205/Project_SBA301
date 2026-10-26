package com.tablemaster.restaurant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlackoutDateResponse {
    private UUID id;
    private LocalDate eventDate;
    private String eventName;
    private Boolean isClosed;
    private BigDecimal customDepositAmount;
    private Boolean requireSpecialMenu;
    private String note;
    private ZonedDateTime createdAt;
}
