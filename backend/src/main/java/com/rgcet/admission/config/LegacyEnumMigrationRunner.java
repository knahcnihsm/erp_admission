package com.rgcet.admission.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migrates legacy and uppercase enum values stored in the DB before Hibernate
 * reads them back. EnumType.STRING calls Enum.valueOf() on read, so any row
 * holding an old/uppercase value (TRANSGENDER, MALE, ACTIVE, PAID, PERMANENT…)
 * would throw IllegalArgumentException on the first student query.
 *
 * <p>Phase 1 (original): remaps stale Gender/Caste literals introduced before
 * the enum narrowing (TRANSGENDER→Others, OC/BC…→OBC/Others).
 *
 * <p>Phase 2 (title-case): converts ALL-CAPS enum strings that pre-date the
 * Uppercase→Title Case migration to their new Title Case equivalents.
 *
 * <p>Phase 3 (text columns): INITCAP-normalises free-text columns so that
 * legacy ALL-CAPS data is presented in Title Case.
 *
 * Runs at highest precedence before the application serves traffic.
 * All statements are idempotent — re-running is safe.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LegacyEnumMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        dropStaleEnumCheckConstraints();
        runPhase1LegacyRemap();
        runPhase2TitleCaseEnums();
        runPhase3TitleCaseTextColumns();
    }

    // ---------------------------------------------------------------- Phase 1

    /**
     * Remaps legacy Gender/Caste values that existed before the enum was
     * narrowed (TRANSGENDER, OC, BC, BCM, MBC, SCA).
     */
    private void runPhase1LegacyRemap() {
        int genderRows = updateQuietly(
                "UPDATE student_details SET gender = ? WHERE gender = ?", "Others", "TRANSGENDER");
        int obcRows = updateQuietly(
                "UPDATE student_details SET caste = ? WHERE caste IN (?, ?, ?)", "OBC", "BC", "BCM", "MBC");
        int othersRows = updateQuietly(
                "UPDATE student_details SET caste = ? WHERE caste IN (?, ?)", "Others", "OC", "SCA");
        if (genderRows + obcRows + othersRows > 0) {
            log.info("Phase 1 legacy remap: gender={}, caste->OBC={}, caste->Others={}",
                    genderRows, obcRows, othersRows);
        }
    }


    // ---------------------------------------------------------------- Phase 2

    /**
     * Converts ALL-CAPS enum column values to Title Case so Hibernate's
     * EnumType.STRING can call Enum.valueOf() successfully.
     */
    private void runPhase2TitleCaseEnums() {
        int total = 0;

        // Gender: MALE→Male, FEMALE→Female, OTHERS→Others
        total += updateQuietly("UPDATE student_details SET gender = 'Male'   WHERE gender = 'MALE'");
        total += updateQuietly("UPDATE student_details SET gender = 'Female' WHERE gender = 'FEMALE'");
        total += updateQuietly("UPDATE student_details SET gender = 'Others' WHERE gender = 'OTHERS'");

        // StudentStatus: ACTIVE→Active, DRAFT→Draft, ARCHIVED→Archived
        total += updateQuietly("UPDATE student_details SET status = 'Active'   WHERE status = 'ACTIVE'");
        total += updateQuietly("UPDATE student_details SET status = 'Draft'    WHERE status = 'DRAFT'");
        total += updateQuietly("UPDATE student_details SET status = 'Archived' WHERE status = 'ARCHIVED'");

        // Caste: OTHERS→Others (OBC/SC/ST are acronyms and stay as-is)
        total += updateQuietly("UPDATE student_details SET caste = 'Others' WHERE caste = 'OTHERS'");

        // PaymentStatus: PAID→Paid, PARTIAL→Partial, PENDING→Pending
        total += updateQuietly("UPDATE fee_details SET payment_status = 'Paid'    WHERE payment_status = 'PAID'");
        total += updateQuietly("UPDATE fee_details SET payment_status = 'Partial' WHERE payment_status = 'PARTIAL'");
        total += updateQuietly("UPDATE fee_details SET payment_status = 'Pending' WHERE payment_status = 'PENDING'");
        total += updateQuietly("UPDATE student_fee SET payment_status = 'Paid'    WHERE payment_status = 'PAID'");
        total += updateQuietly("UPDATE student_fee SET payment_status = 'Partial' WHERE payment_status = 'PARTIAL'");
        total += updateQuietly("UPDATE student_fee SET payment_status = 'Pending' WHERE payment_status = 'PENDING'");

        // AddressType: PERMANENT→Permanent, COMMUNICATION→Communication
        total += updateQuietly("UPDATE address SET address_type = 'Permanent'     WHERE address_type = 'PERMANENT'");
        total += updateQuietly("UPDATE address SET address_type = 'Communication' WHERE address_type = 'COMMUNICATION'");

        if (total > 0) {
            log.info("Phase 2 title-case enum migration: {} rows updated", total);
        }
    }

    // ---------------------------------------------------------------- Phase 3

    /**
     * INITCAP-normalises free-text columns (student names, addresses, etc.)
     * that were stored in ALL-CAPS by the previous uppercase migration.
     * Only updates rows whose value still contains a run of ≥2 uppercase letters
     * to avoid re-processing already-normalised data.
     */
    private void runPhase3TitleCaseTextColumns() {
        int total = 0;

        // student_details text columns
        total += updateQuietly(
                "UPDATE student_details SET student_name = INITCAP(student_name) WHERE student_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE student_details SET district = INITCAP(district) WHERE district ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE student_details SET nationality = INITCAP(nationality) WHERE nationality ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE student_details SET archive_reason = INITCAP(archive_reason) WHERE archive_reason ~ '[A-Z]{2}'");

        // parent_details
        total += updateQuietly(
                "UPDATE parent_details SET father_name = INITCAP(father_name) WHERE father_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE parent_details SET father_occupation = INITCAP(father_occupation) WHERE father_occupation ~ '[A-Z]{2}'");

        // address
        total += updateQuietly(
                "UPDATE address SET address_line = INITCAP(address_line) WHERE address_line ~ '[A-Z]{2}'");

        // qualifying_examination
        total += updateQuietly(
                "UPDATE qualifying_examination SET institution_name = INITCAP(institution_name) WHERE institution_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE qualifying_examination SET institution_place = INITCAP(institution_place) WHERE institution_place ~ '[A-Z]{2}'");

        // diploma_details
        total += updateQuietly(
                "UPDATE diploma_details SET diploma = INITCAP(diploma) WHERE diploma ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE diploma_details SET institution_name = INITCAP(institution_name) WHERE institution_name ~ '[A-Z]{2}'");

        // pg_qualification
        total += updateQuietly(
                "UPDATE pg_qualification SET university_name = INITCAP(university_name) WHERE university_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE pg_qualification SET institution_name = INITCAP(institution_name) WHERE institution_name ~ '[A-Z]{2}'");

        // archive
        total += updateQuietly(
                "UPDATE archive SET archive_reason = INITCAP(archive_reason) WHERE archive_reason ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE archive SET description = INITCAP(description) WHERE description ~ '[A-Z]{2}'");

        // master data tables
        total += updateQuietly(
                "UPDATE department SET department_name = INITCAP(department_name) WHERE department_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE program SET program_name = INITCAP(program_name) WHERE program_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE admission_category SET category_name = INITCAP(category_name) WHERE category_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE bus_route SET route_name = INITCAP(route_name) WHERE route_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE bus_stop SET stop_name = INITCAP(stop_name) WHERE stop_name ~ '[A-Z]{2}'");
        total += updateQuietly(
                "UPDATE certificate SET certificate_name = INITCAP(certificate_name) WHERE certificate_name ~ '[A-Z]{2}'");

        if (total > 0) {
            log.info("Phase 3 INITCAP text migration: {} rows updated", total);
        }
    }


    // ---------------------------------------------------------------- helpers

    /**
     * Drops the enum CHECK constraints Hibernate generated for enum columns
     * against the OLD enum values. Hibernate's ddl-auto=update never alters
     * existing constraints, so without this the UPDATEs above (e.g. writing
     * 'Male') would be rejected by the stale constraint that only allows
     * MALE/FEMALE/OTHERS etc.
     */
    private void dropStaleEnumCheckConstraints() {
        executeQuietly("ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_gender_check");
        executeQuietly("ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_caste_check");
        executeQuietly("ALTER TABLE student_details DROP CONSTRAINT IF EXISTS student_details_status_check");
        executeQuietly("ALTER TABLE fee_details    DROP CONSTRAINT IF EXISTS fee_details_payment_status_check");
        executeQuietly("ALTER TABLE student_fee    DROP CONSTRAINT IF EXISTS student_fee_payment_status_check");
        executeQuietly("ALTER TABLE address        DROP CONSTRAINT IF EXISTS address_address_type_check");
    }

    private void executeQuietly(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            log.debug("Constraint drop statement skipped: {}", e.getMessage());
        }
    }

    private int updateQuietly(String sql, Object... args) {
        try {
            return jdbcTemplate.update(sql, args);
        } catch (Exception e) {
            log.debug("Update statement skipped: {}", e.getMessage());
            return 0;
        }
    }
}


