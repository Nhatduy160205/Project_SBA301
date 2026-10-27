package com.tablemaster.restaurant;

import com.tablemaster.restaurant.dto.request.BlackoutDateRequest;
import com.tablemaster.restaurant.dto.response.BlackoutDateResponse;
import com.tablemaster.restaurant.entity.BlackoutDate;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.BlackoutDateRepository;
import com.tablemaster.restaurant.service.BlackoutDateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlackoutDateServiceTest {

    @Mock
    private BlackoutDateRepository blackoutDateRepository;

    @InjectMocks
    private BlackoutDateService blackoutDateService;

    private UUID blackoutId;
    private LocalDate eventDate;
    private BlackoutDate blackoutDate;
    private BlackoutDateRequest blackoutDateRequest;

    @BeforeEach
    void setUp() {
        blackoutId = UUID.randomUUID();
        eventDate = LocalDate.of(2026, 12, 24);

        blackoutDate = BlackoutDate.builder()
                .id(blackoutId)
                .eventDate(eventDate)
                .eventName("Giáng Sinh (Christmas Eve)")
                .isClosed(false)
                .customDepositAmount(new BigDecimal("500000"))
                .requireSpecialMenu(true)
                .note("Phụ thu lễ Giáng Sinh")
                .build();

        blackoutDateRequest = BlackoutDateRequest.builder()
                .eventDate(eventDate)
                .eventName("Giáng Sinh (Christmas Eve)")
                .isClosed(false)
                .customDepositAmount(new BigDecimal("500000"))
                .requireSpecialMenu(true)
                .note("Phụ thu lễ Giáng Sinh")
                .build();
    }

    @Test
    @DisplayName("UC-30: Tạo cấu hình ngày lễ / blackout date thành công")
    void testCreateBlackoutDate_Success() {
        when(blackoutDateRepository.existsByEventDate(eventDate)).thenReturn(false);
        when(blackoutDateRepository.save(any(BlackoutDate.class))).thenReturn(blackoutDate);

        BlackoutDateResponse result = blackoutDateService.createBlackoutDate(blackoutDateRequest);

        assertNotNull(result);
        assertEquals(eventDate, result.getEventDate());
        assertEquals(new BigDecimal("500000"), result.getCustomDepositAmount());
        assertTrue(result.getRequireSpecialMenu());
        verify(blackoutDateRepository, times(1)).save(any(BlackoutDate.class));
    }

    @Test
    @DisplayName("UC-30: Báo lỗi Conflict khi đã tồn tại cấu hình cho ngày đó")
    void testCreateBlackoutDate_Duplicate_ThrowsConflict() {
        when(blackoutDateRepository.existsByEventDate(eventDate)).thenReturn(true);

        assertThrows(ConflictException.class, () -> blackoutDateService.createBlackoutDate(blackoutDateRequest));
        verify(blackoutDateRepository, never()).save(any(BlackoutDate.class));
    }

    @Test
    @DisplayName("UC-30: Kiểm tra ngày đặc biệt (checkDate)")
    void testGetByDate_Found() {
        when(blackoutDateRepository.findByEventDate(eventDate)).thenReturn(Optional.of(blackoutDate));

        Optional<BlackoutDateResponse> result = blackoutDateService.getByDate(eventDate);

        assertTrue(result.isPresent());
        assertEquals("Giáng Sinh (Christmas Eve)", result.get().getEventName());
    }

    @Test
    @DisplayName("Xóa blackout date báo lỗi khi không tìm thấy")
    void testDeleteBlackoutDate_NotFound() {
        when(blackoutDateRepository.existsById(blackoutId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> blackoutDateService.deleteBlackoutDate(blackoutId));
    }
}
