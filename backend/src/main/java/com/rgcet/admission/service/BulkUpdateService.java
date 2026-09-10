package com.rgcet.admission.service;

import com.rgcet.admission.common.TextUtil;
import com.rgcet.admission.dto.BulkUpdateDtos.ApplySummaryDto;
import com.rgcet.admission.dto.BulkUpdateDtos.BulkUpdateApplyResponse;
import com.rgcet.admission.dto.BulkUpdateDtos.BulkUpdatePreviewResponse;
import com.rgcet.admission.dto.BulkUpdateDtos.BulkUpdateRequest;
import com.rgcet.admission.dto.BulkUpdateDtos.ChangeDto;
import com.rgcet.admission.dto.BulkUpdateDtos.ColumnDto;
import com.rgcet.admission.dto.BulkUpdateDtos.RecordPreviewDto;
import com.rgcet.admission.dto.BulkUpdateDtos.RecordResultDto;
import com.rgcet.admission.dto.BulkUpdateDtos.SheetDto;
import com.rgcet.admission.dto.BulkUpdateDtos.SummaryDto;
import com.rgcet.admission.entity.Address;
import com.rgcet.admission.entity.AddressType;
import com.rgcet.admission.entity.Admission;
import com.rgcet.admission.entity.AdmissionCategory;
import com.rgcet.admission.entity.AuditLog;
import com.rgcet.admission.entity.BusRoute;
import com.rgcet.admission.entity.BusStop;
import com.rgcet.admission.entity.Caste;
import com.rgcet.admission.entity.Certificate;
import com.rgcet.admission.entity.Department;
import com.rgcet.admission.entity.DiplomaDetails;
import com.rgcet.admission.entity.Gender;
import com.rgcet.admission.entity.HSCAcademicMark;
import com.rgcet.admission.entity.HSCVocationalMark;
import com.rgcet.admission.entity.Hostel;
import com.rgcet.admission.entity.PGQualification;
import com.rgcet.admission.entity.ParentDetails;
import com.rgcet.admission.entity.Program;
import com.rgcet.admission.entity.QualifyingExam;
import com.rgcet.admission.entity.Student;
import com.rgcet.admission.entity.StudentCertificate;
import com.rgcet.admission.entity.StudentFee;
import com.rgcet.admission.entity.StudentStatus;
import com.rgcet.admission.repository.AdmissionCategoryRepository;
import com.rgcet.admission.repository.AuditLogRepository;
import com.rgcet.admission.repository.BusRouteRepository;
import com.rgcet.admission.repository.BusStopRepository;
import com.rgcet.admission.repository.CertificateRepository;
import com.rgcet.admission.repository.DepartmentRepository;
import com.rgcet.admission.repository.HostelRepository;
import com.rgcet.admission.repository.ProgramRepository;
import com.rgcet.admission.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BulkUpdateService {

    private static final String SOURCE = "Excel Bulk Update";
    private static final String UPDATED_BY = BulkUpdateSchemaService.UPDATED_BY_DEFAULT;

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
    };

    private static final Set<String> PERCENTAGE_COLUMNS = Set.of(
            "sslc_percentage", "hsc_percentage", "second_year_percentage", "third_year_percentage",
            "aggregate_percentage", "merit_percent", "total_percentage", "main_subject_percentage");
    private static final Set<String> AADHAAR_COLUMNS = Set.of("aadhaar_no");
    private static final Set<String> MOBILE_COLUMNS = Set.of("mobile_number", "mobile");
    private static final Set<String> PINCODE_COLUMNS = Set.of("pincode");
    private static final Set<String> EMAIL_COLUMNS = Set.of("email_id", "email");

    private static final Set<String> ACADEMIC_TABLES = Set.of(
            "qualifying_examination", "diploma_details", "pg_qualification");
    private static final Set<String> HSC_MARK_TABLES = Set.of(
            "hsc_academic_marks", "hsc_vocational_marks");

    private static final Map<String, String> PROGRAM_ALIASES = Map.of(
            "FIRST YEAR", "First Year B.Tech",
            "LATERAL ENTRY", "Second Year B.Tech (Lateral Entry)",
            "PG", "PG");
    private static final Map<String, String> CATEGORY_ALIASES = Map.of(
            "CENTAC", "CENTAC",
            "MANAGEMENT", "Management");
    private static final Map<String, String> DEPARTMENT_ALIASES = Map.of(
            "CSE", "Computer Science & Engineering (CSE)",
            "BME", "Biomedical Engineering (BME)",
            "IT", "Information Technology (IT)",
            "AIDS", "Artificial Intelligence and Data Science (AI&DS)",
            "AIML", "Artificial Intelligence and Machine Learning (AI&ML)",
            "ECE", "Electronics & Communication Engineering (ECE)");

    private final StudentRepository studentRepository;
    private final AdmissionCategoryRepository categoryRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final CertificateRepository certificateRepository;
    private final HostelRepository hostelRepository;
    private final BusRouteRepository busRouteRepository;
    private final BusStopRepository busStopRepository;
    private final AuditLogRepository auditLogRepository;
    private final BulkUpdateSchemaService schemaService;
    private final StudentService studentService;

    // ------------------------------------------------------------------ API

    @Transactional(readOnly = true)
    public BulkUpdatePreviewResponse validate(BulkUpdateRequest request) {
        List<RecordOutcome> outcomes = process(request, false);
        int valid = 0;
        int invalid = 0;
        int changed = 0;
        int unchanged = 0;
        List<RecordPreviewDto> records = new ArrayList<>();
        for (RecordOutcome o : outcomes) {
            if (o.errors.isEmpty()) {
                valid++;
                if (o.changes.isEmpty()) {
                    unchanged++;
                } else {
                    changed++;
                }
            } else {
                invalid++;
            }
            records.add(new RecordPreviewDto(o.applicationNo, o.studentName, o.errors.isEmpty(),
                    o.errors, o.changes));
        }
        SummaryDto summary = new SummaryDto(records.size(), valid, invalid, changed, unchanged);
        return new BulkUpdatePreviewResponse(summary, records);
    }

    @Transactional
    public BulkUpdateApplyResponse apply(BulkUpdateRequest request) {
        List<RecordOutcome> outcomes = process(request, true);
        int updated = 0;
        int skipped = 0;
        int failed = 0;
        List<RecordResultDto> results = new ArrayList<>();
        for (RecordOutcome o : outcomes) {
            String status;
            if (!o.errors.isEmpty()) {
                failed++;
                status = "FAILED";
            } else if (o.changes.isEmpty()) {
                skipped++;
                status = "SKIPPED";
            } else {
                updated++;
                status = "UPDATED";
            }
            results.add(new RecordResultDto(o.applicationNo, o.studentName, status, o.errors));
        }
        ApplySummaryDto summary = new ApplySummaryDto(results.size(), updated, skipped, failed);
        return new BulkUpdateApplyResponse(summary, results);
    }

    // ------------------------------------------------------------------ core

    private List<RecordOutcome> process(BulkUpdateRequest request, boolean persist) {
        Map<String, List<Row>> grouped = new LinkedHashMap<>();
        if (request.sheets() != null) {
            for (SheetDto sheet : request.sheets()) {
                if (sheet.rows() == null) {
                    continue;
                }
                for (Map<String, String> values : sheet.rows()) {
                    if (values == null) {
                        continue;
                    }
                    Row row = new Row(sheet.tableName(), values);
                    String appNo = values.get(BulkUpdateSchemaService.LOOKUP_KEY);
                    String key = appNo == null ? "" : appNo.trim();
                    grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
                }
            }
        }

        List<RecordOutcome> outcomes = new ArrayList<>();
        for (Map.Entry<String, List<Row>> entry : grouped.entrySet()) {
            String appNo = entry.getKey();
            RecordOutcome outcome = new RecordOutcome(appNo);
            if (appNo.isEmpty()) {
                outcome.errors.add("Row is missing " + BulkUpdateSchemaService.LOOKUP_KEY);
                outcomes.add(outcome);
                continue;
            }
            Optional<Student> maybeStudent = studentRepository
                    .findByApplicationNoIgnoreCase(appNo);
            if (maybeStudent.isEmpty()) {
                outcome.errors.add("Student not found for application number: " + appNo);
                outcomes.add(outcome);
                continue;
            }
            Student student = maybeStudent.get();
            if (student.getStatus() == StudentStatus.Archived) {
                outcome.errors.add("Archived students cannot be updated: " + appNo);
            }
            outcome.studentName = student.getStudentName();

            validateDuplicates(appNo, entry.getValue(), outcome);
            preResolveReferences(entry.getValue());
            String programName = resolveProgramName(student, entry.getValue());

            for (Row row : entry.getValue()) {
                validateRow(row, programName, outcome);
            }

            // diff each valid row
            if (outcome.errors.isEmpty()) {
                for (Row row : entry.getValue()) {
                    diffRow(student, row, outcome, persist);
                }
            }

            if (persist && outcome.errors.isEmpty() && !outcome.changes.isEmpty()) {
                finishStudent(student, outcome);
            }
            outcomes.add(outcome);
        }
        return outcomes;
    }

    private void finishStudent(Student student, RecordOutcome outcome) {
        student.setUpdatedAt(LocalDateTime.now());
        if (student.getAdmission() != null) {
            studentService.recomputeFeeIfPresent(student);
        }
        studentRepository.save(student);
        LocalDateTime now = LocalDateTime.now();
        for (ChangeDto change : outcome.changes) {
            AuditLog log = new AuditLog();
            log.setApplicationNo(outcome.applicationNo);
            log.setTableName(change.tableName());
            log.setFieldName(change.fieldName());
            log.setOldValue(change.oldValue());
            log.setNewValue(change.newValue());
            log.setUpdatedBy(UPDATED_BY);
            log.setSource(SOURCE);
            log.setUpdatedAt(now);
            auditLogRepository.save(log);
        }
    }

    // ------------------------------------------------------------------ validation

    private void preResolveReferences(List<Row> rows) {
        for (Row row : rows) {
            schemaService.findTable(row.table).ifPresent(table ->
                    table.columns().forEach(col -> {
                        if (BulkUpdateSchemaService.TYPE_REFERENCE.equals(col.type())) {
                            String raw = row.values.get(col.name());
                            if (!isBlank(raw) && !row.refs.containsKey(col.name())) {
                                ResolvedRef ref = resolveReference(col.fkReference(), raw);
                                if (ref != null) {
                                    row.refs.put(col.name(), ref);
                                }
                            }
                        }
                    }));
        }
    }

    private void validateDuplicates(String appNo, List<Row> rows, RecordOutcome outcome) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Row row : rows) {
            counts.merge(row.table, 1, Integer::sum);
        }
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (e.getValue() > 1) {
                if ("address".equals(e.getKey())) {
                    Set<String> types = new java.util.HashSet<>();
                    for (Row row : rows) {
                        if (!"address".equals(row.table)) {
                            continue;
                        }
                        String t = row.values.get("address_type");
                        if (t == null || !types.add(t.toUpperCase())) {
                            outcome.errors.add(appNo + ": duplicate address rows for the same address_type.");
                            break;
                        }
                    }
                } else if ("student_certificate".equals(e.getKey())) {
                    Set<String> certs = new java.util.HashSet<>();
                    for (Row row : rows) {
                        if (!"student_certificate".equals(row.table)) {
                            continue;
                        }
                        String c = row.values.get("certificate_id");
                        if (c == null || !certs.add(c.toUpperCase())) {
                            outcome.errors.add(appNo + ": duplicate student_certificate rows for the same certificate.");
                            break;
                        }
                    }
                } else if (HSC_MARK_TABLES.contains(e.getKey())) {
                    Set<String> subjects = new java.util.HashSet<>();
                    for (Row row : rows) {
                        if (!e.getKey().equals(row.table)) {
                            continue;
                        }
                        String s = row.values.get("subject_name");
                        if (s == null || !subjects.add(s.toUpperCase())) {
                            outcome.errors.add(appNo + ": duplicate " + e.getKey()
                                    + " rows for the same subject.");
                            break;
                        }
                    }
                } else {
                    outcome.errors.add(appNo + ": multiple rows supplied for table '" + e.getKey() + "'.");
                }
            }
        }
    }

    private void validateRow(Row row, String programName, RecordOutcome outcome) {
        Optional<com.rgcet.admission.dto.BulkUpdateDtos.TableDto> tableOpt = schemaService.findTable(row.table);
        if (tableOpt.isEmpty()) {
            outcome.errors.add("Unknown sheet/table: " + row.table);
            return;
        }
        com.rgcet.admission.dto.BulkUpdateDtos.TableDto table = tableOpt.get();

        if (ACADEMIC_TABLES.contains(row.table) && programName != null) {
            Set<String> allowed = allowedAcademicSheets(programName);
            if (allowed != null && !allowed.contains(row.table)) {
                outcome.errors.add(row.table + " is not applicable for program " + programName);
            }
        }
        if (HSC_MARK_TABLES.contains(row.table)
                && programName != null && !"First Year B.Tech".equals(programName)) {
            outcome.errors.add(row.table + " is not applicable for program " + programName);
        }

        Map<String, ColumnDto> columns = new LinkedHashMap<>();
        for (ColumnDto c : table.columns()) {
            columns.put(c.name(), c);
        }

        // required column presence
        for (ColumnDto c : table.columns()) {
            if (c.required() && isBlank(row.values.get(c.name()))) {
                outcome.errors.add(row.table + "." + c.name() + " is required.");
            }
        }

        for (Map.Entry<String, String> entry : row.values.entrySet()) {
            String column = entry.getKey();
            if (BulkUpdateSchemaService.LOOKUP_KEY.equals(column)) {
                continue;
            }
            ColumnDto col = columns.get(column);
            if (col == null) {
                outcome.errors.add(row.table + ": unknown column '" + column + "'.");
                continue;
            }
            String raw = entry.getValue();
            if (isBlank(raw)) {
                continue;
            }
            validateColumnValue(row, col, raw, outcome);
        }
    }

    private void validateColumnValue(Row row, ColumnDto col, String rawValue, RecordOutcome outcome) {
        String value = rawValue.trim();
        switch (col.type()) {
            case BulkUpdateSchemaService.TYPE_ENUM -> {
                String upper = value.toUpperCase();
                if (col.enumValues().stream().noneMatch(e -> e.equalsIgnoreCase(upper))) {
                    outcome.errors.add(row.table + "." + col.name() + ": invalid value '" + value
                            + "'. Allowed: " + String.join(", ", col.enumValues()));
                }
            }
            case BulkUpdateSchemaService.TYPE_NUMBER -> {
                try {
                    BigDecimal parsed = new BigDecimal(value);
                    if (PERCENTAGE_COLUMNS.contains(col.name())
                            && (parsed.compareTo(BigDecimal.ZERO) < 0 || parsed.compareTo(BigDecimal.valueOf(100)) > 0)) {
                        outcome.errors.add(row.table + "." + col.name() + ": '" + value + "' must be between 0 and 100.");
                    }
                } catch (NumberFormatException e) {
                    outcome.errors.add(row.table + "." + col.name() + ": '" + value + "' is not a valid number.");
                }
            }
            case BulkUpdateSchemaService.TYPE_DATE -> {
                boolean ok = false;
                for (DateTimeFormatter f : DATE_FORMATS) {
                    try {
                        LocalDate.parse(value, f);
                        ok = true;
                        break;
                    } catch (DateTimeParseException ignored) {
                        // try next format
                    }
                }
                if (!ok) {
                    outcome.errors.add(row.table + "." + col.name() + ": '" + value
                            + "' is not a valid date (expected YYYY-MM-DD).");
                }
            }
            case BulkUpdateSchemaService.TYPE_BOOLEAN -> {
                if (normalizeBoolean(value) == null) {
                    outcome.errors.add(row.table + "." + col.name() + ": '" + value
                            + "' is not a valid boolean (use TRUE/FALSE).");
                }
            }
            case BulkUpdateSchemaService.TYPE_REFERENCE -> {
                ResolvedRef ref = resolveReference(col.fkReference(), value);
                if (ref == null) {
                    outcome.errors.add(row.table + "." + col.name() + ": '" + value
                            + "' does not match any master record.");
                } else {
                    row.refs.put(col.name(), ref);
                }
            }
            default -> validateStringFormat(row, col.name(), value, outcome);
        }
    }

    private void validateStringFormat(Row row, String column, String value, RecordOutcome outcome) {
        if (AADHAAR_COLUMNS.contains(column) && !value.matches("\\d{12}")) {
            outcome.errors.add(row.table + "." + column + ": must be exactly 12 digits.");
        } else if (MOBILE_COLUMNS.contains(column) && !value.matches("\\d{10}")) {
            outcome.errors.add(row.table + "." + column + ": must be exactly 10 digits.");
        } else if (PINCODE_COLUMNS.contains(column) && !value.matches("\\d{6}")) {
            outcome.errors.add(row.table + "." + column + ": must be exactly 6 digits.");
        } else if (EMAIL_COLUMNS.contains(column) && !value.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$")) {
            outcome.errors.add(row.table + "." + column + ": '" + value + "' is not a valid email address.");
        }
    }

    private String resolveProgramName(Student student, List<Row> rows) {
        for (Row row : rows) {
            if ("admission".equals(row.table)) {
                ResolvedRef ref = row.refs.get("program_id");
                if (ref != null) {
                    return ref.canonicalName();
                }
            }
        }
        if (student.getAdmission() != null && student.getAdmission().getProgram() != null) {
            return student.getAdmission().getProgram().getProgramName();
        }
        return null;
    }

    private static Set<String> allowedAcademicSheets(String programName) {
        return switch (programName) {
            case "First Year B.Tech" -> Set.of("qualifying_examination");
            case "Second Year B.Tech (Lateral Entry)" -> Set.of("diploma_details");
            case "PG" -> Set.of("pg_qualification");
            default -> null;
        };
    }

    // ------------------------------------------------------------------ diff / apply

    private void diffRow(Student student, Row row, RecordOutcome outcome, boolean persist) {
        Optional<com.rgcet.admission.dto.BulkUpdateDtos.TableDto> tableOpt = schemaService.findTable(row.table);
        if (tableOpt.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : row.values.entrySet()) {
            String column = entry.getKey();
            if (BulkUpdateSchemaService.LOOKUP_KEY.equals(column)
                    || isDiscriminatorColumn(row.table, column)) {
                continue;
            }
            String newValue = canonicalizeForColumn(tableOpt.get(), column, entry.getValue(), row);
            if (newValue == null) {
                continue;
            }
            String oldValue = currentValue(student, row, column);
            if (valuesDiffer(oldValue, newValue)) {
                outcome.changes.add(new ChangeDto(row.table, column, oldValue, newValue));
                if (persist) {
                    applyValue(student, row, tableOpt.get(), column, newValue);
                }
            }
        }
    }

    private boolean isDiscriminatorColumn(String table, String column) {
        return ("address".equals(table) && "address_type".equals(column))
                || ("student_certificate".equals(table) && "certificate_id".equals(column))
                || (HSC_MARK_TABLES.contains(table) && "subject_name".equals(column));
    }

    private String canonicalizeForColumn(com.rgcet.admission.dto.BulkUpdateDtos.TableDto table,
                                         String column, String rawValue, Row row) {
        if (rawValue == null) {
            return null;
        }
        String value = rawValue.trim();
        if (value.isEmpty()) {
            return null;
        }
        return table.columns().stream()
                .filter(c -> c.name().equals(column))
                .findFirst()
                .map(col -> switch (col.type()) {
                    case BulkUpdateSchemaService.TYPE_NUMBER ->
                            new BigDecimal(value).stripTrailingZeros().toPlainString();
                    case BulkUpdateSchemaService.TYPE_DATE -> {
                        for (DateTimeFormatter f : DATE_FORMATS) {
                            try {
                                yield LocalDate.parse(value, f).toString();
                            } catch (DateTimeParseException ignored) {
                                // try next format
                            }
                        }
                        yield value;
                    }
                    case BulkUpdateSchemaService.TYPE_BOOLEAN -> normalizeBoolean(value);
                    case BulkUpdateSchemaService.TYPE_REFERENCE -> {
                        ResolvedRef ref = row.refs.get(column);
                        yield ref == null ? value : ref.canonicalName();
                    }
                    case BulkUpdateSchemaService.TYPE_ENUM -> value.toUpperCase();
                    default -> value;
                })
                .orElse(value);
    }

    private boolean valuesDiffer(String oldValue, String newValue) {
        if (oldValue == null && newValue == null) {
            return false;
        }
        if (oldValue == null || newValue == null) {
            return true;
        }
        return !oldValue.trim().equalsIgnoreCase(newValue.trim());
    }

    // ------------------------------------------------------------------ current values

    private String currentValue(Student student, Row row, String column) {
        return switch (row.table) {
            case "student_details" -> currentStudentDetails(student, column);
            case "parent_details" -> currentParent(student, column);
            case "admission" -> currentAdmission(student, column);
            case "address" -> currentAddress(student, row, column);
            case "qualifying_examination" -> currentQualifyingExam(student, column);
            case "diploma_details" -> currentDiploma(student, column);
            case "pg_qualification" -> currentPg(student, column);
            case "student_fee" -> currentFee(student, row, column);
            case "student_certificate" -> currentCertificate(student, row, column);
            case "hsc_academic_marks" -> currentHscAcademic(student, row, column);
            case "hsc_vocational_marks" -> currentHscVocational(student, row, column);
            default -> null;
        };
    }

    private String currentHscAcademic(Student student, Row row, String column) {
        QualifyingExam exam = student.getQualifyingExam();
        if (exam == null) {
            return null;
        }
        HSCAcademicMark mark = findHscAcademic(exam, subjectOf(row));
        if (mark == null) {
            return null;
        }
        return switch (column) {
            case "month_year" -> mark.getMonthYear();
            case "maximum_marks" -> plain(mark.getMaximumMarks());
            case "marks_obtained" -> plain(mark.getMarksObtained());
            case "percentage" -> plain(mark.getPercentage());
            default -> null;
        };
    }

    private String currentHscVocational(Student student, Row row, String column) {
        QualifyingExam exam = student.getQualifyingExam();
        if (exam == null) {
            return null;
        }
        HSCVocationalMark mark = findHscVocational(exam, subjectOf(row));
        if (mark == null) {
            return null;
        }
        return switch (column) {
            case "month_year" -> mark.getMonthYear();
            case "maximum_marks" -> plain(mark.getMaximumMarks());
            case "marks_obtained" -> plain(mark.getMarksObtained());
            case "percentage" -> plain(mark.getPercentage());
            default -> null;
        };
    }

    private String currentStudentDetails(Student student, String column) {
        return switch (column) {
            case "register_no" -> student.getRegisterNo();
            case "student_name" -> student.getStudentName();
            case "date_of_birth" -> student.getDateOfBirth() == null ? null : student.getDateOfBirth().toString();
            case "aadhaar_no" -> student.getAadhaarNo();
            case "gender" -> student.getGender() == null ? null : student.getGender().name();
            case "district" -> student.getDistrict();
            case "nationality" -> student.getNationality();
            case "caste" -> student.getCaste() == null ? null : student.getCaste().name();
            case "mobile_number" -> student.getMobileNumber();
            case "email_id" -> student.getEmailId();
            default -> null;
        };
    }

    private String currentParent(Student student, String column) {
        ParentDetails parent = student.getParent();
        if (parent == null) {
            return null;
        }
        return switch (column) {
            case "father_name" -> parent.getFatherName();
            case "father_mobile_no" -> parent.getFatherMobileNo();
            case "father_occupation" -> parent.getFatherOccupation();
            case "annual_income" -> parent.getAnnualIncome() == null
                    ? null : parent.getAnnualIncome().stripTrailingZeros().toPlainString();
            default -> null;
        };
    }

    private String currentAdmission(Student student, String column) {
        Admission admission = student.getAdmission();
        if (admission == null) {
            return null;
        }
        return switch (column) {
            case "category_id" -> admission.getCategory() == null ? null : admission.getCategory().getCategoryName();
            case "program_id" -> admission.getProgram() == null ? null : admission.getProgram().getProgramName();
            case "department_id" -> admission.getDepartment() == null ? null : admission.getDepartment().getDepartmentName();
            case "batch" -> admission.getBatch();
            case "date_of_admission" -> admission.getDateOfAdmission() == null
                    ? null : admission.getDateOfAdmission().toString();
            default -> null;
        };
    }

    private String currentAddress(Student student, Row row, String column) {
        Address address = findAddress(student, addressTypeOf(row));
        if (address == null) {
            return null;
        }
        return switch (column) {
            case "address_line" -> address.getAddressLine();
            case "pincode" -> address.getPincode();
            case "phone" -> address.getPhone();
            case "mobile" -> address.getMobile();
            case "email" -> address.getEmail();
            case "same_as_permanent" -> address.getSameAsPermanent() == null
                    ? null : booleanToString(address.getSameAsPermanent());
            default -> null;
        };
    }

    private String currentQualifyingExam(Student student, String column) {
        QualifyingExam exam = student.getQualifyingExam();
        if (exam == null) {
            return null;
        }
        return switch (column) {
            case "institution_name" -> exam.getInstitutionName();
            case "institution_place" -> exam.getInstitutionPlace();
            case "exam_passed" -> exam.getExamPassed();
            case "month_year_of_passing" -> exam.getMonthYearOfPassing();
            case "sslc_registration_no" -> exam.getSslcRegistrationNo();
            case "sslc_percentage" -> plain(exam.getSslcPercentage());
            case "hsc_registration_no" -> exam.getHscRegistrationNo();
            case "hsc_percentage" -> plain(exam.getHscPercentage());
            default -> null;
        };
    }

    private String currentDiploma(Student student, String column) {
        DiplomaDetails diploma = student.getDiplomaDetails();
        if (diploma == null) {
            return null;
        }
        return switch (column) {
            case "diploma" -> diploma.getDiploma();
            case "institution_name" -> diploma.getInstitutionName();
            case "board" -> diploma.getBoard();
            case "second_year_percentage" -> plain(diploma.getSecondYearPercentage());
            case "third_year_percentage" -> plain(diploma.getThirdYearPercentage());
            case "aggregate_percentage" -> plain(diploma.getAggregatePercentage());
            default -> null;
        };
    }

    private String currentPg(Student student, String column) {
        PGQualification pg = student.getPgQualification();
        if (pg == null) {
            return null;
        }
        return switch (column) {
            case "university_name" -> pg.getUniversityName();
            case "university_place" -> pg.getUniversityPlace();
            case "institution_name" -> pg.getInstitutionName();
            case "institution_place" -> pg.getInstitutionPlace();
            case "exam_passed" -> pg.getExamPassed();
            case "month_year_of_passing" -> pg.getMonthYearOfPassing();
            case "total_percentage" -> plain(pg.getTotalPercentage());
            case "main_subject_percentage" -> plain(pg.getMainSubjectPercentage());
            case "degree_registration_no" -> pg.getDegreeRegistrationNo();
            default -> null;
        };
    }

    private String currentFee(Student student, Row row, String column) {
        StudentFee fee = student.getFee();
        if (fee == null) {
            return null;
        }
        return switch (column) {
            case "cut_off_mark" -> plain(fee.getCutOffMark());
            case "merit_percent" -> plain(fee.getMeritPercent());
            case "original_tuition_fee" -> plain(fee.getOriginalTuitionFee());
            case "scholarship_amount" -> plain(fee.getScholarshipAmount());
            case "tuition_fee_per_year" -> plain(fee.getTuitionFeePerYear());
            case "course_duration_years" -> fee.getCourseDurationYears() == null
                    ? null : String.valueOf(fee.getCourseDurationYears());
            case "total_tuition_fee" -> plain(fee.getTotalTuitionFee());
            case "bus_required" -> fee.getBusRequired() == null ? null : booleanToString(fee.getBusRequired());
            case "route_id" -> fee.getRoute() == null ? null : fee.getRoute().getRouteName();
            case "bus_stop_id" -> fee.getBusStop() == null ? null : fee.getBusStop().getStopName();
            case "bus_fee" -> plain(fee.getBusFee());
            case "hostel_required" -> fee.getHostelRequired() == null ? null : booleanToString(fee.getHostelRequired());
            case "hostel_id" -> fee.getHostel() == null ? null : String.valueOf(fee.getHostel().getHostelId());
            case "hostel_fee" -> plain(fee.getHostelFee());
            case "paid_amount" -> plain(fee.getPaidAmount());
            case "pending_amount" -> plain(fee.getPendingAmount());
            default -> null;
        };
    }

    private String currentCertificate(Student student, Row row, String column) {
        ResolvedRef ref = row.refs.get("certificate_id");
        if (ref == null) {
            return null;
        }
        StudentCertificate sc = findCertificate(student, ref.id());
        if (sc == null) {
            return null;
        }
        return switch (column) {
            case "is_submitted" -> sc.getIsSubmitted() == null ? null : booleanToString(sc.getIsSubmitted());
            case "file_path" -> sc.getFilePath();
            default -> null;
        };
    }

    // ------------------------------------------------------------------ apply values

    private void applyValue(Student student, Row row, com.rgcet.admission.dto.BulkUpdateDtos.TableDto table,
                            String column, String value) {
        switch (row.table) {
            case "student_details" -> applyStudentDetails(student, column, value);
            case "parent_details" -> applyParent(student, column, value);
            case "admission" -> applyAdmission(student, row, column, value);
            case "address" -> applyAddress(student, row, column, value);
            case "qualifying_examination" -> applyQualifyingExam(student, column, value);
            case "diploma_details" -> applyDiploma(student, column, value);
            case "pg_qualification" -> applyPg(student, column, value);
            case "student_fee" -> applyFee(student, row, column, value);
            case "student_certificate" -> applyCertificate(student, row, column, value);
            case "hsc_academic_marks" -> applyHscAcademic(student, row, column, value);
            case "hsc_vocational_marks" -> applyHscVocational(student, row, column, value);
            default -> { /* no-op */ }
        }
    }

    private void applyStudentDetails(Student student, String column, String value) {
        switch (column) {
            case "register_no" -> student.setRegisterNo(value);
            case "student_name" -> student.setStudentName(value);
            case "date_of_birth" -> student.setDateOfBirth(LocalDate.parse(value));
            case "aadhaar_no" -> student.setAadhaarNo(value);
            case "gender" -> student.setGender(enumOf(Gender.class, value));
            case "district" -> student.setDistrict(value);
            case "nationality" -> student.setNationality(value);
            case "caste" -> student.setCaste(enumOf(Caste.class, value));
            case "mobile_number" -> student.setMobileNumber(value);
            case "email_id" -> student.setEmailId(value != null ? value.trim() : null);
            default -> { /* no-op */ }
        }
    }

    private static <E extends Enum<E>> E enumOf(Class<E> type, String value) {
        if (isBlank(value)) {
            return null;
        }
        return java.util.Arrays.stream(type.getEnumConstants())
                .filter(e -> e.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElse(null);
    }


    private void applyParent(Student student, String column, String value) {
        ParentDetails parent = getOrCreateParent(student);
        switch (column) {
            case "father_name" -> parent.setFatherName(value);
            case "father_mobile_no" -> parent.setFatherMobileNo(value);
            case "father_occupation" -> parent.setFatherOccupation(value);
            case "annual_income" -> parent.setAnnualIncome(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    private void applyAdmission(Student student, Row row, String column, String value) {
        Admission admission = getOrCreateAdmission(student);
        switch (column) {
            case "category_id" -> admission.setCategory(refEntity(categoryRepository::findById, row.refs.get(column)));
            case "program_id" -> admission.setProgram(refEntity(programRepository::findById, row.refs.get(column)));
            case "department_id" -> admission.setDepartment(refEntity(departmentRepository::findById, row.refs.get(column)));
            case "batch" -> admission.setBatch(value);
            case "date_of_admission" -> admission.setDateOfAdmission(LocalDate.parse(value));
            default -> { /* no-op */ }
        }
    }

    private void applyAddress(Student student, Row row, String column, String value) {
        Address address = getOrCreateAddress(student, addressTypeOf(row));
        switch (column) {
            case "address_line" -> address.setAddressLine(value);
            case "pincode" -> address.setPincode(value);
            case "phone" -> address.setPhone(value);
            case "mobile" -> address.setMobile(value);
            case "email" -> address.setEmail(value != null ? value.trim() : null);
            case "same_as_permanent" -> address.setSameAsPermanent(Boolean.valueOf(value));
            default -> { /* no-op */ }
        }
    }

    private void applyQualifyingExam(Student student, String column, String value) {
        QualifyingExam exam = getOrCreateQualifyingExam(student);
        switch (column) {
            case "institution_name" -> exam.setInstitutionName(value);
            case "institution_place" -> exam.setInstitutionPlace(value);
            case "exam_passed" -> exam.setExamPassed(value);
            case "month_year_of_passing" -> exam.setMonthYearOfPassing(value);
            case "sslc_registration_no" -> exam.setSslcRegistrationNo(value);
            case "sslc_percentage" -> exam.setSslcPercentage(new BigDecimal(value));
            case "hsc_registration_no" -> exam.setHscRegistrationNo(value);
            case "hsc_percentage" -> exam.setHscPercentage(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    private void applyDiploma(Student student, String column, String value) {
        DiplomaDetails diploma = getOrCreateDiploma(student);
        switch (column) {
            case "diploma" -> diploma.setDiploma(value);
            case "institution_name" -> diploma.setInstitutionName(value);
            case "board" -> diploma.setBoard(value);
            case "second_year_percentage" -> diploma.setSecondYearPercentage(new BigDecimal(value));
            case "third_year_percentage" -> diploma.setThirdYearPercentage(new BigDecimal(value));
            case "aggregate_percentage" -> diploma.setAggregatePercentage(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    private void applyPg(Student student, String column, String value) {
        PGQualification pg = getOrCreatePg(student);
        switch (column) {
            case "university_name" -> pg.setUniversityName(value);
            case "university_place" -> pg.setUniversityPlace(value);
            case "institution_name" -> pg.setInstitutionName(value);
            case "institution_place" -> pg.setInstitutionPlace(value);
            case "exam_passed" -> pg.setExamPassed(value);
            case "month_year_of_passing" -> pg.setMonthYearOfPassing(value);
            case "total_percentage" -> pg.setTotalPercentage(new BigDecimal(value));
            case "main_subject_percentage" -> pg.setMainSubjectPercentage(new BigDecimal(value));
            case "degree_registration_no" -> pg.setDegreeRegistrationNo(value);
            default -> { /* no-op */ }
        }
    }

    private void applyFee(Student student, Row row, String column, String value) {
        StudentFee fee = getOrCreateFee(student);
        switch (column) {
            case "cut_off_mark" -> fee.setCutOffMark(new BigDecimal(value));
            case "merit_percent" -> fee.setMeritPercent(new BigDecimal(value));
            case "original_tuition_fee" -> fee.setOriginalTuitionFee(new BigDecimal(value));
            case "scholarship_amount" -> fee.setScholarshipAmount(new BigDecimal(value));
            case "tuition_fee_per_year" -> fee.setTuitionFeePerYear(new BigDecimal(value));
            case "course_duration_years" -> fee.setCourseDurationYears(Integer.valueOf(value));
            case "total_tuition_fee" -> fee.setTotalTuitionFee(new BigDecimal(value));
            case "bus_required" -> fee.setBusRequired(Boolean.valueOf(value));
            case "route_id" -> fee.setRoute(refEntity(busRouteRepository::findById, row.refs.get(column)));
            case "bus_stop_id" -> fee.setBusStop(refEntity(busStopRepository::findById, row.refs.get(column)));
            case "bus_fee" -> fee.setBusFee(new BigDecimal(value));
            case "hostel_required" -> fee.setHostelRequired(Boolean.valueOf(value));
            case "hostel_id" -> fee.setHostel(refEntity(hostelRepository::findById, row.refs.get(column)));
            case "hostel_fee" -> fee.setHostelFee(new BigDecimal(value));
            case "paid_amount" -> fee.setPaidAmount(new BigDecimal(value));
            case "pending_amount" -> fee.setPendingAmount(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    private void applyCertificate(Student student, Row row, String column, String value) {
        ResolvedRef ref = row.refs.get("certificate_id");
        if (ref == null) {
            return;
        }
        StudentCertificate sc = findCertificate(student, ref.id());
        if (sc == null) {
            Certificate certificate = certificateRepository.findById(ref.id()).orElse(null);
            if (certificate == null) {
                return;
            }
            sc = new StudentCertificate();
            sc.setStudent(student);
            sc.setCertificate(certificate);
            student.getCertificates().add(sc);
        }
        switch (column) {
            case "is_submitted" -> sc.setIsSubmitted(Boolean.valueOf(value));
            case "file_path" -> sc.setFilePath(value);
            default -> { /* no-op */ }
        }
    }

    private void applyHscAcademic(Student student, Row row, String column, String value) {
        QualifyingExam exam = getOrCreateQualifyingExam(student);
        String subject = subjectOf(row);
        if (subject == null) {
            return;
        }
        HSCAcademicMark mark = findHscAcademic(exam, subject);
        if (mark == null) {
            mark = new HSCAcademicMark();
            mark.setQualifyingExam(exam);
            mark.setSubjectName(subject);
            exam.getAcademicMarks().add(mark);
        }
        switch (column) {
            case "month_year" -> mark.setMonthYear(value);
            case "maximum_marks" -> mark.setMaximumMarks(new BigDecimal(value));
            case "marks_obtained" -> mark.setMarksObtained(new BigDecimal(value));
            case "percentage" -> mark.setPercentage(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    private void applyHscVocational(Student student, Row row, String column, String value) {
        QualifyingExam exam = getOrCreateQualifyingExam(student);
        String subject = subjectOf(row);
        if (subject == null) {
            return;
        }
        HSCVocationalMark mark = findHscVocational(exam, subject);
        if (mark == null) {
            mark = new HSCVocationalMark();
            mark.setQualifyingExam(exam);
            mark.setSubjectName(subject);
            exam.getVocationalMarks().add(mark);
        }
        switch (column) {
            case "month_year" -> mark.setMonthYear(value);
            case "maximum_marks" -> mark.setMaximumMarks(new BigDecimal(value));
            case "marks_obtained" -> mark.setMarksObtained(new BigDecimal(value));
            case "percentage" -> mark.setPercentage(new BigDecimal(value));
            default -> { /* no-op */ }
        }
    }

    // ------------------------------------------------------------------ helpers

    private ResolvedRef resolveReference(String fkReference, String rawValue) {
        String value = rawValue.trim();
        return switch (fkReference) {
            case "AdmissionCategory" -> {
                String canonical = resolveAlias(value, CATEGORY_ALIASES);
                yield categoryRepository.findAll().stream()
                        .filter(c -> c.getCategoryName().equalsIgnoreCase(canonical))
                        .findFirst()
                        .map(c -> new ResolvedRef(c.getCategoryId(), c.getCategoryName()))
                        .orElse(null);
            }
            case "Program" -> {
                String canonical = resolveAlias(value, PROGRAM_ALIASES);
                yield programRepository.findAll().stream()
                        .filter(p -> p.getProgramName().equalsIgnoreCase(canonical))
                        .findFirst()
                        .map(p -> new ResolvedRef(p.getProgramId(), p.getProgramName()))
                        .orElse(null);
            }
            case "Department" -> {
                String canonical = resolveAlias(value, DEPARTMENT_ALIASES);
                yield departmentRepository.findAll().stream()
                        .filter(d -> d.getDepartmentName().equalsIgnoreCase(canonical)
                                || d.getDepartmentName().toLowerCase().contains(canonical.toLowerCase()))
                        .findFirst()
                        .map(d -> new ResolvedRef(d.getDepartmentId(), d.getDepartmentName()))
                        .orElse(null);
            }
            case "Certificate" -> certificateRepository.findAll().stream()
                    .filter(c -> c.getCertificateName().equalsIgnoreCase(value))
                    .findFirst()
                    .map(c -> new ResolvedRef(c.getCertificateId(), c.getCertificateName()))
                    .orElse(null);
            case "Hostel" -> hostelRepository.findAll().stream()
                    .filter(h -> h.getHostelId().toString().equals(value))
                    .findFirst()
                    .map(h -> new ResolvedRef(h.getHostelId(), String.valueOf(h.getHostelId())))
                    .orElse(null);
            case "BusRoute" -> busRouteRepository.findAll().stream()
                    .filter(r -> r.getRouteName().equalsIgnoreCase(value))
                    .findFirst()
                    .map(r -> new ResolvedRef(r.getRouteId(), r.getRouteName()))
                    .orElse(null);
            case "BusStop" -> busRouteRepository.findAll().stream()
                    .flatMap(r -> r.getStops().stream())
                    .filter(s -> s.getStopName().equalsIgnoreCase(value))
                    .findFirst()
                    .map(s -> new ResolvedRef(s.getBusStopId(), s.getStopName()))
                    .orElse(null);
            default -> null;
        };
    }

    private static String resolveAlias(String value, Map<String, String> aliases) {
        return aliases.getOrDefault(value.toUpperCase(), value);
    }

    private <T> T refEntity(java.util.function.Function<Long, java.util.Optional<T>> finder, ResolvedRef ref) {
        if (ref == null) {
            return null;
        }
        return finder.apply(ref.id()).orElse(null);
    }

    private static String normalizeBoolean(String value) {
        return switch (value.trim().toUpperCase()) {
            case "TRUE", "YES", "1", "Y" -> "TRUE";
            case "FALSE", "NO", "0", "N" -> "FALSE";
            default -> null;
        };
    }

    private static String booleanToString(Boolean value) {
        return Boolean.TRUE.equals(value) ? "TRUE" : "FALSE";
    }

    private static String plain(BigDecimal value) {
        return value == null ? null : value.stripTrailingZeros().toPlainString();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static AddressType addressTypeOf(Row row) {
        String type = row.values.get("address_type");
        try {
            return Arrays.stream(AddressType.values())
                    .filter(a -> a.name().equalsIgnoreCase(type.trim()))
                    .findFirst()
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Address findAddress(Student student, AddressType type) {
        if (type == null) {
            return null;
        }
        for (Address address : student.getAddresses()) {
            if (address.getAddressType() == type) {
                return address;
            }
        }
        return null;
    }

    private Address getOrCreateAddress(Student student, AddressType type) {
        Address address = findAddress(student, type);
        if (address == null) {
            address = new Address();
            address.setStudent(student);
            address.setAddressType(type);
            student.getAddresses().add(address);
        }
        return address;
    }

    private StudentCertificate findCertificate(Student student, Long certificateId) {
        for (StudentCertificate sc : student.getCertificates()) {
            if (sc.getCertificate() != null && sc.getCertificate().getCertificateId().equals(certificateId)) {
                return sc;
            }
        }
        return null;
    }

    private static String subjectOf(Row row) {
        String s = row.values.get("subject_name");
        return isBlank(s) ? null : TextUtil.titleCase(s);
    }

    private HSCAcademicMark findHscAcademic(QualifyingExam exam, String subject) {
        if (subject == null) {
            return null;
        }
        for (HSCAcademicMark mark : exam.getAcademicMarks()) {
            if (subject.equalsIgnoreCase(mark.getSubjectName())) {
                return mark;
            }
        }
        return null;
    }

    private HSCVocationalMark findHscVocational(QualifyingExam exam, String subject) {
        if (subject == null) {
            return null;
        }
        for (HSCVocationalMark mark : exam.getVocationalMarks()) {
            if (subject.equalsIgnoreCase(mark.getSubjectName())) {
                return mark;
            }
        }
        return null;
    }

    private ParentDetails getOrCreateParent(Student student) {
        ParentDetails parent = student.getParent();
        if (parent == null) {
            parent = new ParentDetails();
            parent.setStudent(student);
            student.setParent(parent);
        }
        return parent;
    }

    private Admission getOrCreateAdmission(Student student) {
        Admission admission = student.getAdmission();
        if (admission == null) {
            admission = new Admission();
            admission.setStudent(student);
            student.setAdmission(admission);
        }
        return admission;
    }

    private QualifyingExam getOrCreateQualifyingExam(Student student) {
        QualifyingExam exam = student.getQualifyingExam();
        if (exam == null) {
            exam = new QualifyingExam();
            exam.setStudent(student);
            student.setQualifyingExam(exam);
        }
        return exam;
    }

    private DiplomaDetails getOrCreateDiploma(Student student) {
        DiplomaDetails diploma = student.getDiplomaDetails();
        if (diploma == null) {
            diploma = new DiplomaDetails();
            diploma.setStudent(student);
            student.setDiplomaDetails(diploma);
        }
        return diploma;
    }

    private PGQualification getOrCreatePg(Student student) {
        PGQualification pg = student.getPgQualification();
        if (pg == null) {
            pg = new PGQualification();
            pg.setStudent(student);
            student.setPgQualification(pg);
        }
        return pg;
    }

    private StudentFee getOrCreateFee(Student student) {
        StudentFee fee = student.getFee();
        if (fee == null) {
            fee = new StudentFee();
            fee.setStudent(student);
            student.setFee(fee);
        }
        return fee;
    }

    // ------------------------------------------------------------------ model

    private record ResolvedRef(Long id, String canonicalName) {
    }

    private static final class Row {
        private final String table;
        private final Map<String, String> values;
        private final Map<String, ResolvedRef> refs = new LinkedHashMap<>();

        private Row(String table, Map<String, String> values) {
            this.table = table;
            this.values = values;
        }
    }

    private static final class RecordOutcome {
        private final String applicationNo;
        private String studentName;
        private final List<String> errors = new ArrayList<>();
        private final List<ChangeDto> changes = new ArrayList<>();

        private RecordOutcome(String applicationNo) {
            this.applicationNo = applicationNo;
        }
    }
}
