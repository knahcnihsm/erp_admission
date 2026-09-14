import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
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
  TablePagination,
  Chip,
  Tooltip,
  Popover,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
} from '@mui/material';
import { Search, RotateCcw, Eye, Archive, Filter, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmission } from '../../context/AdmissionContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { toUpper } from '../../utils/caseUtils';
import { ARCHIVE_REASONS } from '../../utils/constants';
import { useThemeContext } from '../../context/ThemeContext';
import { StudentCards } from '../../components/student/StudentCards';

export const ArchivedStudents: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const {
    archivedStudents,
    restoreStudents,
    startViewStudent,
    showConfirm,
  } = useAdmission();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Advanced Filter states
  const [appliedFilters, setAppliedFilters] = useState({
    department: 'All',
    admissionType: 'All',
    fromYear: '',
    toYear: '',
    gender: 'All',
    archiveReason: 'All',
    fromDate: '',
    toDate: '',
  });

  const [tempFilters, setTempFilters] = useState({ ...appliedFilters });
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const isFilterOpen = Boolean(filterAnchorEl);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setTempFilters({ ...appliedFilters });
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setPage(0);
    handleFilterClose();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      department: 'All',
      admissionType: 'All',
      fromYear: '',
      toYear: '',
      gender: 'All',
      archiveReason: 'All',
      fromDate: '',
      toDate: '',
    };
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(0);
    handleFilterClose();
  };

  const filteredArchived = archivedStudents.filter((student) => {
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
      const gender = student.personal.gender.toUpperCase();
      if (appliedFilters.gender === 'Other') {
        matchesGender = gender !== 'MALE' && gender !== 'FEMALE';
      } else {
        matchesGender = gender === appliedFilters.gender.toUpperCase();
      }
    }

    // 6. Archive Reason
    const matchesReason =
      appliedFilters.archiveReason === 'All' ||
      (student.archiveReason || '').toUpperCase() === appliedFilters.archiveReason.toUpperCase();

    // 7. Date Range
    const studentDate = student.academic.dateOfAdmission;
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
      matchesReason &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const paginatedArchived = filteredArchived.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedArchived.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleRestore = (studentId: string, studentName: string) => {
    showConfirm(
      'Restore Student',
      `Restore student ${studentName} back to the active admission list?`,
      () => restoreStudents([studentId]),
      'Restore'
    );
  };

  const handleBulkRestore = () => {
    showConfirm(
      'Restore Selected Students',
      `Restore ${selectedIds.length} selected archived student(s) to active status?`,
      () => {
        restoreStudents(selectedIds);
        setSelectedIds([]);
      },
      'Restore All'
    );
  };

  // Styles matching dashboard
  const thStyle = {
    fontWeight: 700,
    color: isDark ? '#38BDF8' : '#0D47A1',
    letterSpacing: '0.04em',
    fontSize: '11.5px',
    padding: '12px 14px',
    verticalAlign: 'middle',
  };

  const tdStyle = {
    fontSize: '13px',
    padding: '12px 14px',
    color: isDark ? '#CBD5E1' : '#475569',
    verticalAlign: 'middle',
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0D47A1', fontSize: '1.75rem' }}>
          Archived Student Details
        </Typography>
        <Typography variant="body1" sx={{ color: isDark ? '#8B949E' : '#667085', fontSize: '0.95rem' }}>
          View and restore students who have been archived (soft-deleted) from the active portal.
        </Typography>
      </Box>

      {/* Main Card Container */}
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
        {/* Toolbar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
            Archived Student Records ({filteredArchived.length})
          </Typography>

          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<RotateCcw size={18} />}
              onClick={handleBulkRestore}
              sx={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Restore Selected ({selectedIds.length})
            </Button>
          )}
        </Box>

        {/* Search & Filter Bar matching Dashboard */}
        <Box
          sx={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            fullWidth
            placeholder="Search archived students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flexGrow: 1,
              maxWidth: { xs: '100%', sm: '420px' },
              '& .MuiOutlinedInput-root': {
                height: '48px',
                borderRadius: '10px',
                backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
                paddingLeft: '16px',
                transition: 'all 200ms ease-in-out',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  borderColor: '#1E5EFF',
                },
                '&.Mui-focused': {
                  borderColor: '#1E5EFF',
                  boxShadow: '0 0 0 3px rgba(30, 94, 255, 0.15)',
                },
              },
              '& input': { padding: 0, height: '100%' },
              '& input::placeholder': {
                fontSize: '14px',
                color: isDark ? '#8B949E' : '#94A3B8',
                opacity: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ marginRight: '10px' }}>
                  <Search size={20} color={isDark ? '#8B949E' : '#94A3B8'} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filter Button */}
          <Button
            onClick={handleFilterClick}
            variant="outlined"
            sx={{
              height: '48px',
              minWidth: { xs: '48px', sm: '200px' },
              borderRadius: '10px',
              backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
              color: isDark ? '#38BDF8' : '#0B3D91',
              border: `1px solid ${isDark ? '#334155' : '#D6E4F0'}`,
              display: 'flex',
              justifyContent: { xs: 'center', sm: 'space-between' },
              alignItems: 'center',
              padding: { xs: 0, sm: '0 18px' },
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 200ms ease-in-out',
              '&:hover': {
                backgroundColor: isDark ? '#21262D' : '#F0F9FF',
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

          {/* Popover Filter Controls */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '20px' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: isDark ? '#FFFFFF' : '#1E293B' }}>
                🔍 Filter Students
              </Typography>
              <IconButton onClick={handleFilterClose} size="small" sx={{ color: isDark ? '#8B949E' : '#64748B' }}>
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
                  value={tempFilters.department}
                  onChange={(e) => setTempFilters({ ...tempFilters, department: e.target.value as string })}
                  displayEmpty
                  size="small"
                  sx={{
                    borderRadius: '14px',
                    backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
                  }}
                >
                  <MenuItem value="All">All Departments</MenuItem>
                  <MenuItem value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE)</MenuItem>
                  <MenuItem value="Artificial Intelligence & Data Science (AI & DS)">Artificial Intelligence & Data Science (AI & DS)</MenuItem>
                  <MenuItem value="Artificial Intelligence & Machine Learning (AI & ML)">Artificial Intelligence & Machine Learning (AI & ML)</MenuItem>
                  <MenuItem value="Electronics & Communication Engineering (ECE)">Electronics & Communication Engineering (ECE)</MenuItem>
                  <MenuItem value="Information Technology (IT)">Information Technology (IT)</MenuItem>
                  <MenuItem value="Biomedical Engineering (BME)">Biomedical Engineering (BME)</MenuItem>
                </Select>
              </FormControl>

              {/* 2. Admission Type */}
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  Admission Type
                </Typography>
                <Select
                  value={tempFilters.admissionType}
                  onChange={(e) => setTempFilters({ ...tempFilters, admissionType: e.target.value as string })}
                  displayEmpty
                  size="small"
                  sx={{
                    borderRadius: '14px',
                    backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
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
                    value={tempFilters.fromYear}
                    onChange={(e) => setTempFilters({ ...tempFilters, fromYear: e.target.value })}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
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
                    value={tempFilters.toYear}
                    onChange={(e) => setTempFilters({ ...tempFilters, toYear: e.target.value })}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
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
                  value={tempFilters.gender}
                  onChange={(e) => setTempFilters({ ...tempFilters, gender: e.target.value })}
                >
                  <FormControlLabel value="All" control={<Radio size="small" />} label="All" />
                  <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                  <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
                </RadioGroup>
              </FormControl>

              {/* 5. Archive Reason (Additional option requested) */}
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                  Archive Reason
                </Typography>
                <Select
                  value={tempFilters.archiveReason}
                  onChange={(e) => setTempFilters({ ...tempFilters, archiveReason: e.target.value as string })}
                  displayEmpty
                  size="small"
                  sx={{
                    borderRadius: '14px',
                    backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
                  }}
                >
                  <MenuItem value="All">All Reasons</MenuItem>
                  {ARCHIVE_REASONS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 6. Admission Date Range */}
              <Box sx={{ display: 'flex', gap: '16px' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: '6px', color: isDark ? '#CBD5E1' : '#475569' }}>
                    From Date
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={tempFilters.fromDate}
                    onChange={(e) => setTempFilters({ ...tempFilters, fromDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
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
                    value={tempFilters.toDate}
                    onChange={(e) => setTempFilters({ ...tempFilters, toDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: isDark ? '#0D1117' : '#F9FAFB',
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '12px', gap: '16px' }}>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{
                    flex: 1,
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
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '14px',
                    fontWeight: 600,
                    fontSize: '13px',
                    backgroundColor: isDark ? '#38BDF8' : '#0B4DBA',
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    '&:hover': {
                      backgroundColor: isDark ? '#7DD3FC' : '#093A8C',
                    }
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>
          </Popover>
        </Box>

        {/* Data Grid Table */}
        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, marginBottom: '16px' }}>
          <StudentCards
            students={paginatedArchived}
            selectedIds={selectedIds}
            onToggleSelect={handleSelectOne}
            renderActions={(student) => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Tooltip title="View Profile (Read Only)">
                  <IconButton
                    size="small"
                    onClick={() => startViewStudent(student)}
                    sx={{
                      color: isDark ? '#38BDF8' : '#0D47A1',
                      width: 32,
                      height: 32,
                      transition: 'all 180ms ease-in-out',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(13, 71, 161, 0.08)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Eye size={18} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Restore Student">
                  <IconButton
                    size="small"
                    onClick={() => handleSingleRestore(student.id, student.personal.studentName)}
                    sx={{
                      color: '#16A34A',
                      width: 32,
                      height: 32,
                      transition: 'all 180ms ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <RotateCcw size={18} />
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
                    indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedArchived.length}
                    checked={paginatedArchived.length > 0 && selectedIds.length === paginatedArchived.length}
                    onChange={handleSelectAll}
                    color="primary"
                  />
                </TableCell>
                <TableCell sx={thStyle}>APPLICATION NO</TableCell>
                <TableCell sx={thStyle}>REGISTER NO</TableCell>
                <TableCell sx={thStyle}>STUDENT NAME</TableCell>
                <TableCell sx={thStyle}>DEPARTMENT</TableCell>
                <TableCell sx={thStyle}>REASON</TableCell>
                <TableCell sx={thStyle}>DELETED BY</TableCell>
                <TableCell sx={thStyle}>DELETED DATE</TableCell>
                <TableCell align="center" sx={thStyle}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedArchived.length === 0 ? (
                <TableRow sx={{ height: '120px' }}>
                  <TableCell colSpan={9} align="center" sx={{ verticalAlign: 'middle' }}>
                    <Archive size={40} color={isDark ? '#8B949E' : '#94A3B8'} style={{ marginBottom: '12px' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A2B49' }}>
                      Archive Empty
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#8B949E' : '#667085' }}>
                      No archived student records found matching the filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedArchived.map((student, idx) => {
                  const isSelected = selectedIds.includes(student.id);
                  const isEven = idx % 2 === 0;
                  const rowBg = isDark
                    ? isEven ? '#1E293B' : '#182232'
                    : isEven ? '#FFFFFF' : '#FAFCFF';

                  return (
                    <TableRow
                      key={student.id}
                      hover
                      selected={isSelected}
                      sx={{
                        height: '64px',
                        backgroundColor: rowBg,
                        transition: 'background-color 150ms ease-in-out',
                        '&:hover': {
                          backgroundColor: isDark ? '#334155' : '#EEF5FF !important',
                        },
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ paddingLeft: '18px', verticalAlign: 'middle' }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(student.id)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 600, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                        {toUpper(student.personal.applicationNumber)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 600, color: isDark ? '#38BDF8' : '#0D47A1' }}>
                        {toUpper(student.personal.registerNumber)}
                      </TableCell>
                      <TableCell sx={{ ...tdStyle, fontWeight: 700, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                        {toUpper(student.personal.studentName)}
                      </TableCell>
                      <TableCell sx={tdStyle}>{toUpper(student.academic.department)}</TableCell>
                      <TableCell sx={tdStyle}>
                        <Chip
                          label={toUpper(student.archiveReason) || 'TC ISSUED'}
                          color="error"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={tdStyle}>Admin User</TableCell>
                      <TableCell sx={tdStyle}>{formatDateDisplay(student.archivedAt)}</TableCell>
                      <TableCell align="center" sx={tdStyle}>
                        <Box sx={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Tooltip title="View Profile (Read Only)">
                            <IconButton
                              size="small"
                              onClick={() => {
                                startViewStudent(student);
                              }}
                              sx={{ color: isDark ? '#38BDF8' : '#0D47A1' }}
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Restore Student">
                            <IconButton
                              size="small"
                              onClick={() => handleSingleRestore(student.id, student.personal.studentName)}
                              sx={{ color: '#16A34A' }}
                            >
                              <RotateCcw size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={filteredArchived.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            color: isDark ? '#CBD5E1' : 'inherit',
          }}
        />
      </Card>
    </Box>
  );
};
