package com.tablemaster.booking.util;

import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Utility for generating and verifying cryptographic 64-character dynamic QR check-in tokens (UC-12).
 * Uses HMAC-SHA256 with secure random 32-byte salts and rotation counters.
 */
@Slf4j
public final class QrSecurityUtil {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String DEFAULT_PEPPER = "TableMaster-Michelin-DynamicQR-SecurityPepper-2026";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private QrSecurityUtil() {
        // Utility class
    }

    /**
     * Generates a 64-character hex string representing 32 random bytes (salt).
     */
    public static String generateSecretSalt() {
        byte[] saltBytes = new byte[32];
        SECURE_RANDOM.nextBytes(saltBytes);
        return bytesToHex(saltBytes);
    }

    /**
     * Generates a cryptographic 64-character hex token for the booking and rotation index.
     * Token = HMAC-SHA256(Key: salt + pepper, Data: bookingCode + ":" + rotationCounter)
     *
     * @param bookingCode     the unique booking reference code (e.g., "BK2610260001")
     * @param salt            the 64-character secret salt stored in the booking record
     * @param rotationCounter the current rotation sequence number (1, 2, 3...)
     * @return exactly 64 lowercase hexadecimal characters [0-9a-f]{64}
     */
    public static String generate64CharToken(String bookingCode, String salt, int rotationCounter) {
        try {
            String effectiveSalt = (salt != null && salt.length() >= 32) ? salt : generateSecretSalt();
            String keyMaterial = effectiveSalt + DEFAULT_PEPPER;

            Mac hmac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(keyMaterial.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            hmac.init(keySpec);

            String data = (bookingCode != null ? bookingCode : "TM") + ":" + rotationCounter;
            byte[] rawHmac = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            String hexToken = bytesToHex(rawHmac);
            // Ensure exactly 64 characters (HMAC-SHA256 produces 32 bytes = 64 hex characters)
            if (hexToken.length() != 64) {
                log.warn("Generated token length unexpected: {}", hexToken.length());
            }
            return hexToken;
        } catch (Exception e) {
            log.error("Failed to generate HMAC-SHA256 token, falling back to SHA-256 hash", e);
            return fallbackSha256(bookingCode + ":" + salt + ":" + rotationCounter);
        }
    }

    /**
     * Verifies that the provided token matches the expected 64-character HMAC token in constant time.
     */
    public static boolean verifyToken(String providedToken, String bookingCode, String salt, int rotationCounter) {
        if (providedToken == null || providedToken.trim().length() != 64) {
            return false;
        }
        String expectedToken = generate64CharToken(bookingCode, salt, rotationCounter);
        return MessageDigest.isEqual(
                providedToken.trim().toLowerCase().getBytes(StandardCharsets.UTF_8),
                expectedToken.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Validates whether a token string is a valid 64-character hexadecimal string.
     */
    public static boolean isValid64CharHex(String token) {
        if (token == null || token.length() != 64) {
            return false;
        }
        for (int i = 0; i < 64; i++) {
            char c = token.charAt(i);
            boolean isHex = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
            if (!isHex) return false;
        }
        return true;
    }

    private static String fallbackSha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
