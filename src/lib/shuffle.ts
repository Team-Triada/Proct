/**
 * Unbiased shuffling and server-side option-order bookkeeping.
 *
 * `array.sort(() => Math.random() - 0.5)` is not a shuffle — the comparator is
 * inconsistent, so the resulting permutation distribution is skewed and some
 * orders are far more likely than others. For question order that is a fairness
 * problem; for option order it is a predictability problem. Use Fisher-Yates.
 */

/** Returns a new array shuffled uniformly at random. Does not mutate `input`. */
export function shuffle<T>(input: readonly T[]): T[] {
    const out = [...input]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

/**
 * A shuffle mapping is an array where `mapping[displayedPosition]` is the
 * option's original index in the question. Grading always maps the student's
 * displayed choice back through this before comparing to `correctIndex`.
 */
export type ShuffleMapping = number[]

/** Builds a fresh mapping for a question with `optionCount` options. */
export function buildShuffleMapping(optionCount: number): ShuffleMapping {
    return shuffle(Array.from({ length: optionCount }, (_, i) => i))
}

/** True when `value` is a permutation of 0..optionCount-1. */
export function isValidShuffleMapping(value: unknown, optionCount: number): value is ShuffleMapping {
    return (
        Array.isArray(value) &&
        value.length === optionCount &&
        new Set(value).size === optionCount &&
        value.every(v => Number.isInteger(v) && v >= 0 && v < optionCount)
    )
}

/** Parses the `QuizAttempt.shuffleMappings` JSON blob, tolerating corruption. */
export function parseShuffleMappings(raw: string | null | undefined): Record<string, ShuffleMapping> {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        return parsed as Record<string, ShuffleMapping>
    } catch {
        return {}
    }
}

/**
 * Maps a displayed option position back to its original index.
 *
 * Falls back to the identity mapping when no stored mapping exists, which is
 * the correct behaviour for questions whose options were never shuffled (and
 * for attempts created before mappings were persisted).
 */
export function toOriginalIndex(
    displayedIndex: number,
    mapping: ShuffleMapping | undefined,
    optionCount: number
): number {
    if (!isValidShuffleMapping(mapping, optionCount)) return displayedIndex
    if (displayedIndex < 0 || displayedIndex >= mapping.length) return displayedIndex
    return mapping[displayedIndex]
}
