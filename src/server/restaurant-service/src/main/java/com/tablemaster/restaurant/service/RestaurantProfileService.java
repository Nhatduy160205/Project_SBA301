package com.tablemaster.restaurant.service;

import com.tablemaster.restaurant.dto.request.RestaurantProfileRequest;
import com.tablemaster.restaurant.dto.response.RestaurantProfileResponse;
import com.tablemaster.restaurant.entity.RestaurantProfile;
import com.tablemaster.restaurant.exception.ErrorCode;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.RestaurantProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantProfileService {

    private final RestaurantProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public RestaurantProfileResponse getProfile() {
        RestaurantProfile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESTAURANT_PROFILE_NOT_FOUND));
        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public RestaurantProfileResponse getProfileById(UUID id) {
        RestaurantProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESTAURANT_NOT_FOUND));
        return mapToResponse(profile);
    }

    @Transactional
    public RestaurantProfileResponse updateProfile(UUID id, RestaurantProfileRequest request) {
        RestaurantProfile profile = (id != null)
                ? profileRepository.findById(id).orElseGet(() -> profileRepository.findFirstByOrderByIdAsc().orElse(new RestaurantProfile()))
                : profileRepository.findFirstByOrderByIdAsc().orElse(new RestaurantProfile());

        profile.setName(request.getName());
        profile.setHotline(request.getHotline());
        profile.setEmail(request.getEmail());
        profile.setAddress(request.getAddress());
        profile.setDescription(request.getDescription());
        if (request.getCoverImageUrl() != null) {
            profile.setCoverImageUrl(request.getCoverImageUrl());
        }
        profile.setOpeningTime(request.getOpeningTime());
        profile.setClosingTime(request.getClosingTime());
        if (request.getIsActive() != null) {
            profile.setIsActive(request.getIsActive());
        }
        profile.setBankBin(request.getBankBin());
        profile.setBankName(request.getBankName());
        profile.setBankAccountNo(request.getBankAccountNo());
        profile.setBankAccountHolder(request.getBankAccountHolder());
        profile.setDefaultDepositAmount(request.getDefaultDepositAmount());
        profile.setCancellationGraceHours(request.getCancellationGraceHours());
        profile.setHoldTimeoutSeconds(request.getHoldTimeoutSeconds());

        RestaurantProfile saved = profileRepository.save(profile);
        return mapToResponse(saved);
    }

    public RestaurantProfileResponse mapToResponse(RestaurantProfile entity) {
        return RestaurantProfileResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .hotline(entity.getHotline())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .description(entity.getDescription())
                .coverImageUrl(entity.getCoverImageUrl())
                .openingTime(entity.getOpeningTime())
                .closingTime(entity.getClosingTime())
                .isActive(entity.getIsActive())
                .bankBin(entity.getBankBin())
                .bankName(entity.getBankName())
                .bankAccountNo(entity.getBankAccountNo())
                .bankAccountHolder(entity.getBankAccountHolder())
                .defaultDepositAmount(entity.getDefaultDepositAmount())
                .cancellationGraceHours(entity.getCancellationGraceHours())
                .holdTimeoutSeconds(entity.getHoldTimeoutSeconds())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
