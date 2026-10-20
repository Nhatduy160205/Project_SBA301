package com.tablemaster.booking.exception;

/**
 * Ngoại lệ ném ra khi bàn đang bị người khác khóa tạm (Redlock) hoặc vừa có người chọn trước
 * Tương ứng HTTP Status 409 Conflict (UC-06).
 */
public class TableAlreadyLockedException extends RuntimeException {
    public TableAlreadyLockedException(String message) {
        super(message);
    }
}
