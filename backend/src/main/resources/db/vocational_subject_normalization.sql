-- One-time migration: normalise vocational HSC marks to the canonical structure.
-- Related Subject II carries Theory + Practical I + Practical II sub-rows.
-- Run once against PostgreSQL (erp_admission). Idempotent: re-running is harmless.

-- 1. Relabel legacy flat practical / theory rows to canonical Title Case names.
UPDATE hsc_vocational_marks
SET subject_name = 'Practical I'
WHERE subject_name IN (
    'RELATED SUBJECT II PRACTICAL I', 'RELATED SUBJECT II PRACTICAL',
    'Related Subject II Practical I', 'Related Subject II Practical',
    'PRACTICAL I'
);

UPDATE hsc_vocational_marks
SET subject_name = 'Practical II'
WHERE subject_name IN (
    'RELATED SUBJECT II PRACTICAL II', 'Related Subject II Practical II',
    'PRACTICAL II'
);

-- A standalone THEORY row is the theory component of Related Subject II.
UPDATE hsc_vocational_marks
SET subject_name = 'Related Subject II'
WHERE subject_name IN (
    'THEORY', 'RELATED SUBJECT II THEORY',
    'Theory', 'Related Subject II Theory',
    'RELATED SUBJECT II'
);

-- Normalise the main vocational subject header row.
UPDATE hsc_vocational_marks
SET subject_name = 'Vocational Subject Theory'
WHERE subject_name = 'VOCATIONAL SUBJECT THEORY';

-- 2. Ensure every vocational student has the canonical 5 rows.
--    Existing main rows are preserved; missing practical rows are added with 0 marks.
INSERT INTO hsc_vocational_marks (qualification_id, subject_name, month_year, maximum_marks, marks_obtained, percentage)
SELECT q.qualification_id, s.subject_name, NULL, 100, 0, 0
FROM qualifying_examination q
CROSS JOIN (VALUES
    ('Related Subject II'),
    ('Practical I'),
    ('Practical II')
) AS s(subject_name)
WHERE EXISTS (
    SELECT 1 FROM hsc_vocational_marks v
    WHERE v.qualification_id = q.qualification_id
      AND v.subject_name IN ('Vocational Subject Theory', 'VOCATIONAL SUBJECT THEORY')
)
AND NOT EXISTS (
    SELECT 1 FROM hsc_vocational_marks v
    WHERE v.qualification_id = q.qualification_id
      AND UPPER(v.subject_name) = UPPER(s.subject_name)
);

