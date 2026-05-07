# AI Proctoring System - Project Overview

## 1. Project Overview
**Name:** AI Proctoring System
**Purpose:** Ensure academic integrity in online exams through automated computer vision, audio analysis, and browser monitoring.
**Description:** The AI Proctoring System is a full-stack application that provides real-time monitoring of students during online assessments. It leverages a React frontend for the user interface, a Node.js/Express backend for exam and user management, and a Python-based FastAPI service using YOLO, OpenCV, and MediaPipe to detect unauthorized objects, extra people, and suspicious behaviors.

---

## 2. Full Folder Structure
```text
ai-proctor/
├── ai_dtection/                 # (Legacy/Duplicate Python AI Environment)
│   └── ai_proctoring_system/
│       ├── detect.py
│       ├── server.py
│       ├── modules/
│       └── utils/
├── backend/                     # Node.js Express Server
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── api-documentation.md
│   ├── postman-collection-updated.json
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── cheatingLogController.js
│   │   ├── examController.js
│   │   ├── questionController.js
│   │   ├── resultController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── cheatingLogModel.js
│   │   ├── examModel.js
│   │   ├── questionModel.js
│   │   ├── resultModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── cheatingLogRoutes.js
│   │   ├── examRoutes.js
│   │   ├── resultRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       ├── calculateMarks.js
│       └── generateToken.js
├── frontend/                    # React Vite Application
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Spinner.jsx
│       │   ├── proctoring/
│       │   │   └── ProctoringEngine.jsx
│       │   └── ui/
│       │       ├── badge.jsx
│       │       ├── button.jsx
│       │       ├── card.jsx
│       │       ├── input.jsx
│       │       ├── label.jsx
│       │       └── table.jsx
│       ├── lib/
│       │   └── utils.js
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── student/
│       │   │   ├── ExamPage.jsx
│       │   │   ├── ResultPage.jsx
│       │   │   └── StudentDashboard.jsx
│       │   └── teacher/
│       │       ├── CheatLogPage.jsx
│       │       ├── CreateExamPage.jsx
│       │       ├── ExamDetailPage.jsx
│       │       ├── ExamResultsPage.jsx
│       │       └── TeacherDashboard.jsx
│       └── store/
│           └── authStore.js
└── python-ai/                   # Active Python FastAPI Server
    ├── .env
    ├── main.py
    ├── requirements.txt
    ├── server.py
    ├── __init__.py
    ├── config/
    │   ├── settings.py
    │   └── __init__.py
    └── modules/
        ├── eye_tracking.py
        ├── eye_tracking_logic.py
        ├── face_detection.py
        ├── head_pose.py
        ├── head_pose_logic.py
        ├── object_detection.py
        ├── speech_detection.py
        ├── speech_logic.py
        └── __init__.py
```

---

## 3. Tech Stack & Libraries
*   **Frontend:** React (18.2.0), Vite (5.0.8), React Router DOM (6.20.0), Axios (1.6.2), Zustand (4.4.7), TailwindCSS (3.3.6), React-Webcam (7.2.0), Lucide React (0.487.0).
*   **Backend:** Node.js, Express (5.2.1), MongoDB (Mongoose 9.5.0), jsonwebtoken (9.0.3), bcryptjs (3.0.3), cors (2.8.6), dotenv (17.4.2), express-rate-limit.
*   **Python AI:** FastAPI (0.104.1), Uvicorn (0.24.0), WebSockets (12.0), OpenCV-Python (4.8.1.78), MediaPipe (0.10.14), Ultralytics / YOLO (8.0.221), PyTorch (2.1.1), NumPy (1.26.2), Pydantic (2.5.2), python-dotenv (1.0.0), webrtcvad-wheels.
*   **Database:** MongoDB.

---

## 4. Architecture Diagram
```text
+---------------------+                      +---------------------+
|  Frontend (React)   | == HTTP/REST =====>  |  Backend (Node.js)  |
|  - Renders UI       | <==================  |  - Auth & Exams     |
|  - Captures Video   |                      |  - Cheating Logs    |
|  - Captures Audio   |                      +----------+----------+
+---------+-----------+                                 |
          |                                             v
          | WebSocket (Frames/Audio)           +---------------------+
          +=================================>  | Database (MongoDB)  |
          <=================================+  |  - Users, Exams     |
          | Warnings (JSON)                    |  - Results, Logs    |
          v                                    +---------------------+
+---------------------+
| Python AI (FastAPI) |
|  - Face/Pose Detect |
|  - Eye Tracking     |
|  - YOLO Objects     |
|  - Speech Detect    |
+---------------------+
```

---

## 5. API Endpoints

### User Routes (`/api/users`)
*   `POST /register` - **Public** - Register a new user (student/teacher).
*   `POST /login` - **Public** - Authenticate user & receive JWT token.
*   `GET /me` - **Protected** - Get current user's profile.

