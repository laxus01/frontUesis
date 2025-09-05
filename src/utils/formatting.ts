// Formats a number string with thousand separators (dots)
export const formatNumber = (value: string | number): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/\D/g, '');
  if (stringValue === '') return '';
  return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Removes thousand separators (dots) from a formatted number string
export const unformatNumber = (value: string): string => {
  if (!value) return '';
  return String(value).replace(/\./g, '');
};
