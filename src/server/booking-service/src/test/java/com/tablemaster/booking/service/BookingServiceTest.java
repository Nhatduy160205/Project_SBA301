package com.tablemaster.booking.service;

import com.tablemaster.booking.dto.request.ApproveDepositRequest;
import com.tablemaster.booking.dto.request.CheckInRequest;
import com.tablemaster.booking.dto.request.CreateBookingRequest;
import com.tablemaster.booking.dto.response.BookingResponse;
import com.tablemaster.booking.entity.Booking;
import com.tablemaster.booking.enums.BookingStatus;
import com.tablemaster.booking.exception.InvalidBookingStateException;
import com.tablemaster.booking.exception.TableAlreadyBookedException;
import com.tablemaster.booking.kafka.BookingEventProducer;
import com.tablemaster.booking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingTableRepository bookingTableRepository;

    @Mock
    private BookingPreorderItemRepository bookingPreorderItemRepository;

    @Mock
    private TableOperationsAuditRepository tableOperationsAuditRepository;

    @Mock
    private BookingEventProducer bookingEventProducer;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private UUID userId;
    private UUID tableId;
    private UUID timeSlotId;
    private LocalDate bookingDate;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        tableId = UUID.randomUUID();
        timeSlotId = UUID.randomUUID();
        bookingDate = LocalDate.now().plusDays(1);
    }

    @Test
    void createBooking_Success() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .guestName("Nguyễn Văn A")
                .guestPhone("0987654321")
                .guestEmail("vana@example.com")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(4)
                .tableIds(List.of(tableId))
                .build();

        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.countByBookingDate(bookingDate)).thenReturn(0L);

        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(UUID.randomUUID());
            b.setCreatedAt(ZonedDateTime.now());
            b.setUpdatedAt(ZonedDateTime.now());
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, userId);

        assertNotNull(response);
        assertEquals("PENDING_REVIEW", response.getStatus());
        assertEquals("Nguyễn Văn A", response.getGuestName());
        assertTrue(response.getBookingCode().startsWith("BK"));
        verify(bookingEventProducer, times(1)).publishBookingCreated(any(Booking.class));
    }

    @Test
    void createBooking_ThrowsTableAlreadyBookedException() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .guestName("Nguyễn Văn B")
                .guestPhone("0912345678")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(2)
                .tableIds(List.of(tableId))
                .build();

        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(List.of(tableId));

        assertThrows(TableAlreadyBookedException.class, () -> bookingService.createBooking(request, userId));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void checkIn_Success() {
        String qrToken = UUID.randomUUID().toString();
        Booking booking = Booking.builder()
                .id(UUID.randomUUID())
                .bookingCode("BK2610090001")
                .status(BookingStatus.CONFIRMED)
                .checkinQrToken(qrToken)
                .build();

        when(bookingRepository.findByCheckinQrToken(qrToken)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CheckInRequest request = new CheckInRequest(qrToken);
        BookingResponse response = bookingService.checkIn(request);

        assertEquals("SEATED", response.getStatus());
        assertNotNull(response.getSeatedAt());
        verify(bookingEventProducer, times(1)).publishBookingSeated(any(Booking.class));
    }

    @Test
    void checkIn_ThrowsExceptionWhenNotConfirmed() {
        String qrToken = UUID.randomUUID().toString();
        Booking booking = Booking.builder()
                .id(UUID.randomUUID())
                .status(BookingStatus.PENDING_REVIEW)
                .checkinQrToken(qrToken)
                .build();

        when(bookingRepository.findByCheckinQrToken(qrToken)).thenReturn(Optional.of(booking));

        CheckInRequest request = new CheckInRequest(qrToken);
        assertThrows(InvalidBookingStateException.class, () -> bookingService.checkIn(request));
    }
}
