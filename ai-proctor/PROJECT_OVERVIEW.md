# AI-Proctored Exam System — Project Overview

> **Last updated:** 2026-06-09

---

## 1. Purpose

A full-stack, AI-powered exam proctoring platform that allows **teachers** to create and manage exams while **students** take them under real-time AI surveillance. The system detects cheating behaviours (face absence, phone use, looking away, speech, tab-switching, etc.) via a Python AI service and automatically logs violations to the database.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
│   React + Vite + TailwindCSS + shadcn/ui                       │
│   Port 5173                                                    │
└───────────┬──────────────────────────────┬──────────────────────┘
            │  REST (Axios)                │  WebSocket
            ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────────────┐
│  Node.js / Express   │      │  Python AI Server (FastAPI WS)   │
│  Port 5000           │◄────►│  Port 8000                       │
│  MongoDB (Mongoose)  │      │  OpenCV + MediaPipe + YOLOv8     │
└──────────────────────┘      └──────────────────────────────────┘
```

**Data flow:**
1. Student opens exam → Frontend connects to Python AI via WebSocket (`ws://localhost:8000/ws`)
2. Python captures camera at ~4 FPS, runs face/pose/object/speech detection
3. Violations are sent to the Node.js backend via HTTP and persisted in MongoDB
4. 3-strike policy: 3 violations → auto-termination of exam

---

## 3. Technology Stack

| Layer     | Technology                                                    |
|-----------|---------------------------------------------------------------|
| Frontend  | React 18, Vite, TailwindCSS, shadcn/ui, Zustand, Axios       |
| Backend   | Node.js, Express 5, Mongoose 9, JWT, bcryptjs                 |
| Storage   | Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3)         |
| Database  | MongoDB (Atlas or local)                                      |
| AI Engine | Python 3, FastAPI, OpenCV, MediaPipe, Ultralytics YOLOv8      |
| DevTools  | Nodemon, Concurrently (single `npm run start:all` command)    |

---

## 4. Directory Structure

```
ai-proctor/
├── backend/                          # Node.js REST API
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   └── r2.js                     # Cloudflare R2 (S3) client
│   ├── controllers/
│   │   ├── cheatingLogController.js  # CRUD for cheating violations
│   │   ├── examController.js         # Exam CRUD + toggle active
│   │   ├── materialController.js     # Study materials CRUD + R2 streaming
│   │   ├── questionController.js     # Question CRUD per exam
│   │   ├── resultController.js       # Submit, view, delete, toggle visibility
│   │   └── userController.js         # Register, login, profile
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT protect + role authorization
│   │   └── errorMiddleware.js        # Global error handler
│   ├── models/
│   │   ├── cheatingLogModel.js       # Violation log schema
│   │   ├── examModel.js             # Exam schema
│   │   ├── materialModel.js         # Study material schema (R2 keys)
│   │   ├── questionModel.js         # MCQ question schema
│   │   ├── resultModel.js           # Student result schema
│   │   └── userModel.js             # User schema (student/teacher)
│   ├── routes/
│   │   ├── cheatingLogRoutes.js      # /api/cheating-logs
│   │   ├── examRoutes.js            # /api/exams
│   │   ├── materialRoutes.js        # /api/materials
│   │   ├── resultRoutes.js          # /api/results
│   │   └── userRoutes.js            # /api/users
│   ├── utils/
│   │   ├── calculateMarks.js        # Score calculation utility
│   │   └── generateToken.js         # JWT token generator
│   ├── uploads/                     # Legacy (pre-R2); files now in Cloudflare R2
│   ├── server.js                    # Express app entry point
│   ├── api-documentation.md         # Full REST API reference with examples
│   ├── postman-collection-updated.json  # Postman collection for testing
│   ├── package.json
│   └── .env
│
├── frontend/                         # React SPA
│   └── src/
│       ├── api/
│       │   └── axios.js             # Axios instance with auth interceptor
│       ├── components/
│       │   ├── Navbar.jsx           # Navigation bar (student/teacher links)
│       │   ├── ProtectedRoute.jsx   # Auth guard wrapper
│       │   ├── Spinner.jsx          # Loading spinner
│       │   ├── proctoring/
│       │   │   └── ProctoringEngine.jsx  # WebSocket client + violation handlers
│       │   └── ui/                  # shadcn/ui primitives (button, card, badge, table, etc.)
│       ├── pages/
│       │   ├── LoginPage.jsx        # Student/Teacher login
│       │   ├── RegisterPage.jsx     # Account registration
│       │   ├── student/
│       │   │   ├── StudentDashboard.jsx    # Browse & start exams
│       │   │   ├── PreExamPage.jsx         # Pre-exam checks (AI, camera, eligibility)
│       │   │   ├── ExamPage.jsx            # Live exam with timer + proctoring
│       │   │   ├── ResultPage.jsx          # Post-submit result view
│       │   │   ├── MyResultsPage.jsx       # All student results history
│       │   │   └── StudentMaterialsPage.jsx # Browse & download study materials
│       │   └── teacher/
│       │       ├── TeacherDashboard.jsx    # Exam management cards
│       │       ├── CreateExamPage.jsx      # Create new exam
│       │       ├── ExamDetailPage.jsx      # View/edit questions
│       │       ├── ExamResultsPage.jsx     # Student results + violations modal
│       │       ├── CheatLogPage.jsx        # Real-time cheating log viewer
│       │       └── TeacherMaterialsPage.jsx # Upload & manage study materials
│       ├── store/
│       │   └── authStore.js         # Zustand auth state (user, token, logout)
│       ├── App.jsx                  # Route definitions
│       ├── main.jsx                 # Vite entry point
│       └── index.css                # Global styles
│
└── python-ai/                        # AI Proctoring Engine
    ├── __init__.py                  # Package root
    ├── config/
    │   └── settings.py              # Thresholds & env-based configuration
    ├── modules/
    │   ├── __init__.py              # Exports: FaceDetector, HeadPoseEstimator,
    │   │                            #   HeadPoseLogic, SpeechDetector,
    │   │                            #   SpeechLogic, ObjectDetector
    │   ├── face_detection.py        # MediaPipe face detection
    │   ├── head_pose.py             # Head pose estimation (yaw/pitch)
    │   ├── head_pose_logic.py       # Look-away timing logic
    │   ├── object_detection.py      # YOLOv8 phone/person detection
    │   ├── speech_detection.py      # Audio analysis for speech
    │   └── speech_logic.py          # Speech timing logic
    ├── main.py                      # Detection orchestrator
    ├── server.py                    # FastAPI WebSocket server
    ├── README.md                    # Python AI setup & usage guide
    ├── requirements.txt             # Python dependencies
    ├── yolov8s.pt                   # YOLOv8 model weights
    └── .env                         # Python environment config
```

