-- =============================================================================
-- One-time migration: UPPERCASE -> Title Case for enum and text columns
-- Target: PostgreSQL database 'erp_admission'
-- Safe to run multiple times -- all WHERE clauses are idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop stale CHECK constraints (Hibernate ddl-auto=update never alters them)
-- ---------------------------------------------------------------------------
ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_gender_check;
ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_caste_check;
ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_status_check;
ALTER TABLE fee_details     DROP CONSTRAINT IF EXISTS fee_details_payment_status_check;
ALTER TABLE student_fee     DROP CONSTRAINT IF EXISTS student_fee_payment_status_check;
ALTER TABLE address         DROP CONSTRAINT IF EXISTS address_address_type_check;

-- ---------------------------------------------------------------------------
-- 2. Enum: gender  (MALE->Male, FEMALE->Female, OTHERS/TRANSGENDER->Others)
-- ---------------------------------------------------------------------------
UPDATE student_details SET gender = 'Male'   WHERE gender = 'MALE';
UPDATE student_details SET gender = 'Female' WHERE gender = 'FEMALE';
UPDATE student_details SET gender = 'Others' WHERE gender IN ('OTHERS', 'TRANSGENDER');

-- ---------------------------------------------------------------------------
-- 3. Enum: status  (ACTIVE->Active, DRAFT->Draft, ARCHIVED->Archived)
-- ---------------------------------------------------------------------------
UPDATE student_details SET status = 'Active'   WHERE status = 'ACTIVE';
UPDATE student_details SET status = 'Draft'    WHERE status = 'DRAFT';
UPDATE student_details SET status = 'Archived' WHERE status = 'ARCHIVED';

-- ---------------------------------------------------------------------------
-- 4. Enum: caste  (OBC/SC/ST stay -- acronyms; OTHERS->Others; legacy BC/etc->OBC)
-- ---------------------------------------------------------------------------
UPDATE student_details SET caste = 'OBC'    WHERE caste IN ('BC', 'BCM', 'MBC');
UPDATE student_details SET caste = 'Others' WHERE caste IN ('OTHERS', 'OC', 'SCA');

-- ---------------------------------------------------------------------------
-- 5. Enum: payment_status  (PAID->Paid, PARTIAL->Partial, PENDING->Pending)
-- ---------------------------------------------------------------------------
UPDATE fee_details SET payment_status = 'Paid'    WHERE payment_status = 'PAID';
UPDATE fee_details SET payment_status = 'Partial' WHERE payment_status = 'PARTIAL';
UPDATE fee_details SET payment_status = 'Pending' WHERE payment_status = 'PENDING';
UPDATE student_fee SET payment_status = 'Paid'    WHERE payment_status = 'PAID';
UPDATE student_fee SET payment_status = 'Partial' WHERE payment_status = 'PARTIAL';
UPDATE student_fee SET payment_status = 'Pending' WHERE payment_status = 'PENDING';

-- ---------------------------------------------------------------------------
-- 6. Enum: address_type  (PERMANENT->Permanent, COMMUNICATION->Communication)
-- ---------------------------------------------------------------------------
UPDATE address SET address_type = 'Permanent'     WHERE address_type = 'PERMANENT';
UPDATE address SET address_type = 'Communication' WHERE address_type = 'COMMUNICATION';

-- ---------------------------------------------------------------------------
-- 7. Text columns: INITCAP (only rows still containing runs of uppercase)
-- ---------------------------------------------------------------------------
UPDATE student_details SET student_name   = INITCAP(student_name)   WHERE student_name   ~ '[A-Z]{2}';
UPDATE student_details SET district       = INITCAP(district)       WHERE district       ~ '[A-Z]{2}';
UPDATE student_details SET nationality    = INITCAP(nationality)    WHERE nationality    ~ '[A-Z]{2}';
UPDATE student_details SET archive_reason = INITCAP(archive_reason) WHERE archive_reason ~ '[A-Z]{2}';
UPDATE parent_details  SET father_name       = INITCAP(father_name)       WHERE father_name       ~ '[A-Z]{2}';
UPDATE parent_details  SET father_occupation = INITCAP(father_occupation) WHERE father_occupation ~ '[A-Z]{2}';
UPDATE address         SET address_line = INITCAP(address_line) WHERE address_line ~ '[A-Z]{2}';
UPDATE qualifying_examination SET institution_name  = INITCAP(institution_name)  WHERE institution_name  ~ '[A-Z]{2}';
UPDATE qualifying_examination SET institution_place = INITCAP(institution_place) WHERE institution_place ~ '[A-Z]{2}';
UPDATE diploma_details SET diploma          = INITCAP(diploma)          WHERE diploma          ~ '[A-Z]{2}';
UPDATE diploma_details SET institution_name = INITCAP(institution_name) WHERE institution_name ~ '[A-Z]{2}';
UPDATE pg_qualification SET university_name  = INITCAP(university_name)  WHERE university_name  ~ '[A-Z]{2}';
UPDATE pg_qualification SET university_place = INITCAP(university_place) WHERE university_place ~ '[A-Z]{2}';
UPDATE pg_qualification SET institution_name  = INITCAP(institution_name)  WHERE institution_name  ~ '[A-Z]{2}';
UPDATE pg_qualification SET institution_place = INITCAP(institution_place) WHERE institution_place ~ '[A-Z]{2}';
UPDATE archive SET archive_reason = INITCAP(archive_reason) WHERE archive_reason ~ '[A-Z]{2}';
UPDATE archive SET description    = INITCAP(description)    WHERE description    ~ '[A-Z]{2}';

-- ---------------------------------------------------------------------------
-- 8. Master data tables
-- ---------------------------------------------------------------------------
UPDATE department         SET department_name  = INITCAP(department_name)  WHERE department_name  ~ '[A-Z]{2}';
UPDATE program            SET program_name     = INITCAP(program_name)     WHERE program_name     ~ '[A-Z]{2}';
UPDATE admission_category SET category_name    = INITCAP(category_name)    WHERE category_name    ~ '[A-Z]{2}';
UPDATE bus_route          SET route_name       = INITCAP(route_name)       WHERE route_name       ~ '[A-Z]{2}';
UPDATE bus_stop           SET stop_name        = INITCAP(stop_name)        WHERE stop_name        ~ '[A-Z]{2}';
UPDATE certificate        SET certificate_name = INITCAP(certificate_name) WHERE certificate_name ~ '[A-Z]{2}';

-- ---------------------------------------------------------------------------
-- 9. Vocational HSC subject names: Title Case
-- ---------------------------------------------------------------------------
UPDATE hsc_vocational_marks SET subject_name = 'Vocational Subject Theory' WHERE subject_name = 'VOCATIONAL SUBJECT THEORY';
UPDATE hsc_vocational_marks SET subject_name = 'Practical I'               WHERE subject_name = 'PRACTICAL I';
UPDATE hsc_vocational_marks SET subject_name = 'Practical II'              WHERE subject_name = 'PRACTICAL II';
UPDATE hsc_vocational_marks SET subject_name = 'Related Subject II'        WHERE subject_name = 'RELATED SUBJECT II';
UPDATE hsc_vocational_marks SET subject_name = 'Related Subject I'         WHERE subject_name = 'RELATED SUBJECT I';
