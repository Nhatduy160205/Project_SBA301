package com.tablemaster.auth.service;

import com.tablemaster.auth.dto.*;
import com.tablemaster.auth.entity.RefreshToken;
import com.tablemaster.auth.entity.User;
import com.tablemaster.auth.entity.UserRole;
import com.tablemaster.auth.repository.RefreshTokenRepository;
import com.tablemaster.auth.repository.UserRepository;
import com.tablemaster.auth.security.JwtTokenProvider;
import com.tablemaster.auth.security.RedisTokenBlacklistService;
import com.tablemaster.auth.util.PhoneNumberUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTokenBlacklistService redisTokenBlacklistService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String phone = request.getPhone() != null ? request.getPhone().trim() : "";
        String normalizedPhone = PhoneNumberUtil.normalizePhoneNumber(phone);

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }

        if (userRepository.findByPhoneNumber(normalizedPhone).isPresent() || userRepository.findByPhoneNumber(phone).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng");
        }

        User newUser = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .phoneNumber(normalizedPhone)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.ROLE_CUSTOMER)
                .isActive(true)
                .build();

        userRepository.save(newUser);

        String accessToken = jwtTokenProvider.generateAccessToken(
                newUser.getId().toString(),
                newUser.getRole().name(),
                newUser.getEmail()
        );

        String rawRefreshToken = jwtTokenProvider.generateRefreshTokenString();
        String tokenHash = hashToken(rawRefreshToken);
        ZonedDateTime expiresAt = ZonedDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000L);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(newUser)
                .tokenHash(tokenHash)
                .deviceInfo("Web/Mobile App Registration")
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .user(mapToUserDto(newUser))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String password = request.getPassword();

        if (identifier.isBlank() || password == null) {
            throw new BadCredentialsException("Identifier and password must be provided");
        }

        User user = findUserByIdentifier(identifier)
                .orElseThrow(() -> new BadCredentialsException("Invalid identifier or password"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is disabled");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid identifier or password");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getRole().name(),
                user.getEmail()
        );

        String rawRefreshToken = jwtTokenProvider.generateRefreshTokenString();
        String tokenHash = hashToken(rawRefreshToken);

        ZonedDateTime expiresAt = ZonedDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000L);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .deviceInfo("Web/Mobile App Session")
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) {
        String rawRefreshToken = request.getRefreshToken();
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken refreshTokenEntity = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (Boolean.TRUE.equals(refreshTokenEntity.getIsRevoked())) {
            log.warn("Attempted use of revoked refresh token for user {}", refreshTokenEntity.getUser().getId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is revoked");
        }

        if (refreshTokenEntity.getExpiresAt().isBefore(ZonedDateTime.now())) {
            refreshTokenEntity.setIsRevoked(true);
            refreshTokenRepository.save(refreshTokenEntity);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        // Token Rotation: revoke current refresh token
        refreshTokenEntity.setIsRevoked(true);
        refreshTokenRepository.save(refreshTokenEntity);

        User user = refreshTokenEntity.getUser();
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is disabled");
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getRole().name(),
                user.getEmail()
        );

        String newRawRefreshToken = jwtTokenProvider.generateRefreshTokenString();
        String newTokenHash = hashToken(newRawRefreshToken);

        ZonedDateTime newExpiresAt = ZonedDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000L);

        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .deviceInfo(refreshTokenEntity.getDeviceInfo())
                .expiresAt(newExpiresAt)
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(newRefreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    @Transactional
    public void logout(String authorizationHeader, LogoutRequest logoutRequest) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String jwt = authorizationHeader.substring(7);
            if (jwtTokenProvider.validateToken(jwt)) {
                String jti = jwtTokenProvider.getJtiFromToken(jwt);
                long remainingMs = jwtTokenProvider.getRemainingMsFromToken(jwt);
                if (jti != null && remainingMs > 0) {
                    redisTokenBlacklistService.blacklistToken(jti, remainingMs);
                }
            }
        }

        if (logoutRequest != null && logoutRequest.getRefreshToken() != null && !logoutRequest.getRefreshToken().isBlank()) {
            String tokenHash = hashToken(logoutRequest.getRefreshToken());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setIsRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String userIdStr) {
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return mapToUserDto(user);
    }

    private Optional<User> findUserByIdentifier(String identifier) {
        if (PhoneNumberUtil.isEmail(identifier)) {
            return userRepository.findByEmail(identifier);
        }

        String normalizedPhone = PhoneNumberUtil.normalizePhoneNumber(identifier);
        Optional<User> userByPhone = userRepository.findByPhoneNumber(normalizedPhone);
        if (userByPhone.isPresent()) {
            return userByPhone;
        }

        return userRepository.findByPhoneNumber(identifier);
    }

    public UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhoneNumber())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .build();
    }

    public static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