---

## 5. Database Models

### User
| Field      | Type     | Notes                          |
|------------|----------|--------------------------------|
| name       | String   | Required, trimmed               |
| email      | String   | Required, unique, lowercase     |
| password   | String   | Hashed with bcrypt (10 rounds)  |
| role       | String   | `"student"` or `"teacher"`      |

### Exam
| Field       | Type       | Notes                         |
|-------------|------------|-------------------------------|
| title       | String     | Required                       |
| description | String     | Optional                       |
| duration    | Number     | Minutes, min 1                 |
| teacher     | ObjectId   | Ref → User                     |
| isActive    | Boolean    | Default `true`                 |
| isPublished | Boolean    | Default `false`                |
| totalMarks  | Number     | Computed from questions         |

### Question
| Field         | Type       | Notes                        |
|---------------|------------|------------------------------|
| exam          | ObjectId   | Ref → Exam                    |
| text          | String     | Required                      |
| options       | [String]   | Exactly 4 options             |
| correctOption | Number     | Index 0–3                     |
| marks         | Number     | Default 1                     |
| isActive      | Boolean    | Default `true`                |

### Result
| Field            | Type       | Notes                              |
|------------------|------------|------------------------------------|
| student          | ObjectId   | Ref → User                         |
| exam             | ObjectId   | Ref → Exam                         |
| answers          | [Object]   | `{ question, selectedOption }`     |
| score            | Number     | Computed marks                      |
| totalMarks       | Number     | Max possible marks                  |
| percentage       | Number     | `(score/totalMarks) × 100`         |
| terminated       | Boolean    | `true` if exam was force-ended      |
| visibleToStudent | Boolean    | Teacher-controlled visibility       |
| submittedAt      | Date       | Submission timestamp                |

**Index:** `{ student, exam }` — unique (prevents double submission)

### CheatingLog
| Field       | Type       | Notes                                 |
|-------------|------------|---------------------------------------|
| student     | ObjectId   | Ref → User                            |
| exam        | ObjectId   | Ref → Exam                            |
| type        | String     | Enum: 22 violation types              |
| severity    | String     | `low` / `medium` / `high` / `critical`|
| confidence  | Number     | 0–100, nullable                       |
| description | String     | Human-readable detail                  |
| timestamp   | Date       | When violation occurred                |

**Indexes:** `{ student, exam }`, `{ exam, type }`, `{ timestamp: -1 }`

