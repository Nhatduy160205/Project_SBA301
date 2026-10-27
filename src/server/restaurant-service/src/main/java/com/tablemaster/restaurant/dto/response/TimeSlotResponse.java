package com.tablemaster.restaurant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotResponse {
    private UUID id;
    private String slotName;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxCapacity;
    private Boolean isActive;
    private ZonedDateTime createdAt;
}
