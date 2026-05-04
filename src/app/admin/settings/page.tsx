'use client'

import { useState, useEffect, useRef, MutableRefObject } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_NAV = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
    { name: 'Settings', href: '/admin/settings' },
]

const FORMAT_OPTIONS: { value: FieldFormat; label: string; hint: string }[] = [
    { value: 'ANY', label: 'Any', hint: 'No restrictions' },
    { value: 'NUMERIC', label: 'Numeric', hint: 'Digits 0–9 only' },
    { value: 'ALPHA', label: 'Alpha', hint: 'Letters A–Z only' },
    { value: 'ALPHANUMERIC', label: 'Alphanumeric', hint: 'Letters & digits' },
]

const SECTIONS = [
    { id: 'email', label: 'Email & Access', icon: '✉' },
    { id: 'rollnumber', label: 'Registration Number', icon: '#' },
    { id: 'studentid', label: 'Secondary Student ID', icon: '⊞' },
    { id: 'academic', label: 'Academic Structure', icon: '⚙' },
    { id: 'targeting', label: 'Quiz Targeting', icon: '◎' },
]

const INPUT_CLS = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
const INPUT_STYLE = { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
const LABEL_CLS = "block text-xs font-semibold uppercase tracking-widest mb-1.5"
const LABEL_STYLE = { color: 'var(--text-muted)' }

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldFormat = 'NUMERIC' | 'ALPHA' | 'ALPHANUMERIC' | 'ANY'

interface Settings {
    allowedEmailDomains: string[]
    studentIdLabel: string; studentIdFormat: FieldFormat; studentIdMinLength: number; studentIdMaxLength: number; studentIdRequired: boolean
    rollNumberLabel: string; rollNumberFormat: FieldFormat; rollNumberMinLength: number; rollNumberMaxLength: number; rollNumberRequired: boolean
    maxSemester: number; availableBatches: string[]; maxBatchNumber: number
    enableYearTargeting: boolean; enableSemesterTargeting: boolean; enableBatchTargeting: boolean
}

// ─── Sub-components (defined outside page to prevent remount on state change) ─

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none group">
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
                className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm group-hover:text-theme-secondary transition-colors" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </label>
    )
}

function FormatPicker({ value, onChange }: { value: FieldFormat; onChange: (v: FieldFormat) => void }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => onChange(o.value)}
                    className="flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{
                        background: value === o.value ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-tertiary)',
                        borderColor: value === o.value ? 'var(--accent)' : 'var(--border)',
                        color: value === o.value ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                    <span className="text-xs font-semibold uppercase tracking-wide">{o.label}</span>
                    <span className="text-[10px] mt-0.5 font-mono opacity-70">{o.hint}</span>
                </button>
            ))}
        </div>
    )
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {label}
            <button type="button" onClick={onRemove} className="hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </span>
    )
}

function NumberInput({ label, hint, value, min, max, onChange }: {
    label: string; hint?: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
    return (
        <div>
            <label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
                    className="w-8 h-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>−</button>
                <input type="number" min={min} max={max} value={value}
                    onChange={e => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || min)))}
                    className="w-16 text-center px-2 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={INPUT_STYLE} />
                <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
                    className="w-8 h-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>+</button>
                {hint && <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
            </div>
        </div>
    )
}

