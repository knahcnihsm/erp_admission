package com.rgcet.admission.service;

import com.rgcet.admission.dto.BulkAdmissionDtos.AdmissionApplySummaryDto;
import com.rgcet.admission.dto.BulkAdmissionDtos.AdmissionRecordPreviewDto;
import com.rgcet.admission.dto.BulkAdmissionDtos.AdmissionResultDto;
import com.rgcet.admission.dto.BulkAdmissionDtos.AdmissionSummaryDto;
import com.rgcet.admission.dto.BulkAdmissionDtos.BulkAdmissionApplyResponse;
import com.rgcet.admission.dto.BulkAdmissionDtos.BulkAdmissionPreviewResponse;
import com.rgcet.admission.dto.BulkUpdateDtos.BulkUpdateRequest;
import com.rgcet.admission.dto.BulkUpdateDtos.ColumnDto;
import com.rgcet.admission.dto.BulkUpdateDtos.SheetDto;
import com.rgcet.admission.dto.BulkUpdateDtos.TableDto;
import com.rgcet.admission.entity.Address;
import com.rgcet.admission.entity.AddressType;
import com.rgcet.admission.entity.Admission;
import com.rgcet.admission.entity.AdmissionCategory;
import com.rgcet.admission.entity.AuditLog;
import com.rgcet.admission.entity.Caste;
import com.rgcet.admission.entity.Certificate;
import com.rgcet.admission.entity.Department;
import com.rgcet.admission.entity.DiplomaDetails;
import com.rgcet.admission.entity.Gender;
import com.rgcet.admission.entity.HSCAcademicMark;
import com.rgcet.admission.entity.HSCVocationalMark;
import com.rgcet.admission.entity.PGQualification;
import com.rgcet.admission.entity.ParentDetails;
import com.rgcet.admission.entity.PaymentStatus;
import com.rgcet.admission.entity.Program;
import com.rgcet.admission.entity.QualifyingExam;
import com.rgcet.admission.entity.Student;
import com.rgcet.admission.entity.StudentCertificate;
import com.rgcet.admission.entity.StudentFee;
import com.rgcet.admission.entity.StudentStatus;
import com.rgcet.admission.repository.AdmissionCategoryRepository;
import com.rgcet.admission.repository.AuditLogRepository;
import com.rgcet.admission.repository.CertificateRepository;
import com.rgcet.admission.repository.DepartmentRepository;
import com.rgcet.admission.repository.ProgramRepository;
import com.rgcet.admission.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BulkAdmissionService {

    private static final String SOURCE = "Excel Bulk Admission";
    private static final String UPDATED_BY = BulkUpdateSchemaService.UPDATED_BY_DEFAULT;

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy"),
    };

    private static final Set<String> PERCENTAGE_COLUMNS = Set.of(
            "sslc_percentage", "hsc_percentage", "second_year_percentage", "third_year_percentage",
            "aggregate_percentage", "total_percentage", "main_subject_percentage");
    private static final Set<String> AADHAAR_COLUMNS = Set.of("aadhaar_no");
    private static final Set<String> MOBILE_COLUMNS = Set.of("mobile_number", "mobile");
    private static final Set<String> PINCODE_COLUMNS = Set.of("pincode");
    private static final Set<String> EMAIL_COLUMNS = Set.of("email_id", "email");

    private static final Set<String> ACADEMIC_TABLES = Set.of(
            "qualifying_examination", "diploma_details", "pg_qualification");
    private static final Set<String> HSC_MARK_TABLES = Set.of(
            "hsc_academic_marks", "hsc_vocational_marks");
    private static final Set<String> CORE_TABLES = Set.of(
            "student_details", "parent_details", "admission", "student_fee");

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
    private final AuditLogRepository auditLogRepository;
    private final BulkAdmissionSchemaService schemaService;

    // ------------------------------------------------------------------ API

    @Transactional(readOnly = true)
    public BulkAdmissionPreviewResponse validate(BulkUpdateRequest request) {
        List<RecordOutcome> outcomes = process(request);
        int valid = 0;
        int invalid = 0;
        List<AdmissionRecordPreviewDto> records = new ArrayList<>();
        for (RecordOutcome o : outcomes) {
            if (o.errors.isEmpty()) {
                valid++;
            } else {
                invalid++;
            }
            records.add(new AdmissionRecordPreviewDto(o.applicationNo, o.studentName, o.programName,
                    o.totalFee, o.errors.isEmpty(), o.errors));
        }
        return new BulkAdmissionPreviewResponse(new AdmissionSummaryDto(records.size(), valid, invalid), records);
    }

    public BulkAdmissionApplyResponse apply(BulkUpdateRequest request) {
        List<RecordOutcome> outcomes = process(request);
        int created = 0;
        int failed = 0;
        List<AdmissionResultDto> results = new ArrayList<>();
        for (RecordOutcome o : outcomes) {
            if (!o.errors.isEmpty()) {
                failed++;
                results.add(new AdmissionResultDto(o.applicationNo, o.studentName, "FAILED", o.errors));
                continue;
            }
            try {
                createAdmission(o);
                created++;
                results.add(new AdmissionResultDto(o.applicationNo, o.studentName, "CREATED", List.of()));
            } catch (Exception e) {
                failed++;
                results.add(new AdmissionResultDto(o.applicationNo, o.studentName, "FAILED",
                        List.of("Error creating student: " + e.getMessage())));
            }
        }
        return new BulkAdmissionApplyResponse(new AdmissionApplySummaryDto(results.size(), created, failed), results);
    }

    // ------------------------------------------------------------------ core

    private List<RecordOutcome> process(BulkUpdateRequest request) {
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
                    String appNo = values.get(BulkAdmissionSchemaService.LOOKUP_KEY);
                    String key = appNo == null ? "" : appNo.trim();
                    grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
                }
            }
        }

        Set<String> seenRegisterNos = new HashSet<>();
        List<RecordOutcome> outcomes = new ArrayList<>();
        for (Map.Entry<String, List<Row>> entry : grouped.entrySet()) {
            String appNo = entry.getKey();
            RecordOutcome outcome = new RecordOutcome(appNo, entry.getValue());
            if (appNo.isEmpty()) {
                outcome.errors.add("Row is missing " + BulkAdmissionSchemaService.LOOKUP_KEY);
                outcomes.add(outcome);
                continue;
            }
            Row studentRow = firstRow(entry.getValue(), "student_details");
            if (studentRow != null) {
                outcome.studentName = str(studentRow, "student_name");
            }
            validateRecord(outcome, seenRegisterNos);
            outcomes.add(outcome);
        }
        return outcomes;
    }

    private void validateRecord(RecordOutcome outcome, Set<String> seenRegisterNos) {
        List<Row> rows = outcome.rows;

        if (studentRepository.existsByApplicationNoIgnoreCase(outcome.applicationNo)) {
            outcome.errors.add("Application number already exists: " + outcome.applicationNo);
        }

        Row studentRow = firstRow(rows, "student_details");
        if (studentRow != null) {
            String reg = str(studentRow, "register_no");
            if (!isBlank(reg)) {
                if (studentRepository.existsByRegisterNoIgnoreCase(reg)) {
                    outcome.errors.add("Register number already exists: " + reg);
                } else if (!seenRegisterNos.add(reg.toUpperCase())) {
                    outcome.errors.add("Duplicate register number in workbook: " + reg);
                }
            }
        }

        preResolveReferences(rows);

        Set<String> present = rows.stream()
                .map(r -> r.table)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        for (String t : CORE_TABLES) {
            if (!present.contains(t)) {
                outcome.errors.add("Missing required sheet: " + t);
            }
        }
        if (!present.contains("address")) {
            outcome.errors.add("Missing required sheet: address");
        } else if (addressRow(outcome, "PERMANENT") == null) {
            outcome.errors.add("Missing required sheet: a PERMANENT address row is required.");
        }

        validateDuplicates(outcome);

        String programName = resolveProgramName(rows);
        outcome.programName = programName;
        String requiredAcademic = requiredAcademicSheet(programName);
        if (programName == null) {
            outcome.errors.add("Program could not be resolved from the admission sheet.");
        }
        if (requiredAcademic != null && !present.contains(requiredAcademic)) {
            outcome.errors.add("Missing required sheet for program " + programName + ": " + requiredAcademic);
        }
        for (String t : ACADEMIC_TABLES) {
            if (present.contains(t) && !t.equals(requiredAcademic)) {
                outcome.errors.add(t + " is not applicable for program " + programName);
            }
        }
        boolean firstYear = "First Year B.Tech".equals(programName);
        for (String t : HSC_MARK_TABLES) {
            if (present.contains(t) && !firstYear) {
                outcome.errors.add(t + " is not applicable for program " + programName);
            }
        }

        for (Row row : rows) {
            validateRow(row, outcome);
        }

        validateFee(outcome);

        outcome.totalFee = computeTotalFeePreview(outcome);
    }

    private void validateDuplicates(RecordOutcome outcome) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Row row : outcome.rows) {
            counts.merge(row.table, 1, Integer::sum);
        }
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (e.getValue() > 1) {
                if ("address".equals(e.getKey())) {
                    Set<String> types = new HashSet<>();
                    for (Row row : outcome.rows) {
                        if (!"address".equals(row.table)) {
                            continue;
                        }
                        String t = row.values.get("address_type");
                        if (t == null || !types.add(t.toUpperCase())) {
                            outcome.errors.add(outcome.applicationNo + ": duplicate address rows for the same address_type.");
                            break;
                        }
                    }
                } else if ("student_certificate".equals(e.getKey())) {
                    Set<String> certs = new HashSet<>();
                    for (Row row : outcome.rows) {
                        if (!"student_certificate".equals(row.table)) {
                            continue;
                        }
                        String c = row.values.get("certificate_id");
                        if (c == null || !certs.add(c.toUpperCase())) {
                            outcome.errors.add(outcome.applicationNo + ": duplicate student_certificate rows for the same certificate.");
                            break;
                        }
                    }
                } else if (HSC_MARK_TABLES.contains(e.getKey())) {
                    Set<String> subjects = new HashSet<>();
                    for (Row row : outcome.rows) {
                        if (!e.getKey().equals(row.table)) {
                            continue;
                        }
                        String s = row.values.get("subject_name");
                        if (s == null || !subjects.add(s.toUpperCase())) {
                            outcome.errors.add(outcome.applicationNo + ": duplicate " + e.getKey()
                                    + " rows for the same subject.");
                            break;
                        }
                    }
                } else {
                    outcome.errors.add(outcome.applicationNo + ": multiple rows supplied for table '" + e.getKey() + "'.");
                }
            }
        }
    }

    private void validateRow(Row row, RecordOutcome outcome) {
        Optional<TableDto> tableOpt = schemaService.findTable(row.table);
        if (tableOpt.isEmpty()) {
            outcome.errors.add("Unknown sheet/table: " + row.table);
            return;
        }
        TableDto table = tableOpt.get();

        Map<String, ColumnDto> columns = new LinkedHashMap<>();
        for (ColumnDto c : table.columns()) {
            columns.put(c.name(), c);
        }

        for (ColumnDto c : table.columns()) {
            if (c.required() && isBlank(row.values.get(c.name()))) {
                outcome.errors.add(row.table + "." + c.name() + " is required.");
            }
        }

        for (Map.Entry<String, String> entry : row.values.entrySet()) {
            String column = entry.getKey();
            if (BulkAdmissionSchemaService.LOOKUP_KEY.equals(column)) {
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
            case BulkAdmissionSchemaService.TYPE_ENUM -> {
                String upper = value.toUpperCase();
                if (col.enumValues().stream().noneMatch(e -> e.equalsIgnoreCase(upper))) {
                    outcome.errors.add(row.table + "." + col.name() + ": invalid value '" + value
                            + "'. Allowed: " + String.join(", ", col.enumValues()));
                }
            }
            case BulkAdmissionSchemaService.TYPE_NUMBER -> {
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
            case BulkAdmissionSchemaService.TYPE_DATE -> {
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
            case BulkAdmissionSchemaService.TYPE_BOOLEAN -> {
                if (normalizeBoolean(value) == null) {
                    outcome.errors.add(row.table + "." + col.name() + ": '" + value
                            + "' is not a valid boolean (use TRUE/FALSE).");
                }
            }
            case BulkAdmissionSchemaService.TYPE_REFERENCE -> {
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

    private void validateFee(RecordOutcome outcome) {
        Row row = firstRow(outcome.rows, "student_fee");
        if (row == null) {
            return;
        }
        String perYear = row.values.get("fee_per_year");
        if (!isBlank(perYear)) {
            try {
                if (new BigDecimal(perYear).compareTo(BigDecimal.ZERO) <= 0) {
                    outcome.errors.add("student_fee.fee_per_year must be greater than 0.");
                }
            } catch (NumberFormatException ignored) {
                // column-level NUMBER validation already reported
            }
        }
        String paid = row.values.get("paid_fee");
        if (!isBlank(paid)) {
            try {
                if (new BigDecimal(paid).compareTo(BigDecimal.ZERO) < 0) {
                    outcome.errors.add("student_fee.paid_fee must be 0 or greater.");
                }
            } catch (NumberFormatException ignored) {
                // column-level NUMBER validation already reported
            }
        }
        for (String col : List.of("bus_fee", "hostel_fee")) {
            String v = row.values.get(col);
            if (!isBlank(v)) {
                try {
                    if (new BigDecimal(v).compareTo(BigDecimal.ZERO) < 0) {
                        outcome.errors.add("student_fee." + col + " must be 0 or greater.");
                    }
                } catch (NumberFormatException ignored) {
                    // column-level NUMBER validation already reported
                }
            }
        }
    }

    // ------------------------------------------------------------------ references

    private void preResolveReferences(List<Row> rows) {
        for (Row row : rows) {
            schemaService.findTable(row.table).ifPresent(table ->
                    table.columns().forEach(col -> {
                        if (BulkAdmissionSchemaService.TYPE_REFERENCE.equals(col.type())) {
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
            default -> null;
        };
    }

    private static String resolveAlias(String value, Map<String, String> aliases) {
        return aliases.getOrDefault(value.toUpperCase(), value);
    }

    private static String resolveProgramName(List<Row> rows) {
        for (Row row : rows) {
            if ("admission".equals(row.table)) {
                ResolvedRef ref = row.refs.get("program_id");
                if (ref != null) {
                    return ref.canonicalName();
                }
            }
        }
        return null;
    }

    private static String requiredAcademicSheet(String programName) {
        if (programName == null) {
            return null;
        }
        return switch (programName) {
            case "First Year B.Tech" -> "qualifying_examination";
            case "Second Year B.Tech (Lateral Entry)" -> "diploma_details";
            case "PG" -> "pg_qualification";
            default -> null;
        };
    }

    // ------------------------------------------------------------------ create

    private void createAdmission(RecordOutcome outcome) {
        LocalDateTime now = LocalDateTime.now();

        Student student = new Student();
        Row studentRow = firstRow(outcome.rows, "student_details");
        student.setApplicationNo(str(studentRow, "application_no"));
        student.setRegisterNo(str(studentRow, "register_no"));
        student.setStudentName(str(studentRow, "student_name"));
        student.setDateOfBirth(date(studentRow, "date_of_birth"));
        student.setAge(ageOf(student.getDateOfBirth()));
        student.setAadhaarNo(str(studentRow, "aadhaar_no"));
        student.setMobileNumber(str(studentRow, "mobile_number"));
        student.setEmailId(str(studentRow, "email_id") != null ? str(studentRow, "email_id").trim() : null);
        student.setGender(enumOf(Gender.class, studentRow, "gender"));
        student.setDistrict(str(studentRow, "district"));
        student.setNationality(str(studentRow, "nationality"));
        student.setCaste(enumOf(Caste.class, studentRow, "caste"));
        student.setStatus(StudentStatus.Active);
        student.setCreatedAt(now);
        student.setUpdatedAt(now);

        Row parentRow = firstRow(outcome.rows, "parent_details");
        ParentDetails parent = new ParentDetails();
        parent.setStudent(student);
        parent.setFatherName(str(parentRow, "father_name"));
        parent.setFatherMobileNo(str(parentRow, "father_mobile_no"));
        parent.setFatherOccupation(str(parentRow, "father_occupation"));
        parent.setAnnualIncome(decimal(parentRow, "annual_income"));
        student.setParent(parent);

        Row permRow = addressRow(outcome, "PERMANENT");
        Row commRow = addressRow(outcome, "COMMUNICATION");
        Address perm = new Address();
        perm.setStudent(student);
        perm.setAddressType(AddressType.Permanent);
        perm.setAddressLine(str(permRow, "address_line"));
        perm.setPincode(str(permRow, "pincode"));
        perm.setPhone(str(permRow, "phone"));
        perm.setMobile(str(permRow, "mobile"));
        perm.setEmail(str(permRow, "email") != null ? str(permRow, "email").trim() : null);
        student.getAddresses().add(perm);
        if (commRow != null) {
            Address comm = new Address();
            comm.setStudent(student);
            comm.setAddressType(AddressType.Communication);
            comm.setAddressLine(str(commRow, "address_line"));
            comm.setPincode(str(commRow, "pincode"));
            comm.setPhone(str(commRow, "phone"));
            comm.setMobile(str(commRow, "mobile"));
            comm.setEmail(str(commRow, "email") != null ? str(commRow, "email").trim() : null);
            student.getAddresses().add(comm);
        }

        Row admissionRow = firstRow(outcome.rows, "admission");
        Admission admission = new Admission();
        admission.setStudent(student);
        admission.setCategory(refEntity(categoryRepository::findById, refId(admissionRow, "category_id")));
        admission.setProgram(refEntity(programRepository::findById, refId(admissionRow, "program_id")));
        admission.setDepartment(refEntity(departmentRepository::findById, refId(admissionRow, "department_id")));
        admission.setBatch(str(admissionRow, "batch"));
        admission.setDateOfAdmission(date(admissionRow, "date_of_admission"));
        student.setAdmission(admission);

        Program program = admission.getProgram();
        if (program == null) {
            throw new IllegalStateException("Program could not be resolved for " + outcome.applicationNo);
        }

        Row qeRow = firstRow(outcome.rows, "qualifying_examination");
        List<Row> academicMarksRows = rowsOf(outcome.rows, "hsc_academic_marks");
        List<Row> vocationalMarksRows = rowsOf(outcome.rows, "hsc_vocational_marks");
        if (qeRow != null || !academicMarksRows.isEmpty() || !vocationalMarksRows.isEmpty()) {
            QualifyingExam qe = new QualifyingExam();
            qe.setStudent(student);
            if (qeRow != null) {
                qe.setInstitutionName(str(qeRow, "institution_name"));
                qe.setInstitutionPlace(str(qeRow, "institution_place"));
                qe.setExamPassed(str(qeRow, "exam_passed"));
                qe.setMonthYearOfPassing(str(qeRow, "month_year_of_passing"));
                qe.setSslcRegistrationNo(str(qeRow, "sslc_registration_no"));
                qe.setSslcPercentage(decimal(qeRow, "sslc_percentage"));
                qe.setHscRegistrationNo(str(qeRow, "hsc_registration_no"));
                qe.setHscPercentage(decimal(qeRow, "hsc_percentage"));
            }
            for (Row mRow : academicMarksRows) {
                HSCAcademicMark mark = new HSCAcademicMark();
                mark.setQualifyingExam(qe);
                mark.setSubjectName(str(mRow, "subject_name"));
                mark.setMonthYear(str(mRow, "month_year"));
                mark.setMaximumMarks(decimal(mRow, "maximum_marks"));
                mark.setMarksObtained(decimal(mRow, "marks_obtained"));
                mark.setPercentage(decimal(mRow, "percentage"));
                qe.getAcademicMarks().add(mark);
            }
            for (Row mRow : vocationalMarksRows) {
                HSCVocationalMark mark = new HSCVocationalMark();
                mark.setQualifyingExam(qe);
                mark.setSubjectName(str(mRow, "subject_name"));
                mark.setMonthYear(str(mRow, "month_year"));
                mark.setMaximumMarks(decimal(mRow, "maximum_marks"));
                mark.setMarksObtained(decimal(mRow, "marks_obtained"));
                mark.setPercentage(decimal(mRow, "percentage"));
                qe.getVocationalMarks().add(mark);
            }
            student.setQualifyingExam(qe);
        }

        Row dlRow = firstRow(outcome.rows, "diploma_details");
        if (dlRow != null) {
            DiplomaDetails dl = new DiplomaDetails();
            dl.setStudent(student);
            dl.setDiploma(str(dlRow, "diploma"));
            dl.setInstitutionName(str(dlRow, "institution_name"));
            dl.setBoard(str(dlRow, "board"));
            dl.setSecondYearPercentage(decimal(dlRow, "second_year_percentage"));
            dl.setThirdYearPercentage(decimal(dlRow, "third_year_percentage"));
            dl.setAggregatePercentage(decimal(dlRow, "aggregate_percentage"));
            student.setDiplomaDetails(dl);
        }

        Row pgRow = firstRow(outcome.rows, "pg_qualification");
        if (pgRow != null) {
            PGQualification pg = new PGQualification();
            pg.setStudent(student);
            pg.setUniversityName(str(pgRow, "university_name"));
            pg.setUniversityPlace(str(pgRow, "university_place"));
            pg.setInstitutionName(str(pgRow, "institution_name"));
            pg.setInstitutionPlace(str(pgRow, "institution_place"));
            pg.setExamPassed(str(pgRow, "exam_passed"));
            pg.setMonthYearOfPassing(str(pgRow, "month_year_of_passing"));
            pg.setTotalPercentage(decimal(pgRow, "total_percentage"));
            pg.setMainSubjectPercentage(decimal(pgRow, "main_subject_percentage"));
            pg.setDegreeRegistrationNo(str(pgRow, "degree_registration_no"));
            student.setPgQualification(pg);
        }

        for (Row certRow : outcome.rows) {
            if (!"student_certificate".equals(certRow.table)) {
                continue;
            }
            ResolvedRef ref = certRow.refs.get("certificate_id");
            if (ref == null) {
                continue;
            }
            Certificate certificate = certificateRepository.findById(ref.id()).orElse(null);
            if (certificate == null) {
                continue;
            }
            StudentCertificate sc = new StudentCertificate();
            sc.setStudent(student);
            sc.setCertificate(certificate);
            sc.setIsSubmitted(Boolean.TRUE.equals(booleanValue(certRow, "is_submitted")));
            sc.setFilePath(str(certRow, "file_path"));
            student.getCertificates().add(sc);
        }

        applyManualFee(student, program, outcome);

        studentRepository.save(student);
        writeAuditLog(outcome);
    }

    private void applyManualFee(Student student, Program program, RecordOutcome outcome) {
        Row feeRow = firstRow(outcome.rows, "student_fee");
        BigDecimal feePerYear = feeRow == null ? BigDecimal.ZERO : decimalOrZero(feeRow.values.get("fee_per_year"));
        BigDecimal paidFee = feeRow == null ? BigDecimal.ZERO : decimalOrZero(feeRow.values.get("paid_fee"));
        BigDecimal busFee = feeRow == null ? BigDecimal.ZERO : decimalOrZero(feeRow.values.get("bus_fee"));
        BigDecimal hostelFee = feeRow == null ? BigDecimal.ZERO : decimalOrZero(feeRow.values.get("hostel_fee"));

        int duration = program.getDurationYears() != null ? program.getDurationYears() : 0;
        BigDecimal totalTuition = feePerYear.multiply(BigDecimal.valueOf(duration));
        BigDecimal totalFee = totalTuition.add(busFee).add(hostelFee);
        BigDecimal pending = totalFee.subtract(paidFee);

        Row qeRow = firstRow(outcome.rows, "qualifying_examination");
        BigDecimal cutOffMark = qeRow == null ? null : decimal(qeRow, "cut_off_mark");

        StudentFee fee = new StudentFee();
        fee.setStudent(student);
        fee.setCutOffMark(cutOffMark);
        fee.setOriginalTuitionFee(feePerYear);
        fee.setScholarshipAmount(BigDecimal.ZERO);
        fee.setTuitionFeePerYear(feePerYear);
        fee.setCourseDurationYears(duration);
        fee.setTotalTuitionFee(totalTuition);
        fee.setBusRequired(busFee.compareTo(BigDecimal.ZERO) > 0);
        fee.setBusFee(busFee);
        fee.setHostelRequired(hostelFee.compareTo(BigDecimal.ZERO) > 0);
        fee.setHostelFee(hostelFee);
        fee.setTotalFee(totalFee);
        fee.setPaidAmount(paidFee);
        fee.setPendingAmount(pending);
        fee.setPaymentStatus(paymentStatus(paidFee, pending));
        student.setFee(fee);
    }

    private static PaymentStatus paymentStatus(BigDecimal paid, BigDecimal pending) {
        if (pending.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.Paid;
        }
        if (paid.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.Partial;
        }
        return PaymentStatus.Pending;
    }


    private String computeTotalFeePreview(RecordOutcome outcome) {
        Row feeRow = firstRow(outcome.rows, "student_fee");
        if (feeRow == null) {
            return "";
        }
        BigDecimal perYear = decimalOrZero(feeRow.values.get("fee_per_year"));
        BigDecimal bus = decimalOrZero(feeRow.values.get("bus_fee"));
        BigDecimal hostel = decimalOrZero(feeRow.values.get("hostel_fee"));
        Integer duration = programDuration(outcome);
        BigDecimal total = perYear.multiply(BigDecimal.valueOf(duration == null ? 0 : duration))
                .add(bus).add(hostel);
        return total.stripTrailingZeros().toPlainString();
    }

    private Integer programDuration(RecordOutcome outcome) {
        for (Row row : outcome.rows) {
            if ("admission".equals(row.table)) {
                ResolvedRef ref = row.refs.get("program_id");
                if (ref != null) {
                    return programRepository.findById(ref.id()).map(Program::getDurationYears).orElse(null);
                }
            }
        }
        return null;
    }

    private void writeAuditLog(RecordOutcome outcome) {
        LocalDateTime now = LocalDateTime.now();
        List<String> tables = outcome.rows.stream()
                .map(r -> r.table)
                .distinct()
                .sorted()
                .toList();
        for (String table : tables) {
            AuditLog log = new AuditLog();
            log.setApplicationNo(outcome.applicationNo);
            log.setTableName(table);
            log.setFieldName("record");
            log.setOldValue("");
            log.setNewValue("CREATED");
            log.setUpdatedBy(UPDATED_BY);
            log.setSource(SOURCE);
            log.setUpdatedAt(now);
            auditLogRepository.save(log);
        }
    }

    // ------------------------------------------------------------------ helpers

    private Row firstRow(List<Row> rows, String table) {
        return rows.stream().filter(r -> table.equals(r.table)).findFirst().orElse(null);
    }

    private List<Row> rowsOf(List<Row> rows, String table) {
        return rows.stream().filter(r -> table.equals(r.table)).toList();
    }

    private Row addressRow(RecordOutcome outcome, String type) {
        for (Row row : outcome.rows) {
            if ("address".equals(row.table)) {
                String t = row.values.get("address_type");
                if (t != null && type.equalsIgnoreCase(t)) {
                    return row;
                }
            }
        }
        return null;
    }

    private String str(Row row, String column) {
        String value = row == null ? null : row.values.get(column);
        return isBlank(value) ? null : value.trim();
    }

    private LocalDate date(Row row, String column) {
        String value = str(row, column);
        return isBlank(value) ? null : parseDate(value);
    }

    private BigDecimal decimal(Row row, String column) {
        String value = str(row, column);
        return isBlank(value) ? null : new BigDecimal(value);
    }

    private Boolean booleanValue(Row row, String column) {
        String value = str(row, column);
        if (isBlank(value)) {
            return null;
        }
        String normalized = normalizeBoolean(value);
        return normalized == null ? null : Boolean.TRUE.equals(Boolean.valueOf(normalized));
    }

    private Long refId(Row row, String column) {
        ResolvedRef ref = row == null ? null : row.refs.get(column);
        return ref == null ? null : ref.id();
    }

    private <T> T refEntity(java.util.function.Function<Long, java.util.Optional<T>> finder, Long id) {
        if (id == null) {
            return null;
        }
        return finder.apply(id).orElse(null);
    }

    private <E extends Enum<E>> E enumOf(Class<E> type, Row row, String column) {
        String value = str(row, column);
        if (isBlank(value)) {
            return null;
        }
        return Arrays.stream(type.getEnumConstants())
                .filter(e -> e.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown " + type.getSimpleName() + " value: '" + value + "'"));
    }

    private Integer ageOf(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return null;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

    private LocalDate parseDate(String value) {
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(value, f);
            } catch (DateTimeParseException ignored) {
                // try next format
            }
        }
        return null;
    }

    private static BigDecimal decimalOrZero(String value) {
        if (isBlank(value)) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.trim());
    }

    private static String normalizeBoolean(String value) {
        return switch (value.trim().toUpperCase()) {
            case "TRUE", "YES", "1", "Y" -> "TRUE";
            case "FALSE", "NO", "0", "N" -> "FALSE";
            default -> null;
        };
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
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
        private final List<Row> rows;
        private String studentName;
        private String programName;
        private String totalFee = "";
        private final List<String> errors = new ArrayList<>();

        private RecordOutcome(String applicationNo, List<Row> rows) {
            this.applicationNo = applicationNo;
            this.rows = rows;
        }
    }
}
