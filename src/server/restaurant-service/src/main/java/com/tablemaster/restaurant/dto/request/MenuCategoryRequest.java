package com.tablemaster.restaurant.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuCategoryRequest {
    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private Integer displayOrder;
    private Boolean isActive;
}
