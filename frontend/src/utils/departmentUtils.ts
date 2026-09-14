export const getProgramDisplayName = (programName?: string): string => {
  if (!programName) return '—';
  const p = programName.toUpperCase();
  if (
    p.includes('MASTER OF COMPUTER APPLICATIONS') ||
    p.includes('PG – MASTER OF COMPUTER APPLICATIONS') ||
    p === 'MCA'
  ) {
    return 'MCA';
  }
  if (
    p.includes('M.TECH COMPUTER SCIENCE & ENGINEERING') ||
    p.includes('M.TECH COMPUTER SCIENCE') ||
    p.includes('M.TECH CSE') ||
    p.includes('MTECH CSE')
  ) {
    return 'MTech CSE';
  }
  return programName;
};

export const getDeptCode = (department?: string, program?: string): string => {
  if (!department) return '—';
  const dept = department.toUpperCase();
  const prog = (program || '').toUpperCase();

  if (
    dept.includes('MASTER OF COMPUTER APPLICATIONS') ||
    dept.includes('COMPUTER APPLICATIONS') ||
    dept === 'MCA'
  ) {
    return 'MCA';
  }

  if (
    dept.includes('M.TECH COMPUTER SCIENCE') ||
    dept.includes('MTECH COMPUTER SCIENCE') ||
    dept.includes('M.TECH CSE') ||
    dept.includes('MTECH CSE') ||
    (prog === 'PG' && (dept.includes('COMPUTER SCIENCE') || dept.includes('CSE'))) ||
    (prog.includes('M.TECH') && (dept.includes('COMPUTER SCIENCE') || dept.includes('CSE')))
  ) {
    return 'MTech CSE';
  }

  if (dept.includes('COMPUTER SCIENCE')) return 'CSE';
  if (dept.includes('ELECTRONICS') && dept.includes('COMM')) return 'ECE';
  if (dept.includes('ELECTRICAL')) return 'EEE';
  if (dept.includes('MECHANICAL')) return 'MECH';
  if (dept.includes('INFORMATION TECHNOLOGY')) return 'IT';
  if (dept.includes('CIVIL')) return 'CIVIL';
  if (dept.includes('ARTIFICIAL INTELLIGENCE') && dept.includes('DATA')) return 'AI&DS';
  if (dept.includes('ARTIFICIAL INTELLIGENCE') && dept.includes('ML')) return 'AI&ML';
  if (dept.includes('MBA') || dept.includes('BUSINESS')) return 'MBA';
  if (dept.includes('BIOMEDICAL') || dept.includes('BIO')) return 'BME';
  return department;
};
