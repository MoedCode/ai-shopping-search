-- ============================================
-- AI Shopping Agent - PostgreSQL Setup Script
-- Uses psql variables (NOT pure SQL vars)
-- ============================================

-- 1. Create user
CREATE USER :"db_user"
WITH PASSWORD :'db_pwd';

-- 2. Create database
CREATE DATABASE :"db_name"
WITH
    OWNER = :"db_user"
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 3. Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE :"db_name"
TO :"db_user";

-- 4. Connect to database
\c :"db_name"

-- 5. Grant privileges on schema
GRANT ALL ON SCHEMA public TO :"db_user";

-- 6. Ensure future objects are accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO :"db_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO :"db_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO :"db_user";
-- ============================================================
-- AI Shopping Agent - PostgreSQL Setup Script
-- ============================================================
--
-- ⚠️ IMPORTANT:
-- This script DOES NOT read environment variables directly.
-- Environment variables must be injected via psql variables.
--
-- REQUIRED ENV VARIABLES (from shell):
--   ASE_DB_NAME  -> database name
--   ASE_DB_USER  -> database user
--   ASE_DB_PWD   -> database password
--
-- HOW TO RUN (from project root):
--
--   source db.env.sh
--
--   sudo -u postgres psql \
--     -v db_name="$ASE_DB_NAME" \
--     -v db_user="$ASE_DB_USER" \
--     -v db_pwd="$ASE_DB_PWD" \
--     -f create_db.sql