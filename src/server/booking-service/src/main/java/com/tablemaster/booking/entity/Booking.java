package com.tablemaster.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
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

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING_REVIEW";

    @Column(name = "special_notes", columnDefinition = "TEXT")
    private String specialNotes;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @Column(name = "reviewed_by_user_id")
    private UUID reviewedByUserId;

    @Column(name = "payment_deadline")
    private ZonedDateTime paymentDeadline;

    @Column(name = "checkin_qr_token", unique = true, length = 255)
    private String checkinQrToken;

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
}
