package com.tablemaster.restaurant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantProfileResponse {
    private UUID id;
    private String name;
    private String hotline;
    private String email;
    private String address;
    private String description;
    private String coverImageUrl;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Boolean isActive;
    private String bankBin;
    private String bankName;
    private String bankAccountNo;
    private String bankAccountHolder;
    private BigDecimal defaultDepositAmount;
    private Integer cancellationGraceHours;
    private Integer holdTimeoutSeconds;
    private ZonedDateTime updatedAt;
}
