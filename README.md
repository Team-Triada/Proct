<p align="center">
  <img src="public/logo-light.png" alt="Proct" width="180">
</p>

<h1 align="center">Proct</h1>

<p align="center">
  <strong>Integrity signals and audit trails for low-stakes online assessment</strong>
</p>

<p align="center">
  A quiz platform for institutions that want a clear record of how each attempt was taken —<br>
  without webcams, screen recording, or installing anything on a student's machine.
</p>

<p align="center">
  <a href="#what-proct-is">What it is</a> ·
  <a href="#threat-model">Threat model</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## What Proct is

Proct runs timed, targeted quizzes and records what happened during each attempt: how long every
question took, when the tab lost focus, when fullscreen was exited, when a screenshot key was
pressed. Faculty get a per-attempt integrity log alongside the score, and can export both.

It asks for no camera, no microphone, no screen share and no browser extension. Nothing is
installed. That is a deliberate trade: Proct gives up the ability to observe the room in exchange
for being something students can be asked to use without a privacy conversation.

**Proct is a good fit for** class tests, weekly quizzes, formative assessment, and any setting where
the goal is to discourage casual cheating and have evidence when something looks wrong.

**Proct is not a fit for** high-stakes proctored examinations — board exams, certification, anything
where a determined candidate has real incentive to cheat. See the threat model below before
deploying it for those.

---

## Threat model

Being precise about this matters more than the feature list, so it comes first.

### What is enforced server-side

These cannot be bypassed by tampering with the client, because the browser is not consulted:

| Control | How it holds |
|:--|:--|
| Question sequencing | The API refuses to serve any question ahead of the attempt's stored position, so the paper cannot be read in advance |
| Per-question and total timing | Measured from server-written timestamps; a client-supplied elapsed time is ignored entirely |
| Option order | Generated and stored server-side per attempt, then reused; the client never supplies the mapping used for grading |
| Grading | Answer keys never leave the server for a student session |
| Result visibility | `showScore` and `showAnswers` are applied to the API payload, not only the page |
| Eligibility | Semester, year and batch targeting checked on every start and read |
| Attempt ownership | Every attempt route verifies the session owns the attempt |
| Late submission | Recorded durably against the attempt and surfaced to faculty |

### What is detection only

The in-quiz integrity signals — tab switches, focus loss, fullscreen exits, screenshot key presses,
DevTools heuristics, copy/paste attempts, window resizes — are browser event listeners. They are
**deterrents and evidence, not prevention**. A student who disables JavaScript, edits the page, or
scripts the API directly will produce no signals at all.

### What Proct cannot see

- A second device, a phone, or notes on the desk
- Another person in the room
- A photograph of the screen taken with a camera
- Screen capture performed outside the browser tab

If your assessment needs those covered, you need invigilation — in a room, or via a locked-down
kiosk client. Proct's browser-based design cannot provide it, and no amount of JavaScript will
change that.

---

## Features

### For students

| | |
|:--|:--|
| **Focused interface** | One question at a time, no distractions |
| **Timing modes** | Per-question, total duration, or untimed |
| **Progress is saved** | Answers persist as you go; a reload resumes where you left off, with the server's clock |
| **Question types** | Multiple choice, checkbox, dropdown, short answer, long answer |
| **Works on mobile** | Responsive layout, no desktop requirement |
| **Self-serve password reset** | Emailed, single-use, one-hour expiry |
| **Themes** | Light and dark |

### For faculty

| | |
|:--|:--|
| **Quiz builder** | Five question types, per-question points, configurable question count |
| **Targeting** | Restrict by academic year, semester and batch |
| **Timing** | Per-question limit, whole-quiz duration, or no limit |
| **Availability window** | Open and close times per quiz |
| **Enforcement mode** | `NORMAL` (two strikes) or `STRICT` (one strike) before auto-submit |
| **Result visibility** | Independently control whether students see scores and correct answers |
| **Auto-grading** | Objective questions scored on submit, with partial credit for checkboxes |
| **Manual grading** | Written answers graded with per-answer feedback |
| **Integrity log** | Every signal per attempt, severity-tagged and timestamped |
| **Attempt reset** | Clear a stuck or interrupted attempt so a student can retake |
| **CSV export** | Scores summary, or one row per answer for item analysis |

