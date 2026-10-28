package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.TableRequest;
import com.tablemaster.restaurant.dto.response.TableResponse;
import com.tablemaster.restaurant.entity.TableEntity;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {

    private final TableRepository tableRepository;

    @Transactional(readOnly = true)
    public List<TableResponse> getAllTables(String zoneType, boolean activeOnly) {
        List<TableEntity> tables;
        if (zoneType != null && !zoneType.isBlank() && !"ALL".equalsIgnoreCase(zoneType)) {
            tables = activeOnly
                    ? tableRepository.findByZoneTypeAndIsActiveTrue(zoneType.trim().toUpperCase())
                    : tableRepository.findByZoneType(zoneType.trim().toUpperCase());
        } else {
            tables = activeOnly
                    ? tableRepository.findByIsActiveTrue()
                    : tableRepository.findAll();
        }
        return tables.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TABLE_NOT_FOUND));
        return mapToResponse(table);
    }

    @Transactional(readOnly = true)
    public TableResponse getTableByCode(String code) {
        TableEntity table = tableRepository.findByTableCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TABLE_NOT_FOUND));
        return mapToResponse(table);
    }

    @Transactional
    public TableResponse createTable(TableRequest request) {
        validateTable(request, null);

        TableEntity table = TableEntity.builder()
                .tableCode(request.getTableCode().trim().toUpperCase())
                .zoneType(request.getZoneType() != null && !request.getZoneType().isBlank() ? request.getZoneType().trim().toUpperCase() : "STANDARD")
                .minCapacity(request.getMinCapacity())
                .maxCapacity(request.getMaxCapacity())
                .customDeposit(request.getCustomDeposit())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        TableEntity saved = tableRepository.save(table);
        return mapToResponse(saved);
    }

    @Transactional
    public TableResponse updateTable(UUID id, TableRequest request) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TABLE_NOT_FOUND));

        validateTable(request, id);

        table.setTableCode(request.getTableCode().trim().toUpperCase());
        if (request.getZoneType() != null && !request.getZoneType().isBlank()) {
            table.setZoneType(request.getZoneType().trim().toUpperCase());
        }
        table.setMinCapacity(request.getMinCapacity());
        table.setMaxCapacity(request.getMaxCapacity());
        table.setCustomDeposit(request.getCustomDeposit());
        if (request.getIsActive() != null) {
            table.setIsActive(request.getIsActive());
        }

        TableEntity saved = tableRepository.save(table);
        return mapToResponse(saved);
    }

    @Transactional
    public TableResponse toggleActive(UUID id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TABLE_NOT_FOUND));
        table.setIsActive(!table.getIsActive());
        return mapToResponse(tableRepository.save(table));
    }

    @Transactional
    public void deleteTable(UUID id) {
        if (!tableRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.TABLE_NOT_FOUND);
        }
        tableRepository.deleteById(id);
    }

    private void validateTable(TableRequest request, UUID currentId) {
        if (request.getMinCapacity() > request.getMaxCapacity()) {
            throw new BadRequestException(ErrorCode.TABLE_CAPACITY_INVALID);
        }

        String code = request.getTableCode().trim().toUpperCase();
        boolean exists = (currentId == null)
                ? tableRepository.existsByTableCode(code)
                : tableRepository.existsByTableCodeAndIdNot(code, currentId);

        if (exists) {
            throw new ConflictException(ErrorCode.TABLE_CODE_ALREADY_EXISTS);
        }
    }

    public TableResponse mapToResponse(TableEntity entity) {
        return TableResponse.builder()
                .id(entity.getId())
                .tableCode(entity.getTableCode())
                .zoneType(entity.getZoneType())
                .minCapacity(entity.getMinCapacity())
                .maxCapacity(entity.getMaxCapacity())
                .customDeposit(entity.getCustomDeposit())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
