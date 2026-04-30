'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Eye,
  AlertTriangle,
  Server,
  Users,
  Building2,
  GraduationCap,
  ArrowRight,
  Settings,
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { WorkflowDiagram } from '@/components/landing/WorkflowDiagram'
import BorderGlow from '@/components/ui/border-glow'

// --- Assets ---
// None

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
  <div className={`mb-16 md:mb-24 ${centered ? 'text-center mx-auto' : 'flex flex-col md:flex-row gap-8 justify-between items-end'}`}>
    <div className={centered ? 'max-w-3xl mx-auto' : 'max-w-2xl text-left'}>
      {label && (
        <span className="eyebrow mb-4 block">
          {label}
        </span>
      )}
      <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl lg:text-5xl text-[var(--text-primary)] tracking-tight leading-[1.1] uppercase">
        {title}
      </h2>
    </div>
    {description && (
      <div className={centered ? 'mt-6' : 'max-w-md'}>
        <p className={`font-mono text-sm md:text-base text-[var(--text-muted)] leading-relaxed ${centered ? 'max-w-2xl mx-auto' : 'border-l border-[var(--border-subtle)] pl-6 text-left'}`}>
          {description}
        </p>
      </div>
    )}
  </div>
)

// Proct theme colors for BorderGlow
const GLOW_COLORS_RED = ['#e03e3e', '#ff6b6b', '#e03e3e']
const GLOW_COLORS_BLUE = ['#60a5fa', '#818cf8', '#60a5fa']
const GLOW_COLORS_GREEN = ['#34d399', '#6ee7b7', '#34d399']
const GLOW_COLORS_MIXED = ['#e03e3e', '#60a5fa', '#34d399']

