# PROJECT_OVERVIEW.md — AI Proctoring Platform

## 1. Project Name, Purpose, and Description

**Name:** AI Proctoring Platform (repo: `EXAM_protection_AI`)

**Purpose:** A full-stack web application for AI-powered online exam proctoring, enabling teachers to create exams with multiple-choice questions and students to take them under real-time AI surveillance.

**Description:** The system uses a React frontend to capture webcam frames and microphone audio, streams them over WebSocket to a Python FastAPI server running MediaPipe face detection, head pose estimation, YOLOv8 object detection, and WebRTC VAD speech detection. The Node.js backend provides a REST API with JWT authentication, MongoDB persistence for users, exams, questions, results, and cheating logs. The frontend also monitors browser events such as tab switching, fullscreen exit, copy/paste, and right-click to detect cheating attempts. After submission, the backend automatically grades answers and stores the result.

---

## 2. Full Folder Structure (Every File, Every Folder)

```
ai v 5/
├── .git/                           (git repository metadata)
├── .gitignore                      (ignores node_modules, venv, logs, .env, .vscode, .idea, dist, build)
├── .vscode/                        (VS Code workspace settings)
├── .windsurf/
│   ├── rules/
│   │   └── claude.md              (Windsurf AI agent system prompt with conventions, bug list, file map)
│   └── workflows/
│       └── review.md              (Code review workflow definition)
├── README.md                       (Project title: "EXAM_protection_AI — Graduation Project 2")
├── data_flow.md                    (Mermaid diagrams: auth flow, exam lifecycle, AI proctoring loop, teacher review)
└── ai-proctor/
    ├── backend/
    │   ├── api-documentation.md    (Markdown API docs: endpoints, request/response examples, error codes)
    │   ├── package.json            (npm manifest: Express 5.2.1, Mongoose 9.5.0, JWT, bcryptjs, cors, dotenv, express-rate-limit, express-async-handler, axios, nodemon)
    │   ├── package-lock.json       (npm lockfile)
    │   ├── postman-collection-updated.json  (Postman v2.1 collection with tests for all endpoints)
    │   ├── server.js               (Express app entry: CORS, JSON parser, health check, route registration, error handler)
    │   ├── config/
    │   │   └── db.js               (MongoDB connection via Mongoose, uses process.env.MONGO_URI)
    │   ├── controllers/
    │   │   ├── cheatingLogController.js   (logCheatingEvent, getExamCheatingLogs, getStudentCheatingLogs, getExamCheatingSummary)
    │   │   ├── examController.js          (createExam, getExams, getExamById, updateExam, deleteExam)
    │   │   ├── questionController.js      (addQuestion, getQuestions, deleteQuestion, createQuestion, getQuestion, updateQuestion, toggleActivateQuestion)
    │   │   ├── resultController.js        (submitExam, getMyResults, getExamResults)
    │   │   └── userController.js          (registerUser, loginUser, getMe)
    │   ├── middleware/
    │   │   ├── authMiddleware.js          (protect JWT verifier, teacherOnly, studentOnly, authorizeRoles)
    │   │   └── errorMiddleware.js         (global error handler: CastError→404, 11000→409, ValidationError→400)
    │   ├── models/
    │   │   ├── cheatingLogModel.js        (CheatingLog schema: 23 violation type enums, severity, confidence, description, timestamp)
    │   │   ├── examModel.js               (Exam schema: title, description, duration, teacher ref, isActive, isPublished, totalMarks)
    │   │   ├── questionModel.js           (Question schema: exam ref, text, options[4], correctOption 0-3, marks, isActive)
    │   │   ├── resultModel.js             (Result schema: student+exam refs, answers array, score, totalMarks, percentage, terminated, submittedAt, unique index)
    │   │   └── userModel.js               (User schema: name, email, password with bcrypt hash hook, role enum student/teacher)
    │   ├── routes/
    │   │   ├── cheatingLogRoutes.js       (POST /, GET /exam/:examId, GET /exam/:examId/summary, GET /exam/:examId/student/:studentId)
    │   │   ├── examRoutes.js              (GET /, POST /, GET /:id, PUT /:id, DELETE /:id, GET /:examId/questions, POST /:examId/questions, DELETE /:examId/questions/:questionId)
    │   │   ├── resultRoutes.js            (POST /, GET /my, GET /exam/:examId)
    │   │   └── userRoutes.js              (POST /register, POST /login with rate limit, GET /me)
    │   └── utils/
    │       ├── calculateMarks.js          (iterates questions, compares selectedOption to correctOption, sums marks, computes percentage)
    │       └── generateToken.js           (jwt.sign wrapper, 7-day expiry, payload {id, role})
    ├── frontend/
    │   ├── index.html                (HTML entry: meta charset, viewport, title "AI Proctor", root div, main.jsx script)
    │   ├── package.json              (npm manifest: React 18.2.0, Vite 5.0.8, React Router 6.20.0, Zustand 4.4.7, react-webcam 7.2.0, TailwindCSS 3.3.6, Axios 1.6.2, Lucide 0.487.0, class-variance-authority, clsx, tailwind-merge)
    │   ├── package-lock.json         (npm lockfile)
    │   ├── postcss.config.js         (PostCSS config: tailwindcss + autoprefixer plugins)
    │   ├── tailwind.config.js        (Tailwind config: content paths, custom backdropBlur xs, custom pulse-slow animation)
    │   ├── vite.config.js            (Vite config: @vitejs/plugin-react, port 5173, proxy /api to localhost:5000)
    │   └── src/
    │       ├── main.jsx              (ReactDOM.createRoot, StrictMode, renders App)
    │       ├── App.jsx               (BrowserRouter with future flags, route definitions for login, register, teacher pages, student pages, role-gated navigation)
    │       ├── index.css             (Tailwind directives @tailwind base/components/utilities, body font stack, text-balance utility)
    │       ├── api/
    │       │   └── axios.js          (axios instance with baseURL /api, request interceptor adds Bearer JWT from Zustand, response interceptor 401→logout+redirect)
    │       ├── store/
    │       │   └── authStore.js      (Zustand auth store with persist middleware: user, token, login, logout, localStorage key "auth-storage")
    │       ├── lib/
    │       │   └── utils.js          (cn helper: clsx + tailwindMerge composition utility)
    │       ├── components/
    │       │   ├── Navbar.jsx        (Sticky top nav with role-based links, user display, logout button, active state styling)
    │       │   ├── ProtectedRoute.jsx (Auth guard: checks Zustand token, redirects to /login if missing)
    │       │   ├── Spinner.jsx       (Fullscreen centered spinner: animate-spin, border-t/b border-blue-600)
    │       │   ├── proctoring/
    │       │   │   └── ProctoringEngine.jsx  (WebSocket to ws://localhost:8000/ws, webcam frame capture every 500ms, audio PCM streaming, browser event listeners for tab switch/copy/paste/devtools/fullscreen, debounced violation logger)
    │       │   └── ui/
    │       │       ├── badge.jsx     (shadcn-style Badge component with cn utility)
    │       │       ├── button.jsx    (shadcn-style Button: variants default/outline/ghost, sizes default/sm/lg/icon, scale hover)
    │       │       ├── card.jsx      (shadcn-style Card + CardHeader/CardTitle/CardDescription/CardContent/CardFooter)
    │       │       ├── input.jsx     (shadcn-style Input with focus ring, file input styling)
    │       │       ├── label.jsx     (shadcn-style Label with peer-disabled states)
    │       │       └── table.jsx     (shadcn-style Table + TableHeader/TableBody/TableFooter/TableHead/TableRow/TableCell/TableCaption)
    │       └── pages/
    │           ├── LoginPage.jsx     (Email+password form, demo credentials display, gradient branding)
    │           ├── RegisterPage.jsx  (Name+email+password+role selection form with visual role cards, gradient branding)
    │           ├── student/
    │           │   ├── StudentDashboard.jsx  (Stats cards: Available/Active/Completed exams, grid of exam cards with Start Exam button)
    │           │   ├── ExamPage.jsx            (Exam-taking UI: timer, question navigator, prev/next/submit, ProctoringEngine overlay, critical violation counter, auto-submit on timeout or 3 violations)
    │           │   └── ResultPage.jsx          (Score circle, pass/fail badge, stats grid, submission timestamp, back button)
    │           └── teacher/
    │               ├── TeacherDashboard.jsx   (Stats cards: Total/Active/Total Students/Pass Rate, exam management grid with Questions/Results/Logs/Enable/Delete actions)
    │               ├── CreateExamPage.jsx     (Exam creation form: title, description, duration; on success navigates to exam detail)
    │               ├── ExamDetailPage.jsx     (Exam info header, add question form with 4 options + correctOption dropdown + marks, question list with correct answer highlight and delete)
    │               ├── ExamResultsPage.jsx    (Stats cards: Total Students/Passed/Avg Score, results table with student name/email/score/percentage/submittedAt)
    │               └── CheatLogPage.jsx       (Violation summary cards: Total/Critical/High/Students, filter by type/severity, summary table per student, detailed timeline per student with confidence bars)
    └── python-ai/
        ├── __init__.py             (Module docstring: "AI Proctoring System Python Module")
        ├── server.py               (FastAPI WebSocket server: accepts /ws, per-session FaceDetector/HeadPoseEstimator/HeadPoseLogic/SpeechDetector/SpeechLogic, global ObjectDetector, processes base64 frames + PCM audio, returns annotated frame + warnings JSON)
        ├── main.py                 (Standalone OpenCV script: direct camera capture, all detection modules + eye tracking imports, cv2.imshow UI with overlay info, press Q to quit)
        ├── requirements.txt        (Python deps: fastapi 0.104.1, uvicorn[standard] 0.24.0, websockets 12.0, python-multipart 0.0.6, opencv-python 4.8.1.78, mediapipe 0.10.14, ultralytics 8.0.221, webrtcvad-wheels, numpy 1.26.2, torch 2.1.1, torchvision 0.16.1, pydantic 2.5.2, python-dotenv 1.0.0)
        ├── README.md               (Setup instructions: venv creation, pip install, uvicorn run command, standalone main.py, WebSocket protocol spec)
        ├── yolov8s.pt              (YOLOv8 small pretrained model weights file)
        ├── config/
        │   ├── __init__.py         (Re-exports all from .settings)
        │   └── settings.py         (All configuration loaded from os.environ with defaults: CAMERA_INDEX=0, FRAME_WIDTH=640, FRAME_HEIGHT=480, FACE_CONFIDENCE=0.70, MAX_FACES_ALLOWED=1, head pose thresholds, speech thresholds, object detection toggles, alert toggles, timer limits)
        └── modules/
            ├── __init__.py         (Re-exports: FaceDetector, HeadPoseEstimator, HeadPoseLogic, SpeechDetector, SpeechLogic, ObjectDetector)
            ├── face_detection.py   (MediaPipe FaceDetection wrapper: detects faces, filters out detections <45px to ignore wall decorations)
            ├── head_pose.py        (MediaPipe FaceMesh head pose: calibrates 10 frames baseline, computes yaw/pitch, returns direction Left/Right/Up/Down/Forward/No Face)
            ├── head_pose_logic.py  (Head pose state machine: starts timer on non-forward look, sets cheating=True after MAX_LOOK_AWAY_TIME seconds)
            ├── object_detection.py (YOLOv8 wrapper: loads yolov8s.pt, detects classes 0 (person) and 67 (cell phone), confidence threshold 0.25, NMS iou=0.4, per-class confidence filter at 0.45)
            ├── speech_detection.py (WebRTC VAD mode 3 aggressive + RMS filter >300: processes 960-byte Int16 PCM chunks, 1.0s speech decay)
            └── speech_logic.py     (Speech state machine: starts timer on speech, sets cheating=True after SPEECH_TIME_LIMIT seconds)
```

