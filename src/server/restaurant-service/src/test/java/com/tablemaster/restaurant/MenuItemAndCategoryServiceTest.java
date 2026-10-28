package com.tablemaster.restaurant;

import com.tablemaster.restaurant.dto.request.MenuCategoryRequest;
import com.tablemaster.restaurant.dto.request.MenuItemRequest;
import com.tablemaster.restaurant.dto.response.MenuCategoryResponse;
import com.tablemaster.restaurant.dto.response.MenuItemResponse;
import com.tablemaster.restaurant.entity.MenuCategory;
import com.tablemaster.restaurant.entity.MenuItem;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.MenuCategoryRepository;
import com.tablemaster.restaurant.repository.MenuItemRepository;
import com.tablemaster.restaurant.service.MenuCategoryService;
import com.tablemaster.restaurant.service.MenuItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuItemAndCategoryServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private MenuCategoryRepository categoryRepository;

    @InjectMocks
    private MenuItemService menuItemService;

    @InjectMocks
    private MenuCategoryService menuCategoryService;

    private UUID categoryId;
    private UUID itemId;
    private MenuCategory category;
    private MenuItem menuItem;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        itemId = UUID.randomUUID();

        category = MenuCategory.builder()
                .id(categoryId)
                .name("Steak Bò Thượng Hạng")
                .displayOrder(1)
                .isActive(true)
                .build();

        menuItem = MenuItem.builder()
                .id(itemId)
                .categoryId(categoryId)
                .name("Thăn Bò Wagyu A5")
                .description("Bò Wagyu A5 cao cấp")
                .price(new BigDecimal("1850000"))
                .isPreorderAvailable(true)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("UC-29: Thêm món ăn mới với cờ đặt trước isPreorderAvailable")
    void testCreateMenuItem_Success() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(menuItem);

        MenuItemRequest request = MenuItemRequest.builder()
                .categoryId(categoryId)
                .name("Thăn Bò Wagyu A5")
                .price(new BigDecimal("1850000"))
                .isPreorderAvailable(true)
                .build();

        MenuItemResponse result = menuItemService.createMenuItem(request);

        assertNotNull(result);
        assertEquals("Thăn Bò Wagyu A5", result.getName());
        assertTrue(result.getIsPreorderAvailable());
        assertEquals("Steak Bò Thượng Hạng", result.getCategoryName());
    }

    @Test
    @DisplayName("UC-29: Thêm món ăn báo lỗi khi không tìm thấy danh mục")
    void testCreateMenuItem_CategoryNotFound() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        MenuItemRequest request = MenuItemRequest.builder()
                .categoryId(categoryId)
                .name("Thăn Bò Wagyu A5")
                .price(new BigDecimal("1850000"))
                .build();

        assertThrows(ResourceNotFoundException.class, () -> menuItemService.createMenuItem(request));
        verify(menuItemRepository, never()).save(any(MenuItem.class));
    }

    @Test
    @DisplayName("Lọc danh sách món ăn chỉ lấy món đặt trước (preorderOnly)")
    void testGetAllMenuItems_PreorderOnly() {
        when(menuItemRepository.findByIsPreorderAvailableTrueAndIsActiveTrue()).thenReturn(List.of(menuItem));
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<MenuItemResponse> items = menuItemService.getAllMenuItems(null, null, true);

        assertEquals(1, items.size());
        assertTrue(items.get(0).getIsPreorderAvailable());
    }

    @Test
    @DisplayName("UC-29: Không cho phép xóa danh mục khi danh mục vẫn còn món ăn")
    void testDeleteCategory_HasItems_ThrowsBadRequest() {
        when(categoryRepository.existsById(categoryId)).thenReturn(true);
        when(menuItemRepository.countByCategoryId(categoryId)).thenReturn(5L);

        assertThrows(BadRequestException.class, () -> menuCategoryService.deleteCategory(categoryId));
        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Xóa danh mục thành công khi không có món ăn")
    void testDeleteCategory_NoItems_Success() {
        when(categoryRepository.existsById(categoryId)).thenReturn(true);
        when(menuItemRepository.countByCategoryId(categoryId)).thenReturn(0L);
        doNothing().when(categoryRepository).deleteById(categoryId);

        assertDoesNotThrow(() -> menuCategoryService.deleteCategory(categoryId));
        verify(categoryRepository, times(1)).deleteById(categoryId);
    }
}
