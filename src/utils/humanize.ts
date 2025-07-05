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
