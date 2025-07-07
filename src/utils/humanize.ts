
export const humanizeLabel = (label: string): string => {
  if (!label) return label;
  return label
    .split(':')
    .map(part =>
      part
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    )
    .join(' - ');
};

export const toBillions = (value: number): number => value / 1_000_000_000_000;

export const formatBillions = (
  value: number,
  fractionDigits = 6
): string =>
  toBillions(value).toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
  });
