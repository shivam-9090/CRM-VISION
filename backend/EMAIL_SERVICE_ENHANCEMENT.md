# Email Service Enhancement - Implementation Documentation

## Overview

This document details the comprehensive email service enhancement implemented for the CRM system. The new email infrastructure includes template-based emails, Redis-backed queue system with retry logic, delivery tracking, and production-ready monitoring.

## Architecture

### Components

1. **TemplateService** - Handlebars template rendering with caching
2. **EmailService** - Queue management and email sending
3. **EmailProcessor** - Bull queue worker processing
4. **EmailController** - REST API endpoints
5. **EmailModule** - Module configuration and dependency injection

### Flow Diagram

```
Client Request
    ↓
EmailController (API Endpoint)
    ↓
EmailService.queueEmail() → Bull Queue (Redis)
    ↓
EmailProcessor (Background Worker)
    ↓
TemplateService.render() → HTML/Text
    ↓
EmailService.sendEmailDirect() → SMTP Server
    ↓
Delivery Status Tracking
```

## Features

### 1. Template System

**Handlebars-based templates** with support for:
- HTML and plain text versions
- Variable interpolation
- Custom helpers (date formatting, currency, conditionals)
- Template caching for performance

**Available Templates:**
- `password-reset` - Password reset emails with expiring token links
- `welcome` - Welcome emails for new users
- `invitation` - Workspace/team invitation emails

**Template Variables:**
```typescript
// Password Reset
{
  name: string;
  resetUrl: string;
  expiryHours: number;
}

// Welcome
{
  name: string;
  loginUrl: string;
}

// Invitation
{
  inviterName: string;
  companyName: string;
  role: string;
  inviteUrl: string;
  expiryDays: number;
}
```

### 2. Queue System

**Bull (Redis-backed) queue features:**
- Separate Redis database for email queue (DB 2 by default)
- Configurable concurrency (5 concurrent jobs default)
- Priority-based processing (0-10 scale)
- Automatic retries with exponential backoff
- Job persistence and recovery
- Graceful shutdown handling

**Job Options:**
```typescript
{
  attempts: 3,              // Retry up to 3 times
  backoff: {
    type: 'exponential',
    delay: 5000             // Start at 5s, double each retry
  },
  removeOnComplete: {
    age: 604800,            // Keep for 7 days
    count: 1000             // Keep last 1000
  },
  removeOnFail: {
    age: 2592000            // Keep failed for 30 days
  }
}
```

### 3. Retry Logic

**Exponential Backoff Strategy:**
- Attempt 1: Immediate
- Attempt 2: 5 seconds delay
- Attempt 3: 25 seconds delay (5s × 5)
- Attempt 4: 125 seconds delay (25s × 5)

**Retry Scenarios:**
- SMTP connection failures
- Temporary network issues
- Rate limiting from email provider
- Authentication errors

### 4. Delivery Tracking

**Email Status Lifecycle:**
1. `PENDING` - Email queued, waiting to be processed
2. `PROCESSING` - Currently being sent
3. `SENT` - Successfully delivered to SMTP server
4. `FAILED` - All retry attempts exhausted
5. `BOUNCED` - Email bounced (future enhancement)

**Tracking Features:**
- Job ID for status queries
- Timestamp tracking (created, sent)
- Error message capture
- Attempt count logging
- Message ID from SMTP server

### 5. Production-Ready Features

**SMTP Connection Pooling:**
```typescript
{
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Reuses connections for better performance
}
```

**Development Mode:**
- Console logging instead of SMTP
- Preview email content
- Test without actual sending

**Monitoring:**
- Queue statistics (waiting, active, completed, failed, delayed)
- Failed jobs retrieval
- Delivery status queries
- Template cache monitoring

## API Endpoints

### POST /api/email

Queue a single email for sending.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to CRM",
  "template": "welcome",
  "context": {
    "name": "John Doe",
    "loginUrl": "https://crm.example.com/login"
  },
  "priority": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email queued successfully",
  "jobId": "uuid-v4-job-id"
}
```

**Permissions Required:** `email:send`

---

### POST /api/email/bulk

Queue bulk emails to multiple recipients.

**Request:**
```json
{
  "to": ["user1@example.com", "user2@example.com"],
  "subject": "System Maintenance",
  "template": "welcome",
  "context": {
    "message": "System will be down for maintenance"
  },
  "priority": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk emails queued successfully",
  "jobId": "uuid-v4-job-id"
}
```

**Permissions Required:** `email:send:bulk`

---

### GET /api/email/status/:jobId

Get delivery status for a specific email job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "SENT",
    "to": "user@example.com",
    "subject": "Welcome to CRM",
    "template": "welcome",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sentAt": "2024-01-01T00:00:05.000Z",
    "attempts": 1,
    "messageId": "smtp-message-id"
  }
}
```

**Permissions Required:** `email:view`

