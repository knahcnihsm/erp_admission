import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Menu,
  Tooltip,
  Popover,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
} from '@mui/material';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Pencil,
  MoreVertical,
  FileText,
  Archive,
  Copy,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmission } from '../../context/AdmissionContext';
import { generateStudentPdf } from '../../utils/exportPdf';
import { formatDateDisplay } from '../../utils/dateUtils';
import { getNoAutofillInputProps } from '../../utils/autofillHelper';
import { toUpper } from '../../utils/caseUtils';
import { getDeptCode } from '../../utils/departmentUtils';
import { StudentRecord } from '../../types';
import { useThemeContext } from '../../context/ThemeContext';
import { ArchiveStudentModal } from '../../components/student/ArchiveStudentModal';
import { StudentCards } from '../../components/student/StudentCards';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const {
    students,
    archivedStudents,
    selectedStudentIds,
    setSelectedStudentIds,
    startEditStudent,
    startViewStudent,
    archiveSingleStudent,
    showConfirm,
    showSnackbar,
  } = useAdmission();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePage, setActivePage] = useState<number>(1);

  // Advanced Filter states
  const [appliedFilters, setAppliedFilters] = useState({
    department: 'All',
    admissionType: 'All',
    fromYear: '',
    toYear: '',
    gender: 'All',
    activeStatus: true,
    archivedStatus: false,
    fromDate: '',
    toDate: '',
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const isFilterOpen = Boolean(filterAnchorEl);

  const [archiveModalStudent, setArchiveModalStudent] = useState<StudentRecord | null>(null);

  // More Menu Anchor per row
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<{
    anchorEl: HTMLElement | null;
    student: StudentRecord | null;
  }>({ anchorEl: null, student: null });

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const updateFilter = (field: string, value: any) => {
    setAppliedFilters((prev) => ({ ...prev, [field]: value }));
    setActivePage(1);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      department: 'All',
      admissionType: 'All',
      fromYear: '',
      toYear: '',
      gender: 'All',
      activeStatus: true,
      archivedStatus: false,
      fromDate: '',
      toDate: '',
    };
    setAppliedFilters(defaultFilters);
    setSearchQuery('');
    setActivePage(1);
  };

  const hasActiveFilters = React.useMemo(() => {
    return (
      appliedFilters.department !== 'All' ||
      appliedFilters.admissionType !== 'All' ||
      appliedFilters.fromYear !== '' ||
      appliedFilters.toYear !== '' ||
      appliedFilters.gender !== 'All' ||
      !appliedFilters.activeStatus ||
      appliedFilters.archivedStatus ||
      appliedFilters.fromDate !== '' ||
      appliedFilters.toDate !== '' ||
      searchQuery !== ''
    );
  }, [appliedFilters, searchQuery]);

  // Requirement 15: ESC key clears selected student checkboxes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setSelectedStudentIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setSelectedStudentIds([]); // Clear selection when leaving Dashboard
    };
  }, [setSelectedStudentIds]);

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>, student: StudentRecord) => {
    setMoreMenuAnchor({ anchorEl: event.currentTarget, student });
  };

  const handleMoreClose = () => {
    setMoreMenuAnchor({ anchorEl: null, student: null });
  };

  // Determine students base list based on checked status options
  const baseStudentsList = React.useMemo(() => {
    let list: StudentRecord[] = [];
    if (appliedFilters.activeStatus) {
      list = [...list, ...students];
    }
    if (appliedFilters.archivedStatus) {
      list = [...list, ...archivedStudents];
    }
    const updatedAtMs = (s: StudentRecord): number => (s.updatedAt ? new Date(s.updatedAt).getTime() : 0);
    return [...list].sort((a, b) => updatedAtMs(b) - updatedAtMs(a));
  }, [appliedFilters.activeStatus, appliedFilters.archivedStatus, students, archivedStudents]);

  // Filter students
  const filteredStudents = baseStudentsList.filter((student) => {
    // 1. Search Query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      student.personal.studentName.toLowerCase().includes(q) ||
      student.personal.applicationNumber.toLowerCase().includes(q) ||
      (student.personal.registerNumber || '').toLowerCase().includes(q) ||
      student.academic.department.toLowerCase().includes(q);

    // 2. Department
    const matchesDept =
      appliedFilters.department === 'All' ||
      student.academic.department.toUpperCase() === appliedFilters.department.toUpperCase();

    // 3. Admission Type
    const matchesAdmissionType =
      appliedFilters.admissionType === 'All' ||
      student.academic.admissionCategory.toUpperCase() === appliedFilters.admissionType.toUpperCase();

    // 4. Academic Year
    const admissionYear = student.academic.dateOfAdmission ? parseInt(student.academic.dateOfAdmission.split('-')[0]) : null;
    const batchStartYear = student.academic.batch ? parseInt(student.academic.batch.split('-')[0].trim()) : null;
    const studentYear = admissionYear || batchStartYear;

    const matchesFromYear =
      !appliedFilters.fromYear ||
      (studentYear !== null && studentYear >= parseInt(appliedFilters.fromYear));

    const matchesToYear =
      !appliedFilters.toYear ||
      (studentYear !== null && studentYear <= parseInt(appliedFilters.toYear));

    // 5. Gender
    let matchesGender = true;
    if (appliedFilters.gender !== 'All') {
      const gender = student.personal.gender;
      if (appliedFilters.gender === 'Other') {
        matchesGender = gender !== 'Male' && gender !== 'Female';
      } else {
        matchesGender = gender.toLowerCase() === appliedFilters.gender.toLowerCase();
      }
    }

    // 6. Date Range
    const studentDate = student.academic.dateOfAdmission; // 'YYYY-MM-DD'
    const matchesFromDate =
      !appliedFilters.fromDate || (studentDate && studentDate >= appliedFilters.fromDate);
    const matchesToDate =
      !appliedFilters.toDate || (studentDate && studentDate <= appliedFilters.toDate);

    return (
      matchesSearch &&
      matchesDept &&
      matchesAdmissionType &&
      matchesFromYear &&
      matchesToYear &&
      matchesGender &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );

  const isAllSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((s) => selectedStudentIds.includes(s.id));

  const isSomeSelected =
    selectedStudentIds.length > 0 && !isAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (isSomeSelected || isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(paginatedStudents.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };


  const thStyle = {
    fontWeight: 700,
    fontSize: '13px',
    color: isDark ? '#CBD5E1' : '#0B3D91',
    verticalAlign: 'middle',
    letterSpacing: '0.05em',
    lineHeight: 1.3,
    padding: '16px 18px',
    whiteSpace: 'nowrap' as const,
    borderBottom: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
  };

  const tdStyle = {
    fontSize: '14px',
    color: isDark ? '#FFFFFF' : '#1E293B',
    verticalAlign: 'middle',
    padding: '14px 18px',
    borderBottom: `1px solid ${isDark ? '#1E293B' : '#EEF3FB'}`,
  };

  return (
    <Box sx={{ padding: '0px' }}>
      {/* Search Bar & Filter Dropdown Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Search Box */}
        <TextField
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActivePage(1);
          }}
          autoComplete="off"
          inputProps={getNoAutofillInputProps('dash_search')}
          placeholder="Search Student (Name, Reg No, App No)..."
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              height: '48px',
              borderRadius: '10px',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.2)'
                : '0 2px 10px rgba(11, 61, 145, 0.05)',
              fontSize: '15px',
              color: isDark ? '#FFFFFF' : '#1E293B',
              paddingLeft: '12px',
              transition: 'all 200ms ease-in-out',
              '& fieldset': { border: 'none' },
              '&.Mui-focused': {
                boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.2)',
                borderColor: '#1E5EFF',
              },
            },
            '& input': { padding: 0, height: '100%' },
            '& input::placeholder': {
              fontSize: '14px',
              color: isDark ? '#94A3B8' : '#94A3B8',
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ marginRight: '10px' }}>
                <Search size={20} color={isDark ? '#64748B' : '#94A3B8'} />
              </InputAdornment>
            ),
          }}
        />

        {/* Requirement 17: Reset Filters Button (Appears ONLY when >=1 filter is active) */}
        {hasActiveFilters && (
          <Button
            onClick={handleClearFilters}
            variant="outlined"
            color="error"
            sx={{
              height: '48px',
              minWidth: { xs: '48px', sm: 'auto' },
              borderRadius: '10px',
              padding: { xs: 0, sm: '0 16px' },
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              borderColor: isDark ? '#EF4444' : '#DC2626',
              color: isDark ? '#FCA5A5' : '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 180ms ease-in-out',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                borderColor: '#DC2626',
              },
            }}
          >
            <X size={16} />
            <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontWeight: 700, fontSize: '13px', letterSpacing: '0.04em' }}>
              RESET FILTERS
            </Typography>
          </Button>
        )}

        {/* Filter Button */}
        <Button
          onClick={handleFilterClick}
          variant="outlined"
          sx={{
            height: '48px',
            minWidth: { xs: '48px', sm: '200px' },
            borderRadius: '10px',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#38BDF8' : '#0B3D91',
            border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
            boxShadow: isDark
              ? '0 2px 10px rgba(0, 0, 0, 0.2)'
              : '0 2px 10px rgba(11, 61, 145, 0.04)',
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'space-between' },
            alignItems: 'center',
            padding: { xs: 0, sm: '0 18px' },
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            transition: 'all 200ms ease-in-out',
            '&:hover': {
              backgroundColor: isDark ? '#334155' : '#F0F9FF',
              borderColor: '#1E5EFF',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color={isDark ? '#38BDF8' : '#0B3D91'} />
            <Typography
              variant="body1"
              sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}
            >
              FILTER
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <ChevronDown size={18} color={isDark ? '#38BDF8' : '#0B3D91'} />
          </Box>
        </Button>

        {/* Filter Dropdown Menu (Modal Popup) */}
        <Popover
          open={isFilterOpen}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          elevation={0}
          TransitionProps={{ timeout: 200 }}
          PaperProps={{
            sx: {
              borderRadius: '18px',
              width: { xs: 'calc(100vw - 24px)', sm: '400px' },
              padding: '24px',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#1E293B',
              boxShadow: isDark
                ? '0 10px 40px rgba(0, 0, 0, 0.5)'
                : '0 10px 40px rgba(11, 61, 145, 0.12)',
              border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
              marginTop: '8px',
            },
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '20px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              🔍 Filter Students
            </Typography>
            <IconButton onClick={handleFilterClose} size="small" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              <X size={18} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 1. Department */}
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                Department
              </Typography>
              <Select
                value={appliedFilters.department}
                onChange={(e) => updateFilter('department', e.target.value as string)}
                displayEmpty
                size="small"
                sx={{
                  borderRadius: '14px',
                  backgroundColor: isDark ? '#121212' : '#F9FAFB',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#334155' : '#E5E7EB',
                  },
                }}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Computer Science & Engineering (CSE)">CSE</MenuItem>
                <MenuItem value="Information Technology (IT)">IT</MenuItem>
                <MenuItem value="Electronics & Communication Engineering (ECE)">ECE</MenuItem>
                <MenuItem value="Biomedical Engineering (BME)">BME</MenuItem>
                <MenuItem value="Artificial Intelligence & Data Science (AI & DS)">AI & DS</MenuItem>
                <MenuItem value="Artificial Intelligence & Machine Learning (AI & ML)">AI & ML</MenuItem>
                <MenuItem value="MTech CSE">MTech CSE</MenuItem>
                <MenuItem value="M.Tech Wireless Communication">MTech WC</MenuItem>
                <MenuItem value="Master of Business Administration">MBA</MenuItem>
                <MenuItem value="MCA">MCA</MenuItem>
              </Select>
            </FormControl>

            {/* 2. Admission Type */}
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                Admission Type
              </Typography>
              <Select
                value={appliedFilters.admissionType}
                onChange={(e) => updateFilter('admissionType', e.target.value as string)}
                displayEmpty
                size="small"
                sx={{
                  borderRadius: '14px',
                  backgroundColor: isDark ? '#121212' : '#F9FAFB',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? '#334155' : '#E5E7EB',
                  },
                }}
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="CENTAC">CENTAC</MenuItem>
                <MenuItem value="MANAGEMENT">MANAGEMENT</MenuItem>
              </Select>
            </FormControl>

            {/* 3. Academic Year */}
            <Box sx={{ display: 'flex', gap: '16px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  From Year
                </Typography>
                <TextField
                  placeholder="20__"
                  size="small"
                  value={appliedFilters.fromYear}
                  onChange={(e) => updateFilter('fromYear', e.target.value)}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#121212' : '#F9FAFB',
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  To Year
                </Typography>
                <TextField
                  placeholder="20__"
                  size="small"
                  value={appliedFilters.toYear}
                  onChange={(e) => updateFilter('toYear', e.target.value)}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#121212' : '#F9FAFB',
                    }
                  }}
                />
              </Box>
            </Box>

            {/* 4. Gender */}
            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: '2px', color: isDark ? '#CBD5E1' : '#475569' }}>
                Gender
              </Typography>
              <RadioGroup
                row
                value={appliedFilters.gender}
                onChange={(e) => updateFilter('gender', e.target.value)}
              >
                <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
                <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
              </RadioGroup>
            </FormControl>

            {/* 5. Student Status */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: '2px', color: isDark ? '#CBD5E1' : '#475569' }}>
                Student Status
              </Typography>
              <Box sx={{ display: 'flex', gap: '16px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={appliedFilters.activeStatus}
                      onChange={(e) => updateFilter('activeStatus', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Active"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={appliedFilters.archivedStatus}
                      onChange={(e) => updateFilter('archivedStatus', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Archived"
                />
              </Box>
            </Box>

            {/* 6. Admission Date */}
            <Box sx={{ display: 'flex', gap: '16px' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  From Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={appliedFilters.fromDate}
                  onChange={(e) => updateFilter('fromDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#121212' : '#F9FAFB',
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  To Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={appliedFilters.toDate}
                  onChange={(e) => updateFilter('toDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#121212' : '#F9FAFB',
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: '8px' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleClearFilters}
                sx={{
                  height: '42px',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: isDark ? '#38BDF8' : '#0B4DBA',
                  borderColor: isDark ? '#334155' : '#D6E4F0',
                  '&:hover': {
                    borderColor: '#0B4DBA',
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(11, 77, 186, 0.05)',
                  }
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </Popover>
      </Box>

      {/* Main Student Admission List Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
          boxShadow: isDark
            ? '0 6px 24px rgba(0, 0, 0, 0.3)'
            : '0 4px 24px rgba(15, 23, 42, 0.07)',
          padding: '28px 28px 24px',
        }}
      >
        {/* Card Header Title Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: '20px',
              color: isDark ? '#FFFFFF' : '#1E293B',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            STUDENT ADMISSION LIST
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontSize: '13px',
              color: isDark ? '#94A3B8' : '#64748B',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            SHOWING {filteredStudents.length} RECORDS
          </Typography>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, marginBottom: '16px' }}>
          <StudentCards
            students={paginatedStudents}
            selectedIds={selectedStudentIds}
            onToggleSelect={handleSelectOne}
            renderActions={(student) => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Tooltip title="View Student Profile">
                  <IconButton
                    size="small"
                    onClick={() => startViewStudent(student)}
                    sx={{
                      color: '#1E5EFF',
                      width: 32,
                      height: 32,
                      transition: 'all 180ms ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(30, 94, 255, 0.1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Eye size={18} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Edit Student Details">
                  <IconButton
                    size="small"
                    onClick={() => {
                      startEditStudent(student);
                      navigate('/EditStudent');
                    }}
                    sx={{
                      color: '#1E5EFF',
                      width: 32,
                      height: 32,
                      transition: 'all 180ms ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(30, 94, 255, 0.1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Pencil size={18} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="More Actions">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMoreClick(e, student)}
                    sx={{
                      color: '#1E5EFF',
                      width: 32,
                      height: 32,
                      transition: 'all 180ms ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(30, 94, 255, 0.1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          />
        </Box>

        {/* Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', border: `1px solid ${isDark ? '#334155' : '#E2EBF6'}`, borderRadius: '10px' }}>
          <Table sx={{ minWidth: '900px', tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: isDark ? '#0F172A' : '#EEF3FB',
                  height: '58px',
                }}
              >
                <TableCell padding="checkbox" sx={{ paddingLeft: '18px', verticalAlign: 'middle', width: '52px' }}>
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleHeaderCheckboxChange}
                    sx={{
                      color: isDark ? '#38BDF8' : '#0B3D91',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  />
                </TableCell>
                <TableCell sx={thStyle}>ADMISSION<br />NO.</TableCell>
                <TableCell sx={thStyle}>STUDENT NAME</TableCell>
                <TableCell sx={thStyle}>REGISTER<br />NUMBER</TableCell>
                <TableCell sx={thStyle}>DEPARTMENT</TableCell>
                <TableCell sx={thStyle}>ADMISSION<br />TYPE</TableCell>
                <TableCell sx={thStyle}>DATE OF<br />ADMISSION</TableCell>
                <TableCell align="center" sx={thStyle}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedStudents.length === 0 ? (
                <TableRow sx={{ height: '120px' }}>
                  <TableCell colSpan={8} align="center" sx={{ verticalAlign: 'middle' }}>
                    <Typography variant="body1" sx={{ fontSize: '15px', fontWeight: 500, color: isDark ? '#CBD5E1' : '#64748B' }}>
                      No students found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const isEven = idx % 2 === 0;
                  const rowBg = isSelected
                    ? isDark ? 'rgba(56, 189, 248, 0.22)' : '#E8F2FF'
                    : isDark
                      ? isEven ? '#1E293B' : '#182232'
                      : isEven ? '#FFFFFF' : '#FAFCFF';

                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.035, ease: 'easeOut' }}
                      whileHover={{ backgroundColor: isDark ? '#334155' : '#EEF5FF' }}
                      style={{
                        height: '64px',
                        backgroundColor: rowBg,
                        transition: 'background-color 150ms ease-in-out',
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ paddingLeft: '18px', verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(student.id)}
                          sx={{
                            color: isDark ? '#38BDF8' : '#0B3D91',
                            '& .MuiSvgIcon-root': { fontSize: 20 },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 600, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                        {toUpper(student.personal.applicationNumber)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 700, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                        {toUpper(student.personal.studentName)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 600, color: isDark ? '#38BDF8' : '#0B3D91' }}>
                        {toUpper(student.personal.registerNumber)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B' }}>
                        {toUpper(getDeptCode(student.academic.department, student.academic.program))}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 500, color: isDark ? '#CBD5E1' : '#374151' }}>
                        {toUpper(student.academic.admissionCategory)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 400, color: isDark ? '#94A3B8' : '#64748B' }}>
                        {formatDateDisplay(student.academic.dateOfAdmission)}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'middle', padding: '14px 12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                          <Tooltip title="View Student Profile">
                            <IconButton
                              size="small"
                              onClick={() => {
                                startViewStudent(student);
                              }}
                              sx={{
                                color: '#1E5EFF',
                                width: 32,
                                height: 32,
                                transition: 'all 180ms ease-in-out',
                                '&:hover': {
                                  backgroundColor: 'rgba(30, 94, 255, 0.1)',
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Student Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                startEditStudent(student);
                                navigate('/EditStudent');
                              }}
                              sx={{
                                color: '#1E5EFF',
                                width: 32,
                                height: 32,
                                transition: 'all 180ms ease-in-out',
                                '&:hover': {
                                  backgroundColor: 'rgba(30, 94, 255, 0.1)',
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              <Pencil size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMoreClick(e, student)}
                              sx={{
                                color: '#1E5EFF',
                                width: 32,
                                height: 32,
                                transition: 'all 180ms ease-in-out',
                                '&:hover': {
                                  backgroundColor: 'rgba(30, 94, 255, 0.1)',
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              <MoreVertical size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginTop: '28px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            disabled={activePage === 1}
            onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
            sx={{
              height: '38px',
              padding: '0 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.04em',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#D6E4F0',
              color: isDark ? '#FFFFFF' : '#374151',
              transition: 'all 180ms ease-in-out',
              '&:hover': {
                backgroundColor: isDark ? '#334155' : '#F0F9FF',
                borderColor: '#1E5EFF',
              },
              '&:disabled': {
                color: isDark ? '#475569' : '#CBD5E1',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            }}
          >
            PREVIOUS
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNo) => {
            const isActive = activePage === pageNo;
            return (
              <Button
                key={pageNo}
                variant={isActive ? 'contained' : 'outlined'}
                onClick={() => setActivePage(pageNo)}
                sx={{
                  minWidth: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: 0,
                  backgroundColor: isActive
                    ? '#0B3D91'
                    : isDark
                      ? '#1E293B'
                      : '#FFFFFF',
                  borderColor: isActive ? '#0B3D91' : isDark ? '#334155' : '#D6E4F0',
                  color: isActive ? '#FFFFFF' : isDark ? '#FFFFFF' : '#374151',
                  boxShadow: isActive ? '0 2px 8px rgba(11, 61, 145, 0.3)' : 'none',
                  transition: 'all 180ms ease-in-out',
                  '&:hover': {
                    backgroundColor: isActive ? '#082F49' : isDark ? '#334155' : '#F0F9FF',
                    borderColor: '#0B3D91',
                  },
                }}
              >
                {pageNo}
              </Button>
            );
          })}

          <Button
            variant="outlined"
            disabled={activePage === totalPages}
            onClick={() => setActivePage((prev) => Math.min(totalPages, prev + 1))}
            sx={{
              height: '38px',
              padding: '0 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.04em',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#D6E4F0',
              color: isDark ? '#FFFFFF' : '#374151',
              transition: 'all 180ms ease-in-out',
              '&:hover': {
                backgroundColor: isDark ? '#334155' : '#F0F9FF',
                borderColor: '#1E5EFF',
              },
              '&:disabled': {
                color: isDark ? '#475569' : '#CBD5E1',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            }}
          >
            NEXT
          </Button>
        </Box>
      </Card>

      {/* More Actions Dropdown Menu */}
      <Menu
        anchorEl={moreMenuAnchor.anchorEl}
        open={Boolean(moreMenuAnchor.anchorEl)}
        onClose={handleMoreClose}
        PaperProps={{
          sx: {
            borderRadius: '10px',
            minWidth: '200px',
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#1E293B',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (moreMenuAnchor.student) generateStudentPdf(moreMenuAnchor.student);
            handleMoreClose();
          }}
          sx={{ gap: '10px', fontSize: '14px', fontWeight: 600 }}
        >
          <FileText size={16} color="#16A34A" /> Download PDF Summary
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (moreMenuAnchor.student) {
              navigator.clipboard.writeText(moreMenuAnchor.student.personal.registerNumber || '');
              showSnackbar('Register number copied to clipboard!');
            }
            handleMoreClose();
          }}
          sx={{ gap: '10px', fontSize: '14px', fontWeight: 600 }}
        >
          <Copy size={16} color="#0B3D91" /> Copy Register No
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (moreMenuAnchor.student) {
              setArchiveModalStudent(moreMenuAnchor.student);
            }
            handleMoreClose();
          }}
          sx={{ gap: '10px', fontSize: '14px', fontWeight: 600, color: '#DC2626' }}
        >
          <Archive size={16} /> Archive Student
        </MenuItem>
      </Menu>

      {/* Archive Student Confirmation Modal */}
      <ArchiveStudentModal
        open={Boolean(archiveModalStudent)}
        student={archiveModalStudent}
        onClose={() => setArchiveModalStudent(null)}
        onConfirmArchive={async (reason, description) => {
          if (archiveModalStudent) {
            await archiveSingleStudent(archiveModalStudent.id, reason, description);
          }
        }}
      />
    </Box>
  );
};
