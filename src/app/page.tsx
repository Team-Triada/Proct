'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Smartphone,
  Clock,
  Lock,
  Eye,
  AlertTriangle,
  Server,
  Users,
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { WorkflowDiagram } from '@/components/landing/WorkflowDiagram'

// --- Assets ---
const NOISE_BG = "url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')"

// --- Animation Variants ---
const containerVar = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVar = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
}

// --- Section Header Component ---
const SectionHeader = ({
  label,
  title,
  description,
  centered = true
}: {
  label?: string
  title: React.ReactNode
  description?: string
  centered?: boolean
}) => (
  <div className={`mb-12 md:mb-16 ${centered ? 'text-center' : ''}`}>
    {label && (
      <span className="text-[var(--accent)] font-bold tracking-widest text-xs uppercase mb-3 block">
        {label}
      </span>
    )}
    <h2 className="font-manrope font-extrabold text-3xl md:text-4xl lg:text-5xl text-[var(--text-primary)] tracking-tight">
      {title}
    </h2>
    {description && (
      <p className="font-inter text-base md:text-lg text-[var(--text-muted)] mt-4 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    )}
  </div>
)

// --- Hero Section ---
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-[var(--bg-primary)]">
      <div className="absolute inset-0" style={{ backgroundImage: NOISE_BG }} />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] md:w-[700px] h-[500px] md:h-[700px] bg-[var(--accent)]/10 blur-[100px] md:blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-500/10 blur-[100px] md:blur-[150px] rounded-full" />
    </div>

    <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl py-32 md:py-40">
      <motion.div
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center"
      >
        {/* Badge */}
        <motion.div variants={itemVar} className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] backdrop-blur-md text-sm font-medium text-[var(--text-secondary)] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>Launching Soon</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          variants={itemVar}
          className="font-instrument font-normal text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-[var(--text-primary)] tracking-tight mb-6 md:mb-8 leading-[1.1]"
        >
          <span className="italic">Integrity-First</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-secondary)] to-[var(--text-muted)]">
            Online Quizzes.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVar}
          className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-inter max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-4"
        >
          A mobile-first online quiz platform designed specifically for internal academic assessments.
          Fair, consistent, and reliable.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVar}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none"
        >
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto group relative px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-muted)] text-white rounded-full font-bold text-base md:text-lg transition-all shadow-[0_0_40px_-5px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_-10px_rgba(239,68,68,0.6)] flex items-center justify-center gap-2">
              Get Started
              <ArrowRight size={18} />
              <span className="absolute inset-0 rounded-full ring-1 ring-white/20 group-hover:ring-white/40 transition-all" />
            </button>
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-full font-bold text-base md:text-lg border border-[var(--border)] backdrop-blur-md transition-all flex items-center justify-center gap-2 group">
            <Eye size={18} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            See Demo
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          variants={itemVar}
          className="mt-12 md:mt-16 flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-[var(--text-muted)]"
        >
          {[
            { icon: ShieldCheck, text: "No Webcams" },
            { icon: Lock, text: "Privacy First" },
            { icon: Smartphone, text: "Mobile Ready" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon size={16} className="text-[var(--accent)]" />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
)

// --- How It Works Section ---
const HowItWorks = () => (
  <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)]">
    <div className="container mx-auto px-6 max-w-7xl">
      <SectionHeader
        label="Simple Process"
        title={<>How It <span className="text-[var(--accent)]">Works</span></>}
        description="Streamlined three-step process from creation to analysis."
      />
      <WorkflowDiagram />
    </div>
  </section>
)