---

### GET /api/email/queue/stats

Get queue statistics for monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 1234,
    "failed": 12,
    "delayed": 0
  }
}
```

**Permissions Required:** `email:manage`

---

### GET /api/email/queue/failed

Retrieve all failed email jobs for manual review.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "123",
      "data": { /* job data */ },
      "failedReason": "SMTP connection timeout",
      "attemptsMade": 3,
      "timestamp": 1234567890
    }
  ]
}
```

**Permissions Required:** `email:manage`

---

### PATCH /api/email/retry/:jobId

Manually retry a failed email job.

**Response:**
```json
{
  "success": true,
  "message": "Email job retried successfully"
}
```

**Permissions Required:** `email:manage`

---

### PATCH /api/email/queue/pause

Pause the email queue (stops processing).

**Response:**
```json
{
  "success": true,
  "message": "Email queue paused"
}
```

**Permissions Required:** `email:manage`

---

### PATCH /api/email/queue/resume

Resume the email queue.

**Response:**
```json
{
  "success": true,
  "message": "Email queue resumed"
}
```

**Permissions Required:** `email:manage`

---

### DELETE /api/email/queue/cleanup

Clean up old completed/failed jobs (default: 7 days).

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 123 old jobs",
  "removed": 123
}
```

**Permissions Required:** `email:manage`

---

### GET /api/email/templates

List all available email templates.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": ["password-reset", "welcome", "invitation"]
}
```

**Permissions Required:** `email:view`

## Configuration

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@example.com

# Email Queue
REDIS_EMAIL_QUEUE_DB=2          # Separate Redis DB for email queue
EMAIL_QUEUE_CONCURRENCY=5       # Concurrent email jobs
EMAIL_MAX_RETRIES=3             # Maximum retry attempts
EMAIL_RETRY_DELAY=5000          # Initial retry delay (ms)

# Redis (shared with cache and rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                 # Optional
```

### Gmail Configuration

For Gmail SMTP, use App Passwords:

1. Enable 2-Factor Authentication
2. Go to https://myaccount.google.com/apppasswords
3. Create "App Password" for "Mail"
4. Use the generated password (not your account password)

### Production Recommendations

1. **Use dedicated SMTP service:**
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

2. **Configure SPF/DKIM/DMARC:**
   ```
   example.com TXT "v=spf1 include:_spf.google.com ~all"
   ```

3. **Monitor bounce rates:**
   - Track bounce events
   - Implement bounce handling
   - Remove invalid addresses

4. **Set up alerts:**
   - Failed job threshold
   - Queue size alerts
   - SMTP connection errors

## Usage Examples

### Basic Email Sending

```typescript
import { EmailService } from './email/email.service';
import { EmailTemplate } from './email/interfaces/email.interface';

@Injectable()
export class AuthService {
  constructor(private emailService: EmailService) {}

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `https://crm.example.com/reset?token=${token}`;
    
    const jobId = await this.emailService.queueEmail({
      to: email,
      subject: 'Password Reset Request',
      template: EmailTemplate.PASSWORD_RESET,
      context: {
        name: 'User',
        resetUrl,
        expiryHours: 1,
      },
      priority: 8, // High priority
    });

    return jobId;
  }
}
```

### Bulk Email Sending

```typescript
async sendBulkNotification(userEmails: string[], message: string) {
  const jobId = await this.emailService.queueBulkEmail({
    to: userEmails,
    subject: 'Important System Notification',
    template: EmailTemplate.WELCOME, // Reuse template
    context: {
      name: 'User',
      message,
    },
    priority: 5,
  });

  return jobId;
}
```

### Check Email Status

```typescript
async checkEmailStatus(jobId: string) {
  const status = await this.emailService.getDeliveryStatus(jobId);
  
  if (status?.status === EmailStatus.SENT) {
    console.log('Email successfully sent!');
  } else if (status?.status === EmailStatus.FAILED) {
    console.error('Email failed:', status.error);
  }
}
```

### Monitor Queue Health

```typescript
async monitorQueue() {
  const stats = await this.emailService.getQueueStats();
  
  if (stats.failed > 10) {
    // Alert: Too many failed emails
    await this.alertOps('High email failure rate');
  }
  
  if (stats.waiting > 100) {
    // Alert: Queue backlog
    await this.alertOps('Email queue backlog');
  }
}
```

## Performance Considerations

### Template Caching

Templates are compiled once and cached in memory:

```typescript
// First render: Compiles and caches
await templateService.render('welcome', context);

// Subsequent renders: Uses cached template
await templateService.render('welcome', context2); // Fast!
```

### Connection Pooling

SMTP connections are pooled for efficiency:
- Max 5 concurrent connections
- Reuse connections for up to 100 messages
- Automatic reconnection on failure

### Queue Concurrency

Process multiple emails simultaneously:
- Default: 5 concurrent jobs
- Adjustable via `EMAIL_QUEUE_CONCURRENCY`
- Balance between throughput and resource usage

## Monitoring & Troubleshooting

### Common Issues

**1. Emails stuck in queue:**
```bash
# Check queue stats
GET /api/email/queue/stats