function SectionCard({ id, title, description, children, sectionRefs }: {
    id: string; title: string; description: string; children: React.ReactNode
    sectionRefs: MutableRefObject<Record<string, HTMLElement | null>>
}) {
    return (
        <section id={id} ref={el => { sectionRefs.current[id] = el }} className="scroll-mt-6">
            <div className="card space-y-5">
                <div className="pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 className="text-base font-semibold text-theme-primary">{title}</h2>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{description}</p>
                </div>
                {children}
            </div>
        </section>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [settings, setSettings] = useState<Settings | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [newDomain, setNewDomain] = useState('')
    const [newBatch, setNewBatch] = useState('')
    const [activeSection, setActiveSection] = useState('email')
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
        if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'ADMIN') router.push('/login')
    }, [status, session, router])

    useEffect(() => {
        if (status !== 'authenticated') return
        fetch('/api/admin/settings').then(r => r.json()).then(setSettings).catch(() => setError('Failed to load settings'))
    }, [status])

    // Only set up observer once after settings load (not on every settings change)
    const observerReady = useRef(false)
    useEffect(() => {
        if (!settings || observerReady.current) return
        observerReady.current = true
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.filter(e => e.isIntersecting)
                if (visible.length > 0) setActiveSection(visible[0].target.id)
            },
            { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
        )
        Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
        return () => observer.disconnect()
    }, [settings])

    const scrollTo = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveSection(id)
    }

    const save = async () => {
        if (!settings) return
        setSaving(true); setError(''); setSaved(false)
        try {
            const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
            if (!res.ok) { setError('Failed to save changes'); return }
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch { setError('Failed to save settings') }
        finally { setSaving(false) }
    }

    const addDomain = () => {
        if (!newDomain.trim() || !settings) return
        const d = newDomain.trim().startsWith('@') ? newDomain.trim() : `@${newDomain.trim()}`
        if (!settings.allowedEmailDomains.includes(d)) setSettings({ ...settings, allowedEmailDomains: [...settings.allowedEmailDomains, d] })
        setNewDomain('')
    }
    const removeDomain = (d: string) => settings && setSettings({ ...settings, allowedEmailDomains: settings.allowedEmailDomains.filter(x => x !== d) })

    const addBatch = () => {
        if (!newBatch.trim() || !settings) return
        if (!settings.availableBatches.includes(newBatch.trim())) setSettings({ ...settings, availableBatches: [...settings.availableBatches, newBatch.trim()] })
        setNewBatch('')
    }
    const removeBatch = (b: string) => settings && setSettings({ ...settings, availableBatches: settings.availableBatches.filter(x => x !== b) })

    if (status === 'loading' || !settings) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <DashboardLayout user={session!.user as { name: string; email: string; role: string }} navigation={ADMIN_NAV}>
            <div className="space-y-4">

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-theme-primary">Platform Settings</h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Configure registration rules and academic structure</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {saved && (
                            <span className="text-xs font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Saved
                            </span>
                        )}
                        {error && <span className="text-xs font-mono px-3 py-1.5 rounded-lg pill-red">{error}</span>}
                        <button onClick={save} disabled={saving}
                            className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: 'var(--accent)' }}>
                            {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Mobile section nav — horizontal scrollable pills */}
                <div className="md:hidden overflow-x-auto pb-1 -mx-1 px-1">
                    <div className="flex gap-2 w-max">
                        {SECTIONS.map(s => (
                            <button key={s.id} type="button" onClick={() => scrollTo(s.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
                                style={{
                                    background: activeSection === s.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                                    color: activeSection === s.id ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid',
                                    borderColor: activeSection === s.id ? 'var(--accent)' : 'var(--border)',
                                }}>
                                <span className="text-sm leading-none">{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="flex gap-6 items-start">

                    {/* Sidebar nav — desktop only */}
                    <aside className="hidden md:block w-52 shrink-0 sticky top-20">
                        <nav className="space-y-0.5">
                            {SECTIONS.map(s => (
                                <button key={s.id} type="button" onClick={() => scrollTo(s.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${activeSection === s.id ? 'text-theme-primary bg-[var(--bg-tertiary)]' : 'text-theme-muted hover:text-theme-secondary hover:bg-[var(--bg-secondary)]'}`}>
                                    <span className="text-base leading-none w-5 text-center opacity-70">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </nav>
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <button type="button" onClick={save} disabled={saving}
                                className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: 'var(--accent)' }}>
                                {saving && <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-5">

                        <SectionCard id="email" title="Email & Access" sectionRefs={sectionRefs}
                            description="Restrict registration to specific email domains. Leave empty to allow any address.">
                            <div className="flex gap-2">
                                <input value={newDomain} onChange={e => setNewDomain(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                                    className={INPUT_CLS} style={INPUT_STYLE} placeholder="@institution.edu" />
                                <button type="button" onClick={addDomain}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
                                    style={{ background: 'var(--accent)', color: '#fff' }}>Add</button>
                            </div>
                            {settings.allowedEmailDomains.length === 0 ? (
                                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Open access — any email domain can register.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {settings.allowedEmailDomains.map(d => <Tag key={d} label={d} onRemove={() => removeDomain(d)} />)}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard id="rollnumber" title="Registration Number" sectionRefs={sectionRefs}
                            description="Primary unique student identifier — roll number, student ID, etc.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>Field Label</label>
                                    <input value={settings.rollNumberLabel} onChange={e => setSettings({ ...settings, rollNumberLabel: e.target.value })}
                                        className={INPUT_CLS} style={INPUT_STYLE} placeholder="Registration Number" />
                                </div>
                                <div className="col-span-2">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>Allowed Format</label>
                                    <FormatPicker value={settings.rollNumberFormat} onChange={v => setSettings({ ...settings, rollNumberFormat: v })} />
                                </div>
                                <NumberInput label="Min Length" value={settings.rollNumberMinLength} min={1} max={50}
                                    hint={`≥ ${settings.rollNumberMinLength} char${settings.rollNumberMinLength !== 1 ? 's' : ''}`}
                                    onChange={v => setSettings({ ...settings, rollNumberMinLength: v })} />
                                <NumberInput label="Max Length" value={settings.rollNumberMaxLength} min={1} max={50}
                                    hint={`≤ ${settings.rollNumberMaxLength} chars`}
                                    onChange={v => setSettings({ ...settings, rollNumberMaxLength: v })} />
                            </div>
                            <Toggle checked={settings.rollNumberRequired} onChange={v => setSettings({ ...settings, rollNumberRequired: v })}
                                label="Required during registration" />
                        </SectionCard>

                        <SectionCard id="studentid" title="Secondary Student ID" sectionRefs={sectionRefs}
                            description="Optional second identifier — campus ID, admission number, library card, etc. Disable to hide from registration.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>Field Label</label>
                                    <input value={settings.studentIdLabel} onChange={e => setSettings({ ...settings, studentIdLabel: e.target.value })}
                                        className={INPUT_CLS} style={INPUT_STYLE} placeholder="Campus ID" />
                                </div>
                                <div className="col-span-2">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>Allowed Format</label>
                                    <FormatPicker value={settings.studentIdFormat} onChange={v => setSettings({ ...settings, studentIdFormat: v })} />
                                </div>
                                <NumberInput label="Min Length" value={settings.studentIdMinLength} min={1} max={50}
                                    hint={`≥ ${settings.studentIdMinLength} char${settings.studentIdMinLength !== 1 ? 's' : ''}`}
                                    onChange={v => setSettings({ ...settings, studentIdMinLength: v })} />
                                <NumberInput label="Max Length" value={settings.studentIdMaxLength} min={1} max={50}
                                    hint={`≤ ${settings.studentIdMaxLength} chars`}
                                    onChange={v => setSettings({ ...settings, studentIdMaxLength: v })} />
                            </div>
                            <Toggle checked={settings.studentIdRequired} onChange={v => setSettings({ ...settings, studentIdRequired: v })}
                                label="Show and require during registration" />
                        </SectionCard>

                        <SectionCard id="academic" title="Academic Structure" sectionRefs={sectionRefs}
                            description="Controls semester count, batch numbers, and year options used across registration and quiz targeting.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <NumberInput label="Max Semesters" value={settings.maxSemester} min={1} max={20}
                                        hint={`Sem 1 → Sem ${settings.maxSemester}`}
                                        onChange={v => setSettings({ ...settings, maxSemester: v })} />
                                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                        Applies to registration and quiz targeting.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <NumberInput label="Max Batch Number" value={settings.maxBatchNumber} min={1} max={100}
                                        hint={`Batch 1 → Batch ${settings.maxBatchNumber}`}
                                        onChange={v => setSettings({ ...settings, maxBatchNumber: v })} />
                                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                        Students pick from Batch 1 to Batch {settings.maxBatchNumber}.
                                    </p>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                                <label className={LABEL_CLS} style={LABEL_STYLE}>Available Year Options</label>
                                <p className="text-xs mb-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                                    Preset years shown in registration and quiz targeting dropdowns. Leave empty for free-text input.
                                </p>
                                <div className="flex gap-2 mb-3">
                                    <input value={newBatch} onChange={e => setNewBatch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBatch())}
                                        className={INPUT_CLS} style={INPUT_STYLE} placeholder="e.g. 2024-27" />
                                    <button type="button" onClick={addBatch}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
                                        style={{ background: 'var(--accent)', color: '#fff' }}>Add</button>
                                </div>
                                {settings.availableBatches.length === 0 ? (
                                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>No preset years — students enter their own value.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {settings.availableBatches.map(b => <Tag key={b} label={b} onRemove={() => removeBatch(b)} />)}
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard id="targeting" title="Quiz Targeting" sectionRefs={sectionRefs}
                            description="Choose which dimensions faculty can use to restrict quiz visibility. Disabled dimensions are ignored during both quiz creation and student filtering.">
                            <div className="space-y-4">
                                <Toggle
                                    checked={settings.enableYearTargeting}
                                    onChange={v => setSettings({ ...settings, enableYearTargeting: v })}
                                    label="Enable Year targeting — restrict quizzes to specific enrollment years (e.g. 2024-27)"
                                />
                                <Toggle
                                    checked={settings.enableSemesterTargeting}
                                    onChange={v => setSettings({ ...settings, enableSemesterTargeting: v })}
                                    label="Enable Semester targeting — restrict quizzes to a specific semester (e.g. Sem 3)"
                                />
                                <Toggle
                                    checked={settings.enableBatchTargeting}
                                    onChange={v => setSettings({ ...settings, enableBatchTargeting: v })}
                                    label="Enable Batch targeting — restrict quizzes to a specific batch number (e.g. Batch 2)"
                                />
                            </div>
                            <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                    Turning off a dimension hides its selector from quiz creation/edit forms and skips that check when showing quizzes to students. Existing quiz data is preserved — re-enabling the dimension restores the behaviour.
                                </p>
                            </div>
                        </SectionCard>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
