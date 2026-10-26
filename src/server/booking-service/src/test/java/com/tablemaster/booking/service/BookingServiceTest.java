package com.tablemaster.booking.service;

import com.tablemaster.booking.dto.request.ApproveDepositRequest;
import com.tablemaster.booking.dto.request.CheckInRequest;
import com.tablemaster.booking.dto.request.CreateBookingRequest;
import com.tablemaster.booking.dto.request.PreorderItemRequest;
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

    @Mock
    private InvoicePdfService invoicePdfService;

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

    @Test
    void getBookingsByUserId_Success() {
        Booking booking = Booking.builder()
                .id(UUID.randomUUID())
                .bookingCode("BK2610090001")
                .userId(userId)
                .guestName("Nguyễn Văn A")
                .guestPhone("0987654321")
                .status(BookingStatus.CONFIRMED)
                .build();

        when(bookingRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(booking));

        List<BookingResponse> responses = bookingService.getBookingsByUserId(userId);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("BK2610090001", responses.get(0).getBookingCode());
        verify(bookingRepository, times(1)).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void generateDepositInvoicePdf_Success() {
        UUID bookingId = UUID.randomUUID();
        Booking booking = Booking.builder()
                .id(bookingId)
                .bookingCode("BK2610090001")
                .guestName("Nguyễn Văn A")
                .guestPhone("0987654321")
                .status(BookingStatus.CONFIRMED)
                .totalDeposit(BigDecimal.valueOf(200000))
                .build();

        byte[] fakePdf = new byte[]{1, 2, 3, 4};
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(invoicePdfService.generateInvoicePdf(booking)).thenReturn(fakePdf);

        byte[] result = bookingService.generateDepositInvoicePdf(bookingId);

        assertNotNull(result);
        assertEquals(4, result.length);
        verify(invoicePdfService, times(1)).generateInvoicePdf(booking);
    }

    @Test
    void createBooking_WithSignaturePreorderDishes_AccumulatesTotalDeposit() {
        // UC-07: Chọn Món ăn Signature Đặt trước (Wagyu A5, Decant vang, Bánh sinh nhật...)
        UUID wagyuMenuId = UUID.randomUUID();
        UUID wineMenuId = UUID.randomUUID();
        UUID cakeMenuId = UUID.randomUUID();

        PreorderItemRequest wagyuItem = PreorderItemRequest.builder()
                .menuItemId(wagyuMenuId)
                .itemName("Thăn Bò Wagyu A5 Miyazaki 250g")
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(1850000))
                .notes("Độ chín: Medium-Rare, ủ nhiệt 45 phút")
                .build();

        PreorderItemRequest wineItem = PreorderItemRequest.builder()
                .menuItemId(wineMenuId)
                .itemName("Vang Đỏ Château Margaux 2018")
                .quantity(1)
                .unitPrice(BigDecimal.valueOf(4200000))
                .notes("Chiết thở bình decanter pha lê trước 30 phút")
                .build();

        PreorderItemRequest cakeItem = PreorderItemRequest.builder()
                .menuItemId(cakeMenuId)
                .itemName("Bánh Kem Sinh Nhật Thiết Kế Riêng")
                .quantity(1)
                .unitPrice(BigDecimal.valueOf(450000))
                .notes("Viết chữ: Chúc Mừng Sinh Nhật Minh Anh 26th")
                .build();

        CreateBookingRequest request = CreateBookingRequest.builder()
                .guestName("Hoàng Nhật Duy")
                .guestPhone("0909123456")
                .guestEmail("nhanvien@tablemaster.vn")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(4)
                .tableIds(List.of(tableId))
                .totalDeposit(BigDecimal.valueOf(200000)) // Tiền cọc giữ bàn
                .preorderItems(List.of(wagyuItem, wineItem, cakeItem))
                .build();

        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.countByBookingDate(bookingDate)).thenReturn(5L);

        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            if (b.getId() == null) {
                b.setId(UUID.randomUUID());
            }
            b.setCreatedAt(ZonedDateTime.now());
            b.setUpdatedAt(ZonedDateTime.now());
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, userId);

        assertNotNull(response);
        // Kiểm tra tiền cọc tích lũy: Cọc bàn (200k) + 2*Wagyu (3.7M) + Vang (4.2M) + Bánh (450k) = 8,550,000 VND
        BigDecimal expectedTotalDeposit = BigDecimal.valueOf(8550000);
        assertEquals(0, expectedTotalDeposit.compareTo(response.getTotalDeposit()), "Tổng tiền cọc phải được cộng dồn chính xác");

        // Kiểm tra danh sách món đặt trước đã được map đầy đủ thông tin & ghi chú công phu
        assertNotNull(response.getPreorderItems());
        assertEquals(3, response.getPreorderItems().size());

        BookingResponse.PreorderItemResponse respWagyu = response.getPreorderItems().get(0);
        assertEquals("Thăn Bò Wagyu A5 Miyazaki 250g", respWagyu.getItemName());
        assertEquals(2, respWagyu.getQuantity());
        assertEquals("Độ chín: Medium-Rare, ủ nhiệt 45 phút", respWagyu.getNotes());
        assertEquals(0, BigDecimal.valueOf(3700000).compareTo(respWagyu.getSubtotal()));

        BookingResponse.PreorderItemResponse respWine = response.getPreorderItems().get(1);
        assertEquals("Vang Đỏ Château Margaux 2018", respWine.getItemName());
        assertEquals("Chiết thở bình decanter pha lê trước 30 phút", respWine.getNotes());

        BookingResponse.PreorderItemResponse respCake = response.getPreorderItems().get(2);
        assertEquals("Bánh Kem Sinh Nhật Thiết Kế Riêng", respCake.getItemName());
        assertEquals("Viết chữ: Chúc Mừng Sinh Nhật Minh Anh 26th", respCake.getNotes());

        verify(bookingEventProducer, times(1)).publishBookingCreated(any(Booking.class));
    }

    @Test
    void createBooking_WithSpecialRequestsAndDietaryNotes_Success() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .guestName("Lê Hoàng Nam")
                .guestPhone("0912345678")
                .guestEmail("nam.le@example.com")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(4)
                .tableIds(List.of(tableId))
                .occasion("BIRTHDAY")
                .dietaryNotes("Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ")
                .babyChairCount(1)
                .candleSetup(true)
                .specialNotes("Ưu tiên bàn góc yên tĩnh, bánh kem viết tên Minh Anh")
                .build();

        when(bookingRepository.findBookedTableIds(eq(bookingDate), eq(timeSlotId), anyList()))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.countByBookingDate(bookingDate)).thenReturn(1L);

        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            if (b.getId() == null) {
                b.setId(UUID.randomUUID());
            }
            b.setCreatedAt(ZonedDateTime.now());
            b.setUpdatedAt(ZonedDateTime.now());
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, userId);

        assertNotNull(response);
        assertEquals("BIRTHDAY", response.getOccasion());
        assertEquals("Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ", response.getDietaryNotes());
        assertEquals(1, response.getBabyChairCount());
        assertTrue(response.getCandleSetup());
        assertEquals("Ưu tiên bàn góc yên tĩnh, bánh kem viết tên Minh Anh", response.getSpecialNotes());

        verify(bookingEventProducer, times(1)).publishBookingCreated(any(Booking.class));
    }

    @Test
    void updateSpecialRequests_Success() {
        UUID bookingId = UUID.randomUUID();
        Booking existing = Booking.builder()
                .id(bookingId)
                .bookingCode("BK2610260001")
                .guestName("Trần Tuấn Kiệt")
                .guestPhone("0988889999")
                .guestEmail("kiet.tran@example.com")
                .bookingDate(bookingDate)
                .timeSlotId(timeSlotId)
                .guestCount(2)
                .status(BookingStatus.CONFIRMED)
                .occasion("ROMANTIC_DATE")
                .babyChairCount(0)
                .candleSetup(false)
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(existing));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.tablemaster.booking.dto.request.UpdateSpecialRequestsRequest updateReq =
                com.tablemaster.booking.dto.request.UpdateSpecialRequestsRequest.builder()
                        .occasion("ANNIVERSARY")
                        .dietaryNotes("Không ăn cay, dị ứng đậu phộng")
                        .babyChairCount(1)
                        .candleSetup(true)
                        .specialNotes("Kỷ niệm 3 năm ngày cưới, chuẩn bị nến thơm và 1 ghế ăn em bé high-chair")
                        .staffNotes("Lễ tân đã xác nhận qua điện thoại và ghi chú cho Bếp trưởng")
                        .build();

        BookingResponse response = bookingService.updateSpecialRequests(bookingId, updateReq, UUID.randomUUID());

        assertNotNull(response);
        assertEquals("ANNIVERSARY", response.getOccasion());
        assertEquals("Không ăn cay, dị ứng đậu phộng", response.getDietaryNotes());
        assertEquals(1, response.getBabyChairCount());
        assertTrue(response.getCandleSetup());
        assertEquals("Kỷ niệm 3 năm ngày cưới, chuẩn bị nến thơm và 1 ghế ăn em bé high-chair", response.getSpecialNotes());
        assertEquals("Lễ tân đã xác nhận qua điện thoại và ghi chú cho Bếp trưởng", response.getStaffNotes());

        verify(bookingEventProducer, times(1)).publishSpecialRequestsUpdated(any(Booking.class));
    }
}
