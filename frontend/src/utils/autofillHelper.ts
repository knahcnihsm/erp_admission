import React from 'react';

/**
 * Returns inputProps and props that prevent Chrome / Edge / Firefox from triggering
 * profile autofill, address suggestions, and saved form popups.
 */
export const getNoAutofillInputProps = (fieldName: string) => ({
  autoComplete: 'one-time-code',
  name: `no_autofill_${fieldName}`,
  readOnly: true,
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.removeAttribute('readonly');
  },
});