### For admins

| | |
|:--|:--|
| **User management** | Create, edit and delete users with cascade-safe deletion |
| **Subject approval** | Review and approve faculty-submitted subjects |
| **Search** | Across users, subjects and quizzes |
| **Analytics** | Attempt trends, per-subject ranking, recent violation feed, live counts |
| **Platform settings** | Field labels, formats, allowed email domains, semester and batch ranges, which targeting dimensions are active |

### Account security

| | |
|:--|:--|
| **Password hashing** | bcrypt, cost factor 12 |
| **Password policy** | 8+ characters with upper, lower, digit and symbol — enforced identically at signup and reset |
| **Rate limiting** | Per-IP caps on login, registration and password reset |
| **Account lockout** | Temporary lock after repeated failures, so one account cannot be ground through a wordlist |
| **No enumeration** | Login and password reset respond identically for unknown and known addresses |
| **Reset tokens** | 256-bit, stored only as a SHA-256 digest, single-use, one-hour expiry |

---

## Tech stack

| Layer | Technology |
|:--|:--|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT sessions, credentials provider) |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI |
| Charts | Recharts |
| Animation | Framer Motion |
| Tests | Vitest, Testing Library |

Any PostgreSQL instance works — the only Postgres-specific coupling is the connection string. The
project is developed against Supabase, but Neon, RDS or a local Docker container are drop-in
replacements.

---

## Getting started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL 14+ database
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/Team-Triada/Proct.git
cd Proct

# 2. Install (runs prisma generate automatically)
npm install

# 3. Configure
cp .env.example .env
#    Then edit .env — at minimum DATABASE_URL, DIRECT_URL and NEXTAUTH_SECRET

# 4. Create the schema
npx prisma db push

# 5. Optional: load demo users, subjects and quizzes
npx prisma db seed

