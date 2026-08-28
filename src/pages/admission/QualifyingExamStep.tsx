import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { AppCard } from '../../components/ui/AppCard';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { handleFormEnterKeyDown } from '../../utils/enterKeyNavigation';
import { focusFirstFormError } from '../../utils/formFocus';
import { calculateHSCCutOff } from '../../utils/cutoffCalculator';
import { HSCSubjectMark, ExamPassed } from '../../types';

const fieldSx = {
  '& .MuiInputLabel-root': {
    fontSize: '14.5px',
    fontWeight: 600,
    color: '#344054',
    transform: 'translate(14px, 14px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
  '& .MuiOutlinedInput-root': {
    height: '50px',
    borderRadius: '12px',
    fontSize: '15px',
    '& input': {
      padding: '13px 16px',
    },
    '& input::placeholder': {
      fontSize: '14.5px',
    },
    '& .MuiSelect-select': {
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '20px',
    },
  },
};

export const QualifyingExamStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { draftStudent, updateDraftSection, isViewReadOnly, showSnackbar } = useAdmission();
  const program = draftStudent.academic?.program || 'First Year B.Tech';

  // State for First Year B.Tech HSC Marks
  const [qualifyingData, setQualifyingData] = useState<{
    institutionName: string;
    institutionPlace: string;
    examinationPassed: ExamPassed | '';
    monthYearPassing: string;
    sslcPercentage: number | undefined;
    sslcRegisterNumber: string;
    hscPercentage: number | undefined;
    hscRegisterNumber: string;
  }>({
    institutionName: draftStudent.qualifyingExam?.institutionName || '',
    institutionPlace: draftStudent.qualifyingExam?.institutionPlace || '',
    examinationPassed: (draftStudent.qualifyingExam?.examinationPassed || '') as any,
    monthYearPassing: draftStudent.qualifyingExam?.monthYearPassing || '',
    sslcPercentage: draftStudent.qualifyingExam?.sslcPercentage ?? undefined,
    sslcRegisterNumber: draftStudent.qualifyingExam?.sslcRegisterNumber || '',
    hscPercentage: draftStudent.qualifyingExam?.hscPercentage || draftStudent.hscMarks?.overallPercentage || undefined,
    hscRegisterNumber: draftStudent.qualifyingExam?.hscRegisterNumber || '',
  });

  const [stream, setStream] = useState<'Academic' | 'Vocational'>(
    draftStudent.hscMarks?.stream || 'Academic'
  );

  const THIRD_SUBJECTS = ['Chemistry', 'Biology', 'Computer Science', 'Bio Technology'];

  const getDefaultThirdSubject = (): string => {
    if (draftStudent.hscMarks?.academicMarks.length) {
      const third = draftStudent.hscMarks.academicMarks.find(
        (m) => !['Maths', 'Physics'].includes(m.subject)
      );
      return third?.subject || 'Chemistry';
    }
    return 'Chemistry';
  };

  const [thirdSubject, setThirdSubject] = useState<string>(getDefaultThirdSubject());

  const [academicMarks, setAcademicMarks] = useState<HSCSubjectMark[]>(
    draftStudent.hscMarks?.academicMarks.length
      ? draftStudent.hscMarks.academicMarks
      : [
          { subject: 'Maths', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
          { subject: 'Physics', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
          { subject: 'Chemistry', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
        ]
  );

  const handleThirdSubjectChange = (newSubject: string) => {
    setThirdSubject(newSubject);
    setAcademicMarks((prev) => {
      const updated = [...prev];
      const thirdIdx = updated.findIndex((m) => !['Maths', 'Physics'].includes(m.subject));
      if (thirdIdx >= 0) {
        updated[thirdIdx] = { ...updated[thirdIdx], subject: newSubject };
      }
      return updated;
    });
  };

  const DEFAULT_VOCATIONAL_MARKS: HSCSubjectMark[] = [
    { subject: 'Vocational Subject Theory', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
    { subject: 'Related Subject I', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
    { subject: 'Related Subject II', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
    { subject: 'Practical I', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
    { subject: 'Practical II', monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 },
  ];

  const normalizeVocationalMarks = (marks: HSCSubjectMark[]): HSCSubjectMark[] => {
    if (!marks || marks.length === 0) return DEFAULT_VOCATIONAL_MARKS;
    const normalized = marks.map((m) => {
      const s = m.subject.trim();
      if (/^(practical i|related subject ii practical i)$/i.test(s)) return { ...m, subject: 'Practical I' };
      if (/^(practical ii|related subject ii practical ii)$/i.test(s)) return { ...m, subject: 'Practical II' };
      if (/^(theory|related subject ii theory)$/i.test(s)) return { ...m, subject: 'Related Subject II' };
      return m;
    });
    const result = [...normalized];
    const ensure = (subject: string) => {
      if (!result.some((m) => m.subject.trim().toLowerCase() === subject.toLowerCase())) {
        result.push({ subject, monthYear: '', maxMarks: 100, marksObtained: 0, percentage: 0 });
      }
    };
    ensure('Practical I');
    ensure('Practical II');
    return result;
  };

  const [vocationalMarks, setVocationalMarks] = useState<HSCSubjectMark[]>(() =>
    normalizeVocationalMarks(draftStudent.hscMarks?.vocationalMarks || [])
  );

  // State for Lateral Entry Diploma
  const [diploma, setDiploma] = useState<{
    diplomaCourse: string;
    institutionName: string;
    board: string;
    secondYearPercentage: number | undefined;
    thirdYearPercentage: number | undefined;
  }>({
    diplomaCourse: draftStudent.diplomaDetails?.diplomaCourse || '',
    institutionName: draftStudent.diplomaDetails?.institutionName || '',
    board: draftStudent.diplomaDetails?.board || '',
    secondYearPercentage: draftStudent.diplomaDetails?.secondYearPercentage ?? undefined,
    thirdYearPercentage: draftStudent.diplomaDetails?.thirdYearPercentage ?? undefined,
  });

  // State for PG Qualification
  const [pg, setPg] = useState<{
    universityName: string;
    universityPlace: string;
    institutionName: string;
    institutionPlace: string;
    examinationPassed: string;
    monthYearPassing: string;
    totalPercentage: number | undefined;
    mainSubjectPercentage: number | undefined;
    degreeRegistrationNumber: string;
  }>({
    universityName: draftStudent.pgQualification?.universityName || '',
    universityPlace: draftStudent.pgQualification?.universityPlace || '',
    institutionName: draftStudent.pgQualification?.institutionName || '',
    institutionPlace: draftStudent.pgQualification?.institutionPlace || '',
    examinationPassed: draftStudent.pgQualification?.examinationPassed || '',
    monthYearPassing: draftStudent.pgQualification?.monthYearPassing || '',
    totalPercentage: draftStudent.pgQualification?.totalPercentage ?? undefined,
    mainSubjectPercentage: draftStudent.pgQualification?.mainSubjectPercentage ?? undefined,
    degreeRegistrationNumber: draftStudent.pgQualification?.degreeRegistrationNumber || '',
  });

  // Calculations for HSC
  const activeMarksList = stream === 'Academic' ? academicMarks : vocationalMarks;
  const totalMax = activeMarksList.reduce((acc, m) => acc + Number(m.maxMarks || 0), 0);
  const totalObtained = activeMarksList.reduce((acc, m) => acc + Number(m.marksObtained || 0), 0);
  const overallPct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const cutOff = calculateHSCCutOff(activeMarksList, stream);

  // Calculations for Diploma
  const secondYearPct = diploma.secondYearPercentage || 0;
  const thirdYearPct = diploma.thirdYearPercentage || 0;
  const diplomaAggregate = Number(((secondYearPct + thirdYearPct) / 2).toFixed(2));

  // Live synchronize edits to draftStudent in AdmissionContext
  useEffect(() => {
    if (program === 'First Year B.Tech') {
      updateDraftSection('qualifyingExam', qualifyingData as any);
      updateDraftSection('hscMarks', {
        stream,
        academicMarks,
        vocationalMarks,
        totalMaxMarks: totalMax,
        totalMarksObtained: totalObtained,
        overallPercentage: qualifyingData.hscPercentage !== undefined && qualifyingData.hscPercentage > 0 ? qualifyingData.hscPercentage : overallPct,
        engineeringCutOff: cutOff,
      });
      if (draftStudent.fee) {
        updateDraftSection('fee', {
          ...draftStudent.fee,
          cutOffMark: cutOff,
        });
      }
    } else if (program === 'Second Year B.Tech (Lateral Entry)') {
      updateDraftSection('diplomaDetails', {
        ...diploma,
        aggregatePercentage: diplomaAggregate,
      } as any);
      if (draftStudent.fee) {
        updateDraftSection('fee', {
          ...draftStudent.fee,
          cutOffMark: diplomaAggregate,
        });
      }
    } else {
      updateDraftSection('pgQualification', pg as any);
      if (draftStudent.fee) {
        updateDraftSection('fee', {
          ...draftStudent.fee,
          cutOffMark: pg.mainSubjectPercentage || 0,
        });
      }
    }
  }, [qualifyingData, stream, academicMarks, vocationalMarks, diploma, pg, program, totalMax, totalObtained, overallPct, cutOff, diplomaAggregate]);

  const handleMarkChange = (index: number, field: keyof HSCSubjectMark, value: any) => {
    const setter = stream === 'Academic' ? setAcademicMarks : setVocationalMarks;
    setter((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value };
      if (field === 'marksObtained' || field === 'maxMarks') {
        const obtained = field === 'marksObtained' ? Number(value) : updated.marksObtained;
        const max = field === 'maxMarks' ? Number(value) : updated.maxMarks;
        updated.percentage = max > 0 ? Number(((obtained / max) * 100).toFixed(2)) : 0;
      }
      copy[index] = updated;
      return copy;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (program === 'First Year B.Tech') {
      if (
        !qualifyingData.institutionName ||
        !qualifyingData.sslcRegisterNumber ||
        !qualifyingData.hscRegisterNumber ||
        !qualifyingData.examinationPassed ||
        !qualifyingData.monthYearPassing
      ) {
        showSnackbar('Please complete all required Qualifying Examination fields before proceeding.', 'error');
        focusFirstFormError();
        return;
      }

      updateDraftSection('qualifyingExam', qualifyingData as any);
      updateDraftSection('hscMarks', {
        stream,
        academicMarks,
        vocationalMarks,
        totalMaxMarks: totalMax,
        totalMarksObtained: totalObtained,
        overallPercentage: qualifyingData.hscPercentage !== undefined && qualifyingData.hscPercentage > 0 ? qualifyingData.hscPercentage : overallPct,
        engineeringCutOff: cutOff,
      });
      updateDraftSection('fee', {
        ...draftStudent.fee!,
        cutOffMark: cutOff,
      });
    } else if (program === 'Second Year B.Tech (Lateral Entry)') {
      if (!diploma.diplomaCourse || !diploma.institutionName || !diploma.board) {
        showSnackbar('Please complete all required Diploma Details fields before proceeding.', 'error');
        focusFirstFormError();
        return;
      }

      const diplomaData = {
        ...diploma,
        aggregatePercentage: diplomaAggregate,
      };
      updateDraftSection('diplomaDetails', diplomaData as any);
      updateDraftSection('fee', {
        ...draftStudent.fee!,
        cutOffMark: diplomaAggregate,
      });
    } else {
      if (
        !pg.examinationPassed ||
        !pg.universityName ||
        !pg.institutionName ||
        !pg.degreeRegistrationNumber ||
        !pg.monthYearPassing
      ) {
        showSnackbar('Please complete all required Undergraduate / Qualifying Degree fields before proceeding.', 'error');
        focusFirstFormError();
        return;
      }

      updateDraftSection('pgQualification', pg as any);
      updateDraftSection('fee', {
        ...draftStudent.fee!,
        cutOffMark: pg.mainSubjectPercentage || 0,
      });
    }

    onNext();
  };

  return (
    <Box
      component="form"
      id="wizard-step-form"
      onSubmit={handleFormSubmit}
      autoComplete="off"
      onKeyDown={(e) => handleFormEnterKeyDown(e, () => handleFormSubmit(e))}
    >
      {/* Hidden dummy inputs to trap Chrome profile autofill */}
      <input type="text" name="prevent_autofill_user" id="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pass" id="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      {program === 'First Year B.Tech' && (
        <AppCard sx={{ marginBottom: '24px' }}>
          <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
            Qualifying Examination (HSC / CBSE)
          </Typography>
          <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
            Enter the student's 10th and 12th qualifying examination details.
          </Typography>

            <Grid container columnSpacing={3} rowSpacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Institution Name *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.institutionName}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, institutionName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Institution Place *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.institutionPlace}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, institutionPlace: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Examination Passed *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.examinationPassed}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, examinationPassed: e.target.value as ExamPassed })}
                >
                  <MenuItem value="">No Selection</MenuItem>
                  <MenuItem value="HSC">HSC (State Board)</MenuItem>
                  <MenuItem value="CBSE">CBSE</MenuItem>
                  <MenuItem value="ISC">ISC</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Month & Year of Passing *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.monthYearPassing}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, monthYearPassing: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="SSLC Percentage (%) *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.sslcPercentage !== undefined ? qualifyingData.sslcPercentage : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQualifyingData({ ...qualifyingData, sslcPercentage: val === '' ? undefined : Number(val) });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SSLC Register Number *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.sslcRegisterNumber}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, sslcRegisterNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="HSC Total Percentage (%) *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.hscPercentage !== undefined ? qualifyingData.hscPercentage : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQualifyingData({ ...qualifyingData, hscPercentage: val === '' ? undefined : Number(val) });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="HSC Register Number *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={qualifyingData.hscRegisterNumber}
                  onChange={(e) => setQualifyingData({ ...qualifyingData, hscRegisterNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          </AppCard>
      )}

      {program === 'First Year B.Tech' && (
        <AppCard sx={{ marginBottom: '24px' }}>
          {/* HSC Marks Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '22px' }}>
                HSC Marks & Cut-Off Calculation
              </Typography>
              <RadioGroup
                row
                value={stream}
                onChange={(e) => setStream(e.target.value as 'Academic' | 'Vocational')}
              >
                <FormControlLabel value="Academic" control={<Radio size="small" color="primary" />} label="Academic" sx={{ '& .MuiTypography-root': { fontSize: '14.5px', fontWeight: 600 } }} />
                <FormControlLabel value="Vocational" control={<Radio size="small" color="primary" />} label="Vocational" sx={{ '& .MuiTypography-root': { fontSize: '14.5px', fontWeight: 600 } }} />
              </RadioGroup>
            </Box>

            <Table sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '8px', overflow: 'hidden', mb: '16px' }}>
              <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F5F8FC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '13px', padding: '10px 14px' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '13px', padding: '10px 14px' }}>Month & Year</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '13px', padding: '10px 14px' }}>Max Marks</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '13px', padding: '10px 14px' }}>Marks Obtained</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: isDark ? '#38BDF8' : '#0D47A1', fontSize: '13px', padding: '10px 14px' }}>Percentage (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeMarksList.map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', padding: '8px 14px', minWidth: '180px' }}>
                      {stream === 'Academic' && idx === 2 ? (
                        <TextField
                          select
                          size="small"
                          value={thirdSubject}
                          disabled={isViewReadOnly}
                          onChange={(e) => handleThirdSubjectChange(e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { height: '36px', borderRadius: '6px', fontSize: '12px' } }}
                        >
                          {THIRD_SUBJECTS.map((s) => (
                            <MenuItem key={s} value={s} sx={{ fontSize: '13px' }}>{s}</MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        row.subject
                      )}
                    </TableCell>
                    <TableCell sx={{ padding: '8px 14px' }}>
                      <TextField
                        size="small"
                        disabled={isViewReadOnly}
                        value={row.monthYear}
                        onChange={(e) => handleMarkChange(idx, 'monthYear', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '36px',
                            borderRadius: '6px',
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '8px 14px' }}>
                      <TextField
                        size="small"
                        type="number"
                        disabled={isViewReadOnly}
                        value={row.maxMarks || ''}
                        onChange={(e) => handleMarkChange(idx, 'maxMarks', e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '36px',
                            borderRadius: '6px',
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '8px 14px' }}>
                      <TextField
                        size="small"
                        type="number"
                        disabled={isViewReadOnly}
                        value={row.marksObtained || ''}
                        onChange={(e) => handleMarkChange(idx, 'marksObtained', e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '36px',
                            borderRadius: '6px',
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0D47A1', fontSize: '13px', padding: '8px 14px' }}>
                      {row.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <SummaryCard
              title="HSC Marks Summary"
              items={[
                { label: 'Total Maximum Marks', value: totalMax },
                { label: 'Total Marks Obtained', value: totalObtained },
                { label: 'Overall HSC Percentage', value: `${overallPct}%`, isHighlight: true },
              ]}
            />
          </AppCard>
      )}

      {program === 'Second Year B.Tech (Lateral Entry)' && (
        <AppCard>
          <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
            Diploma Qualification Details
          </Typography>
          <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
            Enter the student's Diploma course marks for lateral entry admission.
          </Typography>

          <Grid container columnSpacing={3} rowSpacing={2.5} sx={{ marginBottom: '24px' }}>
            {/* ROW 1 */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Diploma Course Name *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={diploma.diplomaCourse}
                onChange={(e) => setDiploma({ ...diploma, diplomaCourse: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Polytechnic / Institution Name *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={diploma.institutionName}
                onChange={(e) => setDiploma({ ...diploma, institutionName: e.target.value })}
              />
            </Grid>

            {/* ROW 2 */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Board *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={diploma.board}
                onChange={(e) => setDiploma({ ...diploma, board: e.target.value })}
              >
                <MenuItem value="">No Selection</MenuItem>
                <MenuItem value="DOTE">DOTE (Tamil Nadu / Puducherry)</MenuItem>
                <MenuItem value="AICTE">AICTE</MenuItem>
                <MenuItem value="Autonomous">Autonomous</MenuItem>
                <MenuItem value="Other">Other Board</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Second Year Percentage (%) *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={diploma.secondYearPercentage !== undefined ? diploma.secondYearPercentage : ''}
                inputProps={{ min: 0, max: 100 }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDiploma({ ...diploma, secondYearPercentage: undefined });
                    return;
                  }
                  const num = Number(val);
                  if (num >= 0 && num <= 100) {
                    setDiploma({ ...diploma, secondYearPercentage: num });
                  }
                }}
              />
            </Grid>

            {/* ROW 3 */}
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Third Year Percentage (%) *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={diploma.thirdYearPercentage !== undefined ? diploma.thirdYearPercentage : ''}
                inputProps={{ min: 0, max: 100 }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDiploma({ ...diploma, thirdYearPercentage: undefined });
                    return;
                  }
                  const num = Number(val);
                  if (num >= 0 && num <= 100) {
                    setDiploma({ ...diploma, thirdYearPercentage: num });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Overall Diploma Percentage (%) (Auto Calculated)"
                fullWidth
                sx={fieldSx}
                disabled
                InputProps={{ readOnly: true }}
                value={
                  diploma.secondYearPercentage !== undefined || diploma.thirdYearPercentage !== undefined
                    ? `${((Number(diploma.secondYearPercentage || 0) + Number(diploma.thirdYearPercentage || 0)) / 2).toFixed(2)}`
                    : ''
                }
              />
            </Grid>
          </Grid>

          <SummaryCard
            title="Diploma Percentage Summary"
            items={[
              { label: 'Second Year Percentage', value: diploma.secondYearPercentage !== undefined ? `${diploma.secondYearPercentage}%` : '-' },
              { label: 'Third Year Percentage', value: diploma.thirdYearPercentage !== undefined ? `${diploma.thirdYearPercentage}%` : '-' },
              {
                label: 'Overall Diploma Percentage',
                value: `${((Number(diploma.secondYearPercentage || 0) + Number(diploma.thirdYearPercentage || 0)) / 2).toFixed(2)}%`,
                isHighlight: true,
              },
            ]}
          />
        </AppCard>
      )}

      {program === 'PG' && (
        <AppCard>
          <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
            PG Qualifying Degree Details
          </Typography>
          <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
            Enter the qualifying undergraduate degree details for postgraduate admission.
          </Typography>

          <Grid container columnSpacing={3} rowSpacing={2.5} sx={{ marginBottom: '24px' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="University Name *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.universityName}
                onChange={(e) => setPg({ ...pg, universityName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="University Place *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.universityPlace}
                onChange={(e) => setPg({ ...pg, universityPlace: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Institution / College Name *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.institutionName}
                onChange={(e) => setPg({ ...pg, institutionName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Institution Place *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.institutionPlace}
                onChange={(e) => setPg({ ...pg, institutionPlace: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Degree / Exam Passed *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.examinationPassed}
                onChange={(e) => setPg({ ...pg, examinationPassed: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Month & Year of Passing *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.monthYearPassing}
                onChange={(e) => setPg({ ...pg, monthYearPassing: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Total Percentage (%) *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.totalPercentage !== undefined ? pg.totalPercentage : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPg({ ...pg, totalPercentage: val === '' ? undefined : Number(val) });
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Main Subject Percentage (%) *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.mainSubjectPercentage !== undefined ? pg.mainSubjectPercentage : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPg({ ...pg, mainSubjectPercentage: val === '' ? undefined : Number(val) });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Degree Registration Number *"
                fullWidth
                sx={fieldSx}
                disabled={isViewReadOnly}
                value={pg.degreeRegistrationNumber}
                onChange={(e) => setPg({ ...pg, degreeRegistrationNumber: e.target.value })}
              />
            </Grid>
          </Grid>

          <SummaryCard
            title="Degree Qualification Summary"
            items={[
              { label: 'Examination Passed', value: pg.examinationPassed || '-' },
              { label: 'Overall Degree Percentage', value: pg.totalPercentage !== undefined ? `${pg.totalPercentage}%` : '-' },
              { label: 'Main Subject Percentage', value: pg.mainSubjectPercentage !== undefined ? `${pg.mainSubjectPercentage}%` : '-', isHighlight: true },
              { label: 'Month & Year of Passing', value: pg.monthYearPassing || '-' },
            ]}
          />
        </AppCard>
      )}
    </Box>
  );
};
