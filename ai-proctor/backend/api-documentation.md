# AI Proctor Backend API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Exams](#exams)
4. [Questions](#questions)
5. [Results](#results)
6. [Cheating Logs](#cheating-logs)
7. [Code Execution](#code-execution)
8. [Health Check](#health-check)

---

## 🔐 Authentication

### Register User
```http
POST /api/users/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "123456",
  "role": "student"
}
```

**Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John Doe",
  "email": "john@test.com",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User
```http
POST /api/users/login
```

**Body:**
```json
{
  "email": "john@test.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John Doe",
  "email": "john@test.com",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get User Profile
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John Doe",
  "email": "john@test.com",
  "role": "student"
}
```

---

## 👥 Users

### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

---

## 📝 Exams

### Create Exam (Teacher/Admin)
```http
POST /api/exams
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Mathematics Test",
  "description": "Basic mathematics assessment",
  "duration": 60,
  "startDate": "2024-01-01T10:00:00.000Z",
  "endDate": "2024-01-01T12:00:00.000Z",
  "maxAttempts": 1,
  "passingScore": 70,
  "shuffleQuestions": false,
  "shuffleAnswers": false,
  "showResults": true,
  "allowReview": false
}
```

### Get All Exams
```http
GET /api/exams
Authorization: Bearer <token>
```

**Query Parameters:**
- `exam` - Filter by exam ID
- `status` - Filter by status
- `student` - Filter by student ID

### Get Single Exam
```http
GET /api/exams/{examId}
Authorization: Bearer <token>
```

### Update Exam (Teacher/Admin)
```http
PUT /api/exams/{examId}
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Mathematics Test",
  "description": "Updated description",
  "duration": 90,
  "isActive": true
}
```

### Delete Exam (Teacher/Admin)
```http
DELETE /api/exams/{examId}
Authorization: Bearer <teacher_token>
```

---

## ❓ Questions

### Add Question to Exam (Teacher/Admin)
```http
POST /api/exams/{examId}/questions
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "What is 2 + 2?",
  "options": ["3", "4", "5", "6"],
  "correctOption": 1,
  "marks": 1
}
```

### Get Exam Questions
```http
GET /api/exams/{examId}/questions
Authorization: Bearer <token>
```

### Delete Question from Exam (Teacher/Admin)
```http
DELETE /api/exams/{examId}/questions/{questionId}
Authorization: Bearer <teacher_token>
```

### Create Standalone Question (Teacher/Admin)
```http
POST /api/questions
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correctOption": 2,
  "marks": 2,
  "exam": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

### Get All Questions
```http
GET /api/questions
Authorization: Bearer <token>
```

**Query Parameters:**
- `exam` - Filter by exam ID
- `category` - Filter by category
- `search` - Search in question text
- `type` - Filter by question type
- `difficulty` - Filter by difficulty level

### Get Single Question
```http
GET /api/questions/{questionId}
Authorization: Bearer <token>
```

### Update Question (Teacher/Admin)
```http
PUT /api/questions/{questionId}
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

### Delete Question (Teacher/Admin)
```http
DELETE /api/questions/{questionId}
Authorization: Bearer <teacher_token>
```

---

## 📊 Results

### Start Exam (Student)
```http
POST /api/results/start
Authorization: Bearer <student_token>
Content-Type: application/json
```

**Body:**
```json
{
  "examId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "deviceFingerprint": "abc123",
  "location": "New York"
}
```

### Submit Answer (Student)
```http
POST /api/results/{resultId}/answer
Authorization: Bearer <student_token>
Content-Type: application/json
```

**Body:**
```json
{
  "questionId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "selectedOption": 1,
  "timeSpent": 30
}
```

### Submit Exam (Student)
```http
POST /api/results/{resultId}/submit
Authorization: Bearer <student_token>
```

### Get Student Results
```http
GET /api/results/student
Authorization: Bearer <student_token>
```

### Get All Results (Teacher/Admin)
```http
GET /api/results
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
- `exam` - Filter by exam ID
- `status` - Filter by status
- `student` - Filter by student ID

### Get Single Result
```http
GET /api/results/{resultId}
Authorization: Bearer <token>
```

### Grade Result (Teacher/Admin)
```http
POST /api/results/{resultId}/grade
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "score": 85,
  "feedback": "Good performance, but review basic concepts",
  "passed": true
}
```

### Get Result Statistics (Teacher/Admin)
```http
GET /api/results/stats
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
- `examId` - Filter by exam ID

---

## 🚨 Cheating Logs

### Log Cheating Incident
```http
POST /api/cheating-logs
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "student": "64f8a1b2c3d4e5f6a7b8c9d0",
  "exam": "64f8a1b2c3d4e5f6a7b8c9d1",
  "result": "64f8a1b2c3d4e5f6a7b8c9d2",
  "type": "tab_switch",
  "severity": "medium",
  "description": "Student switched browser tab during exam",
  "confidence": 85,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "deviceFingerprint": "abc123"
}
```

### Get Cheating Logs (Teacher/Admin)
```http
GET /api/cheating-logs
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `exam` - Filter by exam ID
- `student` - Filter by student ID
- `type` - Filter by incident type
- `severity` - Filter by severity level
- `isResolved` - Filter by resolution status
- `automatedDetection` - Filter by detection type

### Get Cheating Statistics (Teacher/Admin)
```http
GET /api/cheating-logs/stats
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
- `examId` - Filter by exam ID
- `startDate` - Filter by start date
- `endDate` - Filter by end date

### Get Result Cheating Logs
```http
GET /api/cheating-logs/result/{resultId}
Authorization: Bearer <token>
```

### Get Single Cheating Log (Teacher/Admin)
```http
GET /api/cheating-logs/{cheatingLogId}
Authorization: Bearer <teacher_token>
```

### Resolve Cheating Log (Teacher/Admin)
```http
POST /api/cheating-logs/{cheatingLogId}/resolve
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "resolution": "False positive - student was checking reference material",
  "isFalsePositive": true,
  "notes": "Verified with video recording"
}
```

### Bulk Resolve Cheating Logs (Teacher/Admin)
```http
POST /api/cheating-logs/bulk-resolve
Authorization: Bearer <teacher_token>
Content-Type: application/json
```

**Body:**
```json
{
  "logIds": ["64f8a1b2c3d4e5f6a7b8c9d3", "64f8a1b2c3d4e5f6a7b8c9d4"],
  "resolution": "Minor infractions - no action needed",
  "isFalsePositive": false,
  "notes": "Reviewed all incidents"
}
```

### Get Student Cheating Logs (Teacher/Admin)
```http
GET /api/cheating-logs/student/{studentId}
Authorization: Bearer <teacher_token>
```

---

## 💻 Code Execution

### Run Code
```http
POST /api/code/run
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "source_code": "print('Hello World')",
  "language_id": 71,
  "stdin": "",
  "expected_output": "Hello World",
  "cpu_time_limit": 2,
  "memory_limit": 128000,
  "max_output_size": 1024
}
```

**Response:**
```json
{
  "token": "64f8a1b2c3d4e5f6a7b8c9d5",
  "status": {
    "id": 3,
    "description": "Accepted"
  },
  "stdout": "Hello World\n",
  "stderr": "",
  "compile_output": "",
  "message": "",
  "time": "0.123",
  "memory": "1280",
  "exit_code": 0,
  "exit_signal": null,
  "created_at": "2024-01-01T10:00:00.000Z",
  "finished_at": "2024-01-01T10:00:01.000Z"
}
```

### Get Supported Languages
```http
GET /api/code/languages
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 54,
    "name": "C++ (GCC 9.2.0)"
  },
  {
    "id": 71,
    "name": "Python (3.8.1)"
  }
]
```

### Get Submission Status
```http
GET /api/code/submissions/{token}
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/code/health
Authorization: Bearer <token>
```

---

## 🔍 Health Check

### API Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "env": "development"
}
```

---

## 📝 Common Language IDs for Judge0

| Language | ID |
|----------|----|
| C++ (GCC) | 54 |
| Java (OpenJDK) | 62 |
| C (GCC) | 50 |
| C# (Mono) | 51 |
| Python (3.8.1) | 71 |
| PHP (7.4.1) | 68 |
| Ruby (2.7.0) | 72 |
| Go (1.13.5) | 60 |
| Kotlin (1.3.70) | 79 |
| Swift (5.2.3) | 83 |
| JavaScript (Node.js) | 63 |
| TypeScript (Node.js) | 74 |

---

## 🔑 Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `408` - Request Timeout
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable

---

## 🚀 Quick Start Guide

1. **Register Users:**
   - Create a teacher account
   - Create a student account

2. **Login:**
   - Get JWT tokens for both users

3. **Create Exam:**
   - Use teacher token to create an exam

4. **Add Questions:**
   - Add questions to the exam

5. **Take Exam:**
   - Start exam with student token
   - Submit answers
   - Submit exam

6. **View Results:**
   - Check student results
   - Grade if needed

7. **Monitor Cheating:**
   - Log cheating incidents
   - Review and resolve

8. **Execute Code:**
   - Test code execution with Judge0

---

## 📞 Support

For any issues with the API, please check:
1. JWT token is valid and not expired
2. Request body format is correct
3. Required fields are provided
4. User has proper permissions for the operation