# 6. Run
npm run dev
```

The app is served at [http://localhost:3000](http://localhost:3000).

> **Why `db push` and not `migrate deploy`?** The committed migration history in
> `prisma/migrations/` was generated against MySQL — the SQL uses backtick quoting and
> `migration_lock.toml` still declares `provider = "mysql"`. The datasource is now PostgreSQL, so
> `prisma migrate deploy` aborts with error `P3019` and none of those files can be applied. The
> schema is currently maintained with `prisma db push`.
>
> This is worth fixing before the project carries production data, because `db push` gives you no
> migration history, no review of generated SQL, and no rollback path. To repair it: archive the
> existing `prisma/migrations/` directory, set `provider = "postgresql"` in `migration_lock.toml`,
> then baseline against the live database with
> `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` and record
> that as an initial migration via `prisma migrate resolve --applied`.

### Seeded accounts

Present only if you ran step 5. **Delete or change these before exposing the instance.**

| Role | Email | Password |
|:--|:--|:--|
| Admin | `admin@college.edu` | `password123` |
| Faculty | `alan.turing@college.edu` | `password123` |
| Student | `student1@yenepoya.edu.in` | `password123` |

### Scripts

| Command | Purpose |
|:--|:--|
| `npm run dev` | Development server (Turbopack) |
| `npm run dev:webpack` | Development server (Webpack, if Turbopack misbehaves) |
| `npm run build` | Production build |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |

---

## Configuration

### Environment variables

| Variable | Required | Purpose |
|:--|:--:|:--|
| `DATABASE_URL` | Yes | Runtime connection. Use the **pooled** URL (port 6543 on Supabase) for serverless deployments |
| `DIRECT_URL` | Yes | Direct connection (port 5432), used by `prisma migrate` only |
| `NEXTAUTH_SECRET` | Yes | Session signing key. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical app URL; also used to build links in outbound email |
| `RESEND_API_KEY` | For email | Enables password reset delivery |
| `MAIL_FROM` | For email | Verified sender, e.g. `Proct <no-reply@yourdomain.edu>` |

> **Password reset needs email configured.** Without `RESEND_API_KEY` and `MAIL_FROM`, reset links
> are written to the server log rather than sent. That is workable in development but means
> production users cannot reset their own passwords unaided.

### Platform settings

Institution-specific rules live in the database, editable at **Admin → Settings**, so a new
deployment does not require code changes:

- Allowed email domains (empty means any domain)
- Registration number and campus ID — label, format, length bounds, whether required
- Maximum semester and batch number
- Available academic years
- Which targeting dimensions (year, semester, batch) are active

### Deployment notes

Two things to get right before real use:

1. **Use the pooled connection string.** Serverless functions each open their own connection; the
   direct URL will exhaust the database's connection limit. `DIRECT_URL` stays direct for migrations.

2. **Rate limiting is per-instance.** Counters live in process memory, so on multi-instance or
   serverless hosting the effective limit is multiplied by the instance count and resets on cold
   start. It blunts a naive password spray but is not a shared-state limiter. For a hardened
   deployment, back `src/lib/rateLimit.ts` with Redis — the call sites do not change.

---

## Usage

### Creating a quiz

1. Sign in as faculty.
2. **Create Quiz** — pick a subject (must be admin-approved first).
3. Add questions, choosing a type and point value for each.
4. Choose a timing mode and, if relevant, the per-question or total limit.
5. Set targeting: academic year, semester, batch.
6. Decide whether students may see their score and the correct answers afterwards.
7. Optionally set an availability window.
8. Publish.

### Taking a quiz

1. Sign in as a student — only quizzes matching your year, semester and batch appear.
2. Read the instructions screen, then start.
3. Answer within the time allowed; progress saves as you go.
4. Submit, or let the timer submit for you.
5. Scores and correct answers appear only if the faculty member enabled them.

### Reviewing results

1. **Faculty → Quizzes → Results**.
2. Scores, grading status and violation counts per student; expand a row for the full integrity log.
3. **Grade** to mark written answers and leave feedback.
4. **Reset** to clear an interrupted attempt and let the student retake it.
5. **Scores CSV** for one row per student, **Answers CSV** for one row per answer.

---

## API reference

All routes require an authenticated session unless noted. Roles: **S**tudent, **F**aculty, **A**dmin.

### Authentication

| Method | Route | Access | Purpose |
|:--|:--|:--:|:--|
| `*` | `/api/auth/[...nextauth]` | Public | NextAuth handlers |
| `POST` | `/api/auth/register` | Public | Student self-registration |
| `POST` | `/api/auth/forgot-password` | Public | Request a reset link |
| `POST` | `/api/auth/reset-password` | Public | Consume a reset token |

### Quizzes

| Method | Route | Access | Purpose |
|:--|:--|:--:|:--|
| `GET` | `/api/quizzes` | S·F·A | List quizzes visible to the caller |
| `POST` | `/api/quizzes` | F | Create a quiz |
| `GET` | `/api/quizzes/[id]` | S·F·A | Quiz detail (answer keys stripped for students) |
| `PUT` | `/api/quizzes/[id]` | F·A | Update a quiz |
| `DELETE` | `/api/quizzes/[id]` | F·A | Delete a quiz and its attempts |
| `GET` `POST` `PUT` `DELETE` | `/api/quizzes/[id]/questions/[questionId]` | F·A | Read, add, update or remove one question |
| `POST` | `/api/quizzes/[id]/start` | S | Start or resume an attempt |
| `GET` | `/api/quizzes/[id]/results/export` | F·A | CSV export — `?format=summary\|answers` |

### Attempts

| Method | Route | Access | Purpose |
|:--|:--|:--:|:--|
| `GET` | `/api/attempts/[id]` | S | Fetch a question at or before the current position |
| `POST` | `/api/attempts/[id]` | S | Submit an answer and advance |
| `POST` | `/api/attempts/[id]/save` | S | Save an answer without advancing |
| `POST` | `/api/attempts/[id]/submit` | S | Final submission |
| `POST` | `/api/attempts/[id]/violation` | S | Record an integrity signal |
| `POST` | `/api/attempts/[id]/reload` | S | Record a page reload |
| `POST` | `/api/attempts/[id]/reset` | F·A | Clear an attempt so the student can retake |
| `POST` | `/api/attempts/grade` | F·A | Grade written answers |

### Subjects, users and settings

| Method | Route | Access | Purpose |
|:--|:--|:--:|:--|
| `GET` `POST` | `/api/subjects/my` | F | List or create own subjects |
| `PUT` `DELETE` | `/api/subjects/my/[id]` | F | Update or remove an own subject |
| `PUT` `DELETE` | `/api/subjects/[id]` | A | Update or remove any subject |
| `POST` | `/api/subjects/[id]/approve` | A | Approve a subject |
| `POST` | `/api/subjects/[id]/reject` | A | Reject a subject |
| `GET` | `/api/faculty/dashboard` | F | Faculty dashboard aggregates |
| `GET` | `/api/faculty/students` | F·A | Students in scope |
| `PUT` | `/api/faculty/students/[id]` | F·A | Update a student record |
| `POST` | `/api/admin/users` | A | Create a user |
| `PUT` `DELETE` | `/api/admin/users/[id]` | A | Update or delete a user |
| `GET` `PUT` | `/api/admin/settings` | A | Read or update platform settings |
| `GET` | `/api/settings/public` | Public | Settings needed by the registration form |
| `GET` `PUT` | `/api/profile` | S·F·A | Read or update own profile |

---

## Project structure

```
src/
├── app/
│   ├── admin/                  Admin dashboard
│   ├── api/                    Route handlers
│   ├── faculty/                Faculty dashboard, quiz builder, results
│   ├── student/                Student dashboard and attempt history
│   ├── quiz/[id]/              Instructions and attempt runner
│   ├── login/                  Sign in and registration
│   ├── forgot-password/        Reset request
│   ├── reset-password/         Reset completion
│   └── (public pages)          About, Docs, FAQ, Privacy, Terms, Support
├── components/                 Shared and dashboard-specific components
├── hooks/
│   └── useProctoringEngine.ts  Client-side integrity signal collection
├── lib/
│   ├── attemptTiming.ts        Server-authoritative timing rules
│   ├── shuffle.ts              Fisher-Yates shuffle, option-order mappings
│   ├── rateLimit.ts            Fixed-window rate limiting
│   ├── loginThrottle.ts        Per-account lockout
│   ├── passwordPolicy.ts       Shared password rules
│   ├── passwordReset.ts        Reset token issue and resolution
│   ├── mailer.ts               Outbound email
│   ├── csv.ts                  Injection-safe CSV writer
│   ├── quizFilters.ts          Targeting and eligibility
│   ├── settings.ts             Platform settings access
│   ├── auth.ts                 NextAuth configuration
│   └── db.ts                   Prisma client singleton
├── middleware.ts               Edge rate limiting
└── __tests__/                  Unit, flow, smoke and E2E tests

prisma/
├── schema.prisma
├── migrations/                 Legacy MySQL history — not applicable, see note above
└── seed.ts
```

---

## Testing

```bash
npm test                 # full suite
npm run test:coverage    # with coverage
```

The suite covers API authorisation, grading arithmetic, targeting and eligibility, timing
enforcement, option-order integrity, rate limiting and lockout, password policy and reset tokens,
CSV escaping, and end-to-end platform flows.

`src/__tests__/e2e/platform-integrity.test.ts` runs against a **live database** — it creates and
then deletes its own records, so point `DATABASE_URL` at a development instance, never production.
It fails if the database is unreachable. Every other suite is fully mocked and runs offline.

---

## Contributing

1. Fork and branch: `git checkout -b feature/your-change`
2. Keep `npm test` and `npm run lint` clean.
3. Add tests for behaviour changes — especially anything touching grading, timing or access control.
4. Commit, push, and open a pull request describing what changed and why.

If you are changing an integrity control, say in the PR whether it is enforced server-side or is
detection only. Keeping that distinction honest is the point of the project.

---

## License

No license file is currently present in this repository, so default copyright applies and no
permission to reuse is granted. If you intend this to be open source, add a `LICENSE` file.

---

<p align="center">
  <sub>Built by Team Triada · Integrity through evidence, not surveillance</sub>
</p>
