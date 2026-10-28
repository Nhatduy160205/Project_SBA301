package com.tablemaster.booking.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * UC-10: DTO Đăng ký tổ chức tiệc đoàn đông / Sự kiện bao trọn tầng (Private Banquet & Event Inquiry)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEventInquiryRequest {

    @NotBlank(message = "Họ và tên người đại diện không được để trống")
    private String guestName;

    @NotBlank(message = "Số điện thoại liên hệ không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String guestPhone;

    @NotBlank(message = "Email liên hệ không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String guestEmail;

    private String companyName;

    @NotNull(message = "Ngày tổ chức sự kiện không được để trống")
    @FutureOrPresent(message = "Ngày tổ chức sự kiện phải từ ngày hôm nay trở đi")
    private LocalDate bookingDate;

    private UUID timeSlotId;
    private String preferredTime; // e.g. "18:00 - 22:00"

    @NotNull(message = "Số lượng khách ước tính không được để trống")
    @Min(value = 15, message = "Tiệc sự kiện / bao trọn tầng yêu cầu tối thiểu 15 khách")
    @Max(value = 200, message = "Sức chứa tối đa của nhà hàng là 200 khách")
    private Integer guestCount;

    @NotBlank(message = "Loại hình sự kiện không được để trống")
    private String eventType; // ROOFTOP_BUYOUT, COMPANY_PARTY, BIRTHDAY_GALA, WORKSHOP, WEDDING_BANQUET, OTHER

    private Integer targetFloor; // 1: Grand Bistro, 2: VIP Salon, 3: Sky Lounge Rooftop

    private BigDecimal estimatedBudget;

    private Boolean stageAudioRequired;
    private Boolean decorationRequired;

    private String menuPreference; // SET_MENU_5_COURSES, BUFFET_FRENCH, COCKTAIL_CANAPE

    private String specialNotes;
}
