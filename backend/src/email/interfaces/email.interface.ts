export enum EmailTemplate {
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
  INVITATION = 'invitation',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  context: Record<string, any>;
  priority?: number; // Higher number = higher priority (default: 0)
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailJobData extends EmailOptions {
  jobId: string;
  createdAt: Date;
  attempt: number;
}

export interface EmailDeliveryStatus {
  jobId: string;
  status: EmailStatus;
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
  attempts: number;
  messageId?: string;
}
