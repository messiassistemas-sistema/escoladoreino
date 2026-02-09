-- Add modality column to students table
ALTER TABLE students 
ADD COLUMN modality TEXT DEFAULT 'presencial' CHECK (modality IN ('presencial', 'online'));

-- Add release_for_presencial column to lessons table
ALTER TABLE lessons 
ADD COLUMN release_for_presencial BOOLEAN DEFAULT false;