### Material (Study Materials)
| Field         | Type       | Notes                                          |
|---------------|------------|-------------------------------------------------|
| title         | String     | Required, max 200 chars                          |
| description   | String     | Optional, max 500 chars                          |
| subject       | String     | Required, used for filtering                     |
| teacher       | ObjectId   | Ref → User                                       |
| fileName      | String     | Original file name (e.g. "Lecture1.pdf")         |
| r2Key         | String     | R2 object key (e.g. "materials/123-file.pdf")    |
| fileUrl       | String     | R2 public CDN URL for direct access              |
| fileType      | String     | Enum: `pdf`, `word`, `powerpoint`, `other`       |
| fileSize      | Number     | Size in bytes                                    |
| isVisible     | Boolean    | Default `true` (hidden = invisible to students)  |
| downloadCount | Number     | Auto-incremented on each download                |

---

## 6. API Endpoints

### Auth — `/api/users`
| Method | Path          | Access  | Description              |
|--------|---------------|---------|--------------------------|
| POST   | `/register`   | Public  | Create account            |
| POST   | `/login`      | Public  | Login (rate-limited)      |
| GET    | `/me`         | Auth    | Get current user profile  |

### Exams — `/api/exams`
| Method | Path                          | Access  | Description                    |
|--------|-------------------------------|---------|--------------------------------|
| GET    | `/`                           | Auth    | List exams (teacher=own, student=active) |
| POST   | `/`                           | Teacher | Create exam                     |
| GET    | `/:id`                        | Auth    | Get single exam                 |
| PUT    | `/:id`                        | Teacher | Update exam (toggle active, etc)|
| DELETE | `/:id`                        | Teacher | Delete exam                     |
| GET    | `/:examId/questions`          | Auth    | List questions for exam         |
| POST   | `/:examId/questions`          | Teacher | Add question to exam            |
| PUT    | `/:examId/questions/:questionId` | Teacher | Update question              |
| DELETE | `/:examId/questions/:questionId` | Teacher | Delete question              |

### Results — `/api/results`
| Method | Path              | Access  | Description                          |
|--------|-------------------|---------|--------------------------------------|
| POST   | `/`               | Student | Submit exam answers                   |
| GET    | `/my`             | Student | Get own results (visible only)        |
| GET    | `/exam/:examId`   | Teacher | Get all results for an exam           |
| PUT    | `/:id/visibility` | Teacher | Toggle result visibility for student  |
| DELETE | `/:id`            | Teacher | Delete a student's result             |

### Cheating Logs — `/api/cheating-logs`
| Method | Path                              | Access  | Description                       |
|--------|-----------------------------------|---------|-----------------------------------|
| POST   | `/`                               | Student | Create cheating log entry          |
| GET    | `/exam/:examId`                   | Teacher | All logs for an exam               |
| GET    | `/exam/:examId/summary`           | Teacher | Aggregated summary per student     |
| GET    | `/exam/:examId/student/:studentId`| Teacher | Logs for specific student in exam  |

### Study Materials — `/api/materials`
| Method | Path                 | Access  | Description                                 |
|--------|----------------------|---------|---------------------------------------------|
| GET    | `/`                  | Auth    | List all visible materials (student view)    |
| GET    | `/my`                | Teacher | List teacher's own materials (incl. hidden)  |
| POST   | `/`                  | Teacher | Upload new material (multipart/form-data)    |
| PUT    | `/:id`               | Teacher | Update material metadata only                |
| PUT    | `/:id/file`          | Teacher | Replace file (streams new file to R2)        |
| PATCH  | `/:id/visibility`    | Teacher | Toggle visibility (show/hide from students)  |
| DELETE | `/:id`               | Teacher | Delete material (removes from R2 + DB)       |
| GET    | `/:id/view-token`    | Auth    | Get short-lived view token + R2 URL          |
| GET    | `/:id/download`      | Auth    | Increment download count + return R2 URL     |

**File constraints:** PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx) only. Max 50 MB.
**Upload flow:** Browser → multer temp disk → streamed to R2 in 4 parallel 5MB chunks → temp cleaned up.

---

## 7. Frontend Routes

| Path                           | Component            | Role    | Description                    |
|--------------------------------|----------------------|---------|--------------------------------|
| `/login`                       | LoginPage            | Public  | Login form                      |
| `/register`                    | RegisterPage         | Public  | Registration form               |
| `/teacher/dashboard`           | TeacherDashboard     | Teacher | Manage exams                    |
| `/teacher/create-exam`         | CreateExamPage       | Teacher | Create new exam                 |
| `/teacher/exam/:id`            | ExamDetailPage       | Teacher | View/edit questions             |
| `/teacher/exam/:id/results`    | ExamResultsPage      | Teacher | Student results + violations    |
| `/teacher/exam/:id/cheating`   | CheatLogPage         | Teacher | Real-time cheating feed         |
| `/student/dashboard`           | StudentDashboard     | Student | Browse available exams          |
| `/student/exam/:id/pre`        | PreExamPage          | Student | Pre-exam system checks          |
| `/student/exam/:id`            | ExamPage             | Student | Take exam (proctored)           |
| `/student/result`              | ResultPage           | Student | Post-submission result view     |
| `/student/my-results`          | MyResultsPage           | Student | All results history             |
| `/student/materials`           | StudentMaterialsPage    | Student | Browse & download materials     |
| `/teacher/materials`           | TeacherMaterialsPage    | Teacher | Upload & manage materials       |

