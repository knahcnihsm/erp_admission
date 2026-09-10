package com.rgcet.admission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import com.rgcet.admission.common.TextUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "hsc_vocational_marks")
@Getter
@Setter
@NoArgsConstructor
public class HSCVocationalMark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocational_mark_id")
    private Long vocationalMarkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qualification_id")
    private QualifyingExam qualifyingExam;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(name = "month_year")
    private String monthYear;

    @Column(name = "maximum_marks")
    private BigDecimal maximumMarks;

    @Column(name = "marks_obtained")
    private BigDecimal marksObtained;

    @Column(name = "percentage")
    private BigDecimal percentage;

    @PrePersist
    @PreUpdate
    public void normalizeTextFields() {
        this.subjectName = TextUtil.titleCase(this.subjectName);
        this.monthYear = TextUtil.titleCase(this.monthYear);
    }
}
