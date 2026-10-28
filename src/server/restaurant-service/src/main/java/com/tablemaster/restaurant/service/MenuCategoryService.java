package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.MenuCategoryRequest;
import com.tablemaster.restaurant.dto.response.MenuCategoryResponse;
import com.tablemaster.restaurant.dto.response.MenuItemResponse;
import com.tablemaster.restaurant.entity.MenuCategory;
import com.tablemaster.restaurant.entity.MenuItem;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.MenuCategoryRepository;
import com.tablemaster.restaurant.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuCategoryService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;

    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getAllCategories(boolean activeOnly, boolean includeItems) {
        List<MenuCategory> categories = activeOnly
                ? categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                : categoryRepository.findAllByOrderByDisplayOrderAsc();

        return categories.stream().map(cat -> {
            MenuCategoryResponse response = mapToResponse(cat);
            if (includeItems) {
                List<MenuItem> items = activeOnly
                        ? itemRepository.findByCategoryIdAndIsActiveTrue(cat.getId())
                        : itemRepository.findByCategoryId(cat.getId());
                response.setItems(items.stream().map(item -> mapItemToResponse(item, cat.getName())).collect(Collectors.toList()));
            }
            return response;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MenuCategoryResponse getCategoryById(UUID id, boolean includeItems) {
        MenuCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        MenuCategoryResponse response = mapToResponse(cat);
        if (includeItems) {
            List<MenuItem> items = itemRepository.findByCategoryId(cat.getId());
            response.setItems(items.stream().map(item -> mapItemToResponse(item, cat.getName())).collect(Collectors.toList()));
        }
        return response;
    }

    @Transactional
    public MenuCategoryResponse createCategory(MenuCategoryRequest request) {
        MenuCategory category = MenuCategory.builder()
                .name(request.getName())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        MenuCategory saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional
    public MenuCategoryResponse updateCategory(UUID id, MenuCategoryRequest request) {
        MenuCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        category.setName(request.getName());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());

        MenuCategory saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Transactional
    public MenuCategoryResponse toggleActive(UUID id) {
        MenuCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND));
        category.setIsActive(!category.getIsActive());
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        long itemCount = itemRepository.countByCategoryId(id);
        if (itemCount > 0) {
            throw new BadRequestException(ErrorCode.CATEGORY_HAS_ITEMS);
        }
        categoryRepository.deleteById(id);
    }

    public MenuCategoryResponse mapToResponse(MenuCategory entity) {
        return MenuCategoryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public MenuItemResponse mapItemToResponse(MenuItem item, String categoryName) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .categoryId(item.getCategoryId())
                .categoryName(categoryName)
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .isPreorderAvailable(item.getIsPreorderAvailable())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
