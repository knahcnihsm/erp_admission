package com.rgcet.admission.config;

import com.rgcet.admission.entity.Address;
import com.rgcet.admission.entity.AddressType;
import com.rgcet.admission.entity.Admission;
import com.rgcet.admission.entity.AdmissionCategory;
import com.rgcet.admission.entity.BusRoute;
import com.rgcet.admission.entity.BusStop;
import com.rgcet.admission.entity.Caste;
import com.rgcet.admission.entity.Certificate;
import com.rgcet.admission.entity.Department;
import com.rgcet.admission.entity.Gender;
import com.rgcet.admission.entity.Hostel;
import com.rgcet.admission.entity.ParentDetails;
import com.rgcet.admission.entity.Program;
import com.rgcet.admission.entity.ScholarshipStructure;
import com.rgcet.admission.entity.Student;
import com.rgcet.admission.entity.StudentFee;
import com.rgcet.admission.entity.StudentStatus;
import com.rgcet.admission.entity.TuitionFeeStructure;
import com.rgcet.admission.repository.AdmissionCategoryRepository;
import com.rgcet.admission.repository.BusRouteRepository;
import com.rgcet.admission.repository.CertificateRepository;
import com.rgcet.admission.repository.DepartmentRepository;
import com.rgcet.admission.repository.HostelRepository;
import com.rgcet.admission.repository.ProgramRepository;
import com.rgcet.admission.repository.ScholarshipStructureRepository;
import com.rgcet.admission.repository.StudentRepository;
import com.rgcet.admission.repository.TuitionFeeStructureRepository;
import com.rgcet.admission.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Order(Ordered.LOWEST_PRECEDENCE)
public class DataSeeder implements CommandLineRunner {

    private final AdmissionCategoryRepository categoryRepository;
    private final ProgramRepository programRepository;
    private final DepartmentRepository departmentRepository;
    private final CertificateRepository certificateRepository;
    private final HostelRepository hostelRepository;
    private final BusRouteRepository busRouteRepository;
    private final TuitionFeeStructureRepository feeStructureRepository;
    private final ScholarshipStructureRepository scholarshipStructureRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;

    private record StopData(String name, int fee) {
    }

