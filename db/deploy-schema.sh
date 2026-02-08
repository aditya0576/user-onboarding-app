#!/bin/bash

# Deploy SQL Schema to Azure SQL Database
# This script deploys the init.sql schema to Azure SQL

# Read connection details from backend/.env or use command line arguments
if [ -f "../backend/.env" ]; then
  echo "Loading connection details from backend/.env..."
  source ../backend/.env
else
  echo "Error: backend/.env file not found"
  echo "Please create backend/.env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
  exit 1
fi

# Check if required variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: Missing database connection details in .env"
  echo "Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
  exit 1
fi

echo "=========================================="
echo "Deploying Schema to Azure SQL Database"
echo "=========================================="
echo ""
echo "Server: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Use Azure CLI to execute the SQL script
echo "Executing init.sql..."

# Extract server name from DB_HOST (remove .database.windows.net)
SERVER_NAME=$(echo $DB_HOST | sed 's/.database.windows.net//')

az sql db show-connection-string \
  --client sqlcmd \
  --name $DB_NAME \
  --server $SERVER_NAME

# Execute SQL using sqlcmd
if command -v sqlcmd &> /dev/null; then
  echo "Using sqlcmd to deploy schema..."
  sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -i init.sql
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Schema Deployed Successfully!"
    echo "=========================================="
    echo ""
  else
    echo ""
    echo "Error: Schema deployment failed"
    exit 1
  fi
else
  echo ""
  echo "Warning: sqlcmd not found. Using alternative method..."
  echo "Please install sqlcmd or use Azure Data Studio to execute init.sql manually"
  echo ""
  echo "Alternative: Use Azure Portal Query Editor"
  echo "1. Go to Azure Portal > SQL Database > Query Editor"
  echo "2. Copy contents of init.sql"
  echo "3. Paste and execute"
  echo ""
fi
