-- Migration 002: Add driver pay columns to trips table

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS driver_pay_calculated NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS driver_pay_bonus NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_pay_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS driver_pay_currency VARCHAR(10) DEFAULT 'CAD',
  ADD COLUMN IF NOT EXISTS driver_pay_details JSONB;
