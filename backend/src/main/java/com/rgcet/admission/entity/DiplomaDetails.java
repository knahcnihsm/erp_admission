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
@Table(name = "diploma_details")
@Getter
@Setter
@NoArgsConstructor
public class DiplomaDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diploma_id")
    private Long diplomaId;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "diploma")
    private String diploma;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "board")
    private String board;

    @Column(name = "second_year_percentage")
    private BigDecimal secondYearPercentage;

    @Column(name = "third_year_percentage")
    private BigDecimal thirdYearPercentage;

    @Column(name = "aggregate_percentage")
    private BigDecimal aggregatePercentage;

    @PrePersist
    @PreUpdate
    public void normalizeTextFields() {
        this.diploma = TextUtil.titleCase(this.diploma);
        this.institutionName = TextUtil.titleCase(this.institutionName);
        this.board = TextUtil.titleCase(this.board);
    }
}
