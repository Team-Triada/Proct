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

// --- TOC Data ---
const SECTIONS = [
    { id: 'intro', title: 'Introduction', icon: Book },
    { id: 'features', title: 'Key Features', icon: Server },
    { id: 'faculty-flow', title: 'Faculty Workflow', icon: UserCheck },
    { id: 'student-flow', title: 'Student Workflow', icon: Users },
    { id: 'security', title: 'Security Mechanics', icon: Shield },
    { id: 'tech-stack', title: 'Tech Stack', icon: Code },
]

export default function DocsPage() {
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

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* --- Sticky Sidebar --- */}
                    <aside className="lg:w-64 shrink-0 hidden lg:block">
                        <div className="sticky top-32 space-y-2">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 px-3">On this page</h3>
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === section.id
                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-lg'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                        }`}
                                >
                                    <section.icon size={16} />
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* --- Main Content --- */}
                    <article className="flex-1 space-y-24">

                        {/* Introduction */}
                        <section id="intro" className="space-y-6">
                            <h1 className="text-4xl md:text-5xl font-manrope font-extrabold mb-6">
                                Proct Documentation
                            </h1>
                            <p className="text-xl text-[var(--text-muted)] leading-relaxed max-w-3xl">
                                The complete guide to Proct&apos;s integrity-first assessment platform.
                                Understand how we enforce fairness, manage access, and structure data.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mt-8">
                                <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                    <h3 className="text-[var(--text-primary)] font-bold mb-2 flex items-center gap-2"><Lock size={18} className="text-[var(--accent)]" /> Why Proct?</h3>
                                    <p className="text-sm text-[var(--text-muted)]">Most platforms optimize for ease of cheating. Proct optimizes for academic integrity through strict timing and linear navigation.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                    <h3 className="text-[var(--text-primary)] font-bold mb-2 flex items-center gap-2"><Users size={18} className="text-blue-500" /> Who is it for?</h3>
                                    <p className="text-sm text-[var(--text-muted)]">Internal university departments needing to conduct standardized assessments for specific Years and Batches.</p>
                                </div>
                            </div>
                        </section>

                        {/* Key Features */}
                        <section id="features" className="space-y-8 pt-8 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Server size={24} /></div>
                                <h2 className="text-3xl font-manrope font-bold">Key Features</h2>
                            </div>

                            <div className="grid gap-6">
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
                            </div>
                        </section>

                        {/* Faculty Workflow */}
                        <section id="faculty-flow" className="space-y-8 pt-8 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><UserCheck size={24} /></div>
                                <h2 className="text-3xl font-manrope font-bold">Faculty Workflow</h2>
                            </div>

                            <div className="space-y-12">
                                <WorkflowBlock
                                    title="1. Creating a Quiz"
                                    steps={[
                                        { label: "Login", desc: "Access Faculty Dashboard home", icon: <UserCheck /> },
                                        { label: "Create Quiz", desc: "Set Title, Sem, Year (2025-28), Batch (3)", icon: <FileText /> },
                                        { label: "Add Questions", desc: "Define Questions & Options (A,B,C,D)", icon: <Database /> },
                                        { label: "Publish", desc: "Quiz becomes visible to eligible students", icon: <CheckCircle /> }
                                    ]}
                                />

                                <WorkflowBlock
                                    title="2. Requesting a Subject"
                                    steps={[
                                        { label: "Propose", desc: "Enter Subject Name & Code", icon: <FileText /> },
                                        { label: "Pending", desc: "Status: Awaiting Approval", icon: <Clock /> },
                                        { label: "Admin Action", desc: "Admin Reviews & Approves", icon: <Shield /> },
                                        { label: "Active", desc: "Available for all Faculty", icon: <CheckCircle /> }
                                    ]}
                                />
                            </div>
                        </section>


                        {/* Student Workflow */}
                        <section id="student-flow" className="space-y-8 pt-8 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Users size={24} /></div>
                                <h2 className="text-3xl font-manrope font-bold">Student Workflow</h2>
                            </div>

                            <WorkflowBlock
                                title="Taking a Quiz"
                                color="green"
                                steps={[
                                    { label: "Dashboard", desc: "View quizzes for your Semester", icon: <Users /> },
                                    { label: "Validation", desc: "System checks your Year/Batch", icon: <Shield /> },
                                    { label: "Attempt", desc: "Answer Qs one by one. Timer ticks.", icon: <Clock /> },
                                    { label: "Auto-Submit", desc: "Ends on timeout or completion", icon: <CheckCircle /> },
                                    { label: "Result", desc: "Instant score (if enabled)", icon: <FileText /> }
                                ]}
                            />
                        </section>


                        {/* Security */}
                        <section id="security" className="space-y-8 pt-8 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]"><Shield size={24} /></div>
                                <h2 className="text-3xl font-manrope font-bold">Security Mechanics</h2>
                            </div>

                            <p className="text-[var(--text-muted)] mb-6">How Proct ensures the right person takes the test fairly.</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-subtle)]">
                                    <h4 className="text-[var(--text-primary)] font-bold flex items-center gap-2 mb-3">
                                        <AlertTriangle className="text-[var(--warning)]" size={18} /> Access Control Logic
                                    </h4>
                                    <code className="block bg-[var(--bg-tertiary)] p-4 rounded-lg text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                                        IF (Student.Semester == Quiz.Semester)<br />
                                        AND (Student.Year == Quiz.TargetYear)<br />
                                        AND (Student.Batch == Quiz.TargetBatch)<br />
                                        AND (Now &gt; AvailableFrom)<br />
                                        THEN Allow User Access
                                    </code>
                                </div>

                                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-subtle)]">
                                    <h4 className="text-[var(--text-primary)] font-bold flex items-center gap-2 mb-3">
                                        <Clock className="text-[var(--accent)]" size={18} /> Integrity Enforcers
                                    </h4>
                                    <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                                        <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-[var(--success)] mt-0.5" /> <strong>Reference Time:</strong> Server-side time prevents changing device clock.</li>
                                        <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-[var(--success)] mt-0.5" /> <strong>One-Way Hash:</strong> Answers are verified on server, never exposed to client.</li>
                                        <li className="flex gap-2 items-start"><CheckCircle size={16} className="text-[var(--success)] mt-0.5" /> <strong>Strict Blur:</strong> (Optional) Logs when user switches tabs.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Tech Stack */}
                        <section id="tech-stack" className="space-y-8 pt-8 border-t border-[var(--border-subtle)] pb-20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Code size={24} /></div>
                                <h2 className="text-3xl font-manrope font-bold">Tech Stack</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <TechBadge name="Next.js 16" desc="App Router" />
                                <TechBadge name="TypeScript" desc="Type Safety" />
                                <TechBadge name="Prisma" desc="Database ORM" />
                                <TechBadge name="Tailwind" desc="Styling Engine" />
                            </div>
                        </section>

                    </article>
                </div>
            </main>

            <Footer />
        </div>
    )
}

