package com.tablemaster.restaurant;

import com.tablemaster.restaurant.dto.request.TimeSlotRequest;
import com.tablemaster.restaurant.dto.response.TimeSlotResponse;
import com.tablemaster.restaurant.entity.TimeSlot;
import com.tablemaster.restaurant.exception.BadRequestException;
import com.tablemaster.restaurant.exception.ConflictException;
import com.tablemaster.restaurant.exception.ResourceNotFoundException;
import com.tablemaster.restaurant.repository.TimeSlotRepository;
import com.tablemaster.restaurant.service.TimeSlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceTest {

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @InjectMocks
    private TimeSlotService timeSlotService;

    private UUID slotId;
    private TimeSlot timeSlot;
    private TimeSlotRequest timeSlotRequest;

    @BeforeEach
    void setUp() {
        slotId = UUID.randomUUID();

        timeSlot = TimeSlot.builder()
                .id(slotId)
                .slotName("Ca tối Giờ Vàng (18:30 - 20:30)")
                .startTime(LocalTime.of(18, 30))
                .endTime(LocalTime.of(20, 30))
                .maxCapacity(60)
                .isActive(true)
                .build();

        timeSlotRequest = TimeSlotRequest.builder()
                .slotName("Ca tối Giờ Vàng (18:30 - 20:30)")
                .startTime(LocalTime.of(18, 30))
                .endTime(LocalTime.of(20, 30))
                .maxCapacity(60)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("UC-28: Tạo ca giờ thành công khi hợp lệ")
    void testCreateTimeSlot_Success() {
        when(timeSlotRepository.findByStartTimeAndEndTime(any(), any())).thenReturn(Optional.empty());
        when(timeSlotRepository.save(any(TimeSlot.class))).thenReturn(timeSlot);

        TimeSlotResponse result = timeSlotService.createTimeSlot(timeSlotRequest);

        assertNotNull(result);
        assertEquals("Ca tối Giờ Vàng (18:30 - 20:30)", result.getSlotName());
        assertEquals(60, result.getMaxCapacity());
        verify(timeSlotRepository, times(1)).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("UC-28: Báo lỗi BadRequest khi giờ bắt đầu sau giờ kết thúc")
    void testCreateTimeSlot_InvalidHours_ThrowsBadRequest() {
        timeSlotRequest.setStartTime(LocalTime.of(21, 0));
        timeSlotRequest.setEndTime(LocalTime.of(19, 0));

        assertThrows(BadRequestException.class, () -> timeSlotService.createTimeSlot(timeSlotRequest));
        verify(timeSlotRepository, never()).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("UC-28: Báo lỗi Conflict khi ca giờ trùng khung giờ đã có")
    void testCreateTimeSlot_DuplicateTime_ThrowsConflict() {
        when(timeSlotRepository.findByStartTimeAndEndTime(any(), any())).thenReturn(Optional.of(timeSlot));

        assertThrows(ConflictException.class, () -> timeSlotService.createTimeSlot(timeSlotRequest));
        verify(timeSlotRepository, never()).save(any(TimeSlot.class));
    }

    @Test
    @DisplayName("Đổi trạng thái ca giờ (toggleStatus)")
    void testToggleStatus() {
        when(timeSlotRepository.findById(slotId)).thenReturn(Optional.of(timeSlot));
        when(timeSlotRepository.save(any(TimeSlot.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TimeSlotResponse updated = timeSlotService.toggleStatus(slotId);

        assertFalse(updated.getIsActive());
    }

    @Test
    @DisplayName("Lấy tất cả ca giờ theo thứ tự giờ bắt đầu")
    void testGetAllTimeSlots() {
        when(timeSlotRepository.findAllByOrderByStartTimeAsc()).thenReturn(List.of(timeSlot));

        List<TimeSlotResponse> slots = timeSlotService.getAllTimeSlots(false);

        assertEquals(1, slots.size());
        assertEquals(LocalTime.of(18, 30), slots.get(0).getStartTime());
    }

    @Test
    @DisplayName("Lấy ca giờ theo id không tồn tại ném ResourceNotFoundException")
    void testGetTimeSlotById_NotFound() {
        when(timeSlotRepository.findById(slotId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> timeSlotService.getTimeSlotById(slotId));
    }
}