// --- Hero Section ---
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-primary)] pt-20">
    {/* Subtle Dot Grid Background */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)'
      }}
    />

    {/* Very subtle top glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent)] opacity-[0.03] blur-[100px] pointer-events-none rounded-full" />

    <div className="page-container relative z-10 text-center max-w-4xl py-20 md:py-32">
      <motion.div
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center"
      >
        {/* Sleek Badge */}
        <motion.div variants={itemVar} className="mb-8">
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="font-inter text-xs font-medium text-[var(--text-secondary)] tracking-wide">
              Introducing Proct V1
            </span>
          </div>
        </motion.div>

        {/* Startup-style Heading */}
        <motion.h1
          variants={itemVar}
          className="font-jakarta font-extrabold tracking-tight mb-6 leading-[1.05]"
          style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
        >
          <span className="text-[var(--text-primary)]">Online Quizzes,</span>
          <br />
          <span className="text-[var(--text-muted)]">Without the Chaos.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVar}
          className="text-base md:text-xl text-[var(--text-secondary)] font-inter max-w-2xl mx-auto mb-10 leading-relaxed px-4"
        >
          A mobile-first assessment platform designed for academic integrity.
          Enforce strict rules, track real-time violations, and manage batches effortlessly.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVar}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-primary)] rounded-lg font-semibold text-sm transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-semibold text-sm border border-[var(--border)] transition-colors flex items-center justify-center gap-2"
          >
            Book a Demo
          </Link>
        </motion.div>

        {/* Clean Trust Indicators */}
        <motion.div
          variants={itemVar}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12"
        >
          {[
            { icon: ShieldCheck, text: "Integrity First" },
            { icon: Lock, text: "Privacy Compliant" },
            { icon: Smartphone, text: "Mobile Native" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-[var(--text-muted)]">
              <item.icon size={16} />
              <span className="font-inter text-xs md:text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
)

// --- How It Works Section ---
const HowItWorks = () => (
  <section id="how-it-works" className="py-20 md:py-32 lg:py-40 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)]">
    <div className="page-container">
      <SectionHeader
        label="Simple Process"
        title={<>How It <span className="text-[var(--accent)]">Works</span></>}
        description="Streamlined three-step process from creation to analysis."
      />
      <WorkflowDiagram />
    </div>
  </section>
)

// --- What Proct Does Section (Zigzag Layout) ---
const WhatProctDoes = () => (
  <section className="py-20 md:py-32 lg:py-40 bg-[var(--bg-primary)] relative">
    {/* Ambient glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent)] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />

    <div className="page-container relative z-10">
      <SectionHeader
        label="Platform Overview"
        title={<>What <span className="text-[var(--accent)]">Proct</span> Does</>}
        description="Unlike generic forms, Proct enforces controlled flow and strict timing."
      />

      <div className="flex flex-col gap-24 md:gap-32 mt-16 md:mt-24">

        {/* Step 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl pill-red">
                <Users size={20} />
              </div>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>STEP 01</span>
            </div>
            <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[var(--text-primary)] leading-tight uppercase">
              Structured Creation
            </h3>
            <p className="font-mono text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
              Stop fighting with generic form builders. Create structured, time-bound quizzes designed specifically for academic integrity. Configure per-question timers, linear flow enforcement, and batch restrictions in seconds.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
            <BorderGlow
              backgroundColor="var(--bg-secondary)"
              colors={GLOW_COLORS_RED}
              glowColor="0 70 65"
              borderRadius={16}
              glowRadius={30}
              glowIntensity={0.5}
              edgeSensitivity={30}
              coneSpread={22}
            >
              <div className="p-6 md:p-8 h-full flex flex-col gap-4 min-h-[280px]">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <span className="eyebrow text-xs">Quiz Configuration</span>
                  <Settings size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm md:text-base text-[var(--text-secondary)]">Time Limit per Question</span>
                    <span className="font-mono text-sm text-[var(--text-primary)]">60s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm md:text-base text-[var(--text-secondary)]">Tab Switch Enforcement</span>
                    <span className="px-2 py-1 rounded text-xs font-mono bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">STRICT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm md:text-base text-[var(--text-secondary)]">Question Flow</span>
                    <span className="font-mono text-sm text-[var(--text-primary)]">Linear</span>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl pill-blue">
                <Lock size={20} />
              </div>
              <span className="eyebrow" style={{ color: 'var(--neon-blue)' }}>STEP 02</span>
            </div>
            <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[var(--text-primary)] leading-tight uppercase">
              Restricted Access
            </h3>
            <p className="font-mono text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
              No more sharing links. Students authenticate and see only the quizzes assigned to their specific year and batch. Give your department complete control over who takes what, and when.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
            <BorderGlow
              backgroundColor="var(--bg-secondary)"
              colors={GLOW_COLORS_BLUE}
              glowColor="220 70 70"
              borderRadius={16}
              glowRadius={30}
              glowIntensity={0.5}
              edgeSensitivity={30}
              coneSpread={22}
            >
              <div className="p-6 md:p-8 h-full flex flex-col gap-4 min-h-[280px]">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <span className="eyebrow text-xs">Access Control</span>
                  <Lock size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="space-y-4 mt-2">
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                      <span className="font-inter text-sm md:text-base font-medium text-[var(--text-primary)]">Batch 2024</span>
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-wider text-[var(--success)]">GRANTED</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-between opacity-50 grayscale">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
                      <span className="font-inter text-sm md:text-base font-medium text-[var(--text-primary)]">Batch 2025</span>
                    </div>
                    <span className="font-mono text-xs font-semibold tracking-wider text-[var(--text-muted)]">DENIED</span>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl pill-green">
                <Server size={20} />
              </div>
              <span className="eyebrow" style={{ color: 'var(--success)' }}>STEP 03</span>
            </div>
            <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[var(--text-primary)] leading-tight uppercase">
              Auto Enforcement & Audit
            </h3>
            <p className="font-mono text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
              Rules are enforced automatically. We log every tab switch, every window blur, and every timing anomaly. Review transparent, detailed audit trails for every student attempt.
            </p>
          </div>
          <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
            <BorderGlow
              backgroundColor="var(--bg-secondary)"
              colors={GLOW_COLORS_MIXED}
              glowColor="160 60 60"
              borderRadius={16}
              glowRadius={30}
              glowIntensity={0.5}
              edgeSensitivity={30}
              coneSpread={22}
            >
              <div className="p-6 md:p-8 h-full flex flex-col gap-4 font-mono min-h-[280px]">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 font-inter">
                  <span className="eyebrow text-xs">Real-Time Audit Trail</span>
                  <Server size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="space-y-4 mt-2 text-xs md:text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text-muted)] shrink-0">10:42:01</span>
                    <span className="text-[var(--success)] font-bold">[INFO]</span>
                    <span className="text-[var(--text-secondary)]">Attempt initialized. IP: 192.168.1.1</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text-muted)] shrink-0">10:45:15</span>
                    <span className="text-[var(--warning)] font-bold">[WARN]</span>
                    <span className="text-[var(--text-primary)]">Visibility change detected: hidden</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text-muted)] shrink-0">10:45:22</span>
                    <span className="text-[var(--danger)] bg-[var(--danger)]/10 px-1 rounded border border-[var(--danger)]/20 font-bold">[VIOL]</span>
                    <span className="text-[var(--danger)]">Tab switch threshold exceeded.</span>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

      </div>
    </div>
  </section>
)

// --- Who Content Section ---
const WhoContent = () => (
  <section className="py-20 md:py-32 lg:py-40 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)] relative overflow-hidden">
    {/* Subtle grid background */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMEwxIDIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDFMMjAgMSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] pointer-events-none" />
    
    <div className="page-container relative z-10">
      <SectionHeader 
        label="Deployment Targets"
        title={<>ENGINEERED FOR <span className="text-[var(--text-muted)]">STAKEHOLDERS.</span></>}
        description="Proct aligns the requirements of strict academic evaluation with the constraints of ethical data privacy and robust IT infrastructure."
        centered={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Building2,
            title: "Department Leadership",
            desc: "Enforce uniform academic standards across all batches. Monitor platform-wide integrity metrics and ensure zero-compromise assessments without violating student privacy laws.",
            metricLabel: "PRIVACY COMPLIANCE",
            metricValue: "100%",
            pill: "pill-red",
            glowColors: GLOW_COLORS_RED,
            hsl: "0 70 65",
          },
          {
            icon: GraduationCap,
            title: "Faculty & Examiners",
            desc: "Design assessments that are mathematically impossible to cheat on. Use time-pressured linear flows to test true recall, and review cryptographic-level audit logs for every student.",
            metricLabel: "ENFORCEMENT RATE",
            metricValue: "STRICT",
            pill: "pill-blue",
            glowColors: GLOW_COLORS_BLUE,
            hsl: "220 70 70",
          },
          {
            icon: Server,
            title: "IT & Systems Admin",
            desc: "Deploy an assessment engine built by cybersecurity engineers. Zero invasive spyware, strict Role-Based Access Control, and seamless batch integration through a predictable architecture.",
            metricLabel: "SYSTEM OVERHEAD",
            metricValue: "MINIMAL",
            pill: "pill-green",
            glowColors: GLOW_COLORS_GREEN,
            hsl: "150 70 40",
          }
        ].map((item, i) => (
          <BorderGlow
            key={i}
            backgroundColor="var(--bg-secondary)"
            colors={item.glowColors}
            glowColor={item.hsl}
            borderRadius={16}
            glowRadius={25}
            glowIntensity={0.4}
            edgeSensitivity={30}
            coneSpread={22}
            className="h-full"
          >
            <div className="flex flex-col h-full p-8 md:p-10 border border-[var(--border-subtle)] bg-[var(--bg-primary)] rounded-2xl group transition-colors hover:bg-[var(--bg-secondary)] relative overflow-hidden">
              <div className={`w-12 h-12 flex items-center justify-center mb-8 ${item.pill} rounded-xl border`}>
                <item.icon size={24} />
              </div>
              
              <h3 className="font-jakarta font-bold text-xl lg:text-2xl text-[var(--text-primary)] mb-4 tracking-tight">
                {item.title}
              </h3>
              
              <p className="font-inter text-[var(--text-muted)] text-sm leading-relaxed mb-10 flex-1">
                {item.desc}
              </p>
              
              <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--text-secondary)] tracking-widest">{item.metricLabel}</span>
                <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{item.metricValue}</span>
              </div>
            </div>
          </BorderGlow>
        ))}
      </div>
    </div>
  </section>
)