### Exam Routes (`/api/exams`)
*   `GET /` - **Protected** - Get a list of exams.
*   `POST /` - **Teacher** - Create a new exam.
*   `GET /:id` - **Protected** - Get details of a specific exam.
*   `PUT /:id` - **Teacher** - Update exam details.
*   `DELETE /:id` - **Teacher** - Delete an exam.

### Question Routes (Mounted at `/:examId/questions` in examRoutes)
*   `GET /` - **Protected** - Get questions for a specific exam.
*   `POST /` - **Teacher** - Add a question to an exam.
*   `DELETE /:questionId` - **Teacher** - Remove a question from an exam.

### Result Routes (`/api/results`)
*   `POST /` - **Student** - Submit an exam, auto-calculate score, and save result.
*   `GET /my` - **Student** - Get logged-in student's results.
*   `GET /exam/:examId` - **Teacher** - Get all student results for a specific exam.

### Cheating Log Routes (`/api/cheating-logs`)
*   `POST /` - **Student** - Log an observed cheating event (called automatically by frontend hooks/AI).
*   `GET /exam/:examId` - **Teacher** - Get all cheating logs for a specific exam.
*   `GET /exam/:examId/summary` - **Teacher** - Get aggregated summary of cheating events.
*   `GET /exam/:examId/student/:studentId` - **Teacher** - Get a specific student's cheating logs.

---

## 6. Database Models

### User
*   `name` (String, required)
*   `email` (String, required, unique)
*   `password` (String, required)
*   `role` (Enum: "student", "teacher", default: "student")

### Exam
*   `title` (String, required)
*   `description` (String, default: "")
*   `duration` (Number in minutes, required)
*   `teacher` (ObjectId -> User, required)
*   `isActive` (Boolean, default: true)
*   `isPublished` (Boolean, default: false)
*   `totalMarks` (Number, default: 0)

### Question
*   `exam` (ObjectId -> Exam, required)
*   `text` (String, required)
*   `options` (Array of Strings, exactly 4 required)
*   `correctOption` (Number 0-3, required)
*   `marks` (Number, default: 1)
*   `isActive` (Boolean, default: true)

### Result
*   `student` (ObjectId -> User, required)
*   `exam` (ObjectId -> Exam, required)
*   `answers` (Array of objects: `{ question: ObjectId, selectedOption: Number }`)
*   `score` (Number, default: 0)
*   `totalMarks` (Number, default: 0)
*   `percentage` (Number, default: 0)
*   `submittedAt` (Date, default: Date.now)
*   *Indexes: Unique compound index on `student` and `exam` to prevent double submission.*

### CheatingLog
*   `student` (ObjectId -> User, required)
*   `exam` (ObjectId -> Exam, required)
*   `type` (String Enum: no_face_detected, multiple_faces, cell_phone_detected, laptop_detected, tab_switch, fullscreen_exit, copy_paste_attempt, browser_dev_tools, suspicious_movement, microphone_muted, other, etc.)
*   `severity` (Enum: "low", "medium", "high", "critical")
*   `confidence` (Number 0-100)
*   `description` (String)
*   `timestamp` (Date, default: Date.now)

---

## 7. Environment Variables

### Backend (`backend/.env`)
*   `NODE_ENV=development`
*   `PORT=5000`
*   `MONGO_URI=mongodb://127.0.0.1:27017/ai-proctor` (or Atlas connection string)
*   `JWT_SECRET=<your-jwt-secret-here>`
*   `ALLOWED_ORIGINS=http://localhost:5173`

### Python AI (`python-ai/.env`)
All settings are loaded via `python-dotenv` in `settings.py`, with sensible defaults:
*   `CAMERA_INDEX=0`, `FRAME_WIDTH=640`, `FRAME_HEIGHT=480`
*   `FACE_CONFIDENCE=0.70`, `MAX_FACES_ALLOWED=1`
*   `LOOK_LEFT_THRESHOLD=-20`, `LOOK_RIGHT_THRESHOLD=20` (Head Pose)
*   `EYE_H_THRESHOLD=0.12`, `EYE_V_THRESHOLD=0.10`
*   `SPEECH_TIME_LIMIT=2.0`
*   `DETECT_PHONE=true`, `DETECT_PERSON=true`

---

## 8. How to Run the Project

### Method 1: Run Individually (Recommended)
You need three terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 (Python AI):**
```bash
cd python-ai
pip install -r requirements.txt
python server.py
```

### Method 2: Run All via Concurrent Script
*Runs backend, frontend, and Python AI concurrently:*
```bash
cd backend
npm run start:all
```

---

## 9. Known Bugs & Audit Findings

A deep code audit identified the following issues (not yet fixed):

### Critical
*   **ProtectedRoute.jsx** — Returns `<Outlet />` instead of `{children}`, causing all protected pages to render blank.
*   **calculateMarks.js** — Uses `exam.totalMarks` (always 0) instead of summing question marks → percentage is always 0%.
*   **cheatingLogModel.js** — Enum missing `phone_detected` and `speech_detected`. Python AI sends these types, but Mongoose rejects them → AI violations silently fail to save.
*   **.gitignore** — Missing `.env` pattern. Both `backend/.env` and `python-ai/.env` will be committed on `git init`.

