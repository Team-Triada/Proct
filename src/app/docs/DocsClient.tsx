'use client'

import React, { useState, useEffect } from 'react'
import {
    Book,
    Server,
    Shield,
    Users,
    Database,
    Code,
    Lock,
    GitBranch,
    CheckCircle,
    Clock,
    UserCheck,
    FileText,
    AlertTriangle
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

const SECTIONS = [
    { id: 'intro', title: 'Introduction', icon: Book },
    { id: 'features', title: 'Key Features', icon: Server },
    { id: 'faculty-flow', title: 'Faculty Workflow', icon: UserCheck },
    { id: 'student-flow', title: 'Student Workflow', icon: Users },
    { id: 'security', title: 'Security Mechanics', icon: Shield },
    { id: 'tech-stack', title: 'Tech Stack', icon: Code },
]

export default function DocsClient() {
    const [activeSection, setActiveSection] = useState('intro')

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200
            for (const section of SECTIONS) {
                const el = document.getElementById(section.id)
                if (el && el.offsetTop <= scrollPosition && (el.offsetTop + el.offsetHeight) > scrollPosition) {
                    setActiveSection(section.id)
                    break
                }
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            window.scrollTo({ top: element.offsetTop - 120, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-inter selection:bg-[var(--accent)]/30">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Header */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-16 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        System Documentation
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Manual.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="flex flex-col lg:flex-row gap-0 lg:gap-16 relative">

                        {/* --- Sticky Sidebar --- */}
                        <aside className="lg:w-64 shrink-0 hidden lg:block border-r border-[var(--border-subtle)] pr-8">
                            <div className="sticky top-32 space-y-0">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] font-mono uppercase tracking-widest mb-6">Index</h3>
                                {SECTIONS.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full flex items-center justify-between py-4 border-b border-[var(--border-subtle)] text-sm font-mono uppercase transition-colors rounded-none ${activeSection === section.id
                                            ? 'text-[var(--accent)] font-bold'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        {section.title}
                                        <section.icon size={14} className={activeSection === section.id ? 'opacity-100' : 'opacity-0'} />
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* --- Main Content --- */}
                        <article className="flex-1 space-y-32">

                            {/* Introduction */}
                            <section id="intro" className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-jakarta font-black uppercase tracking-tighter mb-6">
                                    Introduction
                                </h2>
                                <p className="text-xl text-[var(--text-muted)] font-mono tracking-tight leading-relaxed max-w-3xl border-l-2 border-[var(--border-subtle)] pl-6">
                                    The complete guide to Proct's integrity-first assessment platform. Understand how we enforce fairness, manage access, and structure data.
                                </p>

                                <div className="grid md:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)] mt-12">
                                    <div className="bg-[var(--bg-secondary)] p-8">
                                        <h3 className="text-[var(--text-primary)] font-bold mb-4 font-mono uppercase text-xs tracking-widest flex items-center gap-3"><Lock size={14} className="text-[var(--accent)]" /> Purpose</h3>
                                        <p className="text-sm text-[var(--text-muted)] font-mono">Most platforms optimize for ease of cheating. Proct optimizes for academic integrity through strict timing and linear navigation.</p>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-8">
                                        <h3 className="text-[var(--text-primary)] font-bold mb-4 font-mono uppercase text-xs tracking-widest flex items-center gap-3"><Users size={14} className="text-blue-500" /> Target</h3>
                                        <p className="text-sm text-[var(--text-muted)] font-mono">Internal university departments needing to conduct standardized assessments for specific Years and Batches.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Key Features */}
                            <section id="features" className="space-y-8">
                                <h2 className="text-3xl font-jakarta font-black uppercase tracking-tighter">Key Features</h2>

                                <div className="grid gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                    <FeatureCard
                                        title="Year & Batch Targeting"
                                        desc="Quizzes aren't just 'public'. They are targeted. You can assign a quiz specifically to 'Year 2024-28, Batch 3'. Students outside this group cannot even see the quiz."
                                        icon={<Users />}
                                    />
                                    <FeatureCard
                                        title="Strict Linear Mode"
                                        desc="To prevent answer sharing, students cannot go back to previous questions. Once a question is answered or the timer runs out, it's locked forever."
                                        icon={<GitBranch />}
                                    />
                                    <FeatureCard
                                        title="Subject Approval System"
                                        desc="Faculty can create new subjects (e.g., 'Advanced AI') and create quizzes."
                                        icon={<CheckCircle />}
                                    />
                                    <FeatureCard
                                        title="Strict Fullscreen Mode"
                                        desc="Quizzes launch in fullscreen. Exiting logs a violation and blocks the interface until re-entered."
                                        icon={<Shield />}
                                    />
                                </div>
                            </section>

                            {/* Faculty Workflow */}
                            <section id="faculty-flow" className="space-y-8">
                                <h2 className="text-3xl font-jakarta font-black uppercase tracking-tighter">Faculty Workflow</h2>

                                <div className="space-y-8">
                                    <WorkflowBlock
                                        title="1. Quiz Creation"
                                        steps={[
                                            { label: "Login", desc: "Access Dashboard", icon: <UserCheck /> },
                                            { label: "Create Quiz", desc: "Set Target Demo", icon: <FileText /> },
                                            { label: "Questions", desc: "Define Qs & Options", icon: <Database /> },
                                            { label: "Publish", desc: "Deploy to cohort", icon: <CheckCircle /> }
                                        ]}
                                    />

                                    <WorkflowBlock
                                        title="2. Subject Request"
                                        steps={[
                                            { label: "Propose", desc: "Enter Subject Data", icon: <FileText /> },
                                            { label: "Pending", desc: "Awaiting Admin", icon: <Clock /> },
                                            { label: "Admin Action", desc: "Review & Approve", icon: <Shield /> },
                                            { label: "Active", desc: "Ready for Use", icon: <CheckCircle /> }
                                        ]}
                                    />
                                </div>
                            </section>

                            {/* Student Workflow */}
                            <section id="student-flow" className="space-y-8">
                                <h2 className="text-3xl font-jakarta font-black uppercase tracking-tighter">Student Workflow</h2>

                                <WorkflowBlock
                                    title="Taking a Quiz"
                                    color="green"
                                    steps={[
                                        { label: "Dashboard", desc: "View Active Quizzes", icon: <Users /> },
                                        { label: "Validation", desc: "System checks Auth", icon: <Shield /> },
                                        { label: "Attempt", desc: "Strict Fullscreen Mode", icon: <Clock /> },
                                        { label: "Submit", desc: "Timeout or Manual", icon: <CheckCircle /> }
                                    ]}
                                />
                            </section>

                            {/* Security */}
                            <section id="security" className="space-y-8">
                                <h2 className="text-3xl font-jakarta font-black uppercase tracking-tighter">Security Mechanics</h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm max-w-2xl border-l-2 border-[var(--accent)] pl-4">How Proct ensures the right person takes the test fairly.</p>

                                <div className="grid md:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)] mt-8">
                                    <div className="bg-[var(--bg-secondary)] p-8">
                                        <h4 className="text-[var(--text-primary)] font-bold flex items-center gap-3 mb-6 font-mono uppercase text-xs tracking-widest">
                                            <AlertTriangle className="text-[var(--warning)]" size={16} /> Access Control Logic
                                        </h4>
                                        <code className="block border border-[var(--border-subtle)] p-6 bg-[var(--bg-primary)] text-xs font-mono text-[var(--text-muted)] leading-relaxed whitespace-pre">
                                            IF (Student.Sem == Quiz.Sem){'\n'}
                                            AND (Student.Year == Quiz.Year){'\n'}
                                            AND (Student.Batch == Quiz.Batch){'\n'}
                                            AND (Now &gt; AvailableFrom){'\n'}
                                            THEN Allow User Access
                                        </code>
                                    </div>

                                    <div className="bg-[var(--bg-secondary)] p-8">
                                        <h4 className="text-[var(--text-primary)] font-bold flex items-center gap-3 mb-6 font-mono uppercase text-xs tracking-widest">
                                            <Clock className="text-[var(--accent)]" size={16} /> Integrity Enforcers
                                        </h4>
                                        <ul className="space-y-4 text-sm text-[var(--text-muted)] font-mono">
                                            <li className="flex gap-3 items-start"><span className="text-[var(--success)]">[{'>'}]</span> <span className="text-[var(--text-primary)]">Reference Time:</span> Server-side clock execution.</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--success)]">[{'>'}]</span> <span className="text-[var(--text-primary)]">One-Way Hash:</span> Client never sees answers.</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--success)]">[{'>'}]</span> <span className="text-[var(--text-primary)]">Strict Blur:</span> Focus tracking mechanism.</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--success)]">[{'>'}]</span> <span className="text-[var(--text-primary)]">Fullscreen:</span> Forced environment control.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Tech Stack */}
                            <section id="tech-stack" className="space-y-8">
                                <h2 className="text-3xl font-jakarta font-black uppercase tracking-tighter">Tech Stack</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                    <TechBadge name="Next.js 16" desc="App Router" />
                                    <TechBadge name="TypeScript" desc="Type Safety" />
                                    <TechBadge name="Prisma" desc="Database ORM" />
                                    <TechBadge name="Tailwind" desc="Styling Engine" />
                                </div>
                            </section>

                        </article>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactElement<{ size?: number }> }) {
    return (
        <div className="flex flex-col md:flex-row gap-6 p-8 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors group">
            <div className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <h3 className="text-xl font-jakarta font-bold text-[var(--text-primary)] uppercase tracking-tight mb-2">{title}</h3>
                <p className="text-sm font-mono text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function WorkflowBlock({ title, steps, color }: { title: string, steps: { icon: React.ReactElement<{ size?: number }>, label: string, desc: string }[], color?: string }) {
    void color
    return (
        <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <div className="bg-[var(--bg-secondary)] px-8 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-widest">{title}</h3>
            </div>

            <div className="flex flex-col md:flex-row">
                {steps.map((step, i: number) => (
                    <div key={i} className={`flex-1 p-6 flex flex-col ${i !== steps.length - 1 ? 'border-b md:border-b-0 md:border-r border-[var(--border-subtle)]' : ''}`}>
                        <div className={`w-8 h-8 flex items-center justify-center mb-6
                            ${i === steps.length - 1 ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}
                        `}>
                            {React.cloneElement(step.icon, { size: 14 })}
                        </div>
                        <h4 className="font-jakarta font-bold uppercase text-[var(--text-primary)] text-sm mb-2">{step.label}</h4>
                        <p className="text-xs font-mono text-[var(--text-muted)]">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TechBadge({ name, desc }: { name: string, desc: string }) {
    return (
        <div className="p-8 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <div className="font-jakarta font-bold uppercase tracking-tight text-lg text-[var(--text-primary)] mb-2">{name}</div>
            <div className="font-mono text-xs text-[var(--text-muted)]">{desc}</div>
        </div>
    )
}
