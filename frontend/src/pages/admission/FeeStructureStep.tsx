import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { useAdmission } from '../../context/AdmissionContext';
import { useThemeContext } from '../../context/ThemeContext';
import { AppCard } from '../../components/ui/AppCard';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { BUS_ROUTES_WITH_STOPS } from '../../utils/constants';
import { calculateFeeDetails } from '../../utils/feeCalculator';
import { handleFormEnterKeyDown } from '../../utils/enterKeyNavigation';

const getFieldSx = (isDark: boolean) => ({
  '& .MuiInputLabel-root': {
    fontSize: '14.5px',
    fontWeight: 600,
    color: isDark ? '#CBD5E1' : '#344054',
    transform: 'translate(14px, 14px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    color: isDark ? '#F8FAFC' : '#0D47A1',
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
});

export const FeeStructureStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { draftStudent, updateDraftSection, isViewReadOnly, masterData } = useAdmission();

  const category = draftStudent.academic?.admissionCategory;
  const program = draftStudent.academic?.program;
  const department = draftStudent.academic?.department;
  const initialCutoff = draftStudent.fee?.cutOffMark;
  const hscCutoff = draftStudent.hscMarks?.engineeringCutOff;

  const effectiveCutoff =
    program === 'First Year B.Tech' && hscCutoff !== undefined && hscCutoff > 0
      ? hscCutoff
      : initialCutoff;

  const [busTransport, setBusTransport] = useState<boolean>(
    draftStudent.fee?.busTransportRequired || false
  );
  const [busRoute, setBusRoute] = useState<string>(
    draftStudent.fee?.busRouteSelected || ''
  );
  const [busStop, setBusStop] = useState<string>(
    draftStudent.fee?.busStopSelected || ''
  );
  const [hostel, setHostel] = useState<boolean>(
    draftStudent.fee?.hostelRequired || false
  );

  const feeDetails = calculateFeeDetails(
    {
      category,
      program,
      department,
      cutOffMark: effectiveCutoff,
      busTransportRequired: busTransport,
      busRouteSelected: busTransport ? busRoute : '',
      busStopSelected: busTransport ? busStop : '',
      hostelRequired: hostel,
    },
    {
      feeStructures: masterData.feeStructures,
      scholarshipStructures: masterData.scholarshipStructures,
      busRoutes: masterData.busRoutes,
      hostels: masterData.hostels,
    }
  );

  const masterRoutes = masterData.busRoutes;
  const routeNames =
    masterRoutes && masterRoutes.length > 0
      ? masterRoutes.map((r) => r.name)
      : Object.keys(BUS_ROUTES_WITH_STOPS);

  const availableStops = busRoute
    ? masterRoutes?.find((r) => r.name === busRoute)?.stops ??
      (BUS_ROUTES_WITH_STOPS[busRoute] || []).map((s) => ({
        id: 0,
        name: s.stopName,
        fee: s.fee,
      })) ??
      []
    : [];

  useEffect(() => {
    updateDraftSection('fee', feeDetails);
  }, [busTransport, busRoute, busStop, hostel, category, program, department, effectiveCutoff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateDraftSection('fee', feeDetails);
    onNext();
  };

  const formatINR = (value: number | undefined): string =>
    (value ?? 0).toLocaleString('en-IN');

  const fieldSx = getFieldSx(isDark);

  return (
    <Box
      component="form"
      id="wizard-step-form"
      autoComplete="off"
      onKeyDown={(e) => handleFormEnterKeyDown(e, onNext)}
      onSubmit={handleSubmit}
    >
      {/* Hidden dummy inputs to trap Chrome profile autofill */}
      <input type="text" name="prevent_autofill_user" id="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pass" id="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <AppCard>
        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0D47A1', marginBottom: '4px', fontSize: '22px' }}>
          Fee Structure & Optional Facilities
        </Typography>
        <Typography sx={{ color: isDark ? '#CBD5E1' : '#667085', marginBottom: '24px', fontSize: '14px' }}>
          Assign the student's tuition fee and select optional hostel/bus transport routes.
        </Typography>

        <Grid container columnSpacing={3} rowSpacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={program === 'First Year B.Tech' ? 'Cut-Off Mark (out of 300)' : 'Cut-Off Percentage (%)'}
              fullWidth
              sx={fieldSx}
              disabled
              value={feeDetails.cutOffMark !== undefined ? feeDetails.cutOffMark : 0}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Merit Score (%)"
              fullWidth
              sx={fieldSx}
              disabled
              value={feeDetails.meritPercent !== undefined ? `${feeDetails.meritPercent}%` : '—'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Original Tuition Fee Per Year"
              fullWidth
              sx={fieldSx}
              disabled
              value={`₹ ${formatINR(feeDetails.originalTuitionFee)}`}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Scholarship Amount Per Year"
              fullWidth
              sx={fieldSx}
              disabled
              value={`₹ ${formatINR(feeDetails.scholarshipAmount)}`}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Final Tuition Fee Per Year"
              fullWidth
              sx={fieldSx}
              disabled
              value={`₹ ${formatINR(feeDetails.tuitionFeePerYear)}`}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '15px' } }}>₹</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Course Duration (Years)"
              fullWidth
              sx={fieldSx}
              disabled
              value={program ? `${feeDetails.courseDurationYears} Years (${program})` : '0 Years'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Total Tuition Fee"
              fullWidth
              sx={fieldSx}
              disabled
              value={`₹ ${formatINR(feeDetails.totalTuitionFee)}`}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '15px' } }}>₹</InputAdornment>,
              }}
            />
          </Grid>

          {/* Bus Transport Enable Toggle */}
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                border: `1px solid ${isDark ? '#334155' : '#D8E4F2'}`,
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderRadius: '12px',
                padding: '4px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '50px',
              }}
            >
              <Typography sx={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '14.5px' }}>
                Bus Transport
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={busTransport}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setBusTransport(enabled);
                      if (!enabled) {
                        setBusRoute('');
                        setBusStop('');
                      }
                    }}
                    disabled={isViewReadOnly}
                    color="primary"
                    size="small"
                  />
                }
                label={busTransport ? 'ON' : 'OFF (Default)'}
                sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '13px', fontWeight: 600, color: isDark ? '#38BDF8' : 'inherit' } }}
              />
            </Box>
          </Grid>

          {/* Hostel Accommodation Enable Toggle */}
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                border: `1px solid ${isDark ? '#334155' : '#D8E4F2'}`,
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderRadius: '12px',
                padding: '4px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '50px',
              }}
            >
              <Typography sx={{ fontWeight: 600, color: isDark ? '#FFFFFF' : '#1A2B49', fontSize: '14.5px' }}>
                Hostel Accommodation
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={hostel}
                    onChange={(e) => setHostel(e.target.checked)}
                    disabled={isViewReadOnly}
                    color="primary"
                    size="small"
                  />
                }
                label={hostel ? `Required (₹${formatINR(masterData.hostels?.[0]?.fee ?? 72000)}/yr)` : 'Not Required'}
                sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: '13px', fontWeight: 600, color: isDark ? '#38BDF8' : 'inherit' } }}
              />
            </Box>
          </Grid>

          {/* Dynamic Bus Route Dropdown */}
          {busTransport && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Bus Route *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly}
                  value={busRoute}
                  onChange={(e) => {
                    setBusRoute(e.target.value);
                    setBusStop(''); // Reset bus stop on route change
                  }}
                >
                  {routeNames.map((route) => (
                    <MenuItem key={route} value={route}>
                      {route}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Dynamic Bus Stop Dropdown */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Bus Stop *"
                  fullWidth
                  sx={fieldSx}
                  disabled={isViewReadOnly || !busRoute}
                  value={busStop}
                  onChange={(e) => setBusStop(e.target.value)}
                >
                  {availableStops.map((stop) => (
                    <MenuItem key={stop.id} value={stop.name}>
                      {stop.name} (₹{stop.fee?.toLocaleString('en-IN') ?? 0})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}
        </Grid>

        <SummaryCard
          title="Grand Total Fee Summary"
          items={[
            { label: 'Merit Score', value: feeDetails.meritPercent !== undefined ? `${feeDetails.meritPercent}%` : '—' },
            { label: 'Original Tuition Fee (Per Year)', value: `₹ ${formatINR(feeDetails.originalTuitionFee)}` },
            { label: 'Scholarship (Per Year)', value: `− ₹ ${formatINR(feeDetails.scholarshipAmount)}` },
            { label: 'Final Tuition Fee', value: `₹ ${formatINR(feeDetails.totalTuitionFee)}` },
            { label: 'Bus Route Fee', value: `₹ ${formatINR(feeDetails.busFee)}` },
            { label: 'Hostel Accommodation Fee', value: `₹ ${formatINR(feeDetails.hostelFee)}` },
            { label: 'GRAND TOTAL FEE', value: `₹ ${formatINR(feeDetails.grandTotalFee)}`, isHighlight: true },
          ]}
        />
      </AppCard>
    </Box>
  );
};
