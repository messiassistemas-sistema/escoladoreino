-- Adiciona coluna para controle de chamada aberta
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS attendance_open BOOLEAN DEFAULT FALSE;
