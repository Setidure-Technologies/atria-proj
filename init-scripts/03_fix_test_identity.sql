-- A3R Platform: Fix Test Identity vs Engine Type
-- This migration fixes the confusion between product identity (slug) and engine type
-- 
-- Root Cause: tests.type was being used for product names (beyonders_science) 
-- instead of engine types (psychometric/adaptive/custom)
--
-- Solution: Use tests.type for engine type, store product identity in config_json.slug

-- ============================================
-- FIX EXISTING TESTS
-- ============================================

-- Fix Beyonders Science Assessment (Update existing or Insert new)
DO $$
BEGIN
    -- First, try to update any existing legacy records
    UPDATE tests 
    SET 
        type = 'custom',
        config_json = jsonb_build_object(
            'slug', 'beyonders_science',
            'runner', 'beyonders',
            'version', 1,
            'stream', 'science',
            'description', 'Beyonders Science Stream Assessment'
        )
    WHERE title = 'Beyonders Science Assessment'
       OR type = 'beyonders_science';

    -- If no record exists with this slug, insert it
    IF NOT EXISTS (SELECT 1 FROM tests WHERE config_json->>'slug' = 'beyonders_science') THEN
        INSERT INTO tests (title, description, type, config_json, duration_minutes, is_active)
        VALUES (
            'Beyonders Science Assessment',
            'Beyonders Science Stream Assessment',
            'custom',
            jsonb_build_object(
                'slug', 'beyonders_science',
                'runner', 'beyonders',
                'version', 1,
                'stream', 'science',
                'description', 'Beyonders Science Stream Assessment'
            ),
            20,
            TRUE
        );
        RAISE NOTICE 'Inserted missing Beyonders Science Assessment';
    END IF;
END $$;

-- Fix Beyonders Non-Science Assessment (Update existing or Insert new)
DO $$
BEGIN
    -- First, try to update any existing legacy records
    UPDATE tests 
    SET 
        type = 'custom',
        config_json = jsonb_build_object(
            'slug', 'beyonders_non_science',
            'runner', 'beyonders',
            'version', 1,
            'stream', 'non_science',
            'description', 'Beyonders Non-Science Stream Assessment'
        )
    WHERE title = 'Beyonders Non-Science Assessment'
       OR type = 'beyonders_non_science';

    -- If no record exists with this slug, insert it
    IF NOT EXISTS (SELECT 1 FROM tests WHERE config_json->>'slug' = 'beyonders_non_science') THEN
        INSERT INTO tests (title, description, type, config_json, duration_minutes, is_active)
        VALUES (
            'Beyonders Non-Science Assessment',
            'Beyonders Non-Science Stream Assessment',
            'custom',
            jsonb_build_object(
                'slug', 'beyonders_non_science',
                'runner', 'beyonders',
                'version', 1,
                'stream', 'non_science',
                'description', 'Beyonders Non-Science Stream Assessment'
            ),
            20,
            TRUE
        );
        RAISE NOTICE 'Inserted missing Beyonders Non-Science Assessment';
    END IF;
END $$;

-- Fix Strength 360 Assessment (add config_json)
UPDATE tests
SET 
    config_json = jsonb_build_object(
        'slug', 'strength360',
        'runner', 'strength',
        'version', 1,
        'description', 'Strength 360 Psychometric Assessment'
    )
WHERE title LIKE '%Strength 360%'
  AND (config_json IS NULL OR config_json = '{}'::jsonb);

-- Fix generic "Beyonders Test" if it exists
UPDATE tests
SET 
    type = 'custom',
    config_json = jsonb_build_object(
        'slug', 'beyonders_science',
        'runner', 'beyonders',
        'version', 1,
        'stream', 'science',
        'description', 'Beyonders Assessment'
    )
WHERE title = 'Beyonders Test'
  AND type = 'psychometric';

-- ============================================
-- VERIFY FIXES
-- ============================================

-- Show all tests with their corrected structure
DO $$
DECLARE
    test_record RECORD;
BEGIN
    RAISE NOTICE '=== Test Identity Fix Verification ===';
    FOR test_record IN 
        SELECT 
            id,
            title,
            type as engine_type,
            config_json->>'slug' as test_slug,
            config_json->>'runner' as runner,
            is_active
        FROM tests
        ORDER BY created_at
    LOOP
        RAISE NOTICE 'Test: % | Engine: % | Slug: % | Runner: % | Active: %',
            test_record.title,
            test_record.engine_type,
            test_record.test_slug,
            test_record.runner,
            test_record.is_active;
    END LOOP;
END $$;

-- ============================================
-- CREATE HELPER FUNCTION FOR FUTURE TEST CREATION
-- ============================================

-- Function to create tests with proper structure
CREATE OR REPLACE FUNCTION create_test_with_identity(
    p_title VARCHAR(255),
    p_description TEXT,
    p_engine_type VARCHAR(50),  -- 'psychometric', 'adaptive', or 'custom'
    p_slug VARCHAR(100),         -- Product identity like 'beyonders_science'
    p_runner VARCHAR(50),        -- Runner name like 'beyonders', 'strength'
    p_duration_minutes INTEGER DEFAULT 20,
    p_config JSONB DEFAULT '{}'::jsonb,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_test_id UUID;
    v_full_config JSONB;
BEGIN
    -- Validate engine type
    IF p_engine_type NOT IN ('psychometric', 'adaptive', 'custom') THEN
        RAISE EXCEPTION 'Invalid engine type: %. Must be psychometric, adaptive, or custom', p_engine_type;
    END IF;

    -- Build config_json with required fields
    v_full_config := p_config || jsonb_build_object(
        'slug', p_slug,
        'runner', p_runner,
        'version', 1
    );

    -- Insert test
    INSERT INTO tests (title, description, type, config_json, duration_minutes, created_by)
    VALUES (p_title, p_description, p_engine_type, v_full_config, p_duration_minutes, p_created_by)
    RETURNING id INTO v_test_id;

    RAISE NOTICE 'Created test: % (ID: %, Engine: %, Slug: %)', p_title, v_test_id, p_engine_type, p_slug;

    RETURN v_test_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION create_test_with_identity IS 
'Helper function to create tests with proper separation of engine type and product identity. 
Use this instead of direct INSERT to ensure consistency.';

COMMENT ON COLUMN tests.type IS 
'Engine type: psychometric, adaptive, or custom. NOT product identity.';

COMMENT ON COLUMN tests.config_json IS 
'Test configuration including product identity (slug), runner name, version, and test-specific settings.
Required fields: slug (product identity), runner (runner component name), version (integer).';

-- ============================================
-- FINAL VALIDATION
-- ============================================

-- Ensure no tests have invalid engine types
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM tests
    WHERE type NOT IN ('psychometric', 'adaptive', 'custom');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % tests with invalid engine types. Fix required.', invalid_count;
    END IF;

    RAISE NOTICE '✅ All tests have valid engine types';
END $$;

-- Ensure all active tests have config_json with slug
DO $$
DECLARE
    missing_slug_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_slug_count
    FROM tests
    WHERE is_active = TRUE
      AND (config_json IS NULL OR config_json->>'slug' IS NULL);

    IF missing_slug_count > 0 THEN
        RAISE WARNING 'Found % active tests without slug in config_json', missing_slug_count;
    ELSE
        RAISE NOTICE '✅ All active tests have slug configured';
    END IF;
END $$;
