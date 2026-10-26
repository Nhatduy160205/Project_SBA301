package com.tablemaster.restaurant.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class MenuItemRequest {
    @NotNull(message = "ID danh mục không được để trống")
    private UUID categoryId;

    @NotBlank(message = "Tên món ăn không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá món ăn không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá món ăn phải lớn hơn 0")
    private BigDecimal price;

    private String imageUrl;
    private Boolean isPreorderAvailable;
    private Boolean isActive;
}
