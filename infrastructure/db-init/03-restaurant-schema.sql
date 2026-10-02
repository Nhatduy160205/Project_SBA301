\c tablemaster_restaurant;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS floor_plans CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS restaurant_profile CASCADE;

CREATE TABLE restaurant_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL DEFAULT 'The Prime Bistro & Steakhouse',
    hotline VARCHAR(20) NOT NULL DEFAULT '0901234567',
    address TEXT NOT NULL DEFAULT '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    cover_image_url TEXT,
    bank_bin VARCHAR(10) NOT NULL DEFAULT '970422',
    bank_name VARCHAR(50) NOT NULL DEFAULT 'MBBank (Ngân hàng Quân Đội)',
    bank_account_no VARCHAR(30) NOT NULL DEFAULT '0388999999',
    bank_account_holder VARCHAR(100) NOT NULL DEFAULT 'CONG TY TNHH THE PRIME BISTRO',
    default_deposit_amount DECIMAL(12, 2) NOT NULL DEFAULT 200000.00,
    cancellation_grace_hours INT NOT NULL DEFAULT 6,
    hold_timeout_seconds INT NOT NULL DEFAULT 300,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_name VARCHAR(60) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_slot_time UNIQUE (start_time, end_time)
);

CREATE TABLE floor_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_number INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    width_px INT NOT NULL DEFAULT 1600,
    height_px INT NOT NULL DEFAULT 900,
    grid_size INT NOT NULL DEFAULT 20,
    layout_metadata JSONB NOT NULL DEFAULT '{"walls":[], "windows":[], "doors":[], "facilities":[]}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
    table_code VARCHAR(30) UNIQUE NOT NULL,
    zone_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    min_capacity INT NOT NULL DEFAULT 2,
    max_capacity INT NOT NULL DEFAULT 4,
    custom_deposit DECIMAL(12, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    pos_x FLOAT NOT NULL DEFAULT 100.0,
    pos_y FLOAT NOT NULL DEFAULT 100.0,
    shape VARCHAR(20) NOT NULL DEFAULT 'RECT',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    is_preorder_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_tables_zone_active ON tables(zone_type, is_active);
CREATE INDEX idx_tables_floor_capacity ON tables(floor_plan_id, min_capacity, max_capacity) WHERE is_active = TRUE;
CREATE INDEX idx_floor_layout_gin ON floor_plans USING GIN (layout_metadata);

-- Seed Data
INSERT INTO restaurant_profile (id, name, bank_bin, bank_name, bank_account_no, bank_account_holder, default_deposit_amount)
VALUES ('b0000000-0000-0000-0000-000000000001', 'The Prime Bistro & Steakhouse', '970422', 'MBBank', '0388999999', 'CONG TY TNHH THE PRIME BISTRO', 200000.00);

INSERT INTO time_slots (id, slot_name, start_time, end_time) VALUES
('b1000000-0000-0000-0000-000000000001', 'Ca trưa 1 (11:00 - 13:00)', '11:00:00', '13:00:00'),
('b1000000-0000-0000-0000-000000000002', 'Ca tối Giờ Vàng (18:30 - 20:30)', '18:30:00', '20:30:00'),
('b1000000-0000-0000-0000-000000000003', 'Ca đêm Rooftop (21:00 - 23:30)', '21:00:00', '23:30:00');

INSERT INTO floor_plans (id, floor_number, name) VALUES
('b2000000-0000-0000-0000-000000000001', 1, 'Tầng 1 - Sảnh Vòm & Bar'),
('b2000000-0000-0000-0000-000000000002', 2, 'Tầng 2 - Phòng VIP Riêng Tư'),
('b2000000-0000-0000-0000-000000000003', 3, 'Tầng 3 - Sky Lounge Ngoài Trời (Outdoor)');

INSERT INTO tables (id, floor_plan_id, table_code, zone_type, min_capacity, max_capacity, custom_deposit, pos_x, pos_y) VALUES
('b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'BAR-01', 'BAR_COUNTER', 1, 2, 100000.00, 200, 300),
('b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'WIN-01', 'WINDOW_VIEW', 2, 4, 200000.00, 400, 100),
('b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 'VIP-01', 'PRIVATE_VIP', 6, 12, 500000.00, 150, 150),
('b3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000003', 'OUT-01', 'OUTDOOR', 2, 4, 300000.00, 300, 200),
('b3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 'OUT-02', 'OUTDOOR', 4, 6, 300000.00, 500, 200);

INSERT INTO menu_categories (id, name, display_order) VALUES
('b4000000-0000-0000-0000-000000000001', 'Steak Bò Thượng Hạng', 1),
('b4000000-0000-0000-0000-000000000002', 'Rượu Vang & Đồ Uống', 2);

INSERT INTO menu_items (id, category_id, name, price, is_preorder_available) VALUES
('b5000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'Thăn Bò Wagyu A5 Miyazaki 250g', 1850000.00, TRUE),
('b5000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000002', 'Vang Đỏ Château Margaux 2018', 4200000.00, TRUE);
