# Candidate Portal & Flow Rework

## Overview
We have completely reworked the Candidate Portal (`Strength-360`) to support a secure, authenticated flow as requested. Candidates can now log in, view their assigned assessments, and take tests without relying solely on email links.

## Key Changes

### 1. Authentication & Navigation
- **Login Page (`/login`):** A secure login screen for candidates to sign in with their email and password.
- **Dashboard (`/dashboard`):** A central hub that lists all assessments assigned to the candidate, showing their status (Assigned, Started, Completed).
- **Profile (`/profile`):** A form for candidates to complete their personal and demographic details before testing.

### 2. Unified Test Dispatcher
- The application now intelligently routes users to the correct test interface based on the assignment type:
  - **Strength 360:** Psychometric Assessment.
  - **Beyonders 360:** Adaptive Assessment (Science & Non-Science streams).
- **Smart Access Control:** The system supports both:
  - **Direct Access:** Via email links (using secure tokens).
  - **Authenticated Access:** Via the Dashboard (using user session).

### 3. Backend Enhancements
- **Dual-Mode Authentication:** Updated backend routes to accept both public access tokens and authenticated user sessions (JWT).
- **Assignment Retrieval:** Added endpoints to fetch all assignments for a logged-in user.
- **Profile Management:** Added endpoints to update candidate profile data.

## How to Test

### Candidate Flow
1.  **Login:**
    - Go to `http://localhost:4901/login`.
    - Credentials: `candidate1@example.com` / `password123` (or candidate2/3).
2.  **Dashboard:**
    - You will be redirected to the Dashboard.
    - You should see "Beyonders 360 - Science & Technology" (or other assigned tests).
3.  **Profile:**
    - (Optional) Navigate to `/profile` to fill in details.
4.  **Take Test:**
    - Click **Start Test** on the assignment card.
    - The correct test runner (Adaptive or Psychometric) will load automatically.
    - Complete the test and submit.

### Admin Flow (Existing)
- Admins can continue to use the Admin Portal (`http://localhost:4903`) to create users and assign tests.
- Assignments created there will instantly appear in the candidate's dashboard.

## Technical Details
- **Frontend:** React + TypeScript. Added `Login`, `Dashboard`, `Profile` components. Updated `App.tsx` routing.
- **Backend:** Node.js + Express. Updated `candidate.js` routes to use `optionalAuth` middleware for flexible access control.
- **Database:** No schema changes were required for this update, leveraging existing `users` and `assignments` tables.
