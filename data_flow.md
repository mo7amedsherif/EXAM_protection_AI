# AI Proctor — Data Flow

## Architecture Overview

```mermaid
graph LR
    subgraph Browser["Browser (:5173)"]
        A["React Frontend<br/>Vite + Zustand"]
    end

    subgraph Node["Node.js Backend (:5000)"]
        B["Express API<br/>REST + JWT"]
    end

    subgraph Python["Python AI (:8000)"]
        C["FastAPI<br/>WebSocket"]
    end

    subgraph DB["MongoDB (:27017)"]
        D["ai-proctor DB"]
    end

    A -- "REST API (HTTP)<br/>/api/*" --> B
    A -- "WebSocket (ws://)<br/>/ws" --> C
    B -- "Mongoose ODM" --> D
    C -. "no direct DB access" .-> C
```

The system is **3 services + 1 database**:

| Service | Port | Role |
|---|---|---|
| **React Frontend** | `5173` | UI, webcam/mic capture, browser event monitoring |
| **Node.js Backend** | `5000` | REST API, auth (JWT), all DB operations |
| **Python AI** | `8000` | Real-time AI analysis (face, head pose, speech, YOLO) |
| **MongoDB** | `27017` | Stores users, exams, questions, results, cheating logs |

> [!IMPORTANT]
> The Python AI server has **no database access**. It only analyzes frames/audio and returns results. The frontend is responsible for persisting violations to the backend.

---

## 1. Authentication Flow

```mermaid
sequenceDiagram
    participant U as Student/Teacher
    participant F as React Frontend
    participant B as Node.js Backend
    participant DB as MongoDB

    U->>F: Enter credentials
    F->>B: POST /api/users/login {email, password}
    B->>DB: Find user, verify bcrypt hash
    DB-->>B: User document
    B-->>F: {user, token (JWT)}
    F->>F: Zustand store persists {user, token} to localStorage
    Note over F: All future requests include<br/>Authorization: Bearer <token>
```

