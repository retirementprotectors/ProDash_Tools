# Database Configuration Guide

## Overview
ProDash Tools supports multiple database types out of the box. This guide explains how to configure and use different database systems with your project.

## Supported Databases
- MySQL
- PostgreSQL
- SQLite

## Configuration Structure
```typescript
interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;        // Required for MySQL and PostgreSQL
  port?: number;        // Optional, defaults: MySQL(3306), PostgreSQL(5432)
  username?: string;    // Required for MySQL and PostgreSQL
  password?: string;    // Required for MySQL and PostgreSQL
  database: string;     // Database name
}
```

## Example Configurations

### MySQL
```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "your_password",
  "database": "prodash_db"
}
```

### PostgreSQL
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "your_password",
  "database": "prodash_db"
}
```

### SQLite
```json
{
  "type": "sqlite",
  "database": "path/to/database.sqlite"
}
```

## Usage in Project Configuration
Add the database configuration to your project's `config.json`:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "username": "postgres",
    "password": "your_password",
    "database": "my_project_db"
  }
}
```

## Security Best Practices
1. Never commit database passwords to version control
2. Use environment variables for sensitive information
3. Keep different configurations for development and production
4. Regularly backup your database
5. Use strong passwords and limit database user permissions

## Troubleshooting
Common issues and their solutions:

1. **Connection Failed**
   - Check if the database server is running
   - Verify host and port settings
   - Ensure network connectivity
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check database user permissions
   - Ensure the database exists

3. **SQLite File Access**
   - Check file permissions
   - Verify the path is correct
   - Ensure the directory is writable 