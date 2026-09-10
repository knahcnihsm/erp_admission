package com.rgcet.admission.service;

import com.rgcet.admission.common.ResourceNotFoundException;
import com.rgcet.admission.dto.AcademicStepRequest;
import com.rgcet.admission.dto.ArchiveRequest;
import com.rgcet.admission.dto.CertificatesStepRequest;
import com.rgcet.admission.dto.CommunicationStepRequest;
import com.rgcet.admission.dto.DiplomaStepRequest;
import com.rgcet.admission.dto.FeeStepRequest;
import com.rgcet.admission.dto.HscMarksStepRequest;
import com.rgcet.admission.dto.ParentStepRequest;
import com.rgcet.admission.dto.PersonalStepRequest;
import com.rgcet.admission.dto.PgStepRequest;
import com.rgcet.admission.dto.QualifyingExamStepRequest;
import com.rgcet.admission.dto.StudentResponseDto;
import com.rgcet.admission.dto.StudentSummaryDto;
import com.rgcet.admission.dto.SubmitAdmissionRequest;
import com.rgcet.admission.entity.Address;
import com.rgcet.admission.entity.AddressType;
import com.rgcet.admission.entity.Admission;
import com.rgcet.admission.entity.AdmissionCategory;
import com.rgcet.admission.entity.Archive;
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
import com.rgcet.admission.repository.ArchiveRepository;
import com.rgcet.admission.repository.CertificateRepository;
import com.rgcet.admission.repository.DepartmentRepository;
import com.rgcet.admission.repository.HostelRepository;
import com.rgcet.admission.repository.ProgramRepository;
import com.rgcet.admission.repository.StudentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AdmissionCategoryRepository categoryRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final CertificateRepository certificateRepository;
    private final HostelRepository hostelRepository;
    private final ArchiveRepository archiveRepository;
    private final FeeService feeService;

    // ---------- Create & steps ----------

    @Transactional
    public StudentResponseDto createStudent(PersonalStepRequest request) {
        if (studentRepository.existsByApplicationNoIgnoreCase(request.applicationNumber())) {
            throw new IllegalArgumentException("Application number already exists: " + request.applicationNumber());
        }
        Student student = new Student();
        applyPersonal(student, request);
        student.setStatus(StudentStatus.Draft);
        LocalDateTime now = LocalDateTime.now();
        student.setCreatedAt(now);
        student.setUpdatedAt(now);
        studentRepository.save(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updatePersonal(Long id, PersonalStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        if (!student.getApplicationNo().equalsIgnoreCase(request.applicationNumber())
                && studentRepository.existsByApplicationNoIgnoreCase(request.applicationNumber())) {
            throw new IllegalArgumentException("Application number already exists: " + request.applicationNumber());
        }
        applyPersonal(student, request);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateParent(Long id, ParentStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        ParentDetails parent = student.getParent();
        if (parent == null) {
            parent = new ParentDetails();
            parent.setStudent(student);
            student.setParent(parent);
        }
        parent.setFatherName(request.fatherName());
        parent.setFatherMobileNo(request.fatherMobile());
        parent.setFatherOccupation(request.fatherOccupation());
        parent.setAnnualIncome(request.annualIncome());
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateCommunication(Long id, CommunicationStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        Address permanent = getAddress(student, AddressType.Permanent);
        CommunicationStepRequest.AddressRequest permReq = request.permanentAddress();
        permanent.setAddressLine(permReq.addressLine());
        permanent.setPincode(permReq.pincode());
        permanent.setPhone(permReq.phone());
        permanent.setMobile(permReq.mobile());
        permanent.setEmail(permReq.email() != null ? permReq.email().trim() : null);
        permanent.setSameAsPermanent(request.sameAsPermanent());

        Address communication = getAddress(student, AddressType.Communication);
        if (request.sameAsPermanent()) {
            communication.setAddressLine(permanent.getAddressLine());
            communication.setPincode(permanent.getPincode());
            communication.setPhone(permanent.getPhone());
            communication.setMobile(permanent.getMobile());
            communication.setEmail(permanent.getEmail());
        } else {
            CommunicationStepRequest.AddressRequest commReq = request.communicationAddress();
            communication.setAddressLine(commReq.addressLine());
            communication.setPincode(commReq.pincode());
            communication.setPhone(commReq.phone());
            communication.setMobile(commReq.mobile());
            communication.setEmail(commReq.email() != null ? commReq.email().trim() : null);
        }
        communication.setSameAsPermanent(request.sameAsPermanent());
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateAcademic(Long id, AcademicStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        Admission admission = student.getAdmission();
        if (admission == null) {
            admission = new Admission();
            admission.setStudent(student);
            student.setAdmission(admission);
        }
        admission.setCategory(categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Admission category not found: " + request.categoryId())));
        admission.setProgram(programRepository.findById(request.programId())
                .orElseThrow(() -> new ResourceNotFoundException("Program not found: " + request.programId())));
        if (request.departmentId() != null) {
            admission.setDepartment(departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + request.departmentId())));
        } else {
            admission.setDepartment(null);
        }
        admission.setBatch(request.batch());
        admission.setDateOfAdmission(request.dateOfAdmission());
        recomputeFeeIfPresent(student);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateQualifyingExam(Long id, QualifyingExamStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        QualifyingExam exam = getOrCreateQualifyingExam(student);
        exam.setInstitutionName(request.institutionName());
        exam.setInstitutionPlace(request.institutionPlace());
        exam.setExamPassed(request.examPassed());
        exam.setMonthYearOfPassing(request.monthYearPassing());
        exam.setSslcPercentage(request.sslcPercentage());
        exam.setSslcRegistrationNo(request.sslcRegisterNumber());
        if (request.hscPercentage() != null) {
            exam.setHscPercentage(request.hscPercentage());
        }
        exam.setHscRegistrationNo(request.hscRegisterNumber());
        recomputeFeeIfPresent(student);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateHscMarks(Long id, HscMarksStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        QualifyingExam exam = getOrCreateQualifyingExam(student);

        List<HSCAcademicMark> academic = new ArrayList<>();
        if (request.academicMarks() != null) {
            for (HscMarksStepRequest.SubjectMark m : request.academicMarks()) {
                HSCAcademicMark mark = new HSCAcademicMark();
                mark.setQualifyingExam(exam);
                mark.setSubjectName(m.subject());
                mark.setMonthYear(m.monthYear());
                mark.setMaximumMarks(m.maxMarks());
                mark.setMarksObtained(m.marksObtained());
                mark.setPercentage(CutoffCalculator.subjectPercentage(m.marksObtained(), m.maxMarks()));
                academic.add(mark);
            }
        }
        List<HSCVocationalMark> vocational = new ArrayList<>();
        if (request.vocationalMarks() != null) {
            for (HscMarksStepRequest.SubjectMark m : request.vocationalMarks()) {
                HSCVocationalMark mark = new HSCVocationalMark();
                mark.setQualifyingExam(exam);
                mark.setSubjectName(m.subject());
                mark.setMonthYear(m.monthYear());
                mark.setMaximumMarks(m.maxMarks());
                mark.setMarksObtained(m.marksObtained());
                mark.setPercentage(CutoffCalculator.subjectPercentage(m.marksObtained(), m.maxMarks()));
                vocational.add(mark);
            }
        }

        exam.getAcademicMarks().clear();
        exam.getAcademicMarks().addAll(academic);
        exam.getVocationalMarks().clear();
        exam.getVocationalMarks().addAll(vocational);
        BigDecimal calcOverall = CutoffCalculator.overallPercentage(academic, vocational);
        if (exam.getHscPercentage() == null
                && calcOverall != null
                && calcOverall.compareTo(BigDecimal.ZERO) > 0) {
            exam.setHscPercentage(calcOverall);
        }
        recomputeFeeIfPresent(student);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateDiploma(Long id, DiplomaStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        DiplomaDetails diploma = student.getDiplomaDetails();
        if (diploma == null) {
            diploma = new DiplomaDetails();
            diploma.setStudent(student);
            student.setDiplomaDetails(diploma);
        }
        diploma.setDiploma(request.diplomaCourse());
        diploma.setInstitutionName(request.institutionName());
        diploma.setBoard(request.board());
        diploma.setSecondYearPercentage(request.secondYearPercentage());
        diploma.setThirdYearPercentage(request.thirdYearPercentage());
        diploma.setAggregatePercentage(resolveAggregate(request));
        recomputeFeeIfPresent(student);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updatePg(Long id, PgStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        PGQualification pg = student.getPgQualification();
        if (pg == null) {
            pg = new PGQualification();
            pg.setStudent(student);
            student.setPgQualification(pg);
        }
        pg.setUniversityName(request.universityName());
        pg.setUniversityPlace(request.universityPlace());
        pg.setInstitutionName(request.institutionName());
        pg.setInstitutionPlace(request.institutionPlace());
        pg.setExamPassed(request.examPassed());
        pg.setMonthYearOfPassing(request.monthYearPassing());
        pg.setTotalPercentage(request.totalPercentage());
        pg.setMainSubjectPercentage(request.mainSubjectPercentage());
        pg.setDegreeRegistrationNo(request.degreeRegistrationNumber());
        recomputeFeeIfPresent(student);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto updateFee(Long id, FeeStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        FeeResult result = feeService.compute(student, request);
        applyFee(student, result, request);
        touch(student);
        return StudentResponseDto.from(student);
    }

    private void applyFee(Student student, FeeResult result, FeeStepRequest request) {
        StudentFee fee = student.getFee();
        if (fee == null) {
            fee = new StudentFee();
            fee.setStudent(student);
            student.setFee(fee);
        }
        fee.setCutOffMark(result.cutOffMark());
        fee.setMeritPercent(result.meritPercent());
        fee.setFeeStructure(result.structure());
        fee.setOriginalTuitionFee(result.originalTuitionFee());
        fee.setScholarshipAmount(result.scholarshipAmount());
        fee.setTuitionFeePerYear(result.tuitionFeePerYear());
        fee.setCourseDurationYears(result.courseDurationYears());
        fee.setTotalTuitionFee(result.totalTuitionFee());
        fee.setBusRequired(request.busRequired());
        fee.setRoute(result.route());
        fee.setBusStop(result.busStop());
        fee.setBusFee(result.busFee());
        fee.setHostelRequired(request.hostelRequired());
        fee.setHostel(request.hostelRequired()
                ? hostelRepository.findAll().stream().findFirst().orElse(null)
                : null);
        fee.setHostelFee(result.hostelFee());
        fee.setTotalFee(result.totalFee());
        if (fee.getPaymentStatus() == null) {
            fee.setPaymentStatus(PaymentStatus.Pending);
        }
    }

    /**
     * Recomputes the fee from the currently persisted fee/qualification data whenever a
     * program, admission category, department or cut-off related field changes, so the
     * stored fee always reflects the latest configuration.
     */
    void recomputeFeeIfPresent(Student student) {
        StudentFee existing = student.getFee();
        if (existing == null || student.getAdmission() == null || student.getAdmission().getProgram() == null) {
            return;
        }
        FeeStepRequest request = new FeeStepRequest(
                existing.getCutOffMark(),
                Boolean.TRUE.equals(existing.getBusRequired()),
                existing.getRoute() != null ? existing.getRoute().getRouteId() : null,
                existing.getBusStop() != null ? existing.getBusStop().getBusStopId() : null,
                Boolean.TRUE.equals(existing.getHostelRequired()));
        try {
            applyFee(student, feeService.compute(student, request), request);
        } catch (IllegalStateException ignored) {
            // fee recompute is best-effort; leave existing values untouched when not possible
        }
    }

    /**
     * Recomputes the stored fee for every student that already has a fee record, using the
     * latest fee/scholarship master data. Called on startup so legacy rows created before the
     * fee columns existed (or with stale totals) are repaired. Best-effort per student.
     */
    @Transactional
    public int recomputeAllStudentFees() {
        int recomputed = 0;
        for (Student student : studentRepository.findAll()) {
            if (student.getFee() == null) {
                continue;
            }
            recomputeFeeIfPresent(student);
            studentRepository.save(student);
            recomputed++;
        }
        return recomputed;
    }

    @Transactional
    public StudentResponseDto updateCertificates(Long id, CertificatesStepRequest request) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        if (request.certificates() == null) {
            return StudentResponseDto.from(student);
        }
        Set<Long> requestedIds = request.certificates().stream()
                .map(CertificatesStepRequest.CertificateItem::certificateId)
                .collect(Collectors.toSet());

        List<StudentCertificate> toRemove = student.getCertificates().stream()
                .filter(sc -> sc.getCertificate() != null
                        && !requestedIds.contains(sc.getCertificate().getCertificateId()))
                .toList();
        toRemove.forEach(student.getCertificates()::remove);

        Map<Long, StudentCertificate> existing = student.getCertificates().stream()
                .filter(sc -> sc.getCertificate() != null)
                .collect(Collectors.toMap(sc -> sc.getCertificate().getCertificateId(), Function.identity()));

        LocalDateTime now = LocalDateTime.now();
        for (CertificatesStepRequest.CertificateItem item : request.certificates()) {
            StudentCertificate sc = existing.get(item.certificateId());
            if (sc == null) {
                Certificate certificate = certificateRepository.findById(item.certificateId())
                        .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + item.certificateId()));
                sc = new StudentCertificate();
                sc.setStudent(student);
                sc.setCertificate(certificate);
                student.getCertificates().add(sc);
            }
            sc.setIsSubmitted(item.submitted());
            String filePath = item.filePath();
            if (filePath != null && !filePath.isBlank() && filePath.startsWith("/uploads/")) {
                sc.setFilePath(filePath);
                sc.setUploadedAt(now);
            } else if (!item.submitted()) {
                sc.setFilePath(null);
                sc.setUploadedAt(null);
            }
        }
        touch(student);
        return StudentResponseDto.from(student);
    }

    // ---------- Submit all sections in one transaction ----------

    @Transactional
    public StudentResponseDto submitAdmission(SubmitAdmissionRequest request) {
        Long id = request.studentId();
        if (id == null) {
            id = createStudent(request.personal()).id();
        } else {
            updatePersonal(id, request.personal());
        }

        if (request.parent() != null) {
            updateParent(id, request.parent());
        }
        if (request.communication() != null) {
            updateCommunication(id, request.communication());
        }
        if (request.academic() != null) {
            updateAcademic(id, request.academic());
        }
        if (request.qualifyingExam() != null) {
            updateQualifyingExam(id, request.qualifyingExam());
        }
        if (request.hscMarks() != null) {
            updateHscMarks(id, request.hscMarks());
        }
        if (request.diploma() != null) {
            updateDiploma(id, request.diploma());
        }
        if (request.pg() != null) {
            updatePg(id, request.pg());
        }
        if (request.fee() != null) {
            updateFee(id, request.fee());
        }
        if (request.certificates() != null) {
            updateCertificates(id, request.certificates());
        }

        Student student = getStudentOrThrow(id);
        student.setStatus(StudentStatus.Active);
        touch(student);
        return StudentResponseDto.from(student);
    }

    // ---------- Finalize / read / archive ----------

    @Transactional
    public StudentResponseDto finalize(Long id) {
        Student student = getStudentOrThrow(id);
        assertNotArchived(student);
        student.setStatus(StudentStatus.Active);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional(readOnly = true)
    public StudentResponseDto getStudent(Long id) {
        return StudentResponseDto.from(getStudentOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<StudentSummaryDto> search(String search, Long departmentId, Long programId,
                                          Long categoryId, String batch, StudentStatus status,
                                          Pageable pageable) {
        Specification<Student> spec = buildSpecification(search, departmentId, programId, categoryId, batch, status);
        return studentRepository.findAll(spec, pageable).map(StudentSummaryDto::from);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponseDto> searchDetails(String search, Long departmentId, Long programId,
                                                  Long categoryId, String batch, StudentStatus status,
                                                  Pageable pageable) {
        Specification<Student> spec = buildSpecification(search, departmentId, programId, categoryId, batch, status);
        return studentRepository.findAll(spec, pageable).map(StudentResponseDto::from);
    }

    @Transactional(readOnly = true)
    public List<StudentSummaryDto> listArchived() {
        return studentRepository.findAll(byStatus(StudentStatus.Archived), Sort.by(Sort.Direction.DESC, "archivedAt"))
                .stream()
                .map(StudentSummaryDto::from)
                .toList();
    }

    @Transactional
    public StudentResponseDto archive(Long id, ArchiveRequest request) {
        Student student = getStudentOrThrow(id);
        if (student.getStatus() == StudentStatus.Archived) {
            throw new IllegalStateException("Student is already archived.");
        }
        LocalDateTime now = LocalDateTime.now();
        student.setStatus(StudentStatus.Archived);
        student.setArchivedAt(now);
        student.setArchiveReason(request.reason());

        Archive archive = new Archive();
        archive.setStudent(student);
        archive.setArchiveReason(request.reason());
        archive.setDescription(request.description());
        archive.setArchivedDate(now);
        archiveRepository.save(archive);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional
    public StudentResponseDto restore(Long id) {
        Student student = getStudentOrThrow(id);
        if (student.getStatus() != StudentStatus.Archived) {
            throw new IllegalStateException("Student is not archived.");
        }
        archiveRepository.deleteByStudentStudentId(id);
        student.setStatus(StudentStatus.Active);
        student.setArchivedAt(null);
        student.setArchiveReason(null);
        touch(student);
        return StudentResponseDto.from(student);
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return studentRepository.countByStatus(StudentStatus.Active);
    }

    @Transactional(readOnly = true)
    public long countArchived() {
        return studentRepository.countByStatus(StudentStatus.Archived);
    }

    @Transactional(readOnly = true)
    public long countDraft() {
        return studentRepository.countByStatus(StudentStatus.Draft);
    }


    // ---------- Private helpers ----------

    private void applyPersonal(Student student, PersonalStepRequest req) {
        student.setApplicationNo(req.applicationNumber());
        student.setRegisterNo(blankToNull(req.registerNumber()));
        student.setStudentName(req.studentName());
        student.setDateOfBirth(req.dateOfBirth());
        student.setAge(computeAge(req.dateOfBirth()));
        student.setAadhaarNo(req.aadhaarNumber());
        student.setMobileNumber(blankToNull(req.mobileNumber()));
        student.setEmailId(blankToNull(req.emailId()));
        student.setGender(req.gender());
        student.setDistrict(req.district());
        student.setNationality(req.nationality());
        student.setCaste(req.caste());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    Integer computeAge(java.time.LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return null;
        }
        return Period.between(dateOfBirth, java.time.LocalDate.now()).getYears();
    }

    Address getAddress(Student student, AddressType type) {
        for (Address address : student.getAddresses()) {
            if (address.getAddressType() == type) {
                return address;
            }
        }
        Address address = new Address();
        address.setStudent(student);
        address.setAddressType(type);
        student.getAddresses().add(address);
        return address;
    }

    QualifyingExam getOrCreateQualifyingExam(Student student) {
        QualifyingExam exam = student.getQualifyingExam();
        if (exam == null) {
            exam = new QualifyingExam();
            exam.setStudent(student);
            student.setQualifyingExam(exam);
        }
        return exam;
    }

    private BigDecimal resolveAggregate(DiplomaStepRequest request) {
        if (request.aggregatePercentage() != null) {
            return request.aggregatePercentage();
        }
        if (request.secondYearPercentage() != null && request.thirdYearPercentage() != null) {
            return request.secondYearPercentage().add(request.thirdYearPercentage())
                    .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
        return null;
    }

    private void touch(Student student) {
        student.setUpdatedAt(LocalDateTime.now());
    }

    private void assertNotArchived(Student student) {
        if (student.getStatus() == StudentStatus.Archived) {
            throw new IllegalStateException("Archived students cannot be modified. Restore the student first.");
        }
    }


    private Student getStudentOrThrow(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
    }

    @Transactional
    public List<StudentResponseDto> seed10FakeStudents() {
        AdmissionCategory centac = categoryRepository.findByCategoryNameIgnoreCase("CENTAC")
                .orElseGet(() -> {
                    AdmissionCategory c = new AdmissionCategory();
                    c.setCategoryName("CENTAC");
                    return categoryRepository.save(c);
                });
        AdmissionCategory management = categoryRepository.findByCategoryNameIgnoreCase("Management")
                .orElseGet(() -> {
                    AdmissionCategory m = new AdmissionCategory();
                    m.setCategoryName("Management");
                    return categoryRepository.save(m);
                });
        Program btechProgram = programRepository.findByProgramNameIgnoreCase("First Year B.Tech")
                .orElseGet(() -> {
                    Program p = new Program();
                    p.setProgramName("First Year B.Tech");
                    p.setDurationYears(4);
                    return programRepository.save(p);
                });

        Map<String, Department> depts = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getDepartmentName, d -> d, (a, b) -> a));

        List<Student> seededStudents = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        String[][] fakeData = {
            {"RGCET/2026/2001", "26BTECH001", "Aarav Sharma", "2008-05-14", "987654321001", "Male", "Puducherry", "Indian", "OBC", "Rajesh Sharma", "9840123451", "Computer Science & Engineering (CSE)", "Centac", "75000", "123 MG Road, Puducherry", "605001", "aarav.sharma@example.com"},
            {"RGCET/2026/2002", "26BTECH002", "Ananya Ramakrishnan", "2008-08-20", "987654321002", "Female", "Chennai", "Indian", "Others", "Ramakrishnan V", "9840123452", "Artificial Intelligence and Data Science (AI&DS)", "Management", "90000", "45 Anna Nagar, Chennai", "600040", "ananya.r@example.com"},
            {"RGCET/2026/2003", "26BTECH003", "Rahul Varma", "2008-02-11", "987654321003", "Male", "Cuddalore", "Indian", "OBC", "Suresh Varma", "9840123453", "Information Technology (IT)", "Centac", "75000", "88 Beach Road, Cuddalore", "607001", "rahul.varma@example.com"},
            {"RGCET/2026/2004", "26BTECH004", "Kavya Subramanian", "2008-11-05", "987654321004", "Female", "Karaikal", "Indian", "SC", "Subramanian K", "9840123454", "Electronics & Communication Engineering (ECE)", "Centac", "75000", "12 Church Street, Karaikal", "609602", "kavya.subu@example.com"},
            {"RGCET/2026/2005", "26BTECH005", "Dhruv Patel", "2008-04-18", "987654321005", "Male", "Puducherry", "Indian", "Others", "Vikram Patel", "9840123455", "Artificial Intelligence and Machine Learning (AI&ML)", "Management", "90000", "67 Heritage Town, Puducherry", "605001", "dhruv.patel@example.com"},
            {"RGCET/2026/2006", "26BTECH006", "Priya Sundaram", "2008-09-30", "987654321006", "Female", "Villupuram", "Indian", "OBC", "Sundaram M", "9840123456", "Biomedical Engineering (BME)", "Centac", "75000", "34 Main Road, Villupuram", "605602", "priya.sundaram@example.com"},
            {"RGCET/2026/2007", "26BTECH007", "Vikramaditya Reddy", "2008-01-25", "987654321007", "Male", "Chidambaram", "Indian", "Others", "Raghunath Reddy", "9840123457", "Computer Science & Engineering (CSE)", "Management", "100000", "90 Temple Street, Chidambaram", "608001", "vikram.reddy@example.com"},
            {"RGCET/2026/2008", "26BTECH008", "Sneha Venkatesh", "2008-07-12", "987654321008", "Female", "Neyveli", "Indian", "OBC", "Venkatesh N", "9840123458", "Information Technology (IT)", "Management", "80000", "15 Township Block 4, Neyveli", "607801", "sneha.v@example.com"},
            {"RGCET/2026/2009", "26BTECH009", "Karthik Nair", "2008-10-02", "987654321009", "Male", "Puducherry", "Indian", "OBC", "Narayanan Nair", "9840123459", "Electronics & Communication Engineering (ECE)", "Centac", "75000", "22 ECR Road, Lawspet, Puducherry", "605008", "karthik.nair@example.com"},
            {"RGCET/2026/2010", "26BTECH010", "Divya Iyer", "2008-06-19", "987654321010", "Female", "Puducherry", "Indian", "Others", "Sankar Iyer", "9840123460", "Artificial Intelligence and Data Science (AI&DS)", "Centac", "75000", "59 VIP Avenue, Puducherry", "605011", "divya.iyer@example.com"}
        };

        for (String[] data : fakeData) {
            String appNo = data[0];
            if (studentRepository.existsByApplicationNoIgnoreCase(appNo)) {
                continue;
            }
            Student s = new Student();
            s.setApplicationNo(appNo);
            s.setRegisterNo(data[1]);
            s.setStudentName(data[2]);
            s.setDateOfBirth(LocalDate.parse(data[3]));
            s.setAadhaarNo(data[4]);
            s.setGender(Gender.valueOf(data[5]));
            s.setDistrict(data[6]);
            s.setNationality(data[7]);
            s.setCaste(Caste.valueOf(data[8]));
            s.setStatus(StudentStatus.Active);
            s.setCreatedAt(now);
            s.setUpdatedAt(now);

            ParentDetails p = new ParentDetails();
            p.setStudent(s);
            p.setFatherName(data[9]);
            p.setFatherMobileNo(data[10]);
            p.setFatherOccupation("Private Service / Business");
            p.setAnnualIncome(BigDecimal.valueOf(500000));
            s.setParent(p);

            Address perm = new Address();
            perm.setStudent(s);
            perm.setAddressType(AddressType.Permanent);
            perm.setMobile(data[10]);
            perm.setEmail(data[16]);
            perm.setAddressLine(data[14]);
            perm.setPincode(data[15]);
            s.getAddresses().add(perm);

            Address comm = new Address();
            comm.setStudent(s);
            comm.setAddressType(AddressType.Communication);
            comm.setMobile(data[10]);
            comm.setEmail(data[16]);
            comm.setAddressLine(data[14]);
            comm.setPincode(data[15]);
            s.getAddresses().add(comm);

            Admission adm = new Admission();
            adm.setStudent(s);
            adm.setProgram(btechProgram);
            adm.setDepartment(depts.getOrDefault(data[11], depts.values().isEmpty() ? null : depts.values().iterator().next()));
            adm.setCategory("CENTAC".equalsIgnoreCase(data[12]) ? centac : management);
            adm.setBatch("2026-2030");
            adm.setDateOfAdmission(LocalDate.of(2026, 6, 1));
            s.setAdmission(adm);

            StudentFee fee = new StudentFee();
            fee.setStudent(s);
            fee.setTotalFee(new BigDecimal(data[13]));
            s.setFee(fee);

            studentRepository.save(s);
            seededStudents.add(s);
        }

        return seededStudents.stream().map(StudentResponseDto::from).collect(Collectors.toList());
    }

    private Specification<Student> byStatus(StudentStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<Student> buildSpecification(String search, Long departmentId, Long programId,
                                                      Long categoryId, String batch, StudentStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            } else {
                predicates.add(cb.notEqual(root.get("status"), StudentStatus.Archived));
            }

            if (isNotBlank(search)) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentName")), like),
                        cb.like(cb.lower(root.get("applicationNo")), like),
                        cb.like(cb.lower(root.get("registerNo")), like)));
            }
            if (departmentId != null || programId != null || categoryId != null || isNotBlank(batch)) {
                Join<Object, Object> admission = root.join("admission", JoinType.LEFT);
                if (departmentId != null) {
                    predicates.add(cb.equal(admission.get("department").get("departmentId"), departmentId));
                }
                if (programId != null) {
                    predicates.add(cb.equal(admission.get("program").get("programId"), programId));
                }
                if (categoryId != null) {
                    predicates.add(cb.equal(admission.get("category").get("categoryId"), categoryId));
                }
                if (isNotBlank(batch)) {
                    predicates.add(cb.equal(admission.get("batch"), batch));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}
