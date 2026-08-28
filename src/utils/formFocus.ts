/**
 * Shared helpers for the admission wizard forms.
 *
 * - isRequiredField / isFieldFilled: used by the Enter-key handler to decide
 *   whether all required fields are complete.
 * - focusFirstFormError: focuses the first invalid / first empty required
 *   field after a failed submit so the cursor lands where the user must type.
 */

export const isFieldFilled = (el: HTMLElement): boolean => {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') return true;
    return el.value.trim() !== '';
  }
  if (el.tagName === 'TEXTAREA') {
    return (el as HTMLTextAreaElement).value.trim() !== '';
  }
  if (el.classList.contains('MuiSelect-select')) {
    const hidden = el.closest('.MuiInputBase-root')?.querySelector<HTMLInputElement>(
      'input[aria-hidden="true"], input[type="hidden"], input.MuiSelect-nativeInput'
    );
    return hidden
      ? hidden.value.trim() !== ''
      : (el.textContent || '').trim() !== '';
  }
  if (el.getAttribute('role') === 'combobox') {
    const input = el.querySelector<HTMLInputElement>('input');
    return input
      ? input.value.trim() !== ''
      : (el.textContent || '').trim() !== '';
  }
  return true;
};

export const isRequiredField = (el: HTMLElement): boolean => {
  const formControl = el.closest('.MuiFormControl-root');
  const label = formControl?.querySelector('.MuiInputLabel-root');
  return !!label && (label.textContent || '').includes('*');
};

const isFocusable = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;

  if ((el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  return true;
};

/**
 * Focuses the first field that currently shows an error, falling back to the
 * first empty required field. Runs after the error state has been painted.
 */
export const focusFirstFormError = () => {
  requestAnimationFrame(() => {
    const form = document.getElementById('wizard-step-form') as HTMLElement | null;
    if (!form) return;

    const errorField = form.querySelector<HTMLElement>(
      '.Mui-error input:not([aria-hidden="true"]):not([type="hidden"]), ' +
        '.Mui-error textarea, ' +
        '.Mui-error [role="combobox"]'
    );
    if (errorField) {
      errorField.focus({ preventScroll: true });
      errorField.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const focusable = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, [role="combobox"], .MuiSelect-select'
      )
    ).filter(isFocusable);

    const firstEmpty = focusable.find((el) => isRequiredField(el) && !isFieldFilled(el));
    if (firstEmpty) {
      firstEmpty.focus({ preventScroll: true });
      firstEmpty.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
};
