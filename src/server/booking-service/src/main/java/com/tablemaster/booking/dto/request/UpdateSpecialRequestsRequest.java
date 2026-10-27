package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

/**
 * DTO: Cập nhật Nhu cầu đặc biệt & Ghi chú dị ứng cho đơn đặt bàn (UC-08)
 * PUT /api/v1/bookings/{id}/special-requests
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSpecialRequestsRequest {

    // Mục đích tiệc (BIRTHDAY, BUSINESS, ROMANTIC_DATE, FAMILY, ANNIVERSARY, OTHER)
    private String occasion;

    // Ghi chú dị ứng & ăn uống (không rắc tiêu, không cay, dị ứng hải sản...)
    private String dietaryNotes;

    // Yêu cầu ghế ăn cho trẻ em (Baby high-chair)
    @Min(value = 0, message = "Số lượng ghế em bé không được âm")
    private Integer babyChairCount;

    // Setup nến thơm lãng mạn
    private Boolean candleSetup;

    // Ghi chú chi tiết bổ sung của khách
    private String specialNotes;

    // Ghi chú nội bộ của nhân viên/lễ tân
    private String staffNotes;
}
