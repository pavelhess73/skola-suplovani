-- Migration 0001: Initial schema for substitution records
CREATE TABLE IF NOT EXISTS substitution_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    original_teacher TEXT,
    type TEXT NOT NULL, -- 'HODINA' | 'DOZOR'
    hour_slot TEXT,
    subject TEXT,
    classroom TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_substitution_records_date ON substitution_records(date);
CREATE INDEX IF NOT EXISTS idx_substitution_records_teacher ON substitution_records(teacher_name);

