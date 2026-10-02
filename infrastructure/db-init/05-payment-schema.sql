\c tablemaster_payment;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS webhook_audit_logs CASCADE;
DROP TABLE IF EXISTS payment_refunds CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_code VARCHAR(30) UNIQUE NOT NULL,
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'VIETQR',
    transfer_content VARCHAR(100) UNIQUE NOT NULL,
    bank_provider VARCHAR(50) DEFAULT 'MBBANK',
    bank_transaction_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
    refund_amount DECIMAL(12, 2) NOT NULL,
    refund_ratio FLOAT NOT NULL DEFAULT 1.0,
    refund_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING',
    refund_bank_bin VARCHAR(10),
    refund_account_no VARCHAR(30),
    refund_account_holder VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE webhook_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature_header TEXT,
    is_signature_valid BOOLEAN NOT NULL,
    processed_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_content ON payment_transactions(transfer_content);
CREATE INDEX idx_payment_booking ON payment_transactions(booking_id);
CREATE INDEX idx_payment_status_created ON payment_transactions(status, created_at DESC);
CREATE INDEX idx_refund_payment_id ON payment_refunds(payment_transaction_id);

-- Seed Data
INSERT INTO payment_transactions (
    id, transaction_code, booking_id, user_id, amount,
    payment_method, transfer_content, bank_provider,
    bank_transaction_id, status, paid_at
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'TXN-20261024-001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    200000.00,
    'VIETQR',
    'PB BK001',
    'MBBANK',
    'MB_FT261024999988',
    'SUCCESS',
    NOW()
);
