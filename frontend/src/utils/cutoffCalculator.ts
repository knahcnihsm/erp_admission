import { HSCSubjectMark } from '../types';

/**
 * New Cut-Off Formula (out of 300):
 * Cut-Off = Maths (100) + Physics (100) + 3rd Subject (100)
 * Where 3rd Subject = Biology / Computer Science / Bio Technology / Chemistry
 */
export const calculateHSCCutOff = (marks: HSCSubjectMark[], stream: 'Academic' | 'Vocational'): number => {
  if (!marks || marks.length === 0) return 0;

  const getPercentage = (mark: HSCSubjectMark): number => {
    if (!mark || !mark.maxMarks || mark.maxMarks <= 0) return 0;
    return Number(((mark.marksObtained / mark.maxMarks) * 100).toFixed(2));
  };

  if (stream === 'Academic') {
    // Formula: Maths (100) + Physics (100) + 3rd Subject (100) = 300
    const maths = marks.find((m) => m.subject.toLowerCase().includes('maths'));
    const physics = marks.find((m) => m.subject.toLowerCase().includes('physics'));
    // 3rd subject: best of Biology, Computer Science, Bio Technology, or Chemistry (matches backend CutoffCalculator)
    const scienceSubjects = marks.filter((m) => {
      const subj = m.subject.toLowerCase();
      return (
        subj.includes('biology') ||
        subj.includes('computer') ||
        subj.includes('bio technology') ||
        subj.includes('biotechnology') ||
        subj.includes('chemistry')
      );
    });
    const thirdSubject = scienceSubjects.reduce((best, current) =>
      !best || getPercentage(current) > getPercentage(best) ? current : best,
      undefined as HSCSubjectMark | undefined
    );

    const mathsPct = maths ? getPercentage(maths) : 0;
    const physicsPct = physics ? getPercentage(physics) : 0;
    const thirdPct = thirdSubject ? getPercentage(thirdSubject) : 0;

    const cutoff = mathsPct + physicsPct + thirdPct;
    return Number(cutoff.toFixed(2));
  } else {
    // Vocational Formula: Vocational Subject Theory (100) + Related I (100) + Related II (Theory) (100) = 300
    // Practical sub-rows under Related Subject II (Practical I / Practical II) are NOT part of the cut-off.
    const isPractical = (m: HSCSubjectMark): boolean => /practical/i.test(m.subject);
    const vocational = marks.find((m) => /^vocational/i.test(m.subject.trim()) && !isPractical(m));
    const related1 = marks.find((m) => {
      const s = m.subject.trim().toLowerCase();
      return !isPractical(m) && (s === 'related subject i' || s === 'related subject i theory');
    });
    const related2 = marks.find((m) => {
      const s = m.subject.trim().toLowerCase();
      return !isPractical(m) && (s === 'related subject ii' || s === 'related subject ii theory');
    });

    const vocPct = vocational ? getPercentage(vocational) : 0;
    const r1Pct = related1 ? getPercentage(related1) : 0;
    const r2Pct = related2 ? getPercentage(related2) : 0;

    const cutoff = vocPct + r1Pct + r2Pct;
    return Number(cutoff.toFixed(2));
  }
};
