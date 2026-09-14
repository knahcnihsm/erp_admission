import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import {
  FileSpreadsheet,
  Upload,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  bulkUpdateApi,
} from '../../api/client';
import {
  BulkUpdatePreview,
  BulkUpdateSchema,
  BulkUpdateSheet,
  BulkUpdateTable,
} from '../../api/types';
import { useThemeContext } from '../../context/ThemeContext';
import { toUpper } from '../../utils/caseUtils';

interface ParsedSheet {
  tableName: string;
  rows: Record<string, string>[];
}

const toRowString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return String(value);
};

const tableColumns = (table: BulkUpdateTable): string[] => table.columns.map((c) => c.name);

const FIELD_LABELS: Record<string, string> = {
  application_no: 'Application No',
  register_no: 'Register Number',
  student_name: 'Student Name',
  date_of_birth: 'Date of Birth',
  aadhaar_no: 'Aadhaar No',
  gender: 'Gender',
  district: 'District',
  nationality: 'Nationality',
  caste: 'Caste',
  mobile_number: 'Mobile Number',
  email_id: 'Email',
  father_name: 'Father Name',
  father_mobile_no: 'Father Mobile No',
  father_occupation: 'Father Occupation',
  annual_income: 'Annual Income',
  category_id: 'Category',
  program_id: 'Program',
  department_id: 'Department',
  batch: 'Batch',
  date_of_admission: 'Date of Admission',
  address_type: 'Address Type',
  address_line: 'Address',
  pincode: 'Pincode',
  phone: 'Phone',
  mobile: 'Mobile',
  email: 'Email',
  same_as_permanent: 'Same as Permanent',
  institution_name: 'Institution',
  institution_place: 'Institution Place',
  exam_passed: 'Exam Passed',
  month_year_of_passing: 'Month/Year of Passing',
  sslc_registration_no: 'SSLC Reg No',
  sslc_percentage: 'SSLC %',
  hsc_registration_no: 'HSC Reg No',
  hsc_percentage: 'HSC %',
  diploma: 'Diploma',
  board: 'Board',
  second_year_percentage: 'Second Year %',
  third_year_percentage: 'Third Year %',
  aggregate_percentage: 'Aggregate %',
  university_name: 'University',
  university_place: 'University Place',
  total_percentage: 'Total %',
  main_subject_percentage: 'Main Subject %',
  degree_registration_no: 'Degree Reg No',
  cut_off_mark: 'Cut-off Mark',
  merit_percent: 'Merit %',
  original_tuition_fee: 'Original Tuition Fee',
  scholarship_amount: 'Scholarship Amount',
  tuition_fee_per_year: 'Tuition Fee / Year',
  course_duration_years: 'Duration (Years)',
  total_tuition_fee: 'Total Tuition Fee',
  bus_required: 'Bus Required',
  route_id: 'Bus Route',
  bus_stop_id: 'Bus Stop',
  bus_fee: 'Bus Fee',
  hostel_required: 'Hostel Required',
  hostel_id: 'Hostel',
  hostel_fee: 'Hostel Fee',
  paid_amount: 'Paid Amount',
  pending_amount: 'Pending Amount',
  certificate_id: 'Certificate',
  is_submitted: 'Submitted',
  file_path: 'File Path',
  subject_name: 'Subject',
  month_year: 'Month/Year',
  maximum_marks: 'Maximum Marks',
  marks_obtained: 'Marks Obtained',
  percentage: 'Percentage',
};

