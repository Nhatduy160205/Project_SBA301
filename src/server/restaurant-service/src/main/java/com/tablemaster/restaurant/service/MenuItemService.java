package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.MenuItemRequest;
import com.tablemaster.restaurant.dto.response.MenuItemResponse;
import com.tablemaster.restaurant.entity.MenuCategory;
import com.tablemaster.restaurant.entity.MenuItem;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.MenuCategoryRepository;
import com.tablemaster.restaurant.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAllMenuItems(UUID categoryId, Boolean activeOnly, Boolean preorderOnly) {
        List<MenuItem> items;
        if (categoryId != null) {
            items = Boolean.TRUE.equals(activeOnly)
                    ? menuItemRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                    : menuItemRepository.findByCategoryId(categoryId);
        } else if (Boolean.TRUE.equals(preorderOnly)) {
            items = menuItemRepository.findByIsPreorderAvailableTrueAndIsActiveTrue();
        } else if (Boolean.TRUE.equals(activeOnly)) {
            items = menuItemRepository.findByIsActiveTrue();
        } else {
            items = menuItemRepository.findAll();
        }

        Map<UUID, String> categoryNames = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(MenuCategory::getId, MenuCategory::getName));

        return items.stream()
                .map(item -> mapToResponse(item, categoryNames.getOrDefault(item.getCategoryId(), "")))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItemById(UUID id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MENU_ITEM_NOT_FOUND));
        String catName = categoryRepository.findById(item.getCategoryId())
                .map(MenuCategory::getName).orElse("");
        return mapToResponse(item, catName);
    }

    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        MenuCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        MenuItem item = MenuItem.builder()
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isPreorderAvailable(request.getIsPreorderAvailable() != null ? request.getIsPreorderAvailable() : true)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        MenuItem saved = menuItemRepository.save(item);
        return mapToResponse(saved, category.getName());
    }

    @Transactional
    public MenuItemResponse updateMenuItem(UUID id, MenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MENU_ITEM_NOT_FOUND));

        MenuCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        item.setCategoryId(request.getCategoryId());
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        if (request.getIsPreorderAvailable() != null) item.setIsPreorderAvailable(request.getIsPreorderAvailable());
        if (request.getIsActive() != null) item.setIsActive(request.getIsActive());

        MenuItem saved = menuItemRepository.save(item);
        return mapToResponse(saved, category.getName());
    }

    @Transactional
    public MenuItemResponse toggleActive(UUID id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MENU_ITEM_NOT_FOUND));
        item.setIsActive(!item.getIsActive());
        String catName = categoryRepository.findById(item.getCategoryId()).map(MenuCategory::getName).orElse("");
        return mapToResponse(menuItemRepository.save(item), catName);
    }

    @Transactional
    public void deleteMenuItem(UUID id) {
        if (!menuItemRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.MENU_ITEM_NOT_FOUND);
        }
        menuItemRepository.deleteById(id);
    }

    public MenuItemResponse mapToResponse(MenuItem entity, String categoryName) {
        return MenuItemResponse.builder()
                .id(entity.getId())
                .categoryId(entity.getCategoryId())
                .categoryName(categoryName)
                .name(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .imageUrl(entity.getImageUrl())
                .isPreorderAvailable(entity.getIsPreorderAvailable())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
