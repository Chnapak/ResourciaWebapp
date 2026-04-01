/**
 * Column definition used by admin table components.
 */
export type AdminTableColumn = {
  /** Unique key that maps to the row field. */
  key: string;
  /** Optional header label; falls back to the key when omitted. */
  label?: string;
  /** Tailwind width class applied to the column. */
  widthClass: string;
  /** Horizontal alignment for the column content. */
  align?: 'left' | 'right' | 'center';
};