const fieldLabel = (name: string): string => {
  const mapped = FIELD_LABELS[name];
  if (mapped) return mapped;
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const valueText = (value: string | null | undefined): string =>
  value && value.trim().length > 0 ? value : '(empty)';

const SAMPLE_DATA: Record<string, Record<string, string>[]> = {
  student_details: [
    {
      application_no: 'RGCET/2026/2001',
      register_no: '26BTECH001',
      student_name: 'Aarav Sharma',
      date_of_birth: '2008-06-10',
      aadhaar_no: '123412341200',
      gender: 'Male',
      district: 'Karaikal',
      nationality: 'Indian',
      caste: 'OTHERS',
      mobile_number: '9840112233',
      email_id: 'aarav.sharma@example.com',
    },
  ],
  parent_details: [
    {
      application_no: 'RGCET/2026/2001',
      father_name: 'Father 1',
      father_mobile_no: '9876543001',
      father_occupation: 'Farmer',
      annual_income: '400000',
    },
  ],
  admission: [
    {
      application_no: 'RGCET/2026/2001',
      category_id: 'MANAGEMENT',
      program_id: 'First Year B.Tech',
      department_id: 'Computer Science & Engineering (CSE)',
      batch: '2026-2030',
      date_of_admission: '2026-08-01',
    },
  ],
  address: [
    {
      application_no: 'RGCET/2026/2001',
      address_type: 'PERMANENT',
      address_line: 'No.1, Gandhi Street, Puducherry',
      pincode: '605002',
      phone: '',
      mobile: '9876543001',
      email: 'student1@mail.com',
      same_as_permanent: '',
    },
    {
      application_no: 'RGCET/2026/2001',
      address_type: 'COMMUNICATION',
      address_line: 'No.1, Gandhi Street, Puducherry',
      pincode: '605002',
      phone: '',
      mobile: '9876543001',
      email: 'student1@mail.com',
      same_as_permanent: '',
    },
  ],
  qualifying_examination: [
    {
      application_no: 'RGCET/2026/2001',
      institution_name: 'Govt Hr Sec School',
      institution_place: 'Puducherry',
      exam_passed: 'HSC',
      month_year_of_passing: 'May 2026',
      sslc_registration_no: 'SSLC001',
      sslc_percentage: '92',
      hsc_registration_no: 'HSC001',
      hsc_percentage: '89',
    },
  ],
  student_fee: [
    {
      application_no: 'RGCET/2026/2001',
      cut_off_mark: '284',
      merit_percent: '94.67',
      original_tuition_fee: '100000',
      scholarship_amount: '20000',
      tuition_fee_per_year: '80000',
      course_duration_years: '4',
      total_tuition_fee: '320000',
      bus_required: 'FALSE',
      route_id: '',
      bus_stop_id: '',
      bus_fee: '0',
      hostel_required: 'FALSE',
      hostel_id: '',
      hostel_fee: '0',
      paid_amount: '',
      pending_amount: '',
    },
  ],
  student_certificate: [
    {
      application_no: 'RGCET/2026/2001',
      certificate_id: 'Provisional Allotment Order',
      is_submitted: 'TRUE',
      file_path: '',
    },
  ],
  hsc_academic_marks: [
    {
      application_no: 'RGCET/2026/2001',
      subject_name: 'MATHEMATICS',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '92',
      percentage: '92',
    },
    {
      application_no: 'RGCET/2026/2001',
      subject_name: 'PHYSICS',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '86',
      percentage: '86',
    },
  ],
  hsc_vocational_marks: [
    {
      application_no: 'RGCET/2026/2001',
      subject_name: 'PRACTICAL I',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '75',
      percentage: '75',
    },
  ],
};

export const BulkUpdatePage: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [schema, setSchema] = useState<BulkUpdateSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string>('');

  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const [preview, setPreview] = useState<BulkUpdatePreview | null>(null);

  const [loadingSchema, setLoadingSchema] = useState(false);
  const [validating, setValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const resetAll = () => {
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setParsedSheets([]);
    setPreview(null);
    setError('');
    setSuccessMsg('');
  };

  const loadSchema = async () => {
    setLoadingSchema(true);
    setSchemaError('');
    try {
      setSchema(await bulkUpdateApi.schema());
    } catch (e) {
      setSchemaError(e instanceof Error ? e.message : 'Failed to load schema');
    } finally {
      setLoadingSchema(false);
    }
  };

  React.useEffect(() => {
    loadSchema();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccessMsg('');
    setPreview(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
        const worksheet = workbook.Sheets[name];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false,
        });
        const rows = rawRows.map((raw) => {
          const normalized: Record<string, string> = {};
          Object.entries(raw).forEach(([key, value]) => {
            normalized[key.trim()] = toRowString(value).trim();
          });
          return normalized;
        });
        return { tableName: name.trim(), rows };
      });
      setParsedSheets(sheets);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse the Excel file');
    }
    event.target.value = '';
  };

  const handleValidate = async () => {
    if (parsedSheets.length === 0) return;
    setValidating(true);
    setError('');
    setSuccessMsg('');
    setPreview(null);
    try {
      const payload: { sheets: BulkUpdateSheet[] } = {
        sheets: parsedSheets.map((s) => ({ tableName: s.tableName, rows: s.rows })),
      };
      setPreview(await bulkUpdateApi.validate(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleApply = async () => {
    if (!preview || parsedSheets.length === 0) return;
    setApplying(true);
    setError('');
    try {
      const payload: { sheets: BulkUpdateSheet[] } = {
        sheets: parsedSheets.map((s) => ({ tableName: s.tableName, rows: s.rows })),
      };
      const result = await bulkUpdateApi.apply(payload);
      const message = `Bulk update applied successfully: ${result.summary.updatedRecords} updated, ${result.summary.skippedRecords} skipped, ${result.summary.failedRecords} failed.`;
      resetAll();
      setSuccessMsg(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!schema) return;
    const workbook = XLSX.utils.book_new();
    schema.tables.forEach((table) => {
      const worksheet = XLSX.utils.aoa_to_sheet([tableColumns(table)]);
      XLSX.utils.book_append_sheet(workbook, worksheet, table.tableName.slice(0, 31));
    });
    XLSX.writeFile(workbook, 'bulk_update_template.xlsx');
  };

  const handleDownloadSample = () => {
    if (!schema) return;
    const workbook = XLSX.utils.book_new();
    schema.tables.forEach((table) => {
      const header = tableColumns(table);
      const rows = SAMPLE_DATA[table.tableName] || [];
      const sheetRows = [header, ...rows.map((row) => header.map((col) => row[col] ?? ''))];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, table.tableName.slice(0, 31));
    });
    XLSX.writeFile(workbook, 'bulk_update_sample.xlsx');
  };

  const handleDownloadErrorReport = () => {
    const records = (preview?.records || [])
      .filter((r) => !r.valid)
      .map((r) => ({
        'Application No': toUpper(r.applicationNo),
        'Student Name': toUpper(r.studentName),
        Status: 'INVALID',
        Errors: r.errors.join('; '),
      }));
    if (records.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Report');
    XLSX.writeFile(workbook, 'bulk_update_error_report.xlsx');
  };

  const totalParsedRows = parsedSheets.reduce((sum, s) => sum + s.rows.length, 0);
  const changedRecords = preview?.records.filter((r) => r.valid && r.changes.length > 0) ?? [];
  const unchangedCount = preview ? preview.summary.unchangedRecords : 0;

  const renderSummaryChip = (
    label: string,
    value: number,
    color: string,
    bg: string
  ) => (
    <Box sx={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: bg, textAlign: 'center', minWidth: '110px' }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#667085', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ marginBottom: '24px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '1.75rem' }}>
              Bulk Student Update
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#667085', fontSize: '0.95rem' }}>
              Upload an Excel workbook and apply field-level changes to existing admission records.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<Download size={16} />}
              onClick={handleDownloadSample}
              disabled={!schema}
              sx={{ color: '#16A34A', fontWeight: 600 }}
            >
              Download Sample
            </Button>
            <Button
              size="small"
              startIcon={<Download size={16} />}
              onClick={handleDownloadTemplate}
              disabled={!schema}
              sx={{ color: '#0284C7', fontWeight: 600 }}
            >
              Download Template
            </Button>
            {loadingSchema && <CircularProgress size={20} sx={{ color: '#0284C7' }} />}
          </Box>
        </Box>
        {schemaError && (
          <Alert severity="warning" sx={{ fontSize: '0.85rem', marginTop: '12px' }}>
            {schemaError} — the bulk update API may be offline.
          </Alert>
        )}
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ marginBottom: '16px' }}>
          <AlertTitle>Success</AlertTitle>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ marginBottom: '16px' }}>
          <AlertTitle>Operation Failed</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Upload */}
      <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', marginBottom: '20px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                1. Upload Excel Workbook
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                Each sheet name must match a table name; the first row is the header.
              </Typography>
            </Box>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Upload size={18} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ backgroundColor: '#16A34A', borderRadius: '8px', fontWeight: 600 }}
            >
              Choose Excel File
            </Button>
            {fileName && (
              <Chip icon={<FileSpreadsheet size={14} />} label={fileName} variant="outlined" sx={{ color: isDark ? '#CBD5E1' : '#1A2B49' }} />
            )}
            {parsedSheets.length > 0 && (
              <Typography sx={{ fontSize: '0.85rem', color: isDark ? '#94A3B8' : '#475569' }}>
                {parsedSheets.length} sheet(s), {totalParsedRows} row(s)
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Validate */}
      <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', marginBottom: '20px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                2. Validate & Preview Changes
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                No data is modified — the server returns a preview of every change.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={validating ? <CircularProgress size={16} color="inherit" /> : <ShieldCheck size={18} />}
            onClick={handleValidate}
            disabled={validating || parsedSheets.length === 0}
            sx={{ backgroundColor: '#0284C7', borderRadius: '8px', fontWeight: 600 }}
          >
            {validating ? 'Validating…' : 'Validate File'}
          </Button>
        </CardContent>
      </Card>

      {/* Changed Details */}
      {preview && (
        <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', marginBottom: '20px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                  Changed Details
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                  Only records with changes are listed below.
                </Typography>
              </Box>
            </Box>

            {changedRecords.length === 0 ? (
              <Typography sx={{ fontSize: '0.9rem', color: isDark ? '#94A3B8' : '#475569' }}>
                No changes found in the uploaded data.
              </Typography>
            ) : (
              <>
                {changedRecords.map((record) => (
                  <Card
                    key={record.applicationNo}
                    variant="outlined"
                    elevation={0}
                    sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '12px', marginBottom: '12px', backgroundColor: isDark ? '#0D1117' : '#FFFFFF' }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                            {toUpper(record.studentName)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#475569', fontFamily: 'monospace' }}>
                            {toUpper(record.applicationNo)}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<CheckCircle2 size={13} />}
                          label="VALID"
                          size="small"
                          sx={{ backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7', color: '#16A34A', fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </Box>

                      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: isDark ? '#94A3B8' : '#667085', letterSpacing: '0.04em', marginBottom: '4px' }}>
                        CHANGED DETAILS
                      </Typography>

                      {record.changes.map((change, i) => (
                        <Box
                          key={`${change.tableName}-${change.fieldName}-${i}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 0',
                            borderTop: i === 0 ? 'none' : `1px solid ${isDark ? '#334155' : '#EEF2F7'}`,
                          }}
                        >
                          <Box sx={{ width: '180px', flexShrink: 0 }}>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#CBD5E1' : '#475569' }}>
                              {fieldLabel(change.fieldName)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                              {change.tableName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#DC2626', textDecoration: 'line-through' }}>
                              {valueText(change.oldValue)}
                            </Typography>
                            <ArrowRight size={14} color="#94A3B8" />
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#16A34A' }}>
                              {valueText(change.newValue)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                ))}

                {unchangedCount > 0 && (
                  <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
                    {unchangedCount} record(s) unchanged — nothing to apply.
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply */}
      {preview && (
        <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={20} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                  3. Apply Records
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                  {changedRecords.length} record(s) will be updated. Invalid and unchanged records are skipped.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {renderSummaryChip('TOTAL', preview.summary.totalRecords, isDark ? '#FFFFFF' : '#1A2B49', isDark ? '#334155' : '#F1F5F9')}
              {renderSummaryChip('VALID', preview.summary.validRecords, '#16A34A', isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7')}
              {renderSummaryChip('INVALID', preview.summary.invalidRecords, '#DC2626', isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2')}
            </Box>

            {preview.summary.invalidRecords > 0 && (
              <Button
                size="small"
                startIcon={<Download size={16} />}
                onClick={handleDownloadErrorReport}
                sx={{ color: '#DC2626', fontWeight: 600, marginBottom: '12px' }}
              >
                Download Error Report
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={18} />}
              onClick={handleApply}
              disabled={applying || changedRecords.length === 0}
              sx={{ backgroundColor: '#DC2626', borderRadius: '8px', fontWeight: 600 }}
            >
              {applying ? 'Applying…' : `Apply ${changedRecords.length} Record(s)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
