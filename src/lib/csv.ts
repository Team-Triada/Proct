/**
 * Minimal RFC 4180 CSV writer.
 *
 * Every field is quoted rather than only the ones that strictly need it. It
 * costs a few bytes and removes a whole class of "the export broke because a
 * question title had a comma in it" bugs.
 */

/**
 * Escapes one field.
 *
 * The leading apostrophe on values starting with `= + - @` is CSV injection
 * defence: without it, Excel and Sheets evaluate such a field as a formula, so
 * a student name of `=HYPERLINK(...)` becomes live content in the spreadsheet
 * a faculty member opens.
 */
function escapeField(value: unknown): string {
    if (value === null || value === undefined) return '""'

    let text = String(value)
    if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`
    }
    return `"${text.replace(/"/g, '""')}"`
}

/** Joins one row of fields. */
export function csvRow(fields: readonly unknown[]): string {
    return fields.map(escapeField).join(',')
}

/**
 * Builds a full CSV document with CRLF line endings.
 *
 * The UTF-8 BOM is deliberate: without it Excel on Windows reads the file as
 * the local codepage and mangles non-ASCII names.
 */
export function buildCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
    const lines = [csvRow(header), ...rows.map(csvRow)]
    return `﻿${lines.join('\r\n')}\r\n`
}

/** Strips characters that are unsafe or awkward in a downloaded filename. */
export function safeFilename(name: string, fallback = 'export'): string {
    const cleaned = name
        .replace(/[^a-zA-Z0-9-_ ]+/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60)
    return cleaned || fallback
}