### High
*   **questionController.js** — `isPublished` filter is always `false`, blocking all student standalone question queries.
*   **server.py** — AI modules are global singletons; concurrent WebSocket sessions overwrite each other's calibration.
*   **server.py** — CORS allows all origins (`*`) on the Python WebSocket server.
*   **CheatLogPage.jsx** — Filter dropdown uses `phone_detected` which doesn't match the model enum `cell_phone_detected`.

### Medium
*   **resultController.js** — `terminated` flag sent by frontend is never saved.
*   **CheatLogPage.jsx** — Null confidence value renders as `null%` in the UI.
*   **ExamPage.jsx** — Timer calls stale `handleSubmit` closure.

---

## 10. Feature List
*   **Fully Built:**
    *   JWT-Based User Authentication (Student & Teacher roles).
    *   Exam & Question CRUD Management for Teachers.
    *   Student Exam Taking Interface (Countdown timer, question navigation).
    *   AI Cheating Detection via WebSockets (Head pose, eye tracking, multiple face detection, phone/laptop YOLO object detection).
    *   Browser Security Sandbox (Fullscreen enforcement, tab switching tracking, copy-paste disabled, DevTools tracking).
    *   Automatic grading & Result Generation.
    *   Audio/Speech Detection: Frontend streams PCM audio via WebSocket. Python backend uses WebRTCVAD (mode 3) + RMS energy filter to detect human speech. Sustained speech triggers `speech_detected` violation.
    *   Automatic Exam Termination: `ExamPage.jsx` tracks critical violations (phone, multiple faces, tab switch, speech, fullscreen exit). At 3 critical violations, exam is auto-submitted and student is redirected to results.
    *   Login Rate Limiting: `express-rate-limit` on `POST /login` — max 10 attempts per 15-minute window per IP.
*   **Partially Built:**
    *   Teacher Dashboard Reports: Results and logs are tracked but may lack advanced filtering/graphs.
*   **Missing:**
    *   Permanent Video/Frame Storage: Screenshots are sent via WebSocket but not saved locally or on S3, only the JSON violation log is saved.

---

## 11. Data Flow (Exam Attempt Workflow)
1. **Authentication:** Student logs into the React frontend (`LoginPage.jsx`), receives a JWT, and goes to the dashboard.
2. **Initiation:** Student selects an exam. `ExamPage.jsx` requests Fullscreen mode.
3. **Hardware Initialization:** `ProctoringEngine.jsx` connects to the local Webcam and Microphone, and opens a WebSocket to `ws://localhost:8000/ws` (Python API).
4. **Continuous Analysis:**
    *   Frontend converts webcam video into base64 images and microphone into PCM data. It sends these over WebSocket every 500ms.
    *   Python AI runs OpenCV, YOLO, and MediaPipe to detect objects, gaze, and head pose.
    *   If Python AI flags "Phone Detected", it returns a JSON response containing `violation_type`.
    *   React receives this, debounces the alert (max 1 per 10 seconds), and sends an HTTP POST to `backend/api/cheating-logs`.
    *   Simultaneously, `useEffect` hooks in React track DOM events (Blur, Visibility Change, Keydown) to log browser tab-switching or DevTools attempts.
5. **Exam Completion:** Student selects answers and clicks "Submit" (or time expires). `ExamPage.jsx` sends an array of selected option indices to `/api/results`.
6. **Grading:** The Node.js backend compares submissions to the `correctOption` stored in MongoDB, calculates the score, and saves a `Result` document.
7. **Resolution:** Student is redirected to their Score page. WebSocket connection terminates gracefully.

---

## 12. Security Model
*   **Authentication:** All protected routes require a JWT token passed in the `Authorization: Bearer <token>` header. Passwords are salted and hashed using `bcryptjs`. JWT tokens expire after 7 days.
*   **Role-Based Access Control (RBAC):** The `authorizeRoles` middleware ensures that only `teacher` accounts can create exams, edit questions, or view other students' cheating logs.
*   **Brute-Force Protection:** Login endpoint is rate-limited to 10 attempts per 15-minute window per IP using `express-rate-limit`.
*   **Cheating Logs Integrity:** Cheating logs are instantiated securely via backend REST endpoints. Students cannot view or modify the `CheatingLog` collection.
*   **Anti-Tampering Constraints:** MongoDB schemas enforce correct types and prevent duplicate submissions (unique index on `student + exam` in `ResultModel`).
*   **Browser Containment:** Event listeners intercept right-clicks, copy/paste keyboard shortcuts (CTRL+C, CTRL+V), and track `window.outerWidth` diffs to detect if developer tools are opened.
*   **Environment Configuration:** Python AI settings are loaded from `.env` via `python-dotenv`. Backend uses `dotenv` for all secrets.
*   **⚠️ PENDING:** `.gitignore` does not yet include `.env` — must be added before initializing a git repository.