---

## 3. Tech Stack

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Router:** React Router DOM 6.20.0
- **State Management:** Zustand 4.4.7 with `persist` middleware
- **HTTP Client:** Axios 1.6.2
- **Styling:** TailwindCSS 3.3.6 + PostCSS 10.4.16 + Autoprefixer 10.4.16
- **UI Utilities:** class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.2.0
- **Webcam:** react-webcam 7.2.0
- **Icons:** lucide-react 0.487.0
- **Entry:** `main.jsx` mounts to `#root`

### Backend
- **Runtime:** Node.js (package type: commonjs)
- **Framework:** Express 5.2.1
- **Database:** MongoDB (via Mongoose 9.5.0)
- **Auth:** JSON Web Tokens (jsonwebtoken 9.0.3) + bcryptjs 3.0.3
- **Middleware:** cors 2.8.6, express-async-handler 1.2.0, express-rate-limit 8.5.0, dotenv 17.4.2
- **HTTP Client:** axios 1.15.2 (for future external API calls)
- **Dev:** nodemon 3.1.14
- **Entry:** `server.js`

### Python AI
- **Runtime:** Python 3.10+
- **Framework:** FastAPI 0.104.1 + Uvicorn[standard] 0.24.0
- **WebSocket:** websockets 12.0
- **Computer Vision:** OpenCV 4.8.1.78, MediaPipe 0.10.14
- **Object Detection:** Ultralytics YOLOv8 8.0.221
- **Audio:** webrtcvad-wheels (WebRTC Voice Activity Detector)
- **ML:** PyTorch 2.1.1 + TorchVision 0.16.1, NumPy 1.26.2
- **Validation:** Pydantic 2.5.2
- **Config:** python-dotenv 1.0.0
- **Entry:** `server.py` (WebSocket mode) or `main.py` (standalone CV2 mode)

