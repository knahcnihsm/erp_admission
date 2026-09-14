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
  XCircle,
  Download,
  UserPlus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { bulkAdmissionApi } from '../../api/client';
import {
  BulkAdmissionPreview,
  BulkUpdateSchema,
  BulkUpdateSheet,
  BulkUpdateTable,
} from '../../api/types';
import { useAdmission } from '../../context/AdmissionContext';
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

const SAMPLE_DATA: Record<string, Record<string, string>[]> = {
  student_details: [
    {
      application_no: 'RGCET/2026/2011',
      register_no: '26BTECH011',
      student_name: 'Kavya Krishnan',
      date_of_birth: '2008-05-18',
      aadhaar_no: '123412341211',
      gender: 'Female',
      district: 'Puducherry',
      nationality: 'Indian',
      caste: 'OBC',
      mobile_number: '9840112299',
      email_id: 'kavya.krishnan@example.com',
    },
  ],
  parent_details: [
    {
      application_no: 'RGCET/2026/2011',
      father_name: 'Krishnan V',
      father_mobile_no: '9876543011',
      father_occupation: 'Teacher',
      annual_income: '450000',
    },
  ],
  address: [
    {
      application_no: 'RGCET/2026/2011',
      address_type: 'PERMANENT',
      address_line: 'No.12, Anna Nagar, Puducherry',
      pincode: '605002',
      phone: '',
      mobile: '9840112299',
      email: 'kavya.krishnan@example.com',
    },
    {
      application_no: 'RGCET/2026/2011',
      address_type: 'COMMUNICATION',
      address_line: 'No.12, Anna Nagar, Puducherry',
      pincode: '605002',
      phone: '',
      mobile: '9840112299',
      email: 'kavya.krishnan@example.com',
    },
  ],
  admission: [
    {
      application_no: 'RGCET/2026/2011',
      category_id: 'CENTAC',
      program_id: 'First Year B.Tech',
      department_id: 'Computer Science & Engineering (CSE)',
      batch: '2026-2030',
      date_of_admission: '2026-08-01',
    },
  ],
  qualifying_examination: [
    {
      application_no: 'RGCET/2026/2011',
      institution_name: 'Govt Hr Sec School',
      institution_place: 'Puducherry',
      exam_passed: 'HSC',
      month_year_of_passing: 'May 2026',
      sslc_registration_no: 'SSLC011',
      sslc_percentage: '91',
      hsc_registration_no: 'HSC011',
      hsc_percentage: '88',
      cut_off_mark: '180',
    },
  ],
  student_fee: [
    {
      application_no: 'RGCET/2026/2011',
      fee_per_year: '75000',
      paid_fee: '75000',
      bus_fee: '0',
      hostel_fee: '0',
    },
  ],
  student_certificate: [
    {
      application_no: 'RGCET/2026/2011',
      certificate_id: 'Provisional Allotment Order',
      is_submitted: 'TRUE',
      file_path: '',
    },
  ],
  hsc_academic_marks: [
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'MATHEMATICS',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '92',
      percentage: '92',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'PHYSICS',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '86',
      percentage: '86',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'CHEMISTRY',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '88',
      percentage: '88',
    },
  ],
  hsc_vocational_marks: [
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'VOCATIONAL SUBJECT THEORY',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '85',
      percentage: '85',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'RELATED SUBJECT I',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '80',
      percentage: '80',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'RELATED SUBJECT II',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '78',
      percentage: '78',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'PRACTICAL I',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '75',
      percentage: '75',
    },
    {
      application_no: 'RGCET/2026/2011',
      subject_name: 'PRACTICAL II',
      month_year: 'MAY 2026',
      maximum_marks: '100',
      marks_obtained: '74',
      percentage: '74',
    },
  ],
};

