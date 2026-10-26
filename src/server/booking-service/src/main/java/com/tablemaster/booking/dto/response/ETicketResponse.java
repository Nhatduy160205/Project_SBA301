package com.tablemaster.booking.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for E-Ticket with 64-character dynamic secure QR check-in token (UC-12).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ETicketResponse {

    private UUID bookingId;
    private String bookingCode;
    private UUID userId;
    private String guestName;
    private String guestPhone;
    private String guestEmail;

    // Time & Location
    private LocalDate bookingDate;
    private String timeSlotName;
    private String timeSlotRange;
    private Integer guestCount;
    private String tableCode;
    private Integer floorNumber;
    private String floorName;
    private String zoneName;

    // Financial & Status
    private BigDecimal totalDeposit;
    private String status;
    private Boolean isConfirmed;

    // Special Requests & Allergies (UC-08)
    private String occasion;
    private String dietaryNotes;
    private Integer babyChairCount;
    private Boolean candleSetup;
    private String specialNotes;

    // Preorder Menu (UC-07)
    private List<BookingResponse.PreorderItemResponse> preorderItems;

    // Dynamic QR Security Token (UC-12: exactly 64 hexadecimal characters)
    private String dynamicQrToken;
    private Integer qrRotationCounter;
    private ZonedDateTime qrExpiresAt;
    private Integer refreshIntervalSeconds;

    // E-Ticket & Notification dispatch info
    private ZonedDateTime ticketIssuedAt;
    private String ticketZnsStatus;
    private String ticketEmailStatus;
    private ZonedDateTime checkinScannedAt;
    private Boolean isAlreadyCheckedIn;

    // Restaurant Michelin branding & arrival guide
    private String restaurantName;
    private String restaurantAddress;
    private String hotline;
    private String dressCode;
}
