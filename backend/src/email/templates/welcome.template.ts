/**
 * Generate welcome email HTML for new users
 */
export function generateWelcomeEmail(data: {
  name: string;
  companyName: string;
  email: string;
  dashboardUrl: string;
}): string {
  const { name, companyName, email, dashboardUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CRM Vision</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 20px;
    }
    .content {
      color: #6b7280;
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box strong {
      color: #1f2937;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .features {
      margin: 30px 0;
    }
    .feature-item {
      margin: 15px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }
    .support {
      margin-top: 20px;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 6px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎯 CRM Vision</div>
    </div>
    
    <h1>Welcome to CRM Vision!</h1>
    
    <div class="greeting">
      Hi ${name},
    </div>
    
    <div class="content">
      <p>Thank you for registering with CRM Vision! We're excited to have you and <strong>${companyName}</strong> on board.</p>
      
      <p>Your account has been successfully created, and you're now ready to start managing your customer relationships like never before.</p>
    </div>
    
    <div class="info-box">
      <p><strong>Your Account Details:</strong></p>
      <p>📧 Email: ${email}</p>
      <p>🏢 Company: ${companyName}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
    </div>
    
    <div class="features">
      <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">What you can do with CRM Vision:</h2>
      
      <div class="feature-item">
        <strong>Manage Contacts & Deals</strong> - Keep all your customer information organized in one place
      </div>
      
      <div class="feature-item">
        <strong>Track Activities</strong> - Never miss a follow-up with automated activity tracking
      </div>
      
      <div class="feature-item">
        <strong>Team Collaboration</strong> - Invite team members and work together seamlessly
      </div>
      
      <div class="feature-item">
        <strong>Analytics & Reports</strong> - Get insights into your sales pipeline and team performance
      </div>
      
      <div class="feature-item">
        <strong>Email Integration</strong> - Send and track emails directly from the CRM
      </div>
    </div>
    
    <div class="support">
      <p><strong>Need Help Getting Started?</strong></p>
      <p>Check out our <a href="${dashboardUrl}/help" style="color: #3b82f6; text-decoration: none;">Help Center</a> or contact our support team.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} CRM Vision. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate welcome email plain text version
 */
export function generateWelcomeEmailText(data: {
  name: string;
  companyName: string;
  email: string;
  dashboardUrl: string;
}): string {
  const { name, companyName, email, dashboardUrl } = data;

  return `
Welcome to CRM Vision!

Hi ${name},

Thank you for registering with CRM Vision! We're excited to have you and ${companyName} on board.

Your account has been successfully created, and you're now ready to start managing your customer relationships like never before.

YOUR ACCOUNT DETAILS:
- Email: ${email}
- Company: ${companyName}

Access your dashboard: ${dashboardUrl}

WHAT YOU CAN DO WITH CRM VISION:
✓ Manage Contacts & Deals - Keep all your customer information organized in one place
✓ Track Activities - Never miss a follow-up with automated activity tracking
✓ Team Collaboration - Invite team members and work together seamlessly
✓ Analytics & Reports - Get insights into your sales pipeline and team performance
✓ Email Integration - Send and track emails directly from the CRM

Need help getting started? Check out our Help Center: ${dashboardUrl}/help

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} CRM Vision. All rights reserved.
  `.trim();
}
