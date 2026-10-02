\c tablemaster_analytics;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS vip_customer_insights CASCADE;
DROP TABLE IF EXISTS table_popularity_stats CASCADE;
DROP TABLE IF EXISTS daily_shift_metrics CASCADE;

CREATE TABLE daily_shift_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    time_slot_id UUID NOT NULL,
    slot_name VARCHAR(60) NOT NULL,
    total_bookings INT DEFAULT 0,
    total_seated INT DEFAULT 0,
    total_no_shows INT DEFAULT 0,
    total_deposit_collected DECIMAL(14, 2) DEFAULT 0.00,
    no_show_penalty_income DECIMAL(14, 2) DEFAULT 0.00,
    total_food_revenue DECIMAL(14, 2) DEFAULT 0.00,
    revpash_score DECIMAL(10, 2) DEFAULT 0.00,
    occupancy_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_date_slot UNIQUE (metric_date, time_slot_id)
);

CREATE TABLE table_popularity_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID UNIQUE NOT NULL,
    table_code VARCHAR(30) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    total_reservations INT DEFAULT 0,
    cancel_count INT DEFAULT 0,
    total_revenue_generated DECIMAL(14, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vip_customer_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    total_visits INT DEFAULT 0,
    total_spent DECIMAL(14, 2) DEFAULT 0.00,
    average_party_size FLOAT DEFAULT 0.0,
    last_visit_date DATE,
    favorite_zone VARCHAR(50) DEFAULT 'STANDARD',
    loyalty_tier VARCHAR(30) NOT NULL DEFAULT 'BRONZE',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shift_metrics_date ON daily_shift_metrics(metric_date DESC);
CREATE INDEX idx_popularity_revenue ON table_popularity_stats(total_revenue_generated DESC);
CREATE INDEX idx_vip_tier_spent ON vip_customer_insights(loyalty_tier, total_spent DESC);

-- Seed Data
INSERT INTO daily_shift_metrics (
    metric_date, time_slot_id, slot_name, total_bookings,
    total_seated, total_no_shows, total_deposit_collected,
    total_food_revenue, revpash_score, occupancy_rate
) VALUES (
    '2026-10-24',
    'b1000000-0000-0000-0000-000000000002',
    'Ca tối Giờ Vàng (18:30 - 20:30)',
    18, 17, 1, 3600000.00, 45000000.00, 375000.00, 94.4
);

INSERT INTO table_popularity_stats (
    table_id, table_code, zone_type, total_reservations, cancel_count, total_revenue_generated
) VALUES (
    'b3000000-0000-0000-0000-000000000004',
    'OUT-01',
    'OUTDOOR',
    42, 2, 86000000.00
);

INSERT INTO vip_customer_insights (
    user_id, phone_number, full_name, total_visits, total_spent,
    average_party_size, last_visit_date, favorite_zone, loyalty_tier
) VALUES (
    'a0000000-0000-0000-0000-000000000005',
    '+84901234567',
    'Nguyễn Văn A (Khách VIP)',
    8, 28500000.00, 4.5, '2026-10-24', 'OUTDOOR', 'GOLD'
);
