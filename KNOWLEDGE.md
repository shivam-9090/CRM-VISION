# CRM Vision - Knowledge Base

## Overview
CRM Vision is a comprehensive Customer Relationship Management system built with modern technologies to help businesses manage their customer interactions, deals, and sales pipeline effectively.

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **API Documentation**: RESTful APIs
- **Performance**: Redis for caching and throttling
- **Monitoring**: Sentry integration for error tracking

### Frontend
- **Framework**: Next.js (React framework)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: Modern React hooks and context

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Deployment**: Production and development configurations
- **Database Migrations**: Prisma Migrate
- **Infrastructure as Code**: Terraform (infra directory)

## Key Features

### 1. Deal Management
- Create and track sales deals
- Deal stages: Lead → Qualification → Proposal → Negotiation → Closed (Won/Lost)
- Deal dates tracking
- Performance analytics

### 2. Contact Management
- Store and manage customer contacts
- Optional contact linking with companies
- Contact activity tracking

### 3. Company Management
- Manage company information
- Link contacts and deals to companies
- Company-level insights

### 4. Lead Management System
- Capture and qualify leads
- Lead scoring and prioritization
- Conversion tracking

### 5. Activity Tracking
- Log all customer interactions
- Activity timeline
- Activity types: calls, meetings, emails, tasks

### 6. User Management
- User authentication and authorization
- Role-based access control
- Password reset functionality
- User invitations

### 7. Health Monitoring
- System health checks
- Database connectivity monitoring
- API performance tracking

## Database Schema Highlights

### Key Models
- **User**: System users with authentication
- **Company**: Business organizations
- **Contact**: Individual contacts
- **Deal**: Sales opportunities
- **Activity**: Customer interactions
- **Invite**: User invitation system

### Performance Optimizations
- Indexed fields for faster queries
- Optimized relationships
- Database connection pooling

## Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting with Redis
- CORS configuration
- Environment-based configuration
- Role-based access control guards

## Development Workflow

### Local Development
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Development
```bash
docker-compose up
```

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## API Endpoints Structure

### Authentication
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- POST `/auth/forgot-password` - Password reset
- POST `/auth/reset-password` - Password reset confirmation

### Deals
- GET `/deals` - List all deals
- POST `/deals` - Create new deal
- GET `/deals/:id` - Get deal details
- PUT `/deals/:id` - Update deal
- DELETE `/deals/:id` - Delete deal

### Contacts
- GET `/contacts` - List contacts
- POST `/contacts` - Create contact
- CRUD operations for contact management

### Companies
- GET `/companies` - List companies
- POST `/companies` - Create company
- CRUD operations for company management

### Activities
- GET `/activities` - List activities
- POST `/activities` - Create activity
- Activity filtering and search

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `REDIS_URL` - Redis connection string (optional)
- `SENTRY_DSN` - Sentry error tracking (optional)
- `SMTP_*` - Email configuration for notifications

## Testing
- Unit tests with Jest
- E2E tests in test directory
- Test coverage reporting

## Backup Strategy
- Automated database backups
- Scripts available in `/scripts` directory
- PowerShell and Bash backup scripts
- Cron job setup for scheduled backups

## Best Practices
1. Always run migrations before deployment
2. Use environment-specific configurations
3. Monitor application health endpoints
4. Regular database backups
5. Keep dependencies updated
6. Follow TypeScript strict mode
7. Write tests for critical features
8. Use ESLint for code quality

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL is correct
2. **Port Conflicts**: Check if ports 3000/5000 are available
3. **Migration Issues**: Run `npx prisma migrate deploy`
4. **Redis Connection**: Ensure Redis is running for production

## Future Enhancements
- Advanced reporting and analytics
- Email campaign integration
- Mobile application
- Third-party integrations (Salesforce, HubSpot)
- AI-powered lead scoring
- Automated workflow triggers

## Contributing
1. Create feature branch from `features`
2. Follow code style guidelines
3. Write tests for new features
4. Submit pull request with description

## Support
For issues and questions, please refer to the project documentation or create an issue in the repository.

---

**Last Updated**: January 2026  
**Version**: 2.0  
**Maintained By**: Development Team
