package com.rgcet.admission.dto;

import com.rgcet.admission.entity.Address;
import com.rgcet.admission.entity.AddressType;
import com.rgcet.admission.entity.Caste;
import com.rgcet.admission.entity.Gender;
import com.rgcet.admission.entity.HSCAcademicMark;
import com.rgcet.admission.entity.HSCVocationalMark;
import com.rgcet.admission.entity.PaymentStatus;
import com.rgcet.admission.entity.Student;
import com.rgcet.admission.entity.StudentStatus;
import com.rgcet.admission.service.CutoffCalculator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public record StudentResponseDto(
        Long id,
        String applicationNumber,
        String registerNumber,
        String studentName,
        LocalDate dateOfBirth,
        Integer age,
        String aadhaarNumber,
        String mobileNumber,
        String emailId,
        Gender gender,
        String district,
        String nationality,
        Caste caste,
        StudentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime archivedAt,
        String archiveReason,
        ParentDto parent,
        CommunicationDto communication,
        AcademicDto academic,
        QualifyingExamDto qualifyingExam,
        HscMarksDto hscMarks,
        DiplomaDto diplomaDetails,
        PgDto pgQualification,
        FeeDto fee,
        List<CertificateDto> certificates
) {

    public static StudentResponseDto from(Student s) {
        return new StudentResponseDto(
                s.getStudentId(),
                s.getApplicationNo(),
                s.getRegisterNo(),
                s.getStudentName(),
                s.getDateOfBirth(),
                s.getAge(),
                s.getAadhaarNo(),
                s.getMobileNumber(),
                s.getEmailId(),
                s.getGender(),
                s.getDistrict(),
                s.getNationality(),
                s.getCaste(),
                s.getStatus(),
                s.getCreatedAt(),
                s.getUpdatedAt(),
                s.getArchivedAt(),
                s.getArchiveReason(),
                ParentDto.from(s.getParent()),
                CommunicationDto.from(s),
                AcademicDto.from(s.getAdmission()),
                QualifyingExamDto.from(s.getQualifyingExam()),
                HscMarksDto.from(s.getQualifyingExam()),
                DiplomaDto.from(s.getDiplomaDetails()),
                PgDto.from(s.getPgQualification()),
                FeeDto.from(s.getFee()),
                CertificateDto.from(s)
        );
    }

    public record ParentDto(
            String fatherName,
            String fatherMobile,
            String fatherOccupation,
            BigDecimal annualIncome
    ) {
        private static ParentDto from(com.rgcet.admission.entity.ParentDetails p) {
            if (p == null) return null;
            return new ParentDto(
                    p.getFatherName(), p.getFatherMobileNo(), p.getFatherOccupation(), p.getAnnualIncome());
        }
    }

    public record AddressDto(
            String addressLine, String pincode, String phone, String mobile, String email,
            boolean sameAsPermanent
    ) {
        private static AddressDto from(Address a) {
            if (a == null) return null;
            return new AddressDto(a.getAddressLine(), a.getPincode(), a.getPhone(), a.getMobile(),
                    a.getEmail(), Boolean.TRUE.equals(a.getSameAsPermanent()));
        }
    }

    public record CommunicationDto(
            AddressDto permanentAddress,
            AddressDto communicationAddress,
            boolean sameAsPermanent
    ) {
        private static CommunicationDto from(Student s) {
            if (s == null || s.getAddresses() == null) return null;
            Address perm = null;
            Address comm = null;
            for (Address a : s.getAddresses()) {
                if (a.getAddressType() == AddressType.Permanent) perm = a;
                else if (a.getAddressType() == AddressType.Communication) comm = a;
            }
            boolean same = perm != null && Boolean.TRUE.equals(perm.getSameAsPermanent());
            return new CommunicationDto(AddressDto.from(perm), AddressDto.from(comm), same);
        }
    }

    public record AcademicDto(
            Long categoryId, String category, Long programId, String program, Integer durationYears,
            Long departmentId, String department, String batch, LocalDate dateOfAdmission
    ) {
        private static AcademicDto from(com.rgcet.admission.entity.Admission a) {
            if (a == null) return null;
            return new AcademicDto(
                    a.getCategory() == null ? null : a.getCategory().getCategoryId(),
                    a.getCategory() == null ? null : a.getCategory().getCategoryName(),
                    a.getProgram() == null ? null : a.getProgram().getProgramId(),
                    a.getProgram() == null ? null : a.getProgram().getProgramName(),
                    a.getProgram() == null ? null : a.getProgram().getDurationYears(),
                    a.getDepartment() == null ? null : a.getDepartment().getDepartmentId(),
                    a.getDepartment() == null ? null : a.getDepartment().getDepartmentName(),
                    a.getBatch(),
                    a.getDateOfAdmission());
        }
    }

    public record QualifyingExamDto(
            String institutionName, String institutionPlace, String examPassed, String monthYearPassing,
            BigDecimal sslcPercentage, String sslcRegisterNumber, BigDecimal hscPercentage, String hscRegisterNumber
    ) {
        private static QualifyingExamDto from(com.rgcet.admission.entity.QualifyingExam q) {
            if (q == null) return null;
            return new QualifyingExamDto(q.getInstitutionName(), q.getInstitutionPlace(), q.getExamPassed(),
                    q.getMonthYearOfPassing(), q.getSslcPercentage(), q.getSslcRegistrationNo(),
                    q.getHscPercentage(), q.getHscRegistrationNo());
        }
    }

    public record SubjectMarkDto(
            String subject, String monthYear, BigDecimal maxMarks, BigDecimal marksObtained, BigDecimal percentage
    ) {
        private static SubjectMarkDto from(HSCAcademicMark m) {
            return new SubjectMarkDto(m.getSubjectName(), m.getMonthYear(), m.getMaximumMarks(),
                    m.getMarksObtained(),
                    m.getPercentage() != null ? m.getPercentage()
                            : CutoffCalculator.subjectPercentage(m.getMarksObtained(), m.getMaximumMarks()));
        }

        private static SubjectMarkDto from(HSCVocationalMark m) {
            return new SubjectMarkDto(m.getSubjectName(), m.getMonthYear(), m.getMaximumMarks(),
                    m.getMarksObtained(),
                    m.getPercentage() != null ? m.getPercentage()
                            : CutoffCalculator.subjectPercentage(m.getMarksObtained(), m.getMaximumMarks()));
        }
    }

    public record HscMarksDto(
            String stream,
            List<SubjectMarkDto> academicMarks,
            List<SubjectMarkDto> vocationalMarks,
            BigDecimal totalMaxMarks,
            BigDecimal totalMarksObtained,
            BigDecimal overallPercentage,
            BigDecimal engineeringCutOff
    ) {
        private static HscMarksDto from(com.rgcet.admission.entity.QualifyingExam q) {
            if (q == null) return null;
            String stream = q.getAcademicMarks() != null && !q.getAcademicMarks().isEmpty() ? "Academic" : "Vocational";
            List<SubjectMarkDto> academic = new ArrayList<>();
            if (q.getAcademicMarks() != null) {
                q.getAcademicMarks().forEach(m -> academic.add(SubjectMarkDto.from(m)));
            }
            List<SubjectMarkDto> vocational = new ArrayList<>();
            if (q.getVocationalMarks() != null) {
                q.getVocationalMarks().forEach(m -> vocational.add(SubjectMarkDto.from(m)));
            }
            BigDecimal calculatedOverall = CutoffCalculator.overallPercentage(academicMarks(q), vocationalMarks(q));
            BigDecimal storedOverall = q.getHscPercentage();
            BigDecimal overall = storedOverall != null
                    ? storedOverall
                    : calculatedOverall;
            BigDecimal cutOff = CutoffCalculator.engineeringCutOff(q.getAcademicMarks());
            return new HscMarksDto(stream, academic, vocational,
                    CutoffCalculator.totalMaxMarks(academicMarks(q), vocationalMarks(q)),
                    CutoffCalculator.totalMarksObtained(academicMarks(q), vocationalMarks(q)),
                    overall, cutOff);
        }

        private static List<HSCAcademicMark> academicMarks(com.rgcet.admission.entity.QualifyingExam q) {
            return q.getAcademicMarks() == null ? new ArrayList<>() : q.getAcademicMarks();
        }

        private static List<HSCVocationalMark> vocationalMarks(com.rgcet.admission.entity.QualifyingExam q) {
            return q.getVocationalMarks() == null ? new ArrayList<>() : q.getVocationalMarks();
        }
    }

    public record DiplomaDto(
            String diplomaCourse, String institutionName, String board,
            BigDecimal secondYearPercentage, BigDecimal thirdYearPercentage, BigDecimal aggregatePercentage
    ) {
        private static DiplomaDto from(com.rgcet.admission.entity.DiplomaDetails d) {
            if (d == null) return null;
            return new DiplomaDto(d.getDiploma(), d.getInstitutionName(), d.getBoard(),
                    d.getSecondYearPercentage(), d.getThirdYearPercentage(), d.getAggregatePercentage());
        }
    }

    public record PgDto(
            String universityName, String universityPlace, String institutionName, String institutionPlace,
            String examPassed, String monthYearPassing, BigDecimal totalPercentage,
            BigDecimal mainSubjectPercentage, String degreeRegistrationNumber
    ) {
        private static PgDto from(com.rgcet.admission.entity.PGQualification p) {
            if (p == null) return null;
            return new PgDto(p.getUniversityName(), p.getUniversityPlace(), p.getInstitutionName(),
                    p.getInstitutionPlace(), p.getExamPassed(), p.getMonthYearOfPassing(), p.getTotalPercentage(),
                    p.getMainSubjectPercentage(), p.getDegreeRegistrationNo());
        }
    }

    public record FeeDto(
            BigDecimal cutOffMark,
            BigDecimal meritPercent,
            BigDecimal originalTuitionFeePerYear,
            BigDecimal scholarshipAmount,
            BigDecimal tuitionFeePerYear,
            Integer courseDurationYears,
            BigDecimal totalTuitionFee,
            boolean busRequired,
            Long routeId,
            String routeName,
            Long busStopId,
            String busStopName,
            BigDecimal busFee,
            boolean hostelRequired,
            BigDecimal hostelFee,
            BigDecimal totalFee,
            BigDecimal paidAmount,
            BigDecimal pendingAmount,
            PaymentStatus paymentStatus
    ) {
        private static FeeDto from(com.rgcet.admission.entity.StudentFee f) {
            if (f == null) return null;
            return new FeeDto(
                    f.getCutOffMark(), f.getMeritPercent(), f.getOriginalTuitionFee(), f.getScholarshipAmount(),
                    f.getTuitionFeePerYear(), f.getCourseDurationYears(), f.getTotalTuitionFee(),
                    Boolean.TRUE.equals(f.getBusRequired()),
                    f.getRoute() == null ? null : f.getRoute().getRouteId(),
                    f.getRoute() == null ? null : f.getRoute().getRouteName(),
                    f.getBusStop() == null ? null : f.getBusStop().getBusStopId(),
                    f.getBusStop() == null ? null : f.getBusStop().getStopName(),
                    f.getBusFee(), Boolean.TRUE.equals(f.getHostelRequired()), f.getHostelFee(), f.getTotalFee(),
                    f.getPaidAmount(), f.getPendingAmount(), f.getPaymentStatus());
        }
    }

    public record CertificateDto(
            Long certificateId, String name, boolean submitted, String filePath, LocalDateTime uploadedAt
    ) {
        private static List<CertificateDto> from(Student s) {
            List<CertificateDto> result = new ArrayList<>();
            if (s.getCertificates() != null) {
                s.getCertificates().forEach(c -> result.add(new CertificateDto(
                        c.getCertificate() == null ? null : c.getCertificate().getCertificateId(),
                        c.getCertificate() == null ? null : c.getCertificate().getCertificateName(),
                        Boolean.TRUE.equals(c.getIsSubmitted()), c.getFilePath(), c.getUploadedAt())));
            }
            return result;
        }
    }
}