    private static String norm(String value) {
        return value == null ? null : com.rgcet.admission.common.TextUtil.titleCase(value);
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            seedStudentsIfEmpty();
        } else {
            seed();
        }
        ensureFeeConfiguration();
        studentService.recomputeAllStudentFees();
    }

    private void seed() {
        AdmissionCategory centac = saveCategory("Centac");
        AdmissionCategory management = saveCategory("Management");

        Map<String, Program> programs = new LinkedHashMap<>();
        programs.put("B.Tech", saveProgram("First Year B.Tech", 4));
        programs.put("Lateral", saveProgram("Second Year B.Tech (Lateral Entry)", 3));
        programs.put("PG", saveProgram("PG", 2));

        Map<String, Department> btech = saveDepartments(
                "Computer Science & Engineering (CSE)",
                "Artificial Intelligence and Data Science (AI&DS)",
                "Information Technology (IT)",
                "Artificial Intelligence and Machine Learning (AI&ML)",
                "Electronics & Communication Engineering (ECE)",
                "Biomedical Engineering (BME)");

        Map<String, Department> pg = saveDepartments(
                "M.Tech Computer Science & Engineering",
                "M.Tech Wireless Communication",
                "Master of Business Administration",
                "Master of Computer Applications");

        seedCertificates();
        seedHostel();
        seedBusRoutes();
        seedFeeStructures(centac, management, programs, btech, pg);
        seedScholarshipStructures(management, programs, btech, pg);
        seedStudents(centac, management, programs.get("B.Tech"), btech);
    }

    private void seedStudentsIfEmpty() {
        if (studentRepository.count() >= 10) {
            return;
        }
        AdmissionCategory centac = categoryRepository.findByCategoryNameIgnoreCase("Centac").orElse(null);
        AdmissionCategory management = categoryRepository.findByCategoryNameIgnoreCase("Management").orElse(null);
        Program btechProgram = programRepository.findByProgramNameIgnoreCase("First Year B.Tech").orElse(null);
        if (centac != null && management != null && btechProgram != null) {
            Map<String, Department> btechDepts = new LinkedHashMap<>();
            departmentRepository.findAll().forEach(d -> btechDepts.put(norm(d.getDepartmentName()), d));
            seedStudents(centac, management, btechProgram, btechDepts);
        }
    }

    private void seedStudents(AdmissionCategory centac, AdmissionCategory management,
                              Program btechProgram, Map<String, Department> btechDepts) {
        String[] appNos = {
                "RGCET/2026/2001", "RGCET/2026/2002", "RGCET/2026/2003", "RGCET/2026/2004", "RGCET/2026/2005",
                "RGCET/2026/2006", "RGCET/2026/2007", "RGCET/2026/2008", "RGCET/2026/2009", "RGCET/2026/2010"
        };
        String[] regNos = {
                "26BTECH001", "26BTECH002", "26BTECH003", "26BTECH004", "26BTECH005",
                "26BTECH006", "26BTECH007", "26BTECH008", "26BTECH009", "26BTECH010"
        };
        String[] names = {
                "Aarav Sharma", "Ananya Ramakrishnan", "Rahul Varma", "Kavya Subramanian", "Dhruv Patel",
                "Priya Sundaram", "Vikramaditya Reddy", "Sneha Venkatesh", "Karthik Nair", "Divya Iyer"
        };
        Gender[] genders = {
                Gender.Male, Gender.Female, Gender.Male, Gender.Female, Gender.Male,
                Gender.Female, Gender.Male, Gender.Female, Gender.Male, Gender.Female
        };
        Caste[] castes = {
                Caste.OBC, Caste.Others, Caste.OBC, Caste.SC, Caste.Others,
                Caste.OBC, Caste.Others, Caste.OBC, Caste.OBC, Caste.Others
        };
        String[] deptNames = {
                "Computer Science & Engineering (CSE)",
                "Artificial Intelligence and Data Science (AI&DS)",
                "Information Technology (IT)",
                "Electronics & Communication Engineering (ECE)",
                "Artificial Intelligence and Machine Learning (AI&ML)",
                "Biomedical Engineering (BME)",
                "Computer Science & Engineering (CSE)",
                "Information Technology (IT)",
                "Electronics & Communication Engineering (ECE)",
                "Artificial Intelligence and Data Science (AI&DS)"
        };
        AdmissionCategory[] categories = {
                centac, management, centac, centac, management,
                centac, management, management, centac, centac
        };
        double[] fees = {
                75000, 90000, 75000, 75000, 90000,
                75000, 100000, 80000, 75000, 75000
        };

        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 10; i++) {
            if (studentRepository.existsByApplicationNoIgnoreCase(appNos[i])) {
                continue;
            }
            Student s = new Student();
            s.setApplicationNo(appNos[i]);
            s.setRegisterNo(regNos[i]);
            s.setStudentName(names[i]);
            s.setDateOfBirth(LocalDate.of(2008, 6, 10 + i));
            s.setGender(genders[i]);
            s.setAadhaarNo("98765432100" + i);
            s.setDistrict("Puducherry");
            s.setNationality("Indian");
            s.setCaste(castes[i]);
            s.setStatus(StudentStatus.Active);
            s.setCreatedAt(now.minusDays(10 - i));
            s.setUpdatedAt(now.minusDays(10 - i));

            ParentDetails p = new ParentDetails();
            p.setStudent(s);
            p.setFatherName("Parent " + (i + 1));
            p.setFatherMobileNo("900000000" + i);
            s.setParent(p);

            Address perm = new Address();
            perm.setStudent(s);
            perm.setAddressType(AddressType.Permanent);
            perm.setMobile("950000000" + i);
            perm.setEmail("student" + (i + 1) + "@example.com");
            perm.setAddressLine("123 Sample Street, Puducherry");
            perm.setPincode("605001");
            s.getAddresses().add(perm);

            Address comm = new Address();
            comm.setStudent(s);
            comm.setAddressType(AddressType.Communication);
            comm.setMobile("950000000" + i);
            comm.setEmail("student" + (i + 1) + "@example.com");
            comm.setAddressLine("123 Sample Street, Puducherry");
            comm.setPincode("605001");
            s.getAddresses().add(comm);

            Admission adm = new Admission();
            adm.setStudent(s);
            adm.setProgram(btechProgram);
            adm.setDepartment(btechDepts.get(norm(deptNames[i])));
            adm.setCategory(categories[i]);
            adm.setBatch("2026-2030");
            adm.setDateOfAdmission(LocalDate.of(2026, 6, 1));
            s.setAdmission(adm);

            StudentFee fee = new StudentFee();
            fee.setStudent(s);
            fee.setTotalFee(BigDecimal.valueOf(fees[i]));
            s.setFee(fee);

            studentRepository.save(s);
        }
    }

    private void seedFeeStructures(AdmissionCategory centac, AdmissionCategory management,
                                   Map<String, Program> programs, Map<String, Department> btech,
                                   Map<String, Department> pg) {
        Program firstYear = programs.get("B.Tech");
        Program lateral = programs.get("Lateral");
        Program pgProgram = programs.get("PG");

        // First Year B.Tech - CENTAC: flat 75,000
        btech.values().forEach(dept -> addFee(firstYear, dept, centac, 0, 100, 75000));

        // First Year B.Tech - Management: slabs for CSE & AI&DS, flat for others
        addFee(firstYear, btech.get(norm("Computer Science & Engineering (CSE)")), management, 0, 60, 100000);
        addFee(firstYear, btech.get(norm("Computer Science & Engineering (CSE)")), management, 60, 80, 90000);
        addFee(firstYear, btech.get(norm("Computer Science & Engineering (CSE)")), management, 80, 100, 80000);

        addFee(firstYear, btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management, 0, 60, 100000);
        addFee(firstYear, btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management, 60, 80, 90000);
        addFee(firstYear, btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management, 80, 100, 80000);

        addFee(firstYear, btech.get(norm("Information Technology (IT)")), management, 0, 100, 80000);
        addFee(firstYear, btech.get(norm("Artificial Intelligence and Machine Learning (AI&ML)")), management, 0, 100, 80000);
        addFee(firstYear, btech.get(norm("Electronics & Communication Engineering (ECE)")), management, 0, 100, 80000);
        addFee(firstYear, btech.get(norm("Biomedical Engineering (BME)")), management, 0, 100, 70000);

        // Lateral B.Tech: 50,000 for both quotas
        btech.values().forEach(dept -> {
            addFee(lateral, dept, centac, 0, 100, 50000);
            addFee(lateral, dept, management, 0, 100, 50000);
        });

        // PG: M.Tech CSE / M.Tech WC / MCA = 50,000 both quotas
        addFee(pgProgram, pg.get(norm("M.Tech Computer Science & Engineering")), centac, 0, 100, 50000);
        addFee(pgProgram, pg.get(norm("M.Tech Computer Science & Engineering")), management, 0, 100, 50000);
        addFee(pgProgram, pg.get(norm("M.Tech Wireless Communication")), centac, 0, 100, 50000);
        addFee(pgProgram, pg.get(norm("M.Tech Wireless Communication")), management, 0, 100, 50000);
        addFee(pgProgram, pg.get(norm("Master of Computer Applications")), centac, 0, 100, 50000);
        addFee(pgProgram, pg.get(norm("Master of Computer Applications")), management, 0, 100, 50000);

        // PG MBA: CENTAC flat 70,000; Management slabs
        addFee(pgProgram, pg.get(norm("Master of Business Administration")), centac, 0, 100, 70000);
        addFee(pgProgram, pg.get(norm("Master of Business Administration")), management, 0, 60, 100000);
        addFee(pgProgram, pg.get(norm("Master of Business Administration")), management, 60, 80, 90000);
        addFee(pgProgram, pg.get(norm("Master of Business Administration")), management, 80, 100, 80000);
    }

    private void addFee(Program program, Department department, AdmissionCategory category,
                        int min, int max, int fee) {
        TuitionFeeStructure structure = new TuitionFeeStructure();
        structure.setProgram(program);
        structure.setDepartment(department);
        structure.setCategory(category);
        structure.setMinimumPercentage(BigDecimal.valueOf(min));
        structure.setMaximumPercentage(BigDecimal.valueOf(max));
        structure.setTuitionFee(BigDecimal.valueOf(fee));
        feeStructureRepository.save(structure);
    }

    /**
     * Adds the base (original) fee rows and merit scholarship slabs that are missing from
     * the database. Runs on every startup so existing databases are upgraded additively:
     * rows are never overwritten or deleted, and admin edits to the fee configuration are
     * preserved.
     */
    private void ensureFeeConfiguration() {
        AdmissionCategory centac = categoryRepository.findByCategoryNameIgnoreCase("Centac").orElse(null);
        AdmissionCategory management = categoryRepository.findByCategoryNameIgnoreCase("Management").orElse(null);
        if (centac == null || management == null) {
            return;
        }

        Map<String, Program> programs = new LinkedHashMap<>();
        programRepository.findByProgramNameIgnoreCase("First Year B.Tech").ifPresent(p -> programs.put("B.Tech", p));
        programRepository.findByProgramNameIgnoreCase("Second Year B.Tech (Lateral Entry)").ifPresent(p -> programs.put("Lateral", p));
        programRepository.findByProgramNameIgnoreCase("PG").ifPresent(p -> programs.put("PG", p));

        Map<String, Department> btech = new LinkedHashMap<>();
        Map<String, Department> pg = new LinkedHashMap<>();
        departmentRepository.findAll().forEach(d -> {
            String name = norm(d.getDepartmentName());
            if (name != null && (name.startsWith("M.Tech") || name.startsWith("Master of") || name.startsWith("M.TECH") || name.startsWith("MASTER OF"))) {
                pg.put(name, d);
            } else {
                btech.put(name, d);
            }
        });

        Program firstYear = programs.get("B.Tech");
        Program lateral = programs.get("Lateral");
        Program pgProgram = programs.get("PG");

        // Original (base) fee per year - CENTAC quota
        if (firstYear != null) {
            btech.values().forEach(dept -> addBaseFeeIfMissing(firstYear, dept, centac, 75000));
        }
        if (lateral != null) {
            btech.values().forEach(dept -> addBaseFeeIfMissing(lateral, dept, centac, 50000));
        }
        if (pgProgram != null) {
            addBaseFeeIfMissing(pgProgram, pg.get(norm("M.Tech Computer Science & Engineering")), centac, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("M.Tech Wireless Communication")), centac, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("Master of Computer Applications")), centac, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("Master of Business Administration")), centac, 70000);
        }

        // Original (base) fee per year - Management quota
        if (firstYear != null) {
            addBaseFeeIfMissing(firstYear, btech.get(norm("Computer Science & Engineering (CSE)")), management, 100000);
            addBaseFeeIfMissing(firstYear, btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management, 100000);
            addBaseFeeIfMissing(firstYear, btech.get(norm("Information Technology (IT)")), management, 80000);
            addBaseFeeIfMissing(firstYear, btech.get(norm("Artificial Intelligence and Machine Learning (AI&ML)")), management, 80000);
            addBaseFeeIfMissing(firstYear, btech.get(norm("Electronics & Communication Engineering (ECE)")), management, 80000);
            addBaseFeeIfMissing(firstYear, btech.get(norm("Biomedical Engineering (BME)")), management, 70000);
        }
        if (lateral != null) {
            btech.values().forEach(dept -> addBaseFeeIfMissing(lateral, dept, management, 50000));
        }
        if (pgProgram != null) {
            addBaseFeeIfMissing(pgProgram, pg.get(norm("M.Tech Computer Science & Engineering")), management, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("M.Tech Wireless Communication")), management, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("Master of Computer Applications")), management, 50000);
            addBaseFeeIfMissing(pgProgram, pg.get(norm("Master of Business Administration")), management, 100000);
        }

        // Merit scholarship slabs - Management quota (eligible: B.Tech CSE, B.Tech AI&DS, MBA)
        if (firstYear != null) {
            addScholarshipIfMissing(firstYear, btech.get(norm("Computer Science & Engineering (CSE)")), management);
            addScholarshipIfMissing(firstYear, btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management);
        }
        if (pgProgram != null) {
            addScholarshipIfMissing(pgProgram, pg.get(norm("Master of Business Administration")), management);
        }
    }

    private void seedScholarshipStructures(AdmissionCategory management,
                                           Map<String, Program> programs, Map<String, Department> btech,
                                           Map<String, Department> pg) {
        addScholarshipIfMissing(programs.get("B.Tech"),
                btech.get(norm("Computer Science & Engineering (CSE)")), management);
        addScholarshipIfMissing(programs.get("B.Tech"),
                btech.get(norm("Artificial Intelligence and Data Science (AI&DS)")), management);
        addScholarshipIfMissing(programs.get("PG"),
                pg.get(norm("Master of Business Administration")), management);
    }

    private void addBaseFeeIfMissing(Program program, Department department,
                                     AdmissionCategory category, int fee) {
        if (program == null || department == null || category == null) {
            return;
        }
        List<TuitionFeeStructure> rows =
                feeStructureRepository.findByProgramAndDepartmentAndCategory(program, department, category);
        boolean flatExists = rows.stream().anyMatch(r ->
                r.getMinimumPercentage() == null && r.getMaximumPercentage() == null);
        if (flatExists) {
            return;
        }
        TuitionFeeStructure structure = new TuitionFeeStructure();
        structure.setProgram(program);
        structure.setDepartment(department);
        structure.setCategory(category);
        structure.setTuitionFee(BigDecimal.valueOf(fee));
        feeStructureRepository.save(structure);
    }

    private void addScholarshipIfMissing(Program program, Department department, AdmissionCategory category) {
        if (program == null || department == null || category == null) {
            return;
        }
        int[][] slabs = {{0, 40, 0}, {40, 60, 0}, {60, 80, 10000}, {80, 100, 20000}};
        for (int[] slab : slabs) {
            int min = slab[0];
            int max = slab[1];
            int amount = slab[2];
            List<ScholarshipStructure> rows =
                    scholarshipStructureRepository.findByProgramAndDepartmentAndCategory(program, department, category);
            boolean exists = rows.stream().anyMatch(r ->
                    r.getMinimumPercentage() != null
                            && r.getMinimumPercentage().intValue() == min
                            && r.getMaximumPercentage() != null
                            && r.getMaximumPercentage().intValue() == max);
            if (exists) {
                continue;
            }
            ScholarshipStructure structure = new ScholarshipStructure();
            structure.setProgram(program);
            structure.setDepartment(department);
            structure.setCategory(category);
            structure.setMinimumPercentage(BigDecimal.valueOf(min));
            structure.setMaximumPercentage(BigDecimal.valueOf(max));
            structure.setScholarshipAmount(BigDecimal.valueOf(amount));
            scholarshipStructureRepository.save(structure);
        }
    }

    private void seedBusRoutes() {
        seedRoute("Kalapet",
                new StopData("Koonimedu", 26000), new StopData("Ranganathapuram", 26000),
                new StopData("Manjakuppam", 26000), new StopData("Kilputhupattu", 26000),
                new StopData("Kanagachettikulam Arch", 26000), new StopData("University", 26000),
                new StopData("PEC", 26000), new StopData("Auroville", 25000),
                new StopData("Kottakuppam", 25000), new StopData("Ezhai Mariamman Koil", 25000),
                new StopData("Hotel Lotus", 25000), new StopData("S.S. Thirumana Nilayam", 25000),
                new StopData("Central Bank", 25000), new StopData("G.H", 25000),
                new StopData("Old Law College", 25000), new StopData("Water Tank", 24000),
                new StopData("Railway Station", 24000), new StopData("Old Bus Stand", 24000),
                new StopData("New Bus Stand", 24000), new StopData("Madhava Hospital", 24000),
                new StopData("Cement Road", 23000), new StopData("Murugan Koil", 23000),
                new StopData("Petrol Bunk", 23000), new StopData("Marapalam", 23000),
                new StopData("RGCET", 0));

        seedRoute("Neyveli",
                new StopData("Neyveli Township / Sevvai Sandhai", 28000),
                new StopData("Indra Nagar / Arch Gate", 28000), new StopData("Kadampuliyur", 27000),
                new StopData("Panruti", 25000), new StopData("Link Road", 25000),
                new StopData("Pakkiripalayam", 25000), new StopData("Andikuppam", 25000),
                new StopData("Pattampakkam", 25000), new StopData("Vazhapattu", 24000),
                new StopData("Nellikuppam", 24000), new StopData("Nathapattu", 24000),
                new StopData("Karupu Gate", 24000), new StopData("Vella Gate", 24000),
                new StopData("Kondur", 24000), new StopData("Savadi", 22000),
                new StopData("Employement Office", 21000), new StopData("Railway Gate", 21000),
                new StopData("Kambianpettai", 21000), new StopData("Register Office", 21000),
                new StopData("Vandipalayam Bypass", 21000), new StopData("Kamalam Theatre", 21000),
                new StopData("Semmandalam", 21000), new StopData("RGCET", 0));

        seedRoute("Chidambaram",
                new StopData("Vallampadugai", 28000), new StopData("Therkuvani Street (Police Line)", 27000),
                new StopData("Chidambaram Pacchaiappan School", 27000),
                new StopData("Noothanam Shopping Mall", 27000), new StopData("CRC Bus Shed", 27000),
                new StopData("Telephone Exchange", 27000), new StopData("T. Paalayam Junction (B. Muthlur)", 26000),
                new StopData("B. Muthlur MGR Statue", 26000), new StopData("Kothattai", 25000),
                new StopData("Pudhuchathiram", 25000), new StopData("Periyapattu", 25000),
                new StopData("Alappakkam Railway Gate", 24000), new StopData("SIPCOT (Cuddalore)", 23000),
                new StopData("Housing Board", 23000), new StopData("Suthukulam", 23000),
                new StopData("Cuddalore OT Railway Station", 23000), new StopData("Cuddalore OT Police Station", 23000),
                new StopData("Saalakarai", 23000), new StopData("Cuddalore Seemati", 21000),
                new StopData("New Cinema", 21000), new StopData("Cuddalore Post Office", 21000),
                new StopData("Krishnasamy School", 21000), new StopData("Aalpettai Checkpost", 19000),
                new StopData("Periyakanganankuppam", 19000), new StopData("RGCET", 0));

        seedRoute("JIPMER",
                new StopData("Thattanchavady Bus Stop", 25000), new StopData("V.V.P Nagar Stop", 25000),
                new StopData("JIPMER", 25000), new StopData("Police Complex", 25000),
                new StopData("Mettupalayam", 25000), new StopData("Ramanapuram", 25000),
                new StopData("Shanmugapuram", 25000), new StopData("Indra Gandhi Arts College", 25000),
                new StopData("Gandhi Nagar", 25000), new StopData("Kasthuri Bai Nagar", 25000),
                new StopData("Muruga Theatre", 25000), new StopData("Saradhambal Koil", 24000),
                new StopData("Indra Gandhi Signal", 24000), new StopData("RTO", 23000),
                new StopData("Marapalam", 23000), new StopData("Nainarmandapam", 23000),
                new StopData("Murungapakkam", 23000), new StopData("Ariyankuppam", 21000),
                new StopData("RGCET", 0));

        seedRoute("Villianur",
                new StopData("Indira Gandhi Statue", 25000), new StopData("Ellaipillaichavady", 25000),
                new StopData("Hotel Nalas", 25000), new StopData("Ajees Nagar", 25000),
                new StopData("Kaveri Nagar", 25000), new StopData("Kamban Nagar", 25000),
                new StopData("Jaya Nagar", 25000), new StopData("Salai Street", 25000),
                new StopData("Moolakulam", 25000), new StopData("Villianur", 25000),
                new StopData("Kottaimedu", 23000), new StopData("Achariyapuram", 23000),
                new StopData("Uruvaiyar", 23000), new StopData("Korkadu", 23000),
                new StopData("Karikkalampakkam", 23000), new StopData("Abishekapakkam", 23000),
                new StopData("Thavalakuppam", 22000), new StopData("RGCET", 15000));

        seedRoute("Lawspet",
                new StopData("Sivaji Statue", 25000), new StopData("Karuvadikuppam", 25000),
                new StopData("Vinayagar Koil", 25000), new StopData("Sellaperumal Pet", 25000),
                new StopData("Iyanar Koil", 25000), new StopData("Uzhavar Sandhai", 25000),
                new StopData("JTS School", 25000), new StopData("Navalar School", 25000),
                new StopData("Vanavil", 25000), new StopData("Kurinji Nagar", 25000),
                new StopData("Sellaperumal Vinayager Koil", 25000), new StopData("Latha Steel", 25000),
                new StopData("Rajiv Gandhi Statue", 25000), new StopData("Saram", 25000),
                new StopData("Balaji Theatre", 25000), new StopData("Raja Theatre", 25000),
                new StopData("Ram International", 25000), new StopData("Anthoniar Koil", 24000),
                new StopData("AFT Mill", 24000), new StopData("Mudaliyarpet", 24000),
                new StopData("RGCET", 0));
    }

    private void seedRoute(String routeName, StopData... stops) {
        BusRoute route = new BusRoute();
        route.setRouteName(routeName);
        int order = 1;
        for (StopData stop : stops) {
            BusStop busStop = new BusStop();
            busStop.setRoute(route);
            busStop.setStopOrder(order++);
            busStop.setStopName(stop.name());
            busStop.setTransportFee(BigDecimal.valueOf(stop.fee()));
            route.getStops().add(busStop);
        }
        busRouteRepository.save(route);
    }

    private AdmissionCategory saveCategory(String name) {
        AdmissionCategory category = new AdmissionCategory();
        category.setCategoryName(name);
        return categoryRepository.save(category);
    }

    private Program saveProgram(String name, int durationYears) {
        Program program = new Program();
        program.setProgramName(name);
        program.setDurationYears(durationYears);
        return programRepository.save(program);
    }

    private Map<String, Department> saveDepartments(String... names) {
        Map<String, Department> map = new LinkedHashMap<>();
        for (String name : names) {
            Department department = new Department();
            department.setDepartmentName(name);
            map.put(norm(name), departmentRepository.save(department));
        }
        return map;
    }

    private void seedCertificates() {
        List.of(
                "Provisional Allotment Order",
                "Special Category Certificate",
                "Provisional Certificate",
                "Undertaking Form",
                "Mark Sheet",
                "Degree Certificate",
                "Residence Certificate",
                "Transfer Certificate",
                "Proof of Age",
                "Community Certificate",
                "Conduct Certificate",
                "Aadhaar Card")
                .forEach(name -> {
                    Certificate certificate = new Certificate();
                    certificate.setCertificateName(name);
                    certificateRepository.save(certificate);
                });
    }

    private void seedHostel() {
        Hostel hostel = new Hostel();
        hostel.setHostelFee(BigDecimal.valueOf(72000));
        hostelRepository.save(hostel);
    }
}
