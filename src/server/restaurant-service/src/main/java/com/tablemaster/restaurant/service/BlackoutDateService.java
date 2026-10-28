package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.BlackoutDateRequest;
import com.tablemaster.restaurant.dto.response.BlackoutDateResponse;
import com.tablemaster.restaurant.entity.BlackoutDate;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.BlackoutDateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlackoutDateService {

    private final BlackoutDateRepository blackoutDateRepository;

    @Transactional(readOnly = true)
    public List<BlackoutDateResponse> getAllBlackoutDates() {
        return blackoutDateRepository.findAllByOrderByEventDateAsc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BlackoutDateResponse getBlackoutDateById(UUID id) {
        BlackoutDate entity = blackoutDateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BLACKOUT_DATE_NOT_FOUND));
        return mapToResponse(entity);
    }

    @Transactional(readOnly = true)
    public Optional<BlackoutDateResponse> getByDate(LocalDate date) {
        return blackoutDateRepository.findByEventDate(date).map(this::mapToResponse);
    }

    @Transactional
    public BlackoutDateResponse createBlackoutDate(BlackoutDateRequest request) {
        if (blackoutDateRepository.existsByEventDate(request.getEventDate())) {
            throw new ConflictException(ErrorCode.BLACKOUT_DATE_ALREADY_EXISTS);
        }

        BlackoutDate entity = BlackoutDate.builder()
                .eventDate(request.getEventDate())
                .eventName(request.getEventName())
                .isClosed(request.getIsClosed() != null ? request.getIsClosed() : false)
                .customDepositAmount(request.getCustomDepositAmount())
                .requireSpecialMenu(request.getRequireSpecialMenu() != null ? request.getRequireSpecialMenu() : false)
                .note(request.getNote())
                .build();

        BlackoutDate saved = blackoutDateRepository.save(entity);
        return mapToResponse(saved);
    }

    @Transactional
    public BlackoutDateResponse updateBlackoutDate(UUID id, BlackoutDateRequest request) {
        BlackoutDate entity = blackoutDateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BLACKOUT_DATE_NOT_FOUND));

        if (!entity.getEventDate().equals(request.getEventDate()) && blackoutDateRepository.existsByEventDateAndIdNot(request.getEventDate(), id)) {
            throw new ConflictException(ErrorCode.BLACKOUT_DATE_ALREADY_EXISTS);
        }

        entity.setEventDate(request.getEventDate());
        entity.setEventName(request.getEventName());
        if (request.getIsClosed() != null) entity.setIsClosed(request.getIsClosed());
        entity.setCustomDepositAmount(request.getCustomDepositAmount());
        if (request.getRequireSpecialMenu() != null) entity.setRequireSpecialMenu(request.getRequireSpecialMenu());
        entity.setNote(request.getNote());

        BlackoutDate saved = blackoutDateRepository.save(entity);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteBlackoutDate(UUID id) {
        if (!blackoutDateRepository.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.BLACKOUT_DATE_NOT_FOUND);
        }
        blackoutDateRepository.deleteById(id);
    }

    public BlackoutDateResponse mapToResponse(BlackoutDate entity) {
        return BlackoutDateResponse.builder()
                .id(entity.getId())
                .eventDate(entity.getEventDate())
                .eventName(entity.getEventName())
                .isClosed(entity.getIsClosed())
                .customDepositAmount(entity.getCustomDepositAmount())
                .requireSpecialMenu(entity.getRequireSpecialMenu())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
