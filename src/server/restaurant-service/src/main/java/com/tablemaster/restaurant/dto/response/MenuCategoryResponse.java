package com.tablemaster.restaurant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuCategoryResponse {
    private UUID id;
    private String name;
    private Integer displayOrder;
    private Boolean isActive;
    private ZonedDateTime createdAt;
    private List<MenuItemResponse> items;
}