**Key files:**
- [authStore.js](file:///c:/Users/mo7am/Desktop/ai%20v%205/ai-proctor/frontend/src/store/authStore.js) — Zustand store, persists to `localStorage`
- [axios.js](file:///c:/Users/mo7am/Desktop/ai%20v%205/ai-proctor/frontend/src/api/axios.js) — Interceptor auto-attaches JWT to every request
- [userController.js](file:///c:/Users/mo7am/Desktop/ai%20v%205/ai-proctor/backend/controllers/userController.js) — Login/register logic

---

## 2. Exam Lifecycle (Teacher → Student → Results)

```mermaid
sequenceDiagram
    participant T as Teacher
    participant F as Frontend
    participant B as Backend API
    participant DB as MongoDB

    Note over T,DB: ── TEACHER CREATES EXAM ──
    T->>F: Fill exam form + questions
    F->>B: POST /api/exams {title, duration, questions[]}
    B->>DB: Create Exam + Question docs
    DB-->>B: Exam with accessCode
    B-->>F: Exam object
    F-->>T: Show access code to share

    Note over T,DB: ── STUDENT TAKES EXAM ──
    participant S as Student
    S->>F: Enter access code
    F->>B: POST /api/exams/join {accessCode}
    B->>DB: Find exam, verify active
    DB-->>B: Exam + Questions
    B-->>F: Exam data
    F-->>S: Render exam + start proctoring

    Note over T,DB: ── STUDENT SUBMITS ──
    S->>F: Click submit
    F->>B: POST /api/results {examId, answers[]}
    B->>DB: Calculate score, save Result
    B-->>F: {score, total}
    F-->>S: Show result page
```

---

## 3. Real-Time AI Proctoring (The Core Loop)

This is the most important flow — it runs continuously during the exam.

```mermaid
sequenceDiagram
    participant Cam as Webcam + Mic
    participant PE as ProctoringEngine.jsx
    participant WS as Python AI (WebSocket)
    participant BE as Node.js Backend
    participant DB as MongoDB

    PE->>WS: Connect ws://localhost:8000/ws
    PE->>WS: Send JSON {examId}

    loop Every 500ms
        Cam->>PE: Video frame (320x240)
        PE->>WS: Send base64 JPEG frame
    end

    loop Continuous
        Cam->>PE: Audio PCM chunks (16kHz)
        PE->>WS: Send binary Int16 PCM
    end

    Note over WS: Python AI processes frame:
    Note over WS: 1. Face detection (MediaPipe)
    Note over WS: 2. Head pose estimation
    Note over WS: 3. YOLO object detection
    Note over WS: 4. Speech VAD (webrtcvad)

    WS-->>PE: JSON response with warnings + annotated image

    alt violation_type !== null
        PE->>BE: POST /api/cheating-logs {examId, type, description}
        BE->>DB: Save CheatingLog document
    end
```

### What Python AI Returns (per frame)

```json
{
  "warning": "Cheating: Looking Away",
  "warnings": ["Cheating: Looking Away", "Phone Detected"],
  "violation_type": "suspicious_movement",
  "exam_id": "665a...",
  "image": "data:image/jpeg;base64,..."
}
```

### Warning → Violation Type Mapping

| Python Warning | `violation_type` stored in DB |
|---|---|
| `"No Person Detected"` | `no_face_detected` |
| `"Multiple People Detected"` | `multiple_faces` |
| `"Phone Detected"` | `cell_phone_detected` |
| `"Cheating: Looking Away"` | `suspicious_movement` |
| `"Speech Detection"` | `speech_detected` |

### Browser-Side Violations (no Python involved)

The frontend also detects these directly and logs them to the backend:

| Event | `violation_type` |
|---|---|
| Tab switch / window blur | `tab_switch` |
| Exit fullscreen | `fullscreen_exit` |
| Ctrl+C / Ctrl+V / Ctrl+X | `copy_paste_attempt` |
| Right-click | `right_click_attempt` |
| F12 / Ctrl+Shift+I | `browser_dev_tools` |
| Mic access denied | `microphone_muted` |

> [!NOTE]
> All violations are **debounced** (10 second cooldown per type) in [ProctoringEngine.jsx](file:///c:/Users/mo7am/Desktop/ai%20v%205/ai-proctor/frontend/src/components/proctoring/ProctoringEngine.jsx#L5) to avoid flooding the database.

---

## 4. Teacher Reviews Cheating Logs

```mermaid
sequenceDiagram
    participant T as Teacher
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    T->>F: Open exam detail page
    F->>B: GET /api/cheating-logs/exam/:examId/summary
    B->>DB: Aggregate logs by student
    DB-->>B: [{student, total, critical, high, types}]
    B-->>F: Summary array
    F-->>T: Table showing per-student violation counts

    T->>F: Click on a student
    F->>B: GET /api/cheating-logs/exam/:examId/student/:studentId
    B->>DB: Find all logs for that student
    DB-->>B: Detailed log entries
    F-->>T: Timeline of violations with timestamps
```

---

## 5. Complete Request Path Summary

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React)                       │
│                                                         │
│  Zustand Store ←→ localStorage (JWT + user)             │
│                                                         │
│  axios.js ──── HTTP + JWT ────→ :5000 (Node.js)         │
│    /api/users/*                  │                      │
│    /api/exams/*                  ├──→ MongoDB            │
│    /api/results/*                │                      │
│    /api/cheating-logs/*          │                      │
│                                                         │
│  ProctoringEngine.jsx            │                      │
│    ├── WebSocket ──────────────→ :8000 (Python AI)      │
│    │    ├── sends: JPEG frames (text)                   │
│    │    ├── sends: PCM audio (binary)                   │
│    │    └── receives: warnings + annotated image        │
│    │                                                    │
│    └── On violation ──→ POST /api/cheating-logs ──→ DB  │
└─────────────────────────────────────────────────────────┘
```

---

## Port & Protocol Quick Reference

| From | To | Protocol | Data |
|---|---|---|---|
| Frontend | Backend | HTTP REST (JWT) | CRUD for users, exams, results, logs |
| Frontend | Python AI | WebSocket | Video frames (base64) + audio (PCM binary) |
| Python AI | Frontend | WebSocket | JSON warnings + annotated JPEG |
| Backend | MongoDB | TCP (Mongoose) | All persistence |
| Frontend | Frontend | localStorage | Auth token + user object |
