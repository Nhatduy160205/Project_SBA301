package com.tablemaster.restaurant.controller;

import com.tablemaster.restaurant.dto.request.RestaurantProfileRequest;
import com.tablemaster.restaurant.dto.response.ApiResponse;
import com.tablemaster.restaurant.dto.response.RestaurantProfileResponse;
import com.tablemaster.restaurant.service.RestaurantProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/restaurants", "/api/v1/restaurant"})
@RequiredArgsConstructor
public class RestaurantProfileController {

    private final RestaurantProfileService profileService;

    @GetMapping({"", "/profile"})
    public ResponseEntity<ApiResponse<RestaurantProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success(profileService.getProfile()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantProfileResponse>> getProfileById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getProfileById(id)));
    }

    @PutMapping({"", "/profile", "/{id}"})
    public ResponseEntity<ApiResponse<RestaurantProfileResponse>> updateProfile(
            @PathVariable(value = "id", required = false) UUID id,
            @Valid @RequestBody RestaurantProfileRequest request) {
        RestaurantProfileResponse updated = profileService.updateProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhà hàng thành công", updated));
    }
}
