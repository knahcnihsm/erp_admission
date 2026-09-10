package com.rgcet.admission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import com.rgcet.admission.common.TextUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "pg_qualification")
@Getter
@Setter
@NoArgsConstructor
public class PGQualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pg_id")
    private Long pgId;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "university_name")
    private String universityName;

    @Column(name = "university_place")
    private String universityPlace;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "institution_place")
    private String institutionPlace;

    @Column(name = "exam_passed")
    private String examPassed;

    @Column(name = "month_year_of_passing")
    private String monthYearOfPassing;

    @Column(name = "total_percentage")
    private BigDecimal totalPercentage;

    @Column(name = "main_subject_percentage")
    private BigDecimal mainSubjectPercentage;

    @Column(name = "degree_registration_no")
    private String degreeRegistrationNo;

    @PrePersist
    @PreUpdate
    public void normalizeTextFields() {
        this.universityName = TextUtil.titleCase(this.universityName);
        this.universityPlace = TextUtil.titleCase(this.universityPlace);
        this.institutionName = TextUtil.titleCase(this.institutionName);
        this.institutionPlace = TextUtil.titleCase(this.institutionPlace);
        this.examPassed = TextUtil.titleCase(this.examPassed);
        this.monthYearOfPassing = TextUtil.titleCase(this.monthYearOfPassing);
        this.degreeRegistrationNo = TextUtil.titleCase(this.degreeRegistrationNo);
    }
}
