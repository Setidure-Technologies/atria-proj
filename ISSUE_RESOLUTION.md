# Issue Resolution Report

## Problem
The user was unable to login to the Candidate Portal (`atria_frontend`).
Logs showed a `404 Not Found` for `POST /auth/login`.

## Root Cause Analysis
1.  **Backend Configuration:** The backend API (`atria_api`) mounts authentication routes at `/api/auth` (e.g., `/api/auth/login`).
2.  **Frontend Configuration:** The Candidate Portal (`atria_frontend`) was configured with `VITE_API_URL=http://localhost:4902`.
3.  **Code Behavior:** The frontend code (`apiDatabase.ts`) appends endpoints directly to the base URL: `${baseUrl}/auth/login`.
4.  **Result:** The frontend was making requests to `http://localhost:4902/auth/login`, which does not exist. It should have been `http://localhost:4902/api/auth/login`.

## Fix Applied
- Updated `docker-compose.yml` to set `VITE_API_URL` for `atria_frontend` to `http://localhost:4902/api`.
- Rebuilt the `atria_frontend` container to bake in the correct API URL.

## Verification
- The frontend will now construct the URL as `http://localhost:4902/api/auth/login`, which matches the backend route.
- Login should now proceed correctly.

## Instructions for User
1.  **Clear Browser Cache:** This is critical as the old JS file with the wrong URL might still be cached. Use **Ctrl+Shift+R**.
2.  **Login:** Go to `http://localhost:4901/login` and try again.
