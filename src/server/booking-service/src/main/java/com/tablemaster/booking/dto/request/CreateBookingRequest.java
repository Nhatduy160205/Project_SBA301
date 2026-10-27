package com.tablemaster.booking.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO: Khách gửi yêu cầu đặt bàn trên Web
 * POST /api/v1/bookings/request
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {

    @NotBlank(message = "Tên khách không được để trống")
    @Size(max = 100, message = "Tên khách tối đa 100 ký tự")
    private String guestName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String guestPhone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 120, message = "Email tối đa 120 ký tự")
    private String guestEmail;

    @NotNull(message = "Ngày đặt bàn không được để trống")
    @FutureOrPresent(message = "Ngày đặt bàn phải từ hôm nay trở đi")
    private LocalDate bookingDate;

    @NotNull(message = "Ca giờ không được để trống")
    private UUID timeSlotId;

    @NotNull(message = "Số khách không được để trống")
    @Min(value = 1, message = "Số khách phải ít nhất 1 người")
    private Integer guestCount;

    // Danh sách bàn đã chọn trên sơ đồ 2D (1 hoặc nhiều bàn khi ghép)
    @NotEmpty(message = "Phải chọn ít nhất 1 bàn")
    private List<UUID> tableIds;

    // Ghi chú của khách: "Set nến kỷ niệm ngày cưới"
    private String specialNotes;

    // UC-08: Mục đích tiệc (BIRTHDAY, BUSINESS, ROMANTIC_DATE, FAMILY, ANNIVERSARY, OTHER)
    private String occasion;

    // UC-08: Ghi chú dị ứng & ăn uống (không rắc tiêu, không cay, dị ứng hải sản...)
    private String dietaryNotes;

    // UC-08: Yêu cầu chuẩn bị ghế ăn cho trẻ em (Baby high-chair)
    @Min(value = 0, message = "Số lượng ghế em bé không được âm")
    @Builder.Default
    private Integer babyChairCount = 0;

    // UC-08: Setup nến thơm lãng mạn
    @Builder.Default
    private Boolean candleSetup = false;

    // Danh sách món đặt trước (tuỳ chọn)
    @Valid
    private List<PreorderItemRequest> preorderItems;

    // Tiền cọc (tính tự động hoặc do frontend gửi lên)
    private BigDecimal totalDeposit;
}
