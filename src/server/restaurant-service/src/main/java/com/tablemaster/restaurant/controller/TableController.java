package com.tablemaster.restaurant.controller;

import com.tablemaster.restaurant.dto.request.TableRequest;
import com.tablemaster.restaurant.dto.response.ApiResponse;
import com.tablemaster.restaurant.dto.response.TableResponse;
import com.tablemaster.restaurant.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/tables", "/api/v1/restaurant/tables"})
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAllTables(
            @RequestParam(value = "zoneType", required = false) String zoneType,
            @RequestParam(value = "activeOnly", defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getAllTables(zoneType, activeOnly)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableById(id)));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableByCode(@PathVariable("code") String code) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableByCode(code)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody TableRequest request) {
        TableResponse created = tableService.createTable(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo bàn thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable("id") UUID id,
            @Valid @RequestBody TableRequest request) {
        TableResponse updated = tableService.updateTable(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin bàn thành công", updated));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<TableResponse>> toggleActive(@PathVariable("id") UUID id) {
        TableResponse updated = tableService.toggleActive(id);
        String msg = Boolean.TRUE.equals(updated.getIsActive()) ? "Kích hoạt bàn thành công" : "Ngừng hoạt động bàn thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable("id") UUID id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bàn thành công", null));
    }
}
