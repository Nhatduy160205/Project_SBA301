package com.tablemaster.restaurant;

import com.tablemaster.restaurant.dto.request.TableRequest;
import com.tablemaster.restaurant.dto.response.TableResponse;
import com.tablemaster.restaurant.entity.TableEntity;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.TableRepository;
import com.tablemaster.restaurant.service.TableService;
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
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @InjectMocks
    private TableService tableService;

    private UUID tableId;
    private TableEntity tableEntity;
    private TableRequest tableRequest;

    @BeforeEach
    void setUp() {
        tableId = UUID.randomUUID();

        tableEntity = TableEntity.builder()
                .id(tableId)
                .tableCode("T1-01")
                .zoneType("STANDARD")
                .minCapacity(2)
                .maxCapacity(4)
                .customDeposit(new BigDecimal("200000"))
                .isActive(true)
                .build();

        tableRequest = TableRequest.builder()
                .tableCode("T1-01")
                .zoneType("STANDARD")
                .minCapacity(2)
                .maxCapacity(4)
                .customDeposit(new BigDecimal("200000"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("UC-27: Tạo bàn mới thành công khi dữ liệu hợp lệ")
    void testCreateTable_Success() {
        when(tableRepository.existsByTableCode("T1-01")).thenReturn(false);
        when(tableRepository.save(any(TableEntity.class))).thenReturn(tableEntity);

        TableResponse result = tableService.createTable(tableRequest);

        assertNotNull(result);
        assertEquals("T1-01", result.getTableCode());
        assertEquals("STANDARD", result.getZoneType());
        verify(tableRepository, times(1)).save(any(TableEntity.class));
    }

    @Test
    @DisplayName("UC-27: Báo lỗi Conflict khi mã bàn đã tồn tại")
    void testCreateTable_DuplicateCode_ThrowsConflict() {
        when(tableRepository.existsByTableCode("T1-01")).thenReturn(true);

        assertThrows(ConflictException.class, () -> tableService.createTable(tableRequest));
        verify(tableRepository, never()).save(any(TableEntity.class));
    }

    @Test
    @DisplayName("UC-27: Báo lỗi BadRequest khi minCapacity lớn hơn maxCapacity")
    void testCreateTable_InvalidCapacity_ThrowsBadRequest() {
        tableRequest.setMinCapacity(6);
        tableRequest.setMaxCapacity(4);

        assertThrows(BadRequestException.class, () -> tableService.createTable(tableRequest));
        verify(tableRepository, never()).save(any(TableEntity.class));
    }

    @Test
    @DisplayName("UC-23: Khóa bàn khẩn cấp do bảo trì (toggleActive từ true sang false)")
    void testToggleActive_EmergencyLock() {
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(tableEntity));
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TableResponse locked = tableService.toggleActive(tableId);

        assertFalse(locked.getIsActive(), "Bàn phải chuyển sang trạng thái ngưng hoạt động (khóa bảo trì)");
        verify(tableRepository, times(1)).save(tableEntity);
    }

    @Test
    @DisplayName("UC-23: Mở lại bàn sau bảo trì (toggleActive từ false sang true)")
    void testToggleActive_Reactivate() {
        tableEntity.setIsActive(false);
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(tableEntity));
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TableResponse reactivated = tableService.toggleActive(tableId);

        assertTrue(reactivated.getIsActive(), "Bàn phải được kích hoạt lại");
    }

    @Test
    @DisplayName("Lấy danh sách bàn theo zoneType")
    void testGetAllTables_ByZoneType() {
        when(tableRepository.findByZoneType("STANDARD")).thenReturn(List.of(tableEntity));

        List<TableResponse> tables = tableService.getAllTables("STANDARD", false);

        assertEquals(1, tables.size());
        assertEquals("T1-01", tables.get(0).getTableCode());
    }

    @Test
    @DisplayName("Xóa bàn thành công khi id tồn tại")
    void testDeleteTable_Success() {
        when(tableRepository.existsById(tableId)).thenReturn(true);
        doNothing().when(tableRepository).deleteById(tableId);

        assertDoesNotThrow(() -> tableService.deleteTable(tableId));
        verify(tableRepository, times(1)).deleteById(tableId);
    }

    @Test
    @DisplayName("Xóa bàn báo NotFound khi id không tồn tại")
    void testDeleteTable_NotFound() {
        when(tableRepository.existsById(tableId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> tableService.deleteTable(tableId));
        verify(tableRepository, never()).deleteById(any());
    }
}