---

## 8. AI Detection Modules

| Module              | Technology      | Detects                                  |
|---------------------|-----------------|------------------------------------------|
| Face Detection      | MediaPipe       | No face, multiple faces                   |
| Head Pose           | MediaPipe       | Looking away (left/right/up/down)         |
| Object Detection    | YOLOv8          | Cell phone, additional person             |
| Speech Detection    | Audio analysis  | Voice/talking during exam                 |

### Key Thresholds (configurable via `.env`)
- Face confidence: `0.70`
- Look-away trigger: `0.5s`
- Speech trigger: `2.0s`
- No-face time limit: `5s`
- Multiple-faces time limit: `3s`

---

## 9. Key Features

### Student Side
- ✅ Browse available exams with status badges
- ✅ Pre-exam system check (AI, camera/mic permissions, eligibility)
- ✅ Fullscreen exam with timer + real-time AI proctoring
- ✅ 3-strike auto-termination
- ✅ Anti-cheat: copy/paste, right-click, tab-switch, devtools all blocked
- ✅ "My Results" page with score cards, percentage circles, pass/fail
- ✅ Results visibility controlled by teacher
- ✅ Study Materials page: browse, search, filter by subject
- ✅ Open files in browser (PDF viewer) or download via R2 CDN

### Teacher Side
- ✅ Dashboard with stats (total exams, active, students, pass rate)
- ✅ Create/edit/delete exams
- ✅ Add/edit/delete questions per exam
- ✅ Toggle exam active/inactive (⚡ icon)
- ✅ Results page with student scores table
- ✅ Violations column with popup modal per student
- ✅ Toggle result visibility per student (👁 icon)
- ✅ Delete individual results (🗑 icon)
- ✅ Real-time cheating log viewer (CheatLogPage)
- ✅ Study Materials management: upload, edit, replace, hide, delete
- ✅ Upload progress bar with streaming to Cloudflare R2
- ✅ Auto-fill title from selected filename

---

## 10. Environment Variables

### Backend (`.env`)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173

# Cloudflare R2 Storage
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=ai-proctor-materials
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### Python AI (`.env`)
```
CAMERA_INDEX=0
FRAME_WIDTH=640
FRAME_HEIGHT=480
FACE_CONFIDENCE=0.70
MAX_FACES_ALLOWED=1
LOOK_LEFT_THRESHOLD=-20
LOOK_RIGHT_THRESHOLD=20
SPEECH_TIME_LIMIT=2.0
NO_FACE_TIME_LIMIT=5
MULTIPLE_FACES_TIME_LIMIT=3
BACKEND_URL=http://localhost:5000
```

---

## 11. Running the Project

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas or local instance

### Quick Start (all services at once)
```bash
cd backend
npm run start:all
```

### Manual Start (individual services)
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Python AI
cd python-ai
.\venv\Scripts\activate   # Windows
python server.py
```

### Default Ports
| Service  | Port |
|----------|------|
| Frontend | 5173 |
| Backend  | 5000 |
| AI (WS)  | 8000 |

---

## 12. Exam Flow Sequence

```
Student clicks "Start Exam"
    │
    ▼
PreExamPage — System checks:
    ├── Check eligibility (not already taken)
    ├── Load exam details
    ├── WebSocket ping to AI server
    └── Request camera + mic permissions
    │
    ▼
Student agrees to rules → clicks "Start Exam"
    │
    ▼
ExamPage — Exam environment:
    ├── Student clicks "Begin Exam" → fullscreen enters
    ├── ProctoringEngine connects WebSocket to Python AI
    ├── Timer starts counting down
    ├── Anti-cheat listeners active (tab switch, copy, etc.)
    ├── AI processes camera feed at ~4 FPS
    ├── Violations → logged to DB + warnings shown
    └── 3 strikes → auto-terminate
    │
    ▼
Submit (manual or timer or 3-strike termination)
    │
    ▼
POST /api/results — Score calculated & saved
    │
    ▼
ResultPage — Shows score summary
```

---

## 13. Known Limitations

1. **WebSocket Security** — Python AI WebSocket lacks authentication (API key needed)
2. **Pass Rate stat** — Teacher dashboard shows `--` (not yet computed from results)
3. **No pagination** — Results and exam lists load all records at once
4. **Single browser** — No session management to prevent multi-device login
5. **No exam scheduling** — Exams are available immediately when active
6. **R2 public URLs** — Material files use public R2 URLs; access control relies on hiding the URL from students (no signed URLs yet)

---
