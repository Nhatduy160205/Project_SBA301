package com.tablemaster.auth.dto;

import com.tablemaster.auth.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private Boolean isActive;
    private Integer loyaltyPoints;
    private String avatarUrl;
    private String dietaryPreferences;
}