// --- What Proct Does Section ---
const WhatProctDoes = () => (
  <section className="py-16 md:py-24 lg:py-32 bg-[var(--bg-primary)]">
    <div className="container mx-auto px-6 max-w-7xl">
      <SectionHeader
        label="Platform Overview"
        title={<>What <span className="text-[var(--accent)]">Proct</span> Does</>}
        description="Unlike generic forms, Proct enforces controlled flow and strict timing."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Structured Creation", desc: "Enables faculty to create structured, time-bound quizzes with ease.", icon: Users },
          { title: "Restricted Access", desc: "Students see only quizzes assigned to their specific year and batch.", icon: Lock },
          { title: "Auto Enforcement", desc: "Rules are enforced automatically without manual invigilation.", icon: ShieldCheck },
          { title: "Audit Logs", desc: "Transparent results and comprehensive logs for faculty review.", icon: Server },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl md:rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 md:mb-6 text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-all">
              <item.icon size={24} />
            </div>
            <h3 className="font-manrope font-bold text-lg md:text-xl lg:text-2xl text-[var(--text-primary)] mb-2">{item.title}</h3>
            <p className="font-inter text-[var(--text-muted)] text-sm leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

// --- Who Content Section ---
const WhoContent = () => (
  <section className="py-16 md:py-24 lg:py-32 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)]">
    <div className="container mx-auto px-6 max-w-5xl">
      <SectionHeader
        label="Target Audience"
        title={<>Who <span className="text-[var(--accent)]">Proct</span> Is For</>}
        description="Built specifically for academic institutions prioritizing integrity."
      />

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
        {[
          {
            icon: Building2,
            title: "Educational Institutions",
            desc: "Colleges and universities that value academic integrity without invasive surveillance measures."
          },
          {
            icon: GraduationCap,
            title: "Academic Departments",
            desc: "Faculty teams seeking consistent, fair, and transparent evaluation practices."
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start p-6 md:p-8 rounded-2xl md:rounded-3xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all"
          >
            <div className="bg-[var(--accent)]/10 p-4 rounded-xl md:rounded-2xl text-[var(--accent)] shrink-0">
              <item.icon size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl lg:text-2xl text-[var(--text-primary)] mb-2">{item.title}</h3>
              <p className="font-inter text-[var(--text-muted)] text-sm md:text-base leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

// --- Core Capabilities Section ---
const CoreCapabilities = () => (
  <section id="features" className="py-16 md:py-24 lg:py-32 relative bg-[var(--bg-primary)] overflow-hidden">
    {/* Background glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/5 blur-[150px] rounded-full pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10 max-w-7xl">
      <SectionHeader
        label="Feature Set"
        title={<>Core <span className="text-[var(--accent)]">Capabilities</span></>}
        description="Everything you need for secure, fair online assessments."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {[
          { title: "Subject Org", desc: "Subject-based quiz organization.", icon: Users },
          { title: "Year Access", desc: "Batch-restricted access.", icon: Lock },
          { title: "Linear Flow", desc: "One-question-at-a-time mode.", icon: Eye },
          { title: "Question Timer", desc: "Per-question time limits.", icon: Clock },
          { title: "Auto Submit", desc: "On rule violations.", icon: AlertTriangle },
          { title: "Watermarking", desc: "Dynamic screen watermarks.", icon: ShieldCheck },
          { title: "Dashboards", desc: "Faculty and Admin views.", icon: Server },
          { title: "Mobile Ready", desc: "Browser-based experience.", icon: Smartphone },
        ].map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all group"
          >
            <f.icon
              size={20}
              className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors mb-3 md:mb-4"
              strokeWidth={1.5}
            />
            <h3 className="font-manrope font-bold text-sm md:text-base lg:text-lg text-[var(--text-primary)] mb-1">{f.title}</h3>
            <p className="font-inter text-[var(--text-muted)] text-xs md:text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

// --- CTA Section ---
const CTASection = () => (
  <section className="py-16 md:py-24 lg:py-32 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
    <div className="container mx-auto px-6 max-w-4xl text-center">
      <h2 className="font-manrope font-extrabold text-2xl md:text-3xl lg:text-4xl text-[var(--text-primary)] mb-4 md:mb-6">
        Ready to Transform Your Assessments?
      </h2>
      <p className="text-[var(--text-muted)] text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto">
        Join institutions that trust Proct for fair, consistent, and reliable online quizzes.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/login">
          <button className="w-full sm:w-auto px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-muted)] text-white rounded-full font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2">
            Get Started Free
            <ArrowRight size={18} />
          </button>
        </Link>
        <Link href="/contact">
          <button className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-full font-bold text-base md:text-lg border border-[var(--border)] transition-all">
            Contact Sales
          </button>
        </Link>
      </div>
    </div>
  </section>
)

// --- Main Landing Page ---
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhatProctDoes />
        <WhoContent />
        <CoreCapabilities />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