export const BulkAddAdmissionPage: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { refreshStudents } = useAdmission();

  const [schema, setSchema] = useState<BulkUpdateSchema | null>(null);
  const [schemaError, setSchemaError] = useState<string>('');

  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const [preview, setPreview] = useState<BulkAdmissionPreview | null>(null);

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
      setSchema(await bulkAdmissionApi.schema());
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
      setPreview(await bulkAdmissionApi.validate(payload));
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
      const result = await bulkAdmissionApi.apply(payload);
      const message = `Bulk admission added successfully: ${result.summary.createdRecords} created, ${result.summary.failedRecords} failed.`;
      resetAll();
      await refreshStudents();
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
    XLSX.writeFile(workbook, 'bulk_add_admission_template.xlsx');
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
    XLSX.writeFile(workbook, 'bulk_add_admission_sample.xlsx');
  };

  const handleDownloadErrorReport = () => {
    const records = (preview?.records || [])
      .filter((r) => !r.valid)
      .map((r) => ({
        'Application No': toUpper(r.applicationNo),
        'Student Name': toUpper(r.studentName),
        Program: r.program ? toUpper(r.program) : '',
        Status: 'INVALID',
        Errors: r.errors.join('; '),
      }));
    if (records.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Report');
    XLSX.writeFile(workbook, 'bulk_add_admission_error_report.xlsx');
  };

  const totalParsedRows = parsedSheets.reduce((sum, s) => sum + s.rows.length, 0);
  const validRecords = preview?.records.filter((r) => r.valid) ?? [];
  const invalidRecords = preview?.records.filter((r) => !r.valid) ?? [];

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
              Bulk Add Admission
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#667085', fontSize: '0.95rem' }}>
              Upload an Excel workbook to add new admission records. Fees are entered manually (fee per year, paid fee, bus/hostel fee).
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
            {schemaError} — the bulk add admission API may be offline.
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
                Each sheet name must match a table name; the first row is the header. The required qualification sheet depends on the program.
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
                2. Validate & Preview New Admissions
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                No data is modified — the server checks every record and reports errors.
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

      {/* Preview */}
      {preview && (
        <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', marginBottom: '20px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                  New Admissions
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                  {validRecords.length} record(s) are ready to be added. Invalid records are listed with their errors.
                </Typography>
              </Box>
            </Box>

            {preview.records.map((record) => (
              <Card
                key={record.applicationNo}
                variant="outlined"
                elevation={0}
                sx={{
                  border: record.valid ? `1px solid ${isDark ? '#334155' : '#E6ECF5'}` : '1px solid #FECACA',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  backgroundColor: record.valid ? (isDark ? '#0D1117' : '#FFFFFF') : (isDark ? 'rgba(220, 38, 38, 0.08)' : '#FFF7F7'),
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '1rem' }}>
                        {toUpper(record.studentName) || '(No student name)'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#475569', fontFamily: 'monospace' }}>
                        {toUpper(record.applicationNo)}
                      </Typography>
                    </Box>
                    {record.valid ? (
                      <Chip
                        icon={<CheckCircle2 size={13} />}
                        label="VALID"
                        size="small"
                        sx={{ backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7', color: '#16A34A', fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        icon={<XCircle size={13} />}
                        label="INVALID"
                        size="small"
                        sx={{ backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2', color: '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: record.errors.length > 0 ? '8px' : 0 }}>
                    {record.program && (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#94A3B8', letterSpacing: '0.04em' }}>
                          PROGRAM
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
                          {record.program}
                        </Typography>
                      </Box>
                    )}
                    {record.totalFee && (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#94A3B8', letterSpacing: '0.04em' }}>
                          TOTAL FEE
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>
                          ₹{Number(record.totalFee).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {record.errors.length > 0 && (
                    <Box sx={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : '#FEF2F2' }}>
                      {record.errors.map((err, i) => (
                        <Typography key={i} sx={{ fontSize: '0.78rem', color: isDark ? '#FCA5A5' : '#B91C1C', marginBottom: i === record.errors.length - 1 ? 0 : '4px' }}>
                          {err}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
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
                  3. Add Records
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                  {validRecords.length} new admission(s) will be created with the manual fee details. Invalid records are skipped.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {renderSummaryChip('TOTAL', preview.summary.totalRecords, isDark ? '#FFFFFF' : '#1A2B49', isDark ? '#334155' : '#F1F5F9')}
              {renderSummaryChip('VALID', preview.summary.validRecords, '#16A34A', isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7')}
              {renderSummaryChip('INVALID', preview.summary.invalidRecords, '#DC2626', isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2')}
            </Box>

            {invalidRecords.length > 0 && (
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
              startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <UserPlus size={18} />}
              onClick={handleApply}
              disabled={applying || validRecords.length === 0}
              sx={{ backgroundColor: '#DC2626', borderRadius: '8px', fontWeight: 600 }}
            >
              {applying ? 'Adding…' : `Add ${validRecords.length} New Admission(s)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
