import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { exportStudentsToExcel } from '../../utils/exportExcel';
import { generateStudentPdf } from '../../utils/exportPdf';

export const ExportPage: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { students, selectedStudentIds, showWarningModal } = useAdmission();

  const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.id));

  const handleExportAllExcel = () => {
    if (students.length === 0) {
      showWarningModal(
        'No Student Found',
        'There are no students available to export.'
      );
      return;
    }
    exportStudentsToExcel(students, 'Complete_Active_Students.xlsx');
  };

  const handleExportSelectedExcel = () => {
    if (selectedStudentIds.length === 0) {
      showWarningModal(
        'No Student Selected',
        'Please select at least one student before exporting.'
      );
      return;
    }
    exportStudentsToExcel(selectedStudents, 'Selected_Students.xlsx');
  };

  const handleExportPdf = () => {
    if (selectedStudentIds.length === 0) {
      showWarningModal(
        'No Student Selected',
        'Please select a student before exporting the PDF.'
      );
      return;
    }
    selectedStudents.forEach((s) => generateStudentPdf(s));
  };

  return (
    <Box>
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '1.75rem' }}>
          Enterprise Reports & Data Export Center
        </Typography>
        <Typography variant="body1" sx={{ color: isDark ? '#CBD5E1' : '#667085', fontSize: '0.95rem' }}>
          Generate official PDF admission forms and download Excel master sheets.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Export All Students Excel */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', padding: '20px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={24} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
                    Export All Active Students (Excel)
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                    Download complete spreadsheet of all {students.length} active admission records.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<Download size={18} />}
                onClick={handleExportAllExcel}
                sx={{ backgroundColor: '#16A34A', borderRadius: '8px', fontWeight: 600 }}
              >
                Download All Active Students (.xlsx)
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Export Selected Students Excel */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', padding: '20px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={24} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
                    Export Selected Students ({selectedStudentIds.length} Selected)
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                    Download Excel sheet specifically for checked checkbox records.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<Download size={18} />}
                onClick={handleExportSelectedExcel}
                sx={{ backgroundColor: '#0284C7', borderRadius: '8px', fontWeight: 600 }}
              >
                Download Selected Students ({selectedStudentIds.length})
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* PDF Single Student Generator */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${isDark ? '#334155' : '#E6ECF5'}`, borderRadius: '16px', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', padding: '20px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
                    Generate Student PDF Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#667085' }}>
                    Generate official signed PDF document for selected student.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<FileText size={18} />}
                onClick={handleExportPdf}
                sx={{ backgroundColor: '#D97706', borderRadius: '8px', fontWeight: 600 }}
              >
                Generate Selected Student PDF ({selectedStudentIds.length})
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
