-- Migration 0003: Add is_replacement column to substitution_records
ALTER TABLE substitution_records ADD COLUMN is_replacement INTEGER DEFAULT 0;

