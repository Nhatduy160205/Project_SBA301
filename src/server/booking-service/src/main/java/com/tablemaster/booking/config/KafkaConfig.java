package com.tablemaster.booking.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String TOPIC_BOOKING_CREATED = "booking.created";
    public static final String TOPIC_BOOKING_CONFIRMED = "booking.confirmed";
    public static final String TOPIC_BOOKING_SEATED = "booking.seated";
    public static final String TOPIC_BOOKING_COMPLETED = "booking.completed";
    public static final String TOPIC_BOOKING_CANCELLED = "booking.cancelled";
    public static final String TOPIC_BOOKING_EXPIRED = "booking.expired";
    public static final String TOPIC_TABLE_UPDATED = "booking.table.updated";
    public static final String TOPIC_PAYMENT_SUCCESS = "payment.success";
    public static final String TOPIC_BOOKING_SPECIAL_REQUESTS = "booking.special-notes.updated";
    public static final String TOPIC_EVENT_INQUIRY_CREATED = "booking.event-inquiry.created";
    public static final String TOPIC_EVENT_INQUIRY_CONSULTED = "booking.event-inquiry.consulted";
    public static final String TOPIC_TICKET_ISSUED = "booking.ticket.issued";
    public static final String TOPIC_NOTIFICATION_ZNS_SENT = "notification.zns.sent";
    public static final String TOPIC_NOTIFICATION_EMAIL_SENT = "notification.email.sent";

    @Bean
    public NewTopic ticketIssuedTopic() {
        return TopicBuilder.name(TOPIC_TICKET_ISSUED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationZnsTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATION_ZNS_SENT).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEmailTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATION_EMAIL_SENT).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic eventInquiryCreatedTopic() {
        return TopicBuilder.name(TOPIC_EVENT_INQUIRY_CREATED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic eventInquiryConsultedTopic() {
        return TopicBuilder.name(TOPIC_EVENT_INQUIRY_CONSULTED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingSpecialRequestsTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_SPECIAL_REQUESTS).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCreatedTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_CREATED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingConfirmedTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_CONFIRMED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingSeatedTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_SEATED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCompletedTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_COMPLETED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCancelledTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_CANCELLED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingExpiredTopic() {
        return TopicBuilder.name(TOPIC_BOOKING_EXPIRED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tableUpdatedTopic() {
        return TopicBuilder.name(TOPIC_TABLE_UPDATED).partitions(3).replicas(1).build();
    }
}
