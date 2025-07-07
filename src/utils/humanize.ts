
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

export const humanizeValue = (
  value: number,
  fractionDigits = 2
): { value: string; unitKey: string } => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return {
      value: (value / 1_000_000_000).toLocaleString(undefined, {
        maximumFractionDigits: fractionDigits,
      }),
      unitKey: 'map.unitBillions',
    };
  }
  if (abs >= 1_000_000) {
    return {
      value: (value / 1_000_000).toLocaleString(undefined, {
        maximumFractionDigits: fractionDigits,
      }),
      unitKey: 'map.unitMillions',
    };
  }
  return {
    value: value.toLocaleString(undefined, {
      maximumFractionDigits: fractionDigits,
    }),
    unitKey: 'map.unitTonnes',
  };
};
