-- Add subject_id column to teacher_availability table
ALTER TABLE teacher_availability ADD COLUMN subject_id text REFERENCES subjects(id);

-- Update schema metadata
