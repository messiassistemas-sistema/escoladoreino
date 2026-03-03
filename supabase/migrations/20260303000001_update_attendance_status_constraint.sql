-- Drop existing constraint if it exists
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;

-- Add new constraint allowing 'justified' status
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
CHECK (status IN ('present', 'absent', 'justified'));
