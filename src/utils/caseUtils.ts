export const toUpper = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '';
  return String(value).toUpperCase();
};

/** Returns a human-readable display string in Title Case (first letter upper, rest lower). */
export const toTitleCase = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '';
  const s = String(value);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};
