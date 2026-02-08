# Database Setup Guide

This folder contains scripts and schema for setting up the Azure SQL Database for the User Onboarding Platform.

## Prerequisites

- Azure CLI installed and configured (`az login`)
- Node.js and npm installed
- Azure subscription with permissions to create resources

## Quick Start

### 1. Create Azure SQL Database

```bash
# Review and update configuration in setup-azure-sql.sh
# IMPORTANT: Change ADMIN_PASSWORD before running!

./setup-azure-sql.sh
```

This script will:
- Create an Azure Resource Group
- Create an Azure SQL Server
- Configure firewall rules (Azure services + your IP)
- Create the database
- Output connection details

### 2. Update Backend Configuration

Copy the connection details from the setup script output and create `backend/.env`:

```bash
DB_HOST=your-server.database.windows.net
DB_USER=sqladmin@your-server
DB_PASSWORD=YourSecurePassword123!
DB_NAME=user_onboarding
DB_PORT=1433
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Test Database Connection

```bash
npm run test-connection
```

This will verify:
- Connection to Azure SQL Database
- SSL configuration
- Firewall rules
- Database accessibility

### 5. Deploy Schema

```bash
npm run deploy
```

This will:
- Create all required tables (user_status, users, admins)
- Insert seed data (admin user)
- Verify table creation

### 6. Generate Admin Password Hash (Optional)

If you want to change the default admin password:

```bash
npm run generate-admin-hash
```

Copy the generated hash and update `init.sql` before deploying.

## Default Admin Credentials

After schema deployment, you can login with:
- **Username**: `admin`
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password in production!

## Database Schema

### Tables

1. **user_status** - Status enum (PENDING, APPROVED, REJECTED)
2. **users** - User accounts with status tracking
3. **admins** - Admin accounts for approval workflow

### Schema Details

See `init.sql` for complete schema definition.

## Troubleshooting

### Connection Timeout

If you get a timeout error:
1. Check Azure SQL firewall rules
2. Add your current IP: `az sql server firewall-rule create ...`
3. Verify VPN/proxy settings

### Authentication Failed

1. Verify credentials in `backend/.env`
2. Check username format: `username@servername` (Azure SQL)
3. Ensure password meets Azure complexity requirements

### SSL/TLS Errors

Azure SQL requires SSL. The scripts automatically enable SSL for Azure connections.

## Manual Setup (Alternative)

If you prefer Azure Portal:

1. **Create SQL Server**:
   - Go to Azure Portal > Create Resource > SQL Database
   - Follow the wizard

2. **Configure Firewall**:
   - Go to SQL Server > Networking
   - Add your IP address
   - Enable "Allow Azure services"

3. **Deploy Schema**:
   - Use Azure Data Studio or Query Editor
   - Copy/paste contents of `init.sql`
   - Execute

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| setup-azure-sql.sh | `./setup-azure-sql.sh` | Create Azure SQL Database |
| deploy-schema.js | `npm run deploy` | Deploy schema to database |
| test-connection.js | `npm run test-connection` | Test database connection |
| generate-admin-hash.js | `npm run generate-admin-hash` | Generate bcrypt hash for admin |

## Next Steps

After database setup:
1. Start the backend: `cd ../backend && npm start`
2. Test API endpoints with the database
3. Run end-to-end tests
4. Set up Docker containers (if needed)
