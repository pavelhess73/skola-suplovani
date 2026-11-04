-- Migration 0002: Schema for teacher absences (Chybějící)
CREATE TABLE IF NOT EXISTS absence_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    reason TEXT, -- Důvod (např. Sick Day, Školení, Lékař)
    time_range TEXT, -- Kdy (např. Celý den, 2 - 3)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_absence_records_date ON absence_records(date);
CREATE INDEX IF NOT EXISTS idx_absence_records_teacher ON absence_records(teacher_name);

