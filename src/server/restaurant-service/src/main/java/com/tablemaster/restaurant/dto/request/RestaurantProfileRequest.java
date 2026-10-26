package com.tablemaster.restaurant.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantProfileRequest {
    @NotBlank(message = "Tên nhà hàng không được để trống")
    private String name;

    @NotBlank(message = "Số hotline không được để trống")
    private String hotline;

    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    private String description;
    private String coverImageUrl;

    @NotNull(message = "Giờ mở cửa không được để trống")
    private LocalTime openingTime;

    @NotNull(message = "Giờ đóng cửa không được để trống")
    private LocalTime closingTime;

    private Boolean isActive;

    @NotBlank(message = "Mã BIN ngân hàng không được để trống")
    private String bankBin;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    private String bankAccountNo;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    private String bankAccountHolder;

    @NotNull(message = "Mức tiền cọc mặc định không được để trống")
    private BigDecimal defaultDepositAmount;

    @NotNull(message = "Thời gian hủy miễn phí không được để trống")
    private Integer cancellationGraceHours;

    @NotNull(message = "Thời gian giữ bàn tạm thời không được để trống")
    private Integer holdTimeoutSeconds;
}
