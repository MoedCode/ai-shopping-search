-- ============================================
-- AI Shopping Agent - PostgreSQL Setup Script
-- ============================================

-- 1. Create user
CREATE USER ai_shopping_agent_user
WITH PASSWORD 'moed.psql.ASE-26';

-- 2. Create database
CREATE DATABASE ai_shopping_agent_db
WITH
    OWNER = ai_shopping_agent_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- 3. Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE ai_shopping_agent_db
TO ai_shopping_agent_user;

-- 4. Connect to database
\c ai_shopping_agent_db

-- 5. Grant privileges on schema
GRANT ALL ON SCHEMA public TO ai_shopping_agent_user;

-- 6. Ensure future objects are accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO ai_shopping_agent_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO ai_shopping_agent_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO ai_shopping_agent_user;
https:/