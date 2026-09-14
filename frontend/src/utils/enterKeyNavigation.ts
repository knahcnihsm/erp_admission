import React from 'react';
import { isFieldFilled, isRequiredField } from './formFocus';

/**
 * Global Enter-Key Navigation Handler for ALL Admission Form Steps.
 *
 * Behavior:
 * - Navigates focusable fields in native DOM document order (top-to-bottom, left-to-right as rendered).
 * - Skips disabled, hidden, and zero-size elements.
 * - Skips utility buttons, icon buttons, adornments, and dummy autofill inputs.
 * - If a dropdown/select is expanded (aria-expanded="true"), allows Enter to select the option normally.
 * - While the form is incomplete, Enter moves focus to the next field.
 * - Once every required field is filled, Enter on ANY field validates & submits the step
 *   (advances to the next page) — even if the cursor is not on the last field.
 * - On the final focusable field, always triggers `onFinalSubmit` (runs validation and advances).
 *
 * Usage:
 *   <Box component="form" onKeyDown={(e) => handleFormEnterKeyDown(e, handleSubmit(onSubmit))}>
 */
export const handleFormEnterKeyDown = (
  e: React.KeyboardEvent<HTMLElement>,
  onFinalSubmit?: () => void
) => {
  if (e.key !== 'Enter') return;

  const target = e.target as HTMLElement;

  // 1. Allow default Enter behavior inside multiline textareas
  if (target.tagName === 'TEXTAREA') return;

  // 2. Allow default Enter behavior on standalone buttons (e.g. submit, reset, action buttons)
  if (
    target.tagName === 'BUTTON' ||
    (target.getAttribute('role') === 'button' && !target.classList.contains('MuiSelect-select'))
  ) {
    return;
  }

  // 3. If a MUI select / combobox dropdown is currently open (aria-expanded="true"),
  //    let Enter select the highlighted option — do NOT navigate to the next field yet.
  const ariaExpanded = target.getAttribute('aria-expanded');
  if (ariaExpanded === 'true') return;

  // Also check closest combobox parent for autocomplete wrappers
  const comboboxParent = target.closest('[role="combobox"]');
  if (comboboxParent && comboboxParent.getAttribute('aria-expanded') === 'true') return;

  // 4. Prevent native form submission on Enter
  e.preventDefault();

  const form = e.currentTarget;

  // 5. Collect all potentially interactive form controls in DOM order
  const rawElements = Array.from(
    form.querySelectorAll<HTMLElement>(
      [
        'input:not([type="hidden"])',
        'select',
        'textarea',
        '[role="combobox"]',
        '.MuiSelect-select',
      ].join(', ')
    )
  );

  // 6. Filter to only visible, enabled, primary controls
  const focusableFields = rawElements.filter((el) => {
    // Skip invisible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;

    // Skip disabled elements (MUI renders disabled inputs as such).
    // NOTE: genuinely read-only fields (auto-calculated Age, Batch, fee
    // summaries) are all also disabled, so they are covered above. Do NOT skip
    // readonly inputs in general: getNoAutofillInputProps() sets readOnly=true
    // on editable fields as an autofill-prevention trick.
    if ((el as HTMLInputElement).disabled) return false;

    // Skip aria-disabled elements
    if (el.getAttribute('aria-disabled') === 'true') return false;

    // Skip BUTTON elements themselves (we only want inputs/selects)
    if (el.tagName === 'BUTTON') return false;

    // Skip elements that are inside icon buttons or utility button wrappers
    //   but allow .MuiSelect-select even if it's inside a MuiButtonBase-root
    if (!el.classList.contains('MuiSelect-select')) {
      if (el.closest('.MuiIconButton-root')) return false;
      if (el.closest('.MuiButtonBase-root')) return false;
    }

    // Skip the hidden anti-autofill dummy inputs by id/name convention
    const id = el.id || '';
    const name = el.getAttribute('name') || '';
    if (id.startsWith('prevent_autofill_') || name.startsWith('prevent_autofill_')) return false;

    return true;
  });

  // 7. Locate the current element in the filtered, DOM-ordered list
  let currentIndex = focusableFields.indexOf(target);
  if (currentIndex < 0) {
    // Fallback: target may be a child of a tracked element (e.g. inner input of MUI wrapper)
    currentIndex = focusableFields.findIndex(
      (el) => el.contains(target) || target.contains(el)
    );
  }

  // 8. Navigate
  const allRequiredFilled =
    focusableFields.length > 0 &&
    focusableFields.every((el) => !isRequiredField(el) || isFieldFilled(el));

  if (currentIndex >= 0 && currentIndex < focusableFields.length - 1) {
    if (allRequiredFilled) {
      // All required fields are complete — Enter anywhere advances to the next page.
      if (onFinalSubmit) {
        onFinalSubmit();
      }
      return;
    }
    // Focus the next field
    const nextEl = focusableFields[currentIndex + 1];
    nextEl.focus();
    // Select text content for quick overwrite (skip date inputs – browser handles those)
    if (nextEl instanceof HTMLInputElement && nextEl.type !== 'date') {
      nextEl.select();
    }
  } else if (currentIndex === focusableFields.length - 1 && focusableFields.length > 0) {
    // Last field — trigger step submission / advance to next page
    if (onFinalSubmit) {
      onFinalSubmit();
    }
  }
};
