#!/bin/bash
# Reset assignments and responses for the test candidate
docker exec atria_postgres psql -U atria_admin -d atria360 -c "
DELETE FROM responses WHERE assignment_id IN (SELECT id FROM assignments WHERE user_id = (SELECT id FROM users WHERE email = 'candidate@test.com'));
DELETE FROM assignments WHERE user_id = (SELECT id FROM users WHERE email = 'candidate@test.com');
"
