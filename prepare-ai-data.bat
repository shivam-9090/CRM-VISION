@echo off
REM Simple script to prepare AI training data from CRM database

echo ========================================
echo CRM AI Training Data Preparation
echo ========================================
echo.

echo Step 1: Exporting data from database...
docker exec -it crm-postgres-dev psql -U dev_user -d crm_dev -c "COPY (SELECT json_build_object('deals', (SELECT json_agg(row_to_json(d)) FROM (SELECT * FROM deals WHERE stage IN ('CLOSED_WON', 'CLOSED_LOST') ORDER BY \"closedAt\" DESC LIMIT 200) d))) TO STDOUT;" > backend\data\db-export.json

echo Step 2: Data exported successfully!
echo.
echo Location: backend\data\db-export.json
echo.
echo Next steps:
echo 1. Run: npx tsx backend/scripts/format-training-data.ts
echo 2. Follow AI_INTEGRATION_GUIDE.md for fine-tuning
echo.
pause
