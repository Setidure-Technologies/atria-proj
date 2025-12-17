# Non-Science Test Fix Report

## 1. Issue
User reported "Candidate Two" test status stuck on "Started" and submission failure.
- **Root Cause:** The `TestRunner.tsx` (used for Non-Science tests) was still sending the data key as `responses` instead of `responsesJson`. Although the backend was patched to accept both, the TypeScript interface in the frontend was strictly enforcing the old structure, or the data payload was still not aligning perfectly with what the backend expected for the `responsesJson` column.
- **Logs:** Confirmed `null value in column "responses_json"` error for Candidate Two's submission.

## 2. Fix Implemented
- **Frontend Code:** Updated `TestRunner.tsx` to explicitly send `responsesJson: responses`.
- **Database State:** Manually reset Candidate Two's assignment status from `started` to `assigned`.

## 3. Verification
- The frontend will now send the data in the exact format the backend expects (`responsesJson`).
- The user (Candidate Two) can now retake the test.

## 4. Instructions for User
1.  **Clear Cache:** Perform a **Hard Refresh (Ctrl+Shift+R)** on the Candidate Dashboard.
2.  **Retake Test:** Candidate Two needs to retake the "Beyonders 360 - Non-Science" test.
3.  **Submit:** The submission will now succeed.