### Database
- **Engine:** MongoDB (local or Atlas, URI from `MONGO_URI` env var)
- **ODM:** Mongoose 9.5.0
- **Collections:** Users, Exams, Questions, Results, CheatingLogs

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React Frontend)                         │
│                          Port: 5173 (Vite dev)                          │
│                                                                         │
│  ┌──────────────┐    ┌─────────────────────┐    ┌──────────────────┐   │
│  │  Zustand     │───▶│  localStorage       │    │  ProctoringEngine │   │
│  │  authStore   │    │  (JWT + user object)│    │  (WebSocket +     │   │
│  └──────────────┘    └─────────────────────┘    │   Webcam + Audio) │   │
│                                                  └──────────────────┘   │
│                           │                                              │
│                           │ HTTP REST (Axios)                            │
│                           ▼                                              │
│                  ┌─────────────────┐                                     │
│                  │  /api/users/*   │                                     │
│                  │  /api/exams/*   │                                     │
│                  │  /api/results/* │                                     │
│                  │/api/cheating-logs*                                     │
│                  └─────────────────┘                                     │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ HTTP REST + Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND (Express)                            │
│                         Port: 5000                                      │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐│
│  │  userRoutes │    │  examRoutes │    │ resultRoutes│    │cheatingLog││
│  │   /users    │    │   /exams    │    │  /results   │    │  Routes   ││
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬─────┘│
│         │                   │                   │                  │    │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    ┌───────▼────┐│
│  │userController│   │examController│   │resultController│ │cheatingLog ││
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │ Controller ││
│         │                   │                   │           └─────┬─────┘│
│         └───────────────────┴───────────────────┴─────────────────┘      │
│                                    │                                     │
│                                    ▼                                     │
│                           ┌─────────────────┐                           │
│                           │  Mongoose ODM   │                           │
│                           └────────┬────────┘                           │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ TCP
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MONGODB DATABASE                                 │
│                        Port: 27017 (default)                            │
│                                                                         │
│   Users │ Exams │ Questions │ Results │ CheatingLogs                    │
└─────────────────────────────────────────────────────────────────────────┘

                                    WebSocket (ws://localhost:8000/ws)
                                          base64 JPEG frames
                                          binary PCM audio chunks
                                          JSON warnings + annotated image
                                               ▲      │
                                               │      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PYTHON AI SERVER (FastAPI)                        │
│                         Port: 8000                                      │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Face Detection  │  │ Head Pose       │  │ YOLO Object Detection   │ │
│  │ (MediaPipe)     │  │ (MediaPipe      │  │ (ultralytics YOLOv8s)   │ │
│  │                 │  │  FaceMesh)      │  │ Classes: person, phone  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│  ┌─────────────────┐                                                  │
│  │ Speech Detection│  (No direct database access — returns JSON only)  │
│  │ (webrtcvad +    │                                                  │
│  │  RMS filter)    │                                                  │
│  └─────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. All API Endpoints

All protected endpoints require `Authorization: Bearer <jwt_token>`.

### Authentication / Users (`/api/users`)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/users/register` | Public | Register new user. Body: `{name, email, password, role}`. Returns user object + JWT. |
| POST | `/api/users/login` | Public (rate-limited: 10 req / 15 min) | Login. Body: `{email, password}`. Returns user object + JWT. |
| GET | `/api/users/me` | Private (any authenticated) | Get current user profile (password excluded). |

### Exams (`/api/exams`)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/exams` | Private | Teacher: returns own exams. Student: returns all `isActive=true` exams populated with teacher name/email. |
| POST | `/api/exams` | Teacher only | Create exam. Body: `{title, description, duration}`. `teacher` auto-set from JWT. |
| GET | `/api/exams/:id` | Private | Get single exam by ID, populated with teacher name/email. |
| PUT | `/api/exams/:id` | Teacher only (own exam) | Update exam. Body fields optional: `title`, `description`, `duration`, `isActive`. Ownership verified. |
| DELETE | `/api/exams/:id` | Teacher only (own exam) | Delete exam AND all its questions. Ownership verified. |
| GET | `/api/exams/:examId/questions` | Private | Get all questions for exam. **Students receive sanitized questions** (correctOption stripped). |
| POST | `/api/exams/:examId/questions` | Teacher only (own exam) | Add question. Body: `{text, options[4], correctOption, marks}`. |
| DELETE | `/api/exams/:examId/questions/:questionId` | Teacher only (own exam) | Delete a question from exam. |

### Questions (standalone) (`/api/questions`)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/questions` | Teacher only | Create standalone question. Body: `{text, options[4], correctOption, marks, exam}`. If `exam` provided, ownership verified. |
| GET | `/api/questions/:id` | Private | Get single question. Student view strips `correctOption` if exam not published/active. Teacher view requires ownership. |
| PUT | `/api/questions/:id` | Teacher only | Update question. Ownership verified via associated exam. |
| PATCH | `/api/questions/:id/activate` | Teacher only | Toggle `isActive` boolean. |

### Results (`/api/results`)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/results` | Student only | Submit exam answers. Body: `{examId, answers: [{question, selectedOption}], terminated?}`. Prevents double submission via unique index. Auto-grades. |
| GET | `/api/results/my` | Student only | Get current student's results, populated with exam title/duration. |
| GET | `/api/results/exam/:examId` | Teacher only (own exam) | Get all results for a specific exam, populated with student name/email. |

### Cheating Logs (`/api/cheating-logs`)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/cheating-logs` | Student only | Log a cheating event. Body: `{examId, type, confidence?, description?}`. Severity auto-mapped from `SEVERITY_MAP`. |
| GET | `/api/cheating-logs/exam/:examId` | Teacher only (own exam) | Get all logs for exam. Query filters: `?type=...&severity=...`. Populated with student name/email. |
| GET | `/api/cheating-logs/exam/:examId/summary` | Teacher only (own exam) | Aggregation pipeline: per-student total, critical count, high count, unique violation types. Sorted by critical desc, total desc. |
| GET | `/api/cheating-logs/exam/:examId/student/:studentId` | Teacher only (own exam) | Get detailed timeline of all violations for one student in one exam. |

### Health Check

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/health` | Public | Returns `{status: "ok", env: process.env.NODE_ENV}`. |

---

## 6. All Database Models

### User (`backend/models/userModel.js`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `name` | String | required, trim | Full name |
| `email` | String | required, unique, lowercase, trim | Login identifier |
| `password` | String | required, minlength 6 | bcrypt-hashed password |
| `role` | String | enum: ["student", "teacher"], default: "student" | Access control |
| `createdAt` | Date | auto (timestamps) | Registration time |
| `updatedAt` | Date | auto (timestamps) | Last update time |

**Hooks:** `pre('save')` — if password modified, generate salt (10 rounds) and hash with bcrypt.
**Methods:** `matchPassword(enteredPassword)` — async bcrypt.compare.

### Exam (`backend/models/examModel.js`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `title` | String | required, trim | Exam name |
| `description` | String | trim, default "" | Exam description |
| `duration` | Number | required, min 1 | Duration in minutes |
| `teacher` | ObjectId | ref: "User", required | Exam creator/owner |
| `isActive` | Boolean | default true | Whether students can see/join |
| `isPublished` | Boolean | default false | Publication status |
| `totalMarks` | Number | default 0, min 0 | Cached total (not auto-computed from questions) |
| `createdAt` | Date | auto (timestamps) | Creation time |
| `updatedAt` | Date | auto (timestamps) | Last update time |

### Question (`backend/models/questionModel.js`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `exam` | ObjectId | ref: "Exam", required | Parent exam |
| `text` | String | required, trim | Question text |
| `options` | [String] | validate length === 4 | Four answer choices |
| `correctOption` | Number | required, min 0, max 3 | Index of correct answer |
| `marks` | Number | default 1, min 1 | Points awarded for correct answer |
| `isActive` | Boolean | default true | Whether question is active |
| `createdAt` | Date | auto (timestamps) | Creation time |
| `updatedAt` | Date | auto (timestamps) | Last update time |

### Result (`backend/models/resultModel.js`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `student` | ObjectId | ref: "User", required | Exam taker |
| `exam` | ObjectId | ref: "Exam", required | Taken exam |
| `answers` | Array of `{question: ObjectId, selectedOption: Number?}` | default null | Student's answers |
| `score` | Number | default 0 | Points earned |
| `totalMarks` | Number | default 0 | Total possible points |
| `percentage` | Number | default 0 | score/totalMarks * 100 |
| `terminated` | Boolean | default false | Whether exam was auto-terminated by proctoring |
| `submittedAt` | Date | default Date.now | Submission timestamp |
| `createdAt` | Date | auto (timestamps) | Creation time |
| `updatedAt` | Date | auto (timestamps) | Last update time |

**Indexes:** Unique compound index on `{student: 1, exam: 1}` — prevents double submission.

### CheatingLog (`backend/models/cheatingLogModel.js`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `student` | ObjectId | ref: "User", required | Violator |
| `exam` | ObjectId | ref: "Exam", required | Related exam |
| `type` | String | required, enum (23 values) | Violation category |
| `severity` | String | enum: ["low", "medium", "high", "critical"], default "medium" | Impact level |
| `confidence` | Number | min 0, max 100, default null | AI confidence percentage |
| `description` | String | trim, default "" | Human-readable details |
| `timestamp` | Date | default Date.now | When violation occurred |
| `createdAt` | Date | auto (timestamps) | Creation time |
| `updatedAt` | Date | auto (timestamps) | Last update time |

**Indexes:** `{student: 1, exam: 1}`, `{exam: 1, type: 1}`, `{timestamp: -1}`

**Violation Types Enum (23 values):**
`no_face_detected`, `multiple_faces`, `cell_phone_detected`, `laptop_detected`, `tab_switch`, `fullscreen_exit`, `copy_paste`, `right_click`, `devtools_open`, `window_blur`, `camera_obstruction`, `microphone_muted`, `unauthorized_device`, `suspicious_movement`, `copy_paste_attempt`, `right_click_attempt`, `keyboard_shortcut`, `browser_dev_tools`, `screen_recording`, `unauthorized_access`, `time_anomaly`, `answer_pattern_anomaly`, `speech_detected`, `other`

---

## 7. Environment Variables Required

### Backend (`ai-proctor/backend/.env` — **file does not exist; must be created**)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens |
| `PORT` | No | 5000 | Express server port |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | CORS allowed origins (comma-separated) |
| `NODE_ENV` | No | — | `development` or `production` (affects error stack exposure) |

### Python AI (`ai-proctor/python-ai/.env` — **file does not exist; optional**)

All variables in `config/settings.py` have hardcoded defaults. Override via environment:

| Variable | Default | Purpose |
|----------|---------|---------|
| `CAMERA_INDEX` | 0 | OpenCV camera device index |
| `FRAME_WIDTH` | 640 | Capture width |
| `FRAME_HEIGHT` | 480 | Capture height |
| `FACE_CONFIDENCE` | 0.70 | MediaPipe face detection min confidence |
| `MAX_FACES_ALLOWED` | 1 | Max faces before "multiple faces" warning |
| `LOOK_LEFT_THRESHOLD` | -20 | Yaw diff threshold for looking left |
| `LOOK_RIGHT_THRESHOLD` | 20 | Yaw diff threshold for looking right |
| `LOOK_UP_THRESHOLD` | 20 | Pitch diff threshold for looking up |
| `LOOK_DOWN_THRESHOLD` | -20 | Pitch diff threshold for looking down |
| `MAX_LOOK_AWAY_TIME` | 0.5 | Seconds of looking away before cheating flag |
| `SPEECH_TIME_LIMIT` | 2.0 | Seconds of continuous speech before cheating flag |
| `SPEECH_CONFIDENCE_THRESHOLD` | 0.5 | Unused (VAD uses mode 3 + RMS) |
| `DETECT_PHONE` | true | Enable YOLO phone detection |
| `DETECT_PERSON` | true | Enable YOLO person detection |
| `PHONE_CLASS_NAME` | "cell phone" | YOLO class name |
| `PERSON_CLASS_NAME` | "person" | YOLO class name |
| `ENABLE_ALERTS` | true | Global alert toggle |
| `SHOW_WARNINGS` | true | Global warning toggle |
| `NO_FACE_TIME_LIMIT` | 5 | Seconds without face before flag (unused in current logic) |
| `MULTIPLE_FACES_TIME_LIMIT` | 3 | Seconds with multiple faces before flag (unused in current logic) |

### Frontend
No `.env` file exists. The Vite proxy target is hardcoded to `http://localhost:5000` in `vite.config.js`.

---

## 8. How to Run the Project

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB running locally (or Atlas URI)
- Webcam and microphone connected

### Terminal 1 — Backend
```bash
cd ai-proctor/backend
npm install
copy nul .env
# Edit .env to add:
# MONGO_URI=mongodb://localhost:27017/ai-proctor
# JWT_SECRET=your-super-secret-key
npm run dev
```
Backend runs at `http://localhost:5000`.

### Terminal 2 — Frontend
```bash
cd ai-proctor/frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`, proxies `/api` to port 5000.

### Terminal 3 — Python AI Server
```bash
cd ai-proctor/python-ai

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download YOLO weights if missing (automatic on first run)
# Run the WebSocket server (used by frontend)
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
Python AI runs at `ws://localhost:8000/ws`.

### One-Command Start (from backend directory)
```bash
cd ai-proctor/backend
npm run start:all
```
This uses `concurrently` to start backend (yellow), frontend (blue), and Python AI (magenta) in one terminal.

---

## 9. Known Bugs List

| # | File | Line(s) | Bug Description | Impact |
|---|------|---------|-----------------|--------|
| 1 | `ai-proctor/frontend/src/pages/student/ExamPage.jsx` | 118 | `if (!questions \|\| questions.length === 0) return <Spinner />;` — if an exam has zero questions, the page shows a loading spinner forever instead of a "no questions" message. | UX deadlock for empty exams |
| 2 | `ai-proctor/frontend/src/pages/student/StudentDashboard.jsx` | 91 | `Completed` stat is hardcoded to `"--"`; not fetched from backend. | Misleading dashboard stats |
| 3 | `ai-proctor/frontend/src/pages/teacher/TeacherDashboard.jsx` | 136 | `Pass Rate` is hardcoded to `"--%"`; not computed from results. | Misleading dashboard stats |
| 4 | `ai-proctor/backend/utils/calculateMarks.js` | 4-26 | Computes `totalMarks` by summing question marks at runtime, which may differ from `exam.totalMarks` stored in the database. Percentage denominator uses the runtime sum, creating potential inconsistency. | Score percentage may not match exam metadata |
| 5 | `ai-proctor/python-ai/modules/head_pose.py` | 60-67 | Threshold labels are swapped: `diff_yaw < LOOK_LEFT_THRESHOLD (-20)` returns `"Looking Right"` and `diff_yaw > LOOK_RIGHT_THRESHOLD (20)` returns `"Looking Left"`. The direction strings are inverted. | Wrong direction reported in UI/logs |
| 6 | `ai-proctor/python-ai/main.py` | 6-7 | Imports `modules.eye_tracking` and `modules.eye_tracking_logic` which **do not exist** in the project. Running `python main.py` will throw `ModuleNotFoundError`. | Standalone mode is completely broken |
| 7 | `ai-proctor/python-ai/modules/speech_detection.py` | 33 | `for i in range(0, len(audio_bytes), chunk_size)` iterates with `chunk_size=960`, but `audio_bytes` length may not be a multiple of 960, causing the final partial chunk to be ignored or the loop to process misaligned data. | Potential audio frame misalignment |
| 8 | `ai-proctor/frontend/src/components/proctoring/ProctoringEngine.jsx` | 210 | `// style={{ display: 'none' }}` — the webcam component is visible to the user instead of hidden. | Visual clutter; student can see own camera feed |
| 9 | `ai-proctor/frontend/src/components/proctoring/ProctoringEngine.jsx` | 68-73 | DevTools detection via `window.outerWidth - window.innerWidth > 160` is unreliable on high-DPI displays, zoomed browsers, and undocked DevTools. | False negatives/positives for DevTools detection |
| 10 | `ai-proctor/frontend/src/pages/teacher/TeacherDashboard.jsx` | 57 | `totalStudents` sums `exam.totalStudents` but the `examModel.js` has no `totalStudents` field. Always computes to 0. | Teacher dashboard "Total Students" always shows 0 |
| 11 | `ai-proctor/backend/server.js` | 12 | Uses optional chaining `process.env.ALLOWED_ORIGINS?.split(",")` which may not work on older Node versions, though Express 5 requires Node 18+ so this is minor. | CORS fallback may behave unexpectedly on edge Node versions |
| 12 | `ai-proctor/python-ai/server.py` | 43-223 | No graceful handling of `ModuleNotFoundError` if YOLO model file is missing; the global `object_detector` instantiation at module level will crash the entire server on startup. | Server fails to start without `yolov8s.pt` |
| 13 | `ai-proctor/frontend/src/components/proctoring/ProctoringEngine.jsx` | 84-86 | `document.documentElement.requestFullscreen?.()` is called without storing the promise or checking if already fullscreen. May throw if called repeatedly or if API is blocked. | Unhandled promise rejection on fullscreen request |
| 14 | `ai-proctor/frontend/src/pages/student/ExamPage.jsx` | 39-42 | `criticalViolations >= 3` auto-submit effect depends on `submitRef.current` which is set in a separate effect. Race condition: if violations spike before `submitRef` is initialized, auto-submit may fail. | Potential bypass of 3-strike termination |
| 15 | `ai-proctor/backend/controllers/questionController.js` | 207-210 | `updateQuestion` uses `text || question.text` which prevents clearing question text to empty string (falsy check). | Cannot set question text to "" |
| 16 | `ai-proctor/backend/controllers/examController.js` | 83-86 | `updateExam` uses nullish coalescing `??` correctly, but `isActive` toggle from frontend sends boolean which works. No bug here, but inconsistent with questionController. | Inconsistent update patterns across controllers |
| 17 | `ai-proctor/backend/models/cheatingLogModel.js` | 18-42 | Violation type enum contains both `copy_paste` and `copy_paste_attempt`, both `right_click` and `right_click_attempt`, both `devtools_open` and `browser_dev_tools`. Frontend logs use the `_attempt` variants, creating duplicate semantic categories. | Database enum bloat and confusion |
| 18 | `ai-proctor/python-ai/server.py` | 171-174 | `cv2.putText` for warning overlay uses hardcoded coordinates `(20, 40)` which may overflow on small frames or be invisible on very large frames. | Poor text overlay positioning |
| 19 | `ai-proctor/python-ai/modules/head_pose.py` | 60-67 | Pitch threshold labels are also swapped: `diff_pitch > LOOK_UP_THRESHOLD (20)` returns `"Looking Down"` and `diff_pitch < LOOK_DOWN_THRESHOLD (-20)` returns `"Looking Up"`. | Wrong vertical direction reported |
| 20 | `ai-proctor/frontend/src/pages/student/ExamPage.jsx` | 30 | `criticalTypes` array includes `fullscreen_exit` as critical, but `ProctoringEngine.jsx` logs `fullscreen_exit` with `logViolation` which does not pass a confidence score. The counting logic treats it equally. | Browser fullscreen exit triggers critical counter, which may be too aggressive |

---

## 10. Feature List

### Fully Built

| Feature | Files Involved | Status |
|---------|----------------|--------|
| User registration with role selection | `userController.js`, `RegisterPage.jsx` | Fully built |
| JWT login with 7-day tokens | `userController.js`, `LoginPage.jsx`, `generateToken.js` | Fully built |
| Role-based route protection | `ProtectedRoute.jsx`, `App.jsx`, `authMiddleware.js` | Fully built |
| Teacher exam CRUD | `examController.js`, `TeacherDashboard.jsx`, `CreateExamPage.jsx` | Fully built |
| Question creation with 4 options + correct answer | `questionController.js`, `ExamDetailPage.jsx` | Fully built |
| Student exam listing (active only) | `StudentDashboard.jsx`, `examController.js` | Fully built |
| Exam taking with timer and question navigator | `ExamPage.jsx` | Fully built |
| Auto-grading on submit | `resultController.js`, `calculateMarks.js` | Fully built |
| Result display with score circle and pass/fail badge | `ResultPage.jsx` | Fully built |
| Teacher results table per exam | `ExamResultsPage.jsx`, `resultController.js` | Fully built |
| Real-time AI proctoring (face, head pose, phone, speech) | `ProctoringEngine.jsx`, `server.py`, all `modules/` | Fully built |
| Browser event violation detection (tab switch, copy/paste, devtools, fullscreen, right-click) | `ProctoringEngine.jsx` | Fully built |
| Cheating log persistence with severity auto-mapping | `cheatingLogController.js`, `cheatingLogModel.js` | Fully built |
| Teacher cheating summary dashboard with per-student drill-down | `CheatLogPage.jsx`, `cheatingLogController.js` | Fully built |
| Debounced violation logging (10s cooldown per type) | `ProctoringEngine.jsx` | Fully built |
| Auto-submit on 3 critical violations | `ExamPage.jsx` | Fully built |
| Rate-limited login endpoint | `userRoutes.js` | Fully built |
| Global error handling with Mongoose error translation | `errorMiddleware.js` | Fully built |
| Question sanitization for students (hides correctOption) | `questionController.js` | Fully built |
| Postman collection with automated tests | `postman-collection-updated.json` | Fully built |

### Partially Built

| Feature | What's Missing | Files Involved |
|---------|---------------|----------------|
| 3-warning termination system | Python AI does not maintain a warning counter; frontend counts critical violations only. No `action: "terminate_exam"` from Python. | `server.py`, `ExamPage.jsx` |
| Python direct backend logging | Python AI has no HTTP client to POST violations directly to Node.js backend. All cheating logs go through the student's browser, which is tamperable. | `server.py` |
| Eye tracking | `main.py` imports `EyeTracker` and `EyeTrackingLogic` modules, but they do not exist in the file tree. Only head pose is active in WebSocket server. | `main.py` |
| Standalone Python mode | `main.py` is broken due to missing eye tracking imports. `server.py` is the only runnable Python entry. | `main.py` |
| Exam access code system | `data_flow.md` mentions `POST /api/exams/join {accessCode}`, but no `accessCode` field exists on `examModel.js` and no join endpoint exists. | `examModel.js`, `examController.js` |
| Teacher pass rate computation | Hardcoded `--%` on dashboard; needs aggregation query. | `TeacherDashboard.jsx` |
| Student completed exams count | Hardcoded `--` on dashboard; needs to count results. | `StudentDashboard.jsx` |
| Exam total marks sync | `examModel.totalMarks` is not automatically updated when questions are added/removed. | `examModel.js`, `questionController.js` |
| DevTools detection | Uses unreliable window dimension comparison. | `ProctoringEngine.jsx` |
| Screenshot/evidence capture | Code is commented out in `main.py` lines 179-186. | `main.py` |

### Missing

| Feature | Files That Would Be Affected |
|---------|------------------------------|
| Password reset / forgot password | New controller, route, email service |
| Email verification on registration | New controller, email service, User model field |
| Exam scheduling with start/end dates | `examModel.js`, `examController.js` |
| Randomized question order per student | `questionController.js`, `ExamPage.jsx` |
| Time-limited exam windows (start/end datetime) | `examModel.js`, `examController.js` |
| Image-based or code-based questions | `questionModel.js`, `ExamPage.jsx` |
| Real-time teacher monitoring dashboard (live proctoring view) | New WebSocket room, new teacher page |
| Student profile page | New page, new API endpoints |
| Admin role and admin dashboard | `userModel.js`, `authMiddleware.js`, new routes |
| PDF/CSV export of results | New controller utility, new frontend button |
| API key authentication for Python AI → Backend | `authMiddleware.js`, `cheatingLogRoutes.js`, `server.py` |
| Unit tests | No test files exist in the project |
| CI/CD pipeline | No GitHub Actions or equivalent |
| Docker / containerization | No Dockerfile or docker-compose.yml |
| Production deployment config | No nginx config, no PM2 config, no env.prod |
| WebRTC peer connection for remote proctoring | New architecture entirely |
| ML model training pipeline | No training scripts; relies on pretrained YOLOv8s |

---

## 11. Data Flow — Student Takes an Exam

### Step-by-step sequence from login to result saved:

1. **Authentication**
   - Student opens `http://localhost:5173/login`.
   - `LoginPage.jsx` collects email/password and `POST /api/users/login`.
   - `userController.js` verifies bcrypt hash, generates JWT (7-day expiry, payload `{id, role}`).
   - Frontend receives `{user, token}`, calls `authStore.login()`, which persists to `localStorage` via Zustand `persist` middleware.
   - Axios interceptor in `axios.js` now auto-attaches `Authorization: Bearer <token>` to all requests.

2. **Dashboard — Browse Exams**
   - Student navigates to `/student/dashboard`.
   - `StudentDashboard.jsx` mounts and calls `GET /api/exams` via axios.
   - `examController.js` `getExams` detects `req.user.role === "student"`, queries `Exam.find({ isActive: true })`, populates `teacher` field.
   - Frontend renders exam cards with title, description, duration, teacher name, and an active/inactive badge.

3. **Start Exam**
   - Student clicks "Start Exam" on an active exam card.
   - `handleStartExam(examId)` navigates to `/student/exam/${examId}`.
   - `ExamPage.jsx` mounts. `useEffect` calls:
     - `GET /api/exams/:id` → `getExamById` returns exam document.
     - `GET /api/exams/:id/questions` → `getQuestions` sanitizes questions (strips `correctOption`) for student role.
   - `timeLeft` state initialized to `exam.duration * 60` seconds.
   - Timer `setInterval` begins; when `timeLeft` hits 0, `submitRef.current()` is called automatically.

4. **Proctoring Engine Activation**
   - `ExamPage.jsx` renders `<ProctoringEngine examId={id} onViolation={handleViolation} />`.
   - `ProctoringEngine.jsx` opens `WebSocket('ws://localhost:8000/ws')`.
   - On `ws.onopen`, sends JSON text message: `{examId: id}`.
   - Then starts two streams:
     - **Video:** Every 500ms, captures a frame from `<Webcam>` (320x240), draws to canvas, encodes as base64 JPEG, sends as WebSocket text.
     - **Audio:** `getUserMedia({audio:true})` → `AudioContext` at 16kHz → `ScriptProcessorNode` (4096 buffer) → converts Float32 to Int16 PCM → sends `ArrayBuffer` as WebSocket binary.
   - **Browser monitoring:** Adds listeners for:
     - `visibilitychange` → logs `tab_switch`
     - `fullscreenchange` → logs `fullscreen_exit`
     - `copy`, `cut` → logs `copy_paste_attempt`
     - `contextmenu` → logs `right_click_attempt` (prevents default)
     - `keydown` → blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+C/V/X
     - `window.blur` → logs `tab_switch`
     - Interval every 5s checks window dimensions for DevTools
   - All browser violations go through `logViolation()` which:
     - Checks 10-second debounce per violation type (`violationRef`)
     - `POST /api/cheating-logs` with `{examId, type, description}`
     - Calls `onViolation(type)` to increment `criticalViolations` in `ExamPage`

5. **AI Processing (Python Server)**
   - `server.py` `websocket_endpoint` accepts connection.
   - Per-session instances: `FaceDetector`, `HeadPoseEstimator`, `HeadPoseLogic`, `SpeechDetector`, `SpeechLogic`.
   - Global `ObjectDetector` (YOLOv8s) loaded once at module level.
   - Receives `examId` JSON → stores in `exam_id` variable.
   - Receives base64 frame → decodes with OpenCV → processes:
     - **Face detection:** MediaPipe draws green rectangles, returns face count.
     - **Head pose:** MediaPipe FaceMesh calibrates 10 frames, then computes yaw/pitch diff from baseline. If diff exceeds thresholds for >0.5s, `cheating = True`.
     - **YOLO:** Detects `person` (class 0) and `cell phone` (class 67). Draws blue box for person, red box for phone.
     - **Speech:** Binary PCM chunks accumulated in `audio_buffer`. Split into 960-byte frames. WebRTC VAD mode 3 + RMS > 300. If speech persists >2s, `speech_cheating = True`.
   - Builds `warnings` array (e.g., `["No Person Detected"]`, `["Phone Detected"]`, `["Normal"]`).
   - Annotates frame with red warning text at `(20, 40)`.
   - Encodes frame back to base64 JPEG.
   - Sends JSON response: `{warning, warnings[], violation_type, exam_id, image}`.

6. **Violation Handling in Frontend**
   - `ProctoringEngine.jsx` `ws.onmessage` parses JSON.
   - If `data.violation_type` and `warning !== 'Normal'`, calls `logViolationRef.current(violation_type, warning, null)`.
   - This posts to `/api/cheating-logs` (same debounced logger as browser events).
   - `ExamPage.jsx` `handleViolation` increments `criticalViolations` if type is in critical list.
   - When `criticalViolations >= 3` and not already submitting, `useEffect` calls `submitRef.current(true)` (terminated submit).

7. **Answering Questions**
   - Student sees one question at a time with 4 option buttons.
   - Selecting an option updates `answers` state: `{ [questionId]: optionIndex }`.
   - Progress bar and question navigator (grid of numbered buttons) show answered/unanswered status.
   - Student can click Previous/Next or jump via navigator.
   - Timer continuously counts down in the top navbar with color coding (blue → orange → red/pulsing).

8. **Submission**
   - Student clicks "Submit Exam" or timer hits 0 or 3 violations reached.
   - `handleSubmit(isTerminated)` builds `answersArray`: maps all questions to `{question: q._id, selectedOption: answers[q._id] ?? null}`.
   - `POST /api/results` with `{examId: id, answers, terminated}`.
   - `resultController.js` `submitExam`:
     - Validates `examId` and `answers` array.
     - Checks existing result via `Result.findOne({student, exam})` → returns 409 if duplicate.
     - Calls `calculateMarks(examId, answers, exam)`:
       - Fetches all `Question.find({exam})`.
       - For each question, finds matching answer; if `selectedOption === correctOption`, adds `question.marks` to `score`.
       - Sums all question marks into `totalMarks`.
       - Computes `percentage = Math.round((score / totalMarks) * 100)`.
     - Creates `Result` document.
     - Returns `{_id, score, totalMarks, percentage, submittedAt}`.
   - Frontend receives result, navigates to `/student/result` with state `{result, terminated}`.

9. **Result Display**
   - `ResultPage.jsx` reads `location.state.result`.
   - If no result, shows error card with "No result data found" and back button.
   - Otherwise renders:
     - Large circular percentage indicator with green/yellow/red gradient.
     - Pass/Fail/Average badge based on thresholds (≥70 Pass, ≥50 Average, <50 Fail).
     - Score and Total Marks stat cards.
     - Submission timestamp.
     - "Back to Dashboard" button.

10. **Teacher Review (Post-Exam)**
    - Teacher opens `/teacher/dashboard`, clicks "Logs" on the exam.
    - Navigates to `/teacher/exam/:id/cheating`.
    - `CheatLogPage.jsx` calls `GET /api/cheating-logs/exam/${id}/summary`.
    - Backend aggregation pipeline groups by student, sums total/critical/high counts, collects unique types.
    - Frontend renders summary table: student name, email, total violations, critical count, high count, types.
    - Teacher clicks a student row → fetches `GET /api/cheating-logs/exam/${id}/student/${studentId}`.
    - Frontend switches to timeline view: timestamp, type badge, description, severity badge, confidence bar.

---

## 12. Security Model

### Authentication
- **Mechanism:** Stateless JWT (Bearer token) stored in `localStorage` via Zustand persist.
- **Token contents:** `{id, role}` signed with `JWT_SECRET`, expires in 7 days.
- **Transmission:** Sent in `Authorization: Bearer <token>` header on every Axios request.
- **Validation:** `authMiddleware.js` `protect` function verifies token with `jwt.verify`, then fetches full user document (excluding password) and attaches to `req.user`.
- **Password storage:** bcryptjs with salt rounds 10. Hashed on `pre('save')` hook in `userModel.js`.
- **Login protection:** `express-rate-limit` on `/api/users/login`: 10 attempts per 15-minute window per IP.

### Role-Based Access Control (RBAC)
- **Roles:** `student`, `teacher`.
- **Middleware:**
  - `protect` — any authenticated user.
  - `teacherOnly` / `studentOnly` — single role restriction.
  - `authorizeRoles(...roles)` — flexible multi-role restriction.
- ** Enforcement points:**
  - Exam CRUD: teacher can only modify exams where `exam.teacher.toString() === req.user._id.toString()`.
  - Question CRUD: teacher can only modify questions belonging to their own exams.
  - Results: students can only submit/submit their own; teachers can only view results for their own exams.
  - Cheating logs: students can only create logs for themselves (student ID taken from `req.user._id`); teachers can only view logs for their own exams.

### Data Protection
- **Question answers:** `getQuestions` controller explicitly strips `correctOption` from the response when `req.user.role === "student"`.
- **Password exclusion:** User queries use `.select("-password")` by default.
- **Error messages:** `errorMiddleware.js` translates Mongoose errors into generic messages (e.g., `CastError` → "Resource not found", `11000` → field-specific duplicate message) and only exposes `err.stack` when `NODE_ENV !== "production"`.
- **CORS:** Restricted to `ALLOWED_ORIGINS` (default `localhost:5173`). Credentials enabled.

### Cheating Log Protection
- **Creation:** Only authenticated students can `POST /api/cheating-logs`. The `student` field is automatically set to `req.user._id` — students cannot forge logs for other students.
- **Read access:** Only the exam's owning teacher can read logs for that exam. Every log read endpoint verifies `exam.teacher.toString() !== req.user._id.toString()` → 403.
- **Aggregation exposure:** The `/summary` endpoint uses MongoDB aggregation with `$lookup` to join `users` collection. Results are scoped to the teacher's exam.
- **Tampering risk (current):** Python AI server does **not** have direct backend access. All AI-detected violations are relayed through the student's browser (`ProctoringEngine.jsx` → `POST /api/cheating-logs`). A technically skilled student could block or modify these requests. The `implementation_plan.md` proposes adding an `X-API-Key` route (`POST /api/cheating-logs/ai-report`) to allow Python to log directly, but this is **not yet implemented**.
- **Debouncing:** Frontend enforces 10-second cooldown per violation type to prevent database flooding and reduce false-positive noise.
- **No encryption at rest:** MongoDB connection uses standard TCP; no TLS/SSL configuration is visible in the code. If `MONGO_URI` uses `mongodb+srv`, TLS is handled by the driver.

### Browser Security Measures
- **Fullscreen enforcement:** `requestFullscreen()` called on exam start. Exiting triggers `fullscreen_exit` violation.
- **Tab/window switching:** `visibilitychange` and `window.blur` trigger `tab_switch`.
- **Copy/paste blocking:** `copy`, `cut`, `keydown` (Ctrl+C/V/X) are intercepted and prevented with `e.preventDefault()`.
- **Right-click blocking:** `contextmenu` event prevented.
- **DevTools detection:** Window dimension comparison (unreliable) and keyboard shortcut blocking.
- **Auto-submit on violations:** 3 critical violations auto-submit the exam with `terminated: true`, preventing continued access.

### Known Security Gaps
- **XSS vulnerability:** JWT stored in `localStorage` is accessible to any JavaScript running in the origin, including XSS payloads. Moving to `httpOnly` cookies would require CSRF protection.
- **No refresh tokens:** 7-day JWT is long-lived. No mechanism to revoke tokens before expiry (no token blacklist).
- **No HTTPS:** Development-only HTTP. Production deployment must add TLS termination.
- **No input sanitization:** Express `express.json()` parses bodies but there is no explicit XSS/HTML sanitization on text fields (exam titles, descriptions, question text). MongoDB injection is mitigated by Mongoose parameterization.
- **WebSocket unauthenticated:** The Python AI WebSocket at `:8000/ws` accepts any connection and only receives `examId`. There is no token validation on the WebSocket — any client can connect and send frames.
- **YOLO model file exposure:** `yolov8s.pt` is a large binary in the repository. Not a security risk per se, but bloats the repo.
- **No audit logging:** There is no log of admin/teacher actions (who deleted an exam, who modified a question).
- **File upload absence:** No file upload endpoints exist, so no upload validation is needed currently.
