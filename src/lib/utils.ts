/**
 * Utility for conditionally joining class names.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

export const normalizeBatch = (batch: string): string => {
    if (!batch) return '';
    return batch.trim().toUpperCase();
};

export const normalizeBatches = (batches: string[]): string[] => {
    if (!Array.isArray(batches)) return [];
    return batches.map(b => normalizeBatch(b)).filter(b => b.length > 0);
};
