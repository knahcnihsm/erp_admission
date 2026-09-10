package com.rgcet.admission.service;

import com.rgcet.admission.dto.BulkAdmissionDtos.BulkAdmissionApplyResponse;
import com.rgcet.admission.dto.BulkAdmissionDtos.BulkAdmissionPreviewResponse;
import com.rgcet.admission.dto.BulkUpdateDtos.BulkUpdateRequest;
import com.rgcet.admission.dto.BulkUpdateDtos.SheetDto;
import com.rgcet.admission.entity.AdmissionCategory;
import com.rgcet.admission.entity.Department;
import com.rgcet.admission.entity.PaymentStatus;
import com.rgcet.admission.entity.Program;
import com.rgcet.admission.entity.Student;
import com.rgcet.admission.entity.StudentStatus;
import com.rgcet.admission.repository.AdmissionCategoryRepository;
import com.rgcet.admission.repository.AuditLogRepository;
import com.rgcet.admission.repository.BusRouteRepository;
import com.rgcet.admission.repository.CertificateRepository;
import com.rgcet.admission.repository.DepartmentRepository;
import com.rgcet.admission.repository.HostelRepository;
import com.rgcet.admission.repository.ProgramRepository;
import com.rgcet.admission.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BulkAdmissionServiceTest {

    private static final String APP_NO = "RGCET/2026/2011";
    private static final String REG_NO = "26BTECH011";

    private StudentRepository studentRepository;
    private AdmissionCategoryRepository categoryRepository;
    private ProgramRepository programRepository;
    private DepartmentRepository departmentRepository;
    private CertificateRepository certificateRepository;
    private AuditLogRepository auditLogRepository;
    private BulkAdmissionService bulkAdmissionService;

    private AdmissionCategory centac;
    private Program firstYear;
    private Department cse;

    @BeforeEach
    void setUp() {
        studentRepository = mock(StudentRepository.class);
        categoryRepository = mock(AdmissionCategoryRepository.class);
        programRepository = mock(ProgramRepository.class);
        departmentRepository = mock(DepartmentRepository.class);
        certificateRepository = mock(CertificateRepository.class);
        auditLogRepository = mock(AuditLogRepository.class);
        HostelRepository hostelRepository = mock(HostelRepository.class);
        BusRouteRepository busRouteRepository = mock(BusRouteRepository.class);

        BulkAdmissionSchemaService schemaService = new BulkAdmissionSchemaService(
                categoryRepository, programRepository, departmentRepository,
                certificateRepository, hostelRepository, busRouteRepository);
        bulkAdmissionService = new BulkAdmissionService(
                studentRepository, categoryRepository, programRepository, departmentRepository,
                certificateRepository, auditLogRepository, schemaService);

        centac = new AdmissionCategory();
        centac.setCategoryId(1L);
        centac.setCategoryName("CENTAC");

        firstYear = new Program();
        firstYear.setProgramId(10L);
        firstYear.setProgramName("First Year B.Tech");
        firstYear.setDurationYears(4);

        cse = new Department();
        cse.setDepartmentId(100L);
        cse.setDepartmentName("Computer Science & Engineering (CSE)");

        when(categoryRepository.findAll()).thenReturn(List.of(centac));
        when(programRepository.findAll()).thenReturn(List.of(firstYear));
        when(departmentRepository.findAll()).thenReturn(List.of(cse));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(centac));
        when(programRepository.findById(10L)).thenReturn(Optional.of(firstYear));
        when(departmentRepository.findById(100L)).thenReturn(Optional.of(cse));
        when(certificateRepository.findAll()).thenReturn(List.of());
    }

    private static Map<String, String> row(String... kv) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put(kv[i], kv[i + 1]);
        }
        return map;
    }

    private static List<Map<String, String>> rows(Map<String, String>... rows) {
        List<Map<String, String>> list = new ArrayList<>();
        for (Map<String, String> r : rows) {
            list.add(r);
        }
        return list;
    }

    private static Map<String, String> studentDetailsRow() {
        return row(
                "application_no", APP_NO,
                "register_no", REG_NO,
                "student_name", "Kavya Krishnan",
                "date_of_birth", "2008-05-18",
                "aadhaar_no", "123412341211",
                "gender", "FEMALE",
                "district", "Puducherry",
                "nationality", "Indian",
                "caste", "OBC",
                "mobile_number", "9840112299",
                "email_id", "kavya@example.com");
    }

    private static Map<String, String> parentRow() {
        return row("application_no", APP_NO, "father_name", "Krishnan V");
    }

    private static Map<String, String> permanentAddressRow() {
        return row(
                "application_no", APP_NO,
                "address_type", "PERMANENT",
                "address_line", "No.12, Anna Nagar",
                "pincode", "605002",
                "mobile", "9840112299",
                "email", "kavya@example.com");
    }

    private static Map<String, String> communicationAddressRow() {
        return row(
                "application_no", APP_NO,
                "address_type", "COMMUNICATION",
                "address_line", "No.12, Anna Nagar",
                "pincode", "605002",
                "mobile", "9840112299",
                "email", "kavya@example.com");
    }

    private static Map<String, String> admissionRow(String program) {
        return row(
                "application_no", APP_NO,
                "category_id", "CENTAC",
                "program_id", program,
                "department_id", "CSE",
                "batch", "2026-2030",
                "date_of_admission", "2026-08-01");
    }

    private static Map<String, String> qualifyingExamRow() {
        return row(
                "application_no", APP_NO,
                "institution_name", "Govt Hr Sec School",
                "exam_passed", "HSC",
                "hsc_percentage", "88",
                "cut_off_mark", "180");
    }

    private static Map<String, String> feeRow() {
        return row(
                "application_no", APP_NO,
                "fee_per_year", "75000",
                "paid_fee", "50000",
                "bus_fee", "10000",
                "hostel_fee", "");
    }

    private static BulkUpdateRequest validBtechRequest() {
        return new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow(), communicationAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow()))));
    }

    // ---------------------------------------------------------------- preview

    @Test
    void validateReportsReadyRecordWithComputedTotalFee() {
        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(validBtechRequest());

        assertEquals(1, preview.summary().totalRecords());
        assertEquals(1, preview.summary().validRecords());
        assertEquals(0, preview.summary().invalidRecords());
        assertEquals("First Year B.Tech", preview.records().get(0).program());
        // 75000 x 4 years + 10000 bus
        assertEquals("310000", preview.records().get(0).totalFee());
    }

    @Test
    void validateFlagsExistingApplicationNumber() {
        when(studentRepository.existsByApplicationNoIgnoreCase(APP_NO)).thenReturn(true);

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(validBtechRequest());

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("Application number already exists")));
    }

    @Test
    void validateFlagsExistingRegisterNumber() {
        when(studentRepository.existsByRegisterNoIgnoreCase(REG_NO)).thenReturn(true);

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(validBtechRequest());

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("Register number already exists")));
    }

    @Test
    void validateFlagsDuplicateRegisterNumberInWorkbook() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(
                        studentDetailsRow(),
                        row("application_no", "RGCET/2026/2012", "register_no", REG_NO,
                                "student_name", "Another Student", "date_of_birth", "2008-01-01",
                                "aadhaar_no", "123412341212", "gender", "MALE", "district", "Chennai",
                                "nationality", "Indian", "caste", "SC",
                                "mobile_number", "9840112298", "email_id", "a@example.com"))),
                new SheetDto("parent_details", rows(parentRow(),
                        row("application_no", "RGCET/2026/2012", "father_name", "Father X"))),
                new SheetDto("address", rows(permanentAddressRow(),
                        row("application_no", "RGCET/2026/2012", "address_type", "PERMANENT",
                                "address_line", "Addr", "pincode", "605002", "mobile", "9840112298",
                                "email", "a@example.com"))),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"),
                        row("application_no", "RGCET/2026/2012", "category_id", "CENTAC",
                                "program_id", "First Year B.Tech", "department_id", "CSE",
                                "batch", "2026-2030", "date_of_admission", "2026-08-01"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow(),
                        row("application_no", "RGCET/2026/2012", "institution_name", "School",
                                "exam_passed", "HSC", "hsc_percentage", "90"))),
                new SheetDto("student_fee", rows(feeRow(),
                        row("application_no", "RGCET/2026/2012", "fee_per_year", "70000",
                                "paid_fee", "0")))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertEquals(1, preview.summary().validRecords());
        assertTrue(preview.records().stream()
                .filter(r -> !r.valid())
                .findFirst()
                .orElseThrow()
                .errors().stream()
                .anyMatch(e -> e.contains("Duplicate register number in workbook")));
    }

    @Test
    void validateFlagsMissingProgramQualificationSheet() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("student_fee", rows(feeRow()))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("Missing required sheet for program First Year B.Tech: qualifying_examination")));
    }

    @Test
    void validateFlagsWrongAcademicSheetForProgram() {
        Program pg = new Program();
        pg.setProgramId(20L);
        pg.setProgramName("PG");
        pg.setDurationYears(2);
        when(programRepository.findAll()).thenReturn(List.of(pg));
        when(programRepository.findById(20L)).thenReturn(Optional.of(pg));

        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("PG"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow()))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("qualifying_examination is not applicable for program PG")));
    }

    @Test
    void validateFlagsMissingRequiredColumn() {
        Map<String, String> studentRow = studentDetailsRow();
        studentRow.remove("email_id");

        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentRow)),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow()))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("student_details.email_id is required")));
    }

    @Test
    void validateFlagsUnknownColumn() {
        Map<String, String> studentRow = studentDetailsRow();
        studentRow.put("not_a_column", "value");

        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentRow)),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow()))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("unknown column 'not_a_column'")));
    }

    @Test
    void validateFlagsMissingPermanentAddress() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(communicationAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow()))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("PERMANENT address row is required")));
    }

    // ---------------------------------------------------------------- apply

    @Test
    void applyCreatesStudentWithManualFee() {
        BulkAdmissionApplyResponse result = bulkAdmissionService.apply(validBtechRequest());

        assertEquals(1, result.summary().totalRecords());
        assertEquals(1, result.summary().createdRecords());
        assertEquals(0, result.summary().failedRecords());
        assertEquals("CREATED", result.results().get(0).status());

        ArgumentCaptor<Student> captor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(captor.capture());
        Student saved = captor.getValue();

        assertEquals(StudentStatus.Active, saved.getStatus());
        assertEquals(APP_NO, saved.getApplicationNo());
        assertEquals(REG_NO, saved.getRegisterNo());
        assertEquals("Kavya Krishnan", saved.getStudentName());
        assertEquals(centac, saved.getAdmission().getCategory());
        assertEquals(firstYear, saved.getAdmission().getProgram());
        assertEquals(cse, saved.getAdmission().getDepartment());
        assertEquals(2, saved.getAddresses().size());
        assertEquals(Boolean.TRUE, saved.getFee().getBusRequired());

        assertEquals(0, new BigDecimal("75000").compareTo(saved.getFee().getTuitionFeePerYear()));
        assertEquals(0, new BigDecimal("180").compareTo(saved.getFee().getCutOffMark()));
        assertEquals(4, saved.getFee().getCourseDurationYears());
        assertEquals(0, new BigDecimal("300000").compareTo(saved.getFee().getTotalTuitionFee()));
        assertEquals(0, new BigDecimal("10000").compareTo(saved.getFee().getBusFee()));
        assertEquals(0, new BigDecimal("310000").compareTo(saved.getFee().getTotalFee()));
        assertEquals(0, new BigDecimal("50000").compareTo(saved.getFee().getPaidAmount()));
        assertEquals(0, new BigDecimal("260000").compareTo(saved.getFee().getPendingAmount()));
        assertEquals(PaymentStatus.Partial, saved.getFee().getPaymentStatus());
        verify(auditLogRepository, atLeastOnce()).save(any());
    }

    @Test
    void applyDoesNotPersistInvalidRecord() {
        when(studentRepository.existsByApplicationNoIgnoreCase(APP_NO)).thenReturn(true);

        BulkAdmissionApplyResponse result = bulkAdmissionService.apply(validBtechRequest());

        assertEquals(1, result.summary().failedRecords());
        assertEquals("FAILED", result.results().get(0).status());
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void applySetsPendingStatusWhenNothingPaid() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(row(
                        "application_no", APP_NO,
                        "fee_per_year", "75000",
                        "paid_fee", "0")))));

        BulkAdmissionApplyResponse result = bulkAdmissionService.apply(req);

        assertEquals(1, result.summary().createdRecords());
        ArgumentCaptor<Student> captor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(captor.capture());
        assertEquals(PaymentStatus.Pending, captor.getValue().getFee().getPaymentStatus());

        assertEquals(0, new BigDecimal("300000").compareTo(captor.getValue().getFee().getPendingAmount()));
        assertEquals(Boolean.FALSE, captor.getValue().getFee().getBusRequired());
        assertEquals(Boolean.FALSE, captor.getValue().getFee().getHostelRequired());
    }

    @Test
    void applyPersistsHscMarksRows() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow())),
                new SheetDto("hsc_academic_marks", rows(
                        row("application_no", APP_NO, "subject_name", "MATHEMATICS", "maximum_marks", "100",
                                "marks_obtained", "90", "percentage", "90"),
                        row("application_no", APP_NO, "subject_name", "PHYSICS", "maximum_marks", "100",
                                "marks_obtained", "85", "percentage", "85"))),
                new SheetDto("hsc_vocational_marks", rows(
                        row("application_no", APP_NO, "subject_name", "PRACTICAL I",
                                "maximum_marks", "100", "marks_obtained", "70", "percentage", "70")))));

        BulkAdmissionApplyResponse result = bulkAdmissionService.apply(req);

        assertEquals(1, result.summary().createdRecords());
        ArgumentCaptor<Student> captor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(captor.capture());
        Student saved = captor.getValue();
        assertEquals(2, saved.getQualifyingExam().getAcademicMarks().size());
        assertEquals(1, saved.getQualifyingExam().getVocationalMarks().size());
        assertEquals("MATHEMATICS", saved.getQualifyingExam().getAcademicMarks().get(0).getSubjectName());
        assertEquals(0, new BigDecimal("70").compareTo(
                saved.getQualifyingExam().getVocationalMarks().get(0).getMarksObtained()));
    }

    @Test
    void validateFlagsHscMarksNotApplicableForNonFirstYear() {
        Program pg = new Program();
        pg.setProgramId(20L);
        pg.setProgramName("PG");
        pg.setDurationYears(2);
        when(programRepository.findAll()).thenReturn(List.of(pg));
        when(programRepository.findById(20L)).thenReturn(Optional.of(pg));

        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("PG"))),
                new SheetDto("pg_qualification", rows(row(
                        "application_no", APP_NO, "university_name", "Pondicherry University",
                        "exam_passed", "PG"))),
                new SheetDto("student_fee", rows(feeRow())),
                new SheetDto("hsc_vocational_marks", rows(row(
                        "application_no", APP_NO, "subject_name", "VOCATIONAL SUBJECT THEORY",
                        "maximum_marks", "100", "marks_obtained", "80")))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("hsc_vocational_marks is not applicable for program PG")));
    }

    @Test
    void validateFlagsDuplicateHscSubjectRows() {
        BulkUpdateRequest req = new BulkUpdateRequest(List.of(
                new SheetDto("student_details", rows(studentDetailsRow())),
                new SheetDto("parent_details", rows(parentRow())),
                new SheetDto("address", rows(permanentAddressRow())),
                new SheetDto("admission", rows(admissionRow("First Year B.Tech"))),
                new SheetDto("qualifying_examination", rows(qualifyingExamRow())),
                new SheetDto("student_fee", rows(feeRow())),
                new SheetDto("hsc_academic_marks", rows(
                        row("application_no", APP_NO, "subject_name", "MATHEMATICS", "maximum_marks", "100",
                                "marks_obtained", "90"),
                        row("application_no", APP_NO, "subject_name", "mathematics", "maximum_marks", "100",
                                "marks_obtained", "95")))));

        BulkAdmissionPreviewResponse preview = bulkAdmissionService.validate(req);

        assertEquals(1, preview.summary().invalidRecords());
        assertTrue(preview.records().get(0).errors().stream()
                .anyMatch(e -> e.contains("duplicate hsc_academic_marks rows for the same subject")));
    }
}
