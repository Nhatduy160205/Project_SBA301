package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.TimeSlotRequest;
import com.tablemaster.restaurant.dto.response.TimeSlotResponse;
import com.tablemaster.restaurant.entity.TimeSlot;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;

    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getAllTimeSlots(boolean activeOnly) {
        List<TimeSlot> slots = activeOnly
                ? timeSlotRepository.findByIsActiveTrueOrderByStartTimeAsc()
                : timeSlotRepository.findAllByOrderByStartTimeAsc();
        return slots.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TimeSlotResponse getTimeSlotById(UUID id) {
        TimeSlot slot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TIME_SLOT_NOT_FOUND));
        return mapToResponse(slot);
    }

    @Transactional
    public TimeSlotResponse createTimeSlot(TimeSlotRequest request) {
        validateTimeSlot(request, null);

        TimeSlot timeSlot = TimeSlot.builder()
                .slotName(request.getSlotName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxCapacity(request.getMaxCapacity() != null ? request.getMaxCapacity() : 50)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        TimeSlot saved = timeSlotRepository.save(timeSlot);
        return mapToResponse(saved);
    }

    @Transactional
    public TimeSlotResponse updateTimeSlot(UUID id, TimeSlotRequest request) {
        TimeSlot slot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TIME_SLOT_NOT_FOUND));

        validateTimeSlot(request, id);

        slot.setSlotName(request.getSlotName());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        if (request.getMaxCapacity() != null) {
            slot.setMaxCapacity(request.getMaxCapacity());
        }
        if (request.getIsActive() != null) {
            slot.setIsActive(request.getIsActive());
        }

        TimeSlot saved = timeSlotRepository.save(slot);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTimeSlot(UUID id) {
        if (!timeSlotRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.TIME_SLOT_NOT_FOUND);
        }
        timeSlotRepository.deleteById(id);
    }

    @Transactional
    public TimeSlotResponse toggleStatus(UUID id) {
        TimeSlot slot = timeSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TIME_SLOT_NOT_FOUND));
        slot.setIsActive(!slot.getIsActive());
        return mapToResponse(timeSlotRepository.save(slot));
    }

    private void validateTimeSlot(TimeSlotRequest request, UUID currentId) {
        if (request.getStartTime().compareTo(request.getEndTime()) >= 0) {
            throw new BadRequestException(ErrorCode.TIME_SLOT_INVALID_HOURS);
        }

        timeSlotRepository.findByStartTimeAndEndTime(request.getStartTime(), request.getEndTime())
                .ifPresent(existing -> {
                    if (currentId == null || !existing.getId().equals(currentId)) {
                        throw new ConflictException(ErrorCode.TIME_SLOT_ALREADY_EXISTS);
                    }
                });
    }

    public TimeSlotResponse mapToResponse(TimeSlot entity) {
        return TimeSlotResponse.builder()
                .id(entity.getId())
                .slotName(entity.getSlotName())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .maxCapacity(entity.getMaxCapacity())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