// --- Core Capabilities Section ---
const CoreCapabilities = () => (
  <section id="features" className="py-20 md:py-32 lg:py-40 relative bg-[var(--bg-primary)] overflow-hidden">
    {/* Background glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)] opacity-[0.03] blur-[180px] rounded-full pointer-events-none" />

    <div className="page-container relative z-10">
      <SectionHeader
        label="Feature Set"
        title={<>Core <span className="text-[var(--accent)]">Capabilities</span></>}
        description="Everything you need for secure, fair online assessments."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Card 1: Intelligent Flow Control (span 2) */}
        <div className="md:col-span-2">
          <BorderGlow
            backgroundColor="var(--bg-secondary)"
            colors={GLOW_COLORS_RED}
            glowColor="0 70 65"
            borderRadius={16}
            glowRadius={30}
            glowIntensity={0.5}
            edgeSensitivity={30}
            coneSpread={22}
          >
            <div className="flex flex-col md:flex-row h-full">
              <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 pill-red shadow-sm">
                   <Eye size={22}/>
                </div>
                <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-3 uppercase">Intelligent Flow Control</h3>
                <p className="font-inter text-[var(--text-muted)] leading-relaxed">Enforce true academic rigor with one-way question navigation. By combining linear flow with strict per-question time limits, students cannot backtrack, skip ahead, or stall. It's the ultimate deterrent against collaborative cheating.</p>
              </div>
              
              <div className="md:w-2/5 bg-[var(--bg-primary)] border-t md:border-t-0 md:border-l border-[var(--border-subtle)] rounded-b-[16px] md:rounded-bl-none md:rounded-tr-[16px] md:rounded-br-[16px] p-6 relative overflow-hidden flex items-center justify-center min-h-[250px]">
                <div className="w-full max-w-[280px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-lg p-5 space-y-5">
                   <div className="flex justify-between items-center">
                     <span className="font-inter font-medium text-sm text-[var(--text-primary)]">Question 4</span>
                     <div className="px-2.5 py-1 rounded bg-[var(--danger)]/10 text-[var(--danger)] font-mono text-xs font-bold border border-[var(--danger)]/20 animate-pulse">00:45</div>
                   </div>
                   <div className="space-y-2">
                     <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                       <div className="w-[40%] h-full bg-[var(--danger)] rounded-full shadow-[0_0_10px_var(--danger)]" />
                     </div>
                     <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                       <span>Elapsed: 00:15</span>
                       <span>Total: 01:00</span>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                     <div className="h-8 bg-[var(--bg-primary)] rounded-md opacity-50 border border-[var(--border-subtle)] flex items-center justify-center"><span className="text-[10px] text-[var(--text-muted)]">Previous</span></div>
                     <div className="h-8 bg-[var(--danger)] rounded-md opacity-90 border border-[var(--danger)]/20 shadow-sm flex items-center justify-center"><span className="text-[10px] text-white font-medium">Next</span></div>
                   </div>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Card 2: Granular Access (span 1) */}
        <div className="md:col-span-1">
          <BorderGlow
            backgroundColor="var(--bg-secondary)"
            colors={GLOW_COLORS_BLUE}
            glowColor="220 70 70"
            borderRadius={16}
            glowRadius={30}
            glowIntensity={0.5}
            edgeSensitivity={30}
            coneSpread={22}
          >
            <div className="flex flex-col h-full">
              <div className="p-6 md:p-8 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 pill-blue shadow-sm">
                   <Lock size={22}/>
                </div>
                <h3 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-3 uppercase">Granular Access</h3>
                <p className="font-inter text-[var(--text-muted)] text-sm leading-relaxed">Abandon generic quiz links. Restrict access precisely by subject, academic year, and batches.</p>
              </div>
              
              <div className="bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] rounded-b-[16px] p-6 relative overflow-hidden flex items-center justify-center min-h-[160px]">
                <div className="flex flex-col gap-3 w-full max-w-[220px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Batch</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">2024</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Department</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20">CS</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-sm">
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Section</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-500/10 text-green-500 border border-green-500/20">A</span>
                  </div>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Card 3: Automated Invigilation (span 1) */}
        <div className="md:col-span-1">
          <BorderGlow
            backgroundColor="var(--bg-secondary)"
            colors={GLOW_COLORS_MIXED}
            glowColor="160 60 60"
            borderRadius={16}
            glowRadius={30}
            glowIntensity={0.5}
            edgeSensitivity={30}
            coneSpread={22}
          >
            <div className="flex flex-col h-full">
              <div className="p-6 md:p-8 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 pill-green shadow-sm">
                   <ShieldCheck size={22}/>
                </div>
                <h3 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-3 uppercase">Zero Tolerance</h3>
                <p className="font-inter text-[var(--text-muted)] text-sm leading-relaxed">Auto-submit attempts upon detecting window blurs or tab switches. Watermarks deter recording.</p>
              </div>
              
              <div className="bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] rounded-b-[16px] p-6 relative overflow-hidden flex items-center justify-center min-h-[160px]">
                <div className="w-full max-w-[240px] p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col gap-3 relative shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl" />
                  <div className="flex items-center gap-2">
                     <AlertTriangle size={16} className="text-red-500" />
                     <span className="font-mono text-[10px] text-red-500 font-bold tracking-wider">VIOLATION DETECTED</span>
                  </div>
                  <p className="font-inter text-xs text-red-500/80 leading-tight">Window focus lost. The attempt has been automatically submitted.</p>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Card 4: Faculty Dashboards (span 2) */}
        <div className="md:col-span-2">
          <BorderGlow
            backgroundColor="var(--bg-secondary)"
            colors={GLOW_COLORS_BLUE}
            glowColor="220 70 70"
            borderRadius={16}
            glowRadius={30}
            glowIntensity={0.5}
            edgeSensitivity={30}
            coneSpread={22}
          >
            <div className="flex flex-col md:flex-row h-full">
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 pill-yellow shadow-sm">
                   <Server size={22}/>
                </div>
                <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-3 uppercase">Comprehensive Dashboards</h3>
                <p className="font-inter text-[var(--text-muted)] leading-relaxed">Review student attempts with surgical precision. Access granular event logs that record exactly when a student switched tabs, paused, or submitted. Export detailed analytics instantly.</p>
              </div>
              
              <div className="md:w-1/2 bg-[var(--bg-primary)] border-t md:border-t-0 md:border-l border-[var(--border-subtle)] rounded-b-[16px] md:rounded-bl-none md:rounded-tr-[16px] md:rounded-br-[16px] pt-8 px-6 md:px-8 relative overflow-hidden flex items-end justify-center min-h-[250px]">
                 <div className="w-full h-[180px] flex items-end gap-2 md:gap-3">
                   {[30, 45, 25, 60, 80, 45, 90, 65, 40, 75, 55].map((h, i) => (
                     <div key={i} className="flex-1 bg-[var(--bg-secondary)] border-x border-t border-[var(--border-subtle)] rounded-t-lg flex items-end p-1 h-full shadow-sm relative group transition-all hover:-translate-y-1">
                        <div className="w-full bg-[var(--neon-blue)] opacity-40 group-hover:opacity-100 transition-opacity rounded-sm" style={{height: `${h}%`}} />
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  </section>
)

// --- CTA Section ---
const CTASection = () => (
  <section className="relative bg-[var(--bg-primary)] overflow-hidden border-t border-[var(--border-subtle)]">
    {/* Grid Background Pattern */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-50" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-primary)]" />

    {/* Center Horizontal / Vertical Hairlines */}
    <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />
    
    <div className="page-container relative z-10 py-32 md:py-48 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--accent)] text-xs font-mono font-bold tracking-widest uppercase">
        <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-none animate-pulse" />
        System Ready
      </div>
      
      <h2 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[7rem] text-[var(--text-primary)] leading-[0.9] tracking-tighter mb-8 max-w-5xl mix-blend-plus-lighter">
        NO MORE <br/>COMPROMISES.
      </h2>
      
      <p className="text-[var(--text-secondary)] text-lg md:text-xl mb-12 max-w-2xl font-mono tracking-tight">
        EXACT ASSESSMENTS. ZERO TOLERANCE.<br/>DEPLOY PROCT TODAY.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-0 border border-[var(--border-subtle)] w-full max-w-lg bg-[var(--bg-secondary)] shadow-2xl relative group">
        <Link
          href="/login"
          className="flex-1 relative px-8 py-5 bg-white hover:bg-gray-200 text-black font-black text-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          Deploy Now
          <ArrowRight size={18} />
        </Link>
        <div className="w-px bg-[var(--border-subtle)] hidden sm:block" />
        <div className="h-px bg-[var(--border-subtle)] block sm:hidden" />
        <Link
          href="/contact"
          className="flex-1 relative px-8 py-5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold text-lg transition-colors uppercase tracking-widest group-hover:text-white"
        >
          Sales
        </Link>

        {/* Glow behind buttons */}
        <div className="absolute -inset-1 bg-[var(--accent)] blur-xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none -z-10" />
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
