# Database Structure - B.Tech FYE Register 2024

## Scope and privacy

This is a structural inventory of the workbook `b.tech fye reg no 2024_461e2093-07c5-4c2a-a9ef-d241f200a834.xlsx`. It intentionally excludes all individual student values, including names, register numbers, and parent names.

## Workbook inventory

| Property | Value |
|---|---|
| Workbook format | Microsoft Excel Open XML Workbook (`.xlsx`) |
| Worksheet count | 1 |
| Worksheet name | `B,.TECH FYE REG NO 2024` |
| Used range | `A1:G341` |
| Title merges | `A1:D1`, `A2:D2` |
| Formula cells | 1 (the aggregate total) |
| Data-record rows | 336 (`6:341`) |
| Blank spacer rows | 3–4 |
| Blank separator column | E |

## Logical layout

The worksheet contains two independent areas separated by blank column `E`:

```text
A:D  Student-register dataset (one row per student)
E    Intentional visual separator
F:G  Programme-count summary
```

Rows `1–2` are merged report titles. Row `5` begins the register table and also begins the summary area. Rows `6–341` contain the register records. The summary uses programme labels and their aggregate counts, followed by an overall total.

## Dataset: student-register table

**Physical location:** columns `A:D`; header row `5`; records `6:341`.

| Column | Source header | Suggested field name | Stored type | Required in every record | Meaning |
|---|---|---|---|---|---|
| A | `DEGREE` | `degree_code` | text | Yes | Programme/degree code used to group the register. |
| B | `REGNO` | `register_number` | text | Yes | Institution register identifier. It should be treated as a unique student identifier. |
| C | `NAME` | `student_name` | text | Yes | Student name. |
| D | `FATHER NAME` | `father_name` | text | Yes | Father/parent name. |

### Key and constraints inferred from the workbook

| Item | Structure |
|---|---|
| Grain | One row represents one student-register entry. |
| Candidate key | `register_number` (`REGNO`); the values are used as individual record identifiers. |
| Classification field | `degree_code` (`DEGREE`). |
| Personal-data fields | `register_number`, `student_name`, and `father_name`. These are not reproduced in this document. |
| Nullability observed | All four register-table columns are populated for all 336 record rows. |
| Relationships | None are encoded in the workbook; this is a flat table, not a relational database. |

## Programme-count summary

**Physical location:** columns `F:G`. The workbook has no explicit headers for this block, so the field names below are descriptive/inferred.

| Column | Suggested field name | Stored type | Meaning |
|---|---|---|---|
| F | `programme_name` | text | Human-readable programme abbreviation/name. |
| G | `student_count` | whole number | Count of register rows in that programme. |

### Aggregate distribution (non-identifying)

| Degree code | Programme label | Student count |
|---|---|---:|
| `BTAD1` | AI & DS | 60 |
| `BTBM1` | BME | 40 |
| `BTCS1` | CSE | 118 |
| `BTEC1` | ECE | 59 |
| `BTIT1` | IT | 59 |
| **Total** |  | **336** |

## Recommended relational form

If this worksheet is imported into a database, keep the student data separate from programme reference data:

```text
programmes
  programme_code  PK
  programme_name  NOT NULL

student_register
  register_number PK
  programme_code  FK -> programmes.programme_code
  student_name    NOT NULL
  father_name     NOT NULL
```

The programme-count summary should be generated from `student_register` with `COUNT(*)` grouped by `programme_code`, rather than stored as a separate source of truth.

## Exclusions

No student-level values, names, register numbers, parent names, or row-by-row student details are included in this document.
