package com.rgcet.admission.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import com.rgcet.admission.common.TextUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "qualifying_examination")
@Getter
@Setter
@NoArgsConstructor
public class QualifyingExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "qualification_id")
    private Long qualificationId;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "institution_place")
    private String institutionPlace;

    @Column(name = "exam_passed")
    private String examPassed;

    @Column(name = "month_year_of_passing")
    private String monthYearOfPassing;

    @Column(name = "sslc_registration_no")
    private String sslcRegistrationNo;

    @Column(name = "sslc_percentage")
    private BigDecimal sslcPercentage;

    @Column(name = "hsc_registration_no")
    private String hscRegistrationNo;

    @Column(name = "hsc_percentage")
    private BigDecimal hscPercentage;

    @OneToMany(mappedBy = "qualifyingExam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<HSCAcademicMark> academicMarks = new ArrayList<>();

    @OneToMany(mappedBy = "qualifyingExam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<HSCVocationalMark> vocationalMarks = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void normalizeTextFields() {
        this.institutionName = TextUtil.titleCase(this.institutionName);
        this.institutionPlace = TextUtil.titleCase(this.institutionPlace);
        this.examPassed = TextUtil.titleCase(this.examPassed);
        this.monthYearOfPassing = TextUtil.titleCase(this.monthYearOfPassing);
        this.sslcRegistrationNo = TextUtil.titleCase(this.sslcRegistrationNo);
        this.hscRegistrationNo = TextUtil.titleCase(this.hscRegistrationNo);
    }
}
