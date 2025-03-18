# MongoDB Setup Guide for ProDash Tools

## Quick Start

1. **Sign up for MongoDB Atlas**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account
   - Create a new project

2. **Create a Database**
   - Click "Build a Database"
   - Choose "FREE" tier
   - Select your preferred region
   - Name your cluster (e.g., "ProDashDB")

3. **Get Connection String**
   - Click "Connect"
   - Choose "Drivers"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Configure Your Project**
   Add to your project's `.env` file:
   ```
   MONGODB_URI=your_connection_string_here
   ```

## Template-Specific Setup

### Basic Project
- No MongoDB required
- Uses file-based storage

### Advanced Project
1. Copy `.env.example` to `.env`
2. Add MongoDB connection string
3. Run `npm install` to install dependencies

### API Project
1. Copy `.env.example` to `.env`
2. Add MongoDB connection string
3. Run `npm install` to install dependencies
4. Run database migrations: `npm run db:migrate`

## Development Setup

### Using MongoDB Atlas (Recommended)
- Free cloud hosting
- No local installation needed
- Automatic backups
- Database monitoring

### Local Installation (Optional)
1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install MongoDB Compass for GUI management
3. Use connection string: `mongodb://localhost:27017/prodash`

## Best Practices

1. **Environment Management**
   - Never commit connection strings
   - Use different databases for development/production
   - Keep sensitive data in `.env`

2. **Database Organization**
   - One database per project
   - Clear collection naming
   - Regular backups

3. **Security**
   - Strong passwords
   - IP whitelist in Atlas
   - Regular security updates

## Troubleshooting

Common issues and solutions:

1. **Connection Failed**
   - Check network connection
   - Verify IP whitelist
   - Confirm credentials

2. **Performance Issues**
   - Check indexes
   - Monitor Atlas metrics
   - Review query patterns

## Support

For additional help:
- Check MongoDB Atlas documentation
- Join MongoDB Community Forums
- Contact ProDash Tools support 