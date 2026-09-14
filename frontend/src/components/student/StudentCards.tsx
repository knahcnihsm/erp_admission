import React from 'react';
import { Box, Typography, Checkbox, Divider } from '@mui/material';
import { motion } from 'motion/react';
import { StudentRecord } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';
import { toUpper } from '../../utils/caseUtils';
import { getDeptCode } from '../../utils/departmentUtils';
import { useThemeContext } from '../../context/ThemeContext';

interface StudentCardsProps {
  students: StudentRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  renderActions: (student: StudentRecord) => React.ReactNode;
}

export const StudentCards: React.FC<StudentCardsProps> = ({
  students,
  selectedIds,
  onToggleSelect,
  renderActions,
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  if (students.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '15px', fontWeight: 500, color: isDark ? '#CBD5E1' : '#64748B' }}>
          No students found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {students.map((student, idx) => {
        const isSelected = selectedIds.includes(student.id);
        return (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.035, ease: 'easeOut' }}
          >
            <Box
              sx={{
                borderRadius: '14px',
                padding: '14px 16px',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: isSelected
                  ? `1.5px solid ${isDark ? '#38BDF8' : '#0B3D91'}`
                  : `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
                boxShadow: isDark
                  ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                  : '0 4px 16px rgba(15, 23, 42, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(student.id)}
                  size="small"
                  sx={{
                    color: isDark ? '#38BDF8' : '#0B3D91',
                    marginTop: '-6px',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: isDark ? '#FFFFFF' : '#1E293B',
                      }}
                    >
                      {toUpper(student.personal.studentName)}
                    </Typography>
                    <Box
                      sx={{
                        flexShrink: 0,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(11, 61, 145, 0.08)',
                        color: isDark ? '#38BDF8' : '#0B3D91',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {toUpper(getDeptCode(student.academic.department, student.academic.program))}
                    </Box>
                  </Box>

                  <Typography noWrap sx={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '2px' }}>
                    APP {toUpper(student.personal.applicationNumber)} · REG {toUpper(student.personal.registerNumber || '—')}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <Box
                      sx={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
                        color: '#16A34A',
                      }}
                    >
                      {toUpper(student.academic.admissionCategory)}
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B' }}>
                      Admitted: {formatDateDisplay(student.academic.dateOfAdmission)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ margin: '12px -16px 8px', borderColor: isDark ? '#334155' : '#EEF3FB' }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                {renderActions(student)}
              </Box>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};
