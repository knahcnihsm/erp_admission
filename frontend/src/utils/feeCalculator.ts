import { FeeDetails, ProgramType } from '../types';
import { BusRouteDto, FeeStructureDto, HostelDto, ScholarshipStructureDto } from '../api/types';
import { BUS_ROUTES_WITH_STOPS, HOSTEL_FEE_PER_YEAR } from './constants';

export interface FeeCalculationInput {
  category?: string;
  program?: string;
  department?: string;
  cutOffMark?: number;
  busTransportRequired: boolean;
  busRouteSelected: string;
  busStopSelected: string;
  hostelRequired: boolean;
}

export interface FeeMasterData {
  feeStructures?: FeeStructureDto[];
  scholarshipStructures?: ScholarshipStructureDto[];
  busRoutes?: BusRouteDto[];
  hostels?: HostelDto[];
}

export const getCourseDurationYears = (program: ProgramType | undefined): number => {
  if (!program) return 0;
  switch (program) {
    case 'First Year B.Tech':
      return 4;
    case 'Second Year B.Tech (Lateral Entry)':
      return 3;
    case 'PG':
      return 2;
    default:
      return 0;
  }
};

export const CUTOFF_MAX_SCORE = 300;

/** Mirrors the backend: PG/lateral use a percentage, first year uses a /300 score. */
export const meritPercentFromCutoff = (program: string | undefined, cutOffMark?: number): number | undefined => {
  if (cutOffMark === undefined || cutOffMark === null || Number.isNaN(cutOffMark)) {
    return undefined;
  }
  if (program === 'PG' || program === 'Second Year B.Tech (Lateral Entry)') {
    return cutOffMark;
  }
  return Math.round((cutOffMark / CUTOFF_MAX_SCORE) * 10000) / 100;
};

const matchesName = (value?: string, expected?: string): boolean => {
  if (!value || !expected) return false;
  return value.trim().toLowerCase() === expected.trim().toLowerCase();
};

const matchesCombo = (
  row: { program?: string; department?: string; category?: string },
  program?: string,
  department?: string,
  category?: string
): boolean =>
  matchesName(row.program, program) &&
  matchesName(row.department, department) &&
  matchesName(row.category, category);

const findBand = <T>(
  rows: T[],
  merit: number | undefined,
  getMin: (r: T) => number | null | undefined,
  getMax: (r: T) => number | null | undefined
): T | undefined => {
  if (!rows || rows.length === 0) return undefined;
  if (merit === undefined) {
    return rows.find((r) => getMin(r) === null || getMin(r) === undefined || getMin(r) === 0);
  }
  const upper = rows
    .filter((r) => getMax(r) !== null && getMax(r) !== undefined && merit < (getMax(r) as number))
    .sort((a, b) => (getMax(a) as number) - (getMax(b) as number))[0];
  if (upper) return upper;
  const exact = rows
    .filter((r) => getMax(r) !== null && getMax(r) !== undefined && merit === (getMax(r) as number))
    .sort((a, b) => (getMax(b) as number) - (getMax(a) as number))[0];
  if (exact) return exact;
  return rows.find(
    (r) => getMax(r) === null || getMax(r) === undefined
      ? getMin(r) === null || getMin(r) === undefined || merit >= (getMin(r) as number)
      : false
  );
};

/** Original (base) fee per year from the DB fee structures; falls back to the Management quota. */
const lookupBaseFee = (
  rows: FeeStructureDto[] | undefined,
  program: string | undefined,
  department: string | undefined,
  category: string | undefined,
  merit: number | undefined
): number => {
  const matches = (rows || []).filter((r) => matchesCombo(r, program, department, category));
  const flat = matches.find(
    (r) => (r.min === null || r.min === undefined) && (r.max === null || r.max === undefined)
  );
  if (flat && flat.fee !== undefined && flat.fee !== null) return flat.fee;

  const band = findBand(matches, merit, (r) => r.min, (r) => r.max);
  if (band && band.fee !== undefined && band.fee !== null) return band.fee;

  const management = (rows || []).filter((r) =>
    matchesName(r.program, program) && matchesName(r.department, department) && matchesName(r.category, 'Management'));
  const mgmtFlat = management.find(
    (r) => (r.min === null || r.min === undefined) && (r.max === null || r.max === undefined)
  );
  if (mgmtFlat && mgmtFlat.fee !== undefined && mgmtFlat.fee !== null) return mgmtFlat.fee;

  const mgmtBand = findBand(management, merit, (r) => r.min, (r) => r.max);
  return mgmtBand && mgmtBand.fee !== undefined && mgmtBand.fee !== null ? mgmtBand.fee : 0;
};

const lookupScholarship = (
  rows: ScholarshipStructureDto[] | undefined,
  program: string | undefined,
  department: string | undefined,
  category: string | undefined,
  merit: number | undefined
): number => {
  if (merit === undefined) return 0;
  const matches = (rows || []).filter((r) => matchesCombo(r, program, department, category));
  const row = findBand(matches, merit, (r) => r.min, (r) => r.max);
  return row && row.scholarshipAmount !== undefined && row.scholarshipAmount !== null
    ? row.scholarshipAmount
    : 0;
};

const lookupBusFee = (
  master: FeeMasterData,
  busRouteSelected: string,
  busStopSelected: string
): number => {
  if (!busRouteSelected || !busStopSelected) return 0;
  const route = master.busRoutes?.find((r) => r.name === busRouteSelected);
  const stop = route?.stops.find((s) => s.name === busStopSelected);
  if (stop && stop.fee !== undefined && stop.fee !== null) return stop.fee;
  return BUS_ROUTES_WITH_STOPS[busRouteSelected]?.find((s) => s.stopName === busStopSelected)?.fee ?? 0;
};

export const calculateFeeDetails = (
  input: FeeCalculationInput,
  master: FeeMasterData = {}
): FeeDetails => {
  const duration = getCourseDurationYears(input.program as ProgramType);
  const merit = meritPercentFromCutoff(input.program, input.cutOffMark);
  const originalTuitionFee = lookupBaseFee(
    master.feeStructures,
    input.program,
    input.department,
    input.category,
    merit
  );
  const scholarshipAmount = lookupScholarship(
    master.scholarshipStructures,
    input.program,
    input.department,
    input.category,
    merit
  );
  const tuitionPerYear = Math.max(0, originalTuitionFee - scholarshipAmount);
  const totalTuitionFee = tuitionPerYear * duration;

  const busFee =
    input.busTransportRequired && input.busRouteSelected && input.busStopSelected
      ? lookupBusFee(master, input.busRouteSelected, input.busStopSelected)
      : 0;

  const hostelFee = input.hostelRequired
    ? master.hostels?.[0]?.fee ?? HOSTEL_FEE_PER_YEAR
    : 0;

  const grandTotalFee = totalTuitionFee + busFee + hostelFee;

  return {
    cutOffMark: input.cutOffMark || 0,
    meritPercent: merit,
    originalTuitionFee,
    scholarshipAmount,
    tuitionFeePerYear: tuitionPerYear,
    courseDurationYears: duration,
    totalTuitionFee,
    busTransportRequired: input.busTransportRequired,
    busRouteSelected: input.busRouteSelected,
    busStopSelected: input.busStopSelected,
    busFee,
    hostelRequired: input.hostelRequired,
    hostelFee,
    grandTotalFee,
  };
};
