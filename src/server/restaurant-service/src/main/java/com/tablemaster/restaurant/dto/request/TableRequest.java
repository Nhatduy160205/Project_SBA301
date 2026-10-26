package com.tablemaster.restaurant.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableRequest {
    private UUID id;

    @NotBlank(message = "Mã bàn không được để trống")
    private String tableCode;

    private String zoneType;

    @NotNull(message = "Sức chứa tối thiểu không được để trống")
    @Min(value = 1, message = "Sức chứa tối thiểu phải ít nhất là 1")
    private Integer minCapacity;

    @NotNull(message = "Sức chứa tối đa không được để trống")
    @Min(value = 1, message = "Sức chứa tối đa phải ít nhất là 1")
    private Integer maxCapacity;

    private BigDecimal customDeposit;
    private Boolean isActive;
}
