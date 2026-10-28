package com.tablemaster.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP Message Broker (UC-06)
 * Broadcast sự kiện khóa giữ bàn (vàng), nhả bàn (xanh) hoặc đặt thành công (đỏ)
 * tới toàn bộ các client đang xem sơ đồ mặt bằng.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic broadcast cho client đăng ký lắng nghe (e.g. /topic/tables/status, /topic/floor-plan)
        config.enableSimpleBroker("/topic");
        // Tiền tố cho message từ client gửi lên server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket trực tiếp
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        // Endpoint WebSocket hỗ trợ SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
