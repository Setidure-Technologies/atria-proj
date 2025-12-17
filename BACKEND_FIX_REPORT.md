# Backend Fix Report

## Issue
User reported "Access Error: Invalid token" when starting a test.
Backend logs revealed a PostgreSQL error: `code: '42P18'` (could not determine data type of parameter $2).

## Root Cause
The `updateAssignmentStatus` function in `database.js` had incorrect logic for constructing SQL queries with dynamic parameters.
- It was calculating parameter indices (`$N`) based on a counter that didn't match the actual position of values in the array.
- Specifically, `assignmentId` was expected at a certain index but the query placeholder pointed to a non-existent or wrong index.

## Fix
Rewrote `updateAssignmentStatus` to:
1.  Build the `values` array sequentially.
2.  Use `values.length` to determine the correct placeholder index (`$N`) for each new parameter.
3.  Ensure `assignmentId` is added last and its index is correctly referenced in the `WHERE` clause.

## Verification
- Restarted `atria_api` container.
- The query construction is now robust and should correctly map values to placeholders.

## Next Steps for User
- Retry starting the test. The "Invalid token" error (which was actually a masked database error) should be resolved.