# Check Redis connection
redis-cli ping
```

**2. All emails failing:**
```bash
# Verify SMTP credentials
# Check SMTP server logs
# Review failed jobs
GET /api/email/queue/failed
```

**3. Slow email delivery:**
```bash
# Increase concurrency
EMAIL_QUEUE_CONCURRENCY=10

# Check Redis performance
redis-cli INFO stats
```

### Health Monitoring

Monitor these metrics:
- Queue size (waiting jobs)
- Failed job count
- Average processing time
- SMTP connection errors
- Redis connection status

### Logging

Email service logs include:
- Job queue events
- Template rendering
- SMTP send attempts
- Error details with stack traces
- Status updates

**Example logs:**
```
[EmailService] Email queued successfully: abc-123 (Job ID: 456)
[EmailProcessor] Processing email job abc-123 (attempt 1)
[TemplateService] Template rendered successfully: password-reset.html
[EmailService] Email sent to user@example.com (messageId: <xyz@smtp>)
```

## Security Considerations

### Email Validation

All email addresses are validated using `class-validator`:
```typescript
@IsEmail({}, { message: 'Invalid email address' })
to: string;
```

### SMTP Credentials

- Never commit SMTP credentials to version control
- Use environment variables
- Store in secure vault (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly

### Template Injection Prevention

Handlebars automatically escapes HTML:
```handlebars
{{name}}  <!-- Safe: HTML-escaped -->
{{{html}}} <!-- Unsafe: Raw HTML -->
```

### Rate Limiting

Implement email-specific rate limits:
```typescript
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 emails/minute
@Post()
async queueEmail() {}
```

## Testing

### Unit Tests

```typescript
describe('EmailService', () => {
  it('should queue email successfully', async () => {
    const jobId = await emailService.queueEmail({
      to: 'test@example.com',
      subject: 'Test',
      template: EmailTemplate.WELCOME,
      context: { name: 'Test' },
    });
    
    expect(jobId).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Email E2E', () => {
  it('should send email end-to-end', async () => {
    const jobId = await emailService.queueEmail(/* ... */);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await emailService.getDeliveryStatus(jobId);
    expect(status.status).toBe(EmailStatus.SENT);
  });
});
```

### Manual Testing

1. **Development mode:**
   ```bash
   NODE_ENV=development npm start
   # Emails logged to console
   ```

2. **Test SMTP (Mailtrap):**
   ```bash
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-user
   SMTP_PASS=your-mailtrap-pass
   ```

3. **Production testing:**
   - Use personal email first
   - Verify SPF/DKIM setup
   - Test bounce handling

## Migration from Old Email Service

### Old Service (Common Module)

```typescript
// Old approach - direct sending
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});
```

### New Service (Email Module)

```typescript
// New approach - queued with templates
const jobId = await emailService.queueEmail({
  to: 'user@example.com',
  subject: 'Test',
  template: EmailTemplate.WELCOME,
  context: { name: 'User' },
});
```

### Migration Steps

1. **Update imports:**
   ```typescript
   // Old
   import { EmailService } from '../common/email.service';
   
   // New
   import { EmailService } from '../email/email.service';
   import { EmailTemplate } from '../email/interfaces/email.interface';
   ```

2. **Convert inline HTML to templates:**
   - Create `.hbs` template files
   - Extract variables to context
   - Use template enums

3. **Update method calls:**
   - Replace `sendEmail()` with `queueEmail()`
   - Add template and context parameters
   - Handle jobId returns

4. **Test thoroughly:**
   - Verify template rendering
   - Check queue processing
   - Validate delivery tracking

## Future Enhancements

### Planned Features

1. **Email Event Webhooks:**
   - Delivery confirmations
   - Bounce notifications
   - Spam complaints
   - Click/open tracking

2. **Advanced Templates:**
   - Dynamic template loading
   - Multi-language support
   - A/B testing
   - Personalization engine

3. **Analytics Dashboard:**
   - Delivery rates
   - Bounce rates
   - Open rates (with pixel tracking)
   - Click-through rates

4. **Email Scheduling:**
   - Send at specific time
   - Timezone-aware scheduling
   - Recurring emails

5. **Attachment Support:**
   - File attachments
   - Inline images
   - PDF generation

## Conclusion

The enhanced email service provides a production-ready, scalable solution for email delivery with comprehensive monitoring, retry logic, and template management. The queue-based architecture ensures reliable delivery even under high load, while the template system maintains consistency across all email communications.

For support or questions, refer to the main project documentation or contact the development team.

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0  
**Author:** CRM Development Team
