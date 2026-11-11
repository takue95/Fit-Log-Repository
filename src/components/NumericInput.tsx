import React, { InputHTMLAttributes, useEffect, useState } from 'react';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'> {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  inputMode,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const [draft, setDraft] = useState(String(value ?? ''));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(String(value ?? ''));
  }, [isFocused, value]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const input = event.currentTarget;
    requestAnimationFrame(() => input.select());
    onFocus?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!/^-?(?:\d+[.,]?\d*|[.,]\d*)?$/.test(raw)) return;
    const next = raw.replace(',', '.');
    setDraft(next);

    if (next === '' || next === '-' || next === '.' || next.endsWith('.')) return;
    const parsed = Number(next);
    if (Number.isFinite(parsed)) onValueChange(parsed);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const parsed = draft.trim() === '' || draft === '-' || draft === '.' ? (min ?? 0) : Number(draft);
    const bounded = Number.isFinite(parsed)
      ? Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, parsed))
      : value;
    onValueChange(bounded);
    setDraft(String(bounded));
    onBlur?.(event);
  };

  return (
    <input
      {...inputProps}
      type="text"
      inputMode={inputMode ?? (step % 1 === 0 ? 'numeric' : 'decimal')}
      value={draft}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
};