// --- Visual Components ---

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
    return (
        <div className="flex gap-4 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)]">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function WorkflowBlock({ title, steps }: { title: string, steps: { icon: React.ReactElement, label: string, desc: string }[], color?: string }) {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] p-8">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8 border-b border-[var(--border-subtle)] pb-4">{title}</h3>

            <div className="relative flex flex-col md:flex-row gap-8 md:gap-4 justify-between items-start md:items-center">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[24px] left-8 right-8 h-[2px] bg-[var(--border)] -z-10" />

                {steps.map((step, i: number) => (
                    <div key={i} className="flex flex-row md:flex-col items-center gap-4 md:gap-6 relative w-full md:w-auto">
                        {/* Connecting Line (Mobile) */}
                        {i !== steps.length - 1 && (
                            <div className="md:hidden absolute left-[24px] top-12 bottom-[-32px] w-[2px] bg-[var(--border)] -z-10" />
                        )}

                        <div className={`w-12 h-12 rounded-full border-4 border-[var(--bg-primary)] flex items-center justify-center z-10 
                            ${i === steps.length - 1 ? 'bg-[var(--success)] text-white' : `bg-[var(--bg-tertiary)] text-[var(--text-muted)]`}
                            transition-all hover:scale-110 shadow-lg`}>
                            {React.cloneElement(step.icon, { size: 20 })}
                        </div>
                        <div className="text-left md:text-center bg-[var(--bg-primary)] md:bg-transparent p-2 md:p-0 rounded-lg border border-[var(--border-subtle)] md:border-none w-full md:w-auto">
                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{step.label}</h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1 md:max-w-[150px]">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TechBadge({ name, desc }: { name: string, desc: string }) {
    return (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <div className="font-bold text-[var(--text-primary)]">{name}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{desc}</div>
        </div>
    )
}
