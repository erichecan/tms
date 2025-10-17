#!/bin/bash
# Grant permissions to tms_user

export PGPASSWORD='LeD7g2RjvH9sk6PZ0LC3pi0HDFE25pqp4sAFZhzNPFo='

psql "host=/cloudsql/aponytms:northamerica-northeast2:tms-database-toronto dbname=tms_platform user=postgres" <<EOF
-- Grant all privileges to tms_user
GRANT ALL PRIVILEGES ON DATABASE tms_platform TO tms_user;
GRANT USAGE ON SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tms_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO tms_user;

-- Make tms_user owner of all existing objects
SELECT 'ALTER TABLE public.' || tablename || ' OWNER TO tms_user;' 
FROM pg_tables WHERE schemaname = 'public' \gexec

SELECT 'ALTER SEQUENCE public.' || sequencename || ' OWNER TO tms_user;'
FROM pg_sequences WHERE schemaname = 'public' \gexec

EOF

echo "Permissions granted successfully!"

