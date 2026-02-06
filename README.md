<p align="center">
  <img src="public/logo-light.png" alt="Proct Logo" width="200"/>
</p>

<p align="center">
  <strong>Integrity-First Online Quiz Platform</strong><br>
  Secure, privacy-respecting assessments without webcams or screen recording
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎯 Overview

Proct is a modern quiz platform built for educational institutions that prioritize **student privacy** while maintaining **assessment integrity**. Unlike traditional proctoring solutions, Proct achieves security without invasive surveillance.

### Why Proct?

| Traditional Proctoring | Proct |
|----------------------|-------|
| ❌ Requires webcam | ✅ No webcam needed |
| ❌ Records screen | ✅ No screen recording |
| ❌ Invasive AI monitoring | ✅ Privacy-first approach |
| ❌ High bandwidth usage | ✅ Lightweight & fast |

---

## ✨ Features

### For Students
- 📝 Clean, distraction-free quiz interface
- ⏱️ Per-question timers with auto-save
- 📱 Mobile-optimized experience
- 🌙 Dark/Light theme support
- 📊 Instant score feedback

### For Faculty
- ✏️ Create quizzes with 5 question types:
  - Multiple Choice
  - Checkbox (Multi-select)
  - Dropdown
  - Short Answer
  - Long Answer
- 🎯 Target specific Year/Batch/Section
- 📈 Auto-grading for objective questions
- ✍️ Manual grading with feedback for subjective answers
- 📋 View detailed attempt analytics

### For Admins
- 👥 Complete user management
- 📚 Subject approval workflow
- 📊 Platform-wide analytics
- ⚙️ System configuration

### Integrity Features
- 🚫 Tab switch detection
- 📋 Copy/paste prevention
- 🔒 Question randomization
- ⚠️ Violation logging
- � Tab switch detection
- 📋 Copy/paste prevention
- 🔒 Question randomization
- ⚠️ Violation logging
- �🛑 Auto-submit on violations

### Security & Management
- 🔐 **Enhanced Registration**: Strict email domain (`@yenepoya.edu.in`), Campus ID, and password policy enforcement.
- 🗑️ **Robust Deletion**: Safe cascade deletion for users, ensuring all related attempts and data are cleaned up without errors.
- ⚠️ **Action Warnings**: Confirmation modals for critical actions like deletion.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | MySQL + Prisma ORM |
| **Auth** | NextAuth.js (JWT) |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **UI Components** | Radix UI |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Team-Triada/Proct.git
cd Proct

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed admin account
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```env
# Database (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/proct"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📖 Usage

### Initial Access
1. **Admin Login**:
   - Email: `admin@college.edu`
   - Password: `admin123`

2. **Faculty/Student Access**:
   - Users must register via the **Registration Page**.
   - **Requirements**:
     - Email must be `@yenepoya.edu.in`.
     - 5-digit Campus ID.
     - Strong password (8+ chars, upper, lower, number, special).

### Creating a Quiz
1. Login as Faculty
2. Navigate to **Create Quiz**
3. Select subject and add questions
4. Set time per question and enforcement mode
5. **Targeting**: Assign to specific Years (e.g., 2024-27) or Batches (e.g., Batch 1).
6. Publish when ready

### Taking a Quiz

1. Login as Student
2. View available quizzes on dashboard
3. Read instructions carefully
4. Complete quiz within time limits
5. View score immediately after submission

---

## 📡 API Reference

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Quizzes
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/[id]` - Get quiz details
- `PUT /api/quizzes/[id]` - Update quiz
- `DELETE /api/quizzes/[id]` - Delete quiz
- `POST /api/quizzes/[id]/start` - Start attempt

### Attempts
- `GET /api/attempts/[id]` - Get current question
- `POST /api/attempts/[id]` - Submit answer
- `POST /api/attempts/[id]/save` - Save progress
- `POST /api/attempts/[id]/submit` - Final submission
- `POST /api/attempts/[id]/violation` - Log violation
- `POST /api/attempts/grade` - Faculty grading

### Admin
- `GET/POST /api/admin/users` - User management
- `PUT/DELETE /api/admin/users/[id]` - Update/delete user
- `POST /api/subjects/[id]/approve` - Approve subject
- `POST /api/subjects/[id]/reject` - Reject subject

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── faculty/        # Faculty dashboard
│   ├── login/          # Authentication
│   ├── quiz/           # Quiz taking
│   ├── student/        # Student dashboard
│   └── (public pages)  # About, Docs, Privacy, etc.
├── components/         # Reusable components
├── lib/               # Utilities & config
└── ...
prisma/
├── schema.prisma      # Database schema
├── migrations/        # Migration files
└── seed.ts           # Demo data seeder
```

---

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: JWT with secure cookies
- **Role-Based Access**: Enforced on all API routes
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Prisma ORM

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team Triada

Built with ❤️ by Team Triada

---

<p align="center">
  <sub>Proct - Because integrity doesn't require surveillance</sub>
</p>
