#!/bin/bash

# Azure SQL Database Setup Script for User Onboarding Platform
# This script creates an Azure SQL Database instance

# Configuration Variables
RESOURCE_GROUP="user-onboarding-rg"
LOCATION="eastus"
SQL_SERVER_NAME="user-onboarding-sql-server"
DATABASE_NAME="user_onboarding"
ADMIN_USERNAME="sqladmin"
ADMIN_PASSWORD="YourSecurePassword123!"  # Change this to a secure password
SKU="Basic"  # Options: Basic, S0, S1, S2, P1, P2, etc.

echo "=========================================="
echo "Azure SQL Database Setup"
echo "=========================================="
echo ""

# Step 1: Create Resource Group
echo "Step 1: Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo ""
echo "Resource Group created: $RESOURCE_GROUP"
echo ""

# Step 2: Create Azure SQL Server
echo "Step 2: Creating Azure SQL Server..."
az sql server create \
  --name $SQL_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $ADMIN_USERNAME \
  --admin-password $ADMIN_PASSWORD

echo ""
echo "SQL Server created: $SQL_SERVER_NAME.database.windows.net"
echo ""

# Step 3: Configure Firewall - Allow Azure Services
echo "Step 3: Configuring Firewall (Allow Azure Services)..."
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo ""

# Step 4: Configure Firewall - Allow Your Local IP
echo "Step 4: Configuring Firewall (Allow Your Local IP)..."
MY_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP

echo ""
echo "Firewall configured for IP: $MY_IP"
echo ""

# Step 5: Create Database
echo "Step 5: Creating Database..."
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $DATABASE_NAME \
  --service-objective $SKU \
  --backup-storage-redundancy Local

echo ""
echo "Database created: $DATABASE_NAME"
echo ""

# Step 6: Get Connection String
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Database Details:"
echo "  Server: $SQL_SERVER_NAME.database.windows.net"
echo "  Database: $DATABASE_NAME"
echo "  Admin User: $ADMIN_USERNAME"
echo ""
echo "Connection String (for backend/.env):"
echo "----------------------------------------"
echo "DB_HOST=$SQL_SERVER_NAME.database.windows.net"
echo "DB_USER=$ADMIN_USERNAME@$SQL_SERVER_NAME"
echo "DB_PASSWORD=$ADMIN_PASSWORD"
echo "DB_NAME=$DATABASE_NAME"
echo "DB_PORT=1433"
echo ""
echo "Full Connection String:"
echo "Server=$SQL_SERVER_NAME.database.windows.net,1433;Database=$DATABASE_NAME;User ID=$ADMIN_USERNAME;Password=$ADMIN_PASSWORD;Encrypt=true;Connection Timeout=30;"
echo ""
echo "Next Steps:"
echo "1. Update backend/.env with the connection details above"
echo "2. Run the schema deployment script: npm run deploy-schema"
echo "3. Test the backend connection"
echo ""
