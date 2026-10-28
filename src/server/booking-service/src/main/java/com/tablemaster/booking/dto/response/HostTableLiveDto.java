package com.tablemaster.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO Trạng thái và vị trí bàn trực tiếp thời gian thực cho Tablet Lễ tân (UC-15)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostTableLiveDto {
    private UUID tableId;
    private String tableCode;
    private Integer floorNumber;
    private String floorName;
    private Integer capacity;
    private String shape; // rect, circle
    private String status; // AVAILABLE, HOLDING, CONFIRMED, SEATED, CLEANING
    private String zoneType;
    private Float posX;
    private Float posY;
    private Float width;
    private Float height;

    // Thông tin khách đã cọc & đơn hàng
    private UUID bookingId;
    private String bookingCode;
    private String currentGuestName;
    private String guestPhone;
    private String bookingTime;
    private BigDecimal depositAmount;
    private Boolean isConfirmed;

    // Đồng hồ thời gian ngồi ăn (Dining Duration Counter)
    private Instant seatedAt;
    private Long seatedMinutes;
    private String seatedDurationFormatted; // e.g. "48 phút" hoặc "1h 15m"
    private String diningAlertLevel; // NORMAL, LONG_DINING (>75m), OVERSTAY (>105m)
    private Boolean isLateNoShow;

    // UC-08 Nhu cầu đặc biệt & Dị ứng
    private String occasion;
    private String dietaryNotes;
    private Integer babyChairCount;
    private Boolean candleSetup;
    private String specialNotes;

    // UC-07 Thực đơn đặt trước
    private Integer preorderCount;
    private BigDecimal preorderTotalAmount;
}
