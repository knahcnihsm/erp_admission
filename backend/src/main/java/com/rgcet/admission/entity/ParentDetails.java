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
@Table(name = "parent_details")
@Getter
@Setter
@NoArgsConstructor
public class ParentDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "parent_id")
    private Long parentId;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "father_mobile_no")
    private String fatherMobileNo;

    @Column(name = "father_occupation")
    private String fatherOccupation;

    @Column(name = "annual_income")
    private BigDecimal annualIncome;

    @PrePersist
    @PreUpdate
    public void normalizeTextFields() {
        this.fatherName = TextUtil.titleCase(this.fatherName);
        this.fatherMobileNo = TextUtil.titleCase(this.fatherMobileNo);
        this.fatherOccupation = TextUtil.titleCase(this.fatherOccupation);
    }
}
