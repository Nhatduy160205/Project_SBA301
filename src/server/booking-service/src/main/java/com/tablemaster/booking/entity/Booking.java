package com.tablemaster.booking.entity;

import com.tablemaster.booking.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Bảng đơn đặt bàn chính (bookings)
 * Vòng đời 9 trạng thái: PENDING_REVIEW → AWAITING_PAYMENT → CONFIRMED → SEATED → COMPLETED
 * + REJECTED, EXPIRED, CANCELLED, NO_SHOW
 */
@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_bookings_date_slot", columnList = "booking_date, time_slot_id, status"),
        @Index(name = "idx_bookings_user", columnList = "user_id, status"),
        @Index(name = "idx_bookings_qr_token", columnList = "checkin_qr_token"),
        @Index(name = "idx_bookings_pending_deadline", columnList = "status, payment_deadline")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_code", unique = true, nullable = false, length = 20)
    private String bookingCode;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // Snapshot liên lạc người đặt thực tế (Độc lập & Bảo mật khi SIM đổi chủ)
    @Column(name = "guest_name", nullable = false, length = 100)
    private String guestName;

    @Column(name = "guest_phone", nullable = false, length = 20)
    private String guestPhone;

    @Column(name = "guest_email", nullable = false, length = 120)
    private String guestEmail;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "time_slot_id", nullable = false)
    private UUID timeSlotId;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "total_deposit", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalDeposit = BigDecimal.ZERO;

    // Vòng đời 9 trạng thái
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_REVIEW;

    // UC-08: Mục đích tiệc (BIRTHDAY, BUSINESS, ROMANTIC_DATE, FAMILY, ANNIVERSARY, OTHER)
    @Column(name = "occasion", length = 50)
    private String occasion;

    // UC-08: Ghi chú dị ứng & dinh dưỡng (không tiêu, không cay, dị ứng hải sản...)
    @Column(name = "dietary_notes", columnDefinition = "TEXT")
    private String dietaryNotes;

    // UC-08: Yêu cầu ghế ăn cho trẻ em (Baby high-chair)
    @Column(name = "baby_chair_count", nullable = false)
    @Builder.Default
    private Integer babyChairCount = 0;

    // UC-08: Setup nến thơm lãng mạn
    @Column(name = "candle_setup", nullable = false)
    @Builder.Default
    private Boolean candleSetup = false;

    // UC-10: Đặt tiệc đoàn đông / Sự kiện bao trọn tầng (Private Banquet & Event Inquiry)
    @Column(name = "event_type", length = 50)
    private String eventType; // ROOFTOP_BUYOUT, COMPANY_PARTY, BIRTHDAY_GALA, WORKSHOP, WEDDING_BANQUET, OTHER

    @Column(name = "target_floor")
    private Integer targetFloor; // 1: Grand Bistro, 2: VIP Salon, 3: Sky Lounge Rooftop

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "estimated_budget", precision = 14, scale = 2)
    private BigDecimal estimatedBudget;

    @Column(name = "stage_audio_required", nullable = false)
    @Builder.Default
    private Boolean stageAudioRequired = false;

    @Column(name = "decoration_required", nullable = false)
    @Builder.Default
    private Boolean decorationRequired = false;

    // Hạn chót gọi tư vấn 15 phút (15-Minute Callback SLA)
    @Column(name = "callback_deadline")
    private ZonedDateTime callbackDeadline;

    // Trạng thái cuộc gọi của Quản lý ca (PENDING_CALL, CALLED, PROPOSAL_SENT, ACCEPTED, REJECTED)
    @Column(name = "manager_call_status", length = 30)
    @Builder.Default
    private String managerCallStatus = "PENDING_CALL";

    // Ghi chú tư vấn của Quản lý ca sau cuộc gọi
    @Column(name = "consultation_notes", columnDefinition = "TEXT")
    private String consultationNotes;

    // Ghi chú của khách: "Set nến kỷ niệm ngày cưới"
    @Column(name = "special_notes", columnDefinition = "TEXT")
    private String specialNotes;

    // Ghi chú của Lễ tân sau cuộc gọi Telesales
    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    // Lễ tân nào gọi xác nhận (Ref tablemaster_auth.users)
    @Column(name = "reviewed_by_user_id")
    private UUID reviewedByUserId;

    // Hạn chót cọc VietQR (VD: 60 phút)
    @Column(name = "payment_deadline")
    private ZonedDateTime paymentDeadline;

    // Mã Token sinh mã QR gửi qua Email (Check-in tại sảnh)
    @Column(name = "checkin_qr_token", unique = true, length = 255)
    private String checkinQrToken;

    // UC-12: Vé điện tử E-Ticket & Dynamic QR Code 64 ký tự chống giả mạo
    @Column(name = "ticket_issued_at")
    private ZonedDateTime ticketIssuedAt;

    @Column(name = "ticket_zns_status", length = 30)
    @Builder.Default
    private String ticketZnsStatus = "PENDING";

    @Column(name = "ticket_email_status", length = 30)
    @Builder.Default
    private String ticketEmailStatus = "PENDING";

    @Column(name = "qr_secret_salt", length = 64)
    private String qrSecretSalt;

    @Column(name = "qr_rotation_counter")
    @Builder.Default
    private Integer qrRotationCounter = 1;

    @Column(name = "checkin_scanned_at")
    private ZonedDateTime checkinScannedAt;

    @Column(name = "seated_at")
    private ZonedDateTime seatedAt;

    @Column(name = "completed_at")
    private ZonedDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    // ==================== QUAN HỆ ====================

    // Liên kết với bàn ăn (1 booking có thể chiếm 1 hoặc nhiều bàn - ghép bàn)
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingTable> bookingTables = new ArrayList<>();

    // Danh sách món đặt trước từ Web
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingPreorderItem> preorderItems = new ArrayList<>();

    // Danh sách món gọi thêm tại bàn qua Tablet Phục vụ
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TableOrderItem> tableOrderItems = new ArrayList<>();
}
