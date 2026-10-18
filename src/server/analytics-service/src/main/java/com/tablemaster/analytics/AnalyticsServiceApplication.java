package com.tablemaster.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * TableMaster - Module 5: Analytics & Business Intelligence Service
 * UC-32: Báo cáo Doanh thu Ca, Chỉ số RevPASH & Tỷ lệ No-Show
 */
@SpringBootApplication
@EnableDiscoveryClient
public class AnalyticsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalyticsServiceApplication.class, args);
    }
}