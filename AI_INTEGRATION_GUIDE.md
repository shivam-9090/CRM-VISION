# 🤖 AI Integration & Fine-tuning Guide for CRM System

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Training Data Collection](#training-data-collection)
5. [Fine-tuning Process](#fine-tuning-process)
6. [Integration into CRM](#integration-into-crm)
7. [Testing & Deployment](#testing--deployment)

---

## 🎯 Overview

This guide covers integrating AI capabilities into your CRM system through OpenAI GPT-4 fine-tuning. The AI will help with:
- **Email generation** for deals and contacts
- **Deal insights** and win probability prediction
- **Activity recommendations** based on deal stage
- **Smart search** across CRM data
- **Contact intelligence** and enrichment

**Recommended AI Provider**: OpenAI GPT-4 / GPT-3.5-turbo

---

## ✅ Prerequisites

### System Requirements
- Node.js 18+ installed
- NestJS backend running (Port 3001)
- Next.js frontend running (Port 3000)
- PostgreSQL database with CRM data
- Docker Desktop (optional, for local AI models)

### Required Accounts & API Keys
1. **OpenAI Account**: https://platform.openai.com
   - Create account
   - Generate API key from API settings
   - Add payment method (fine-tuning requires paid account)

2. **Environment Variables**
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   OPENAI_ORG_ID=org-your-org-id-here # Optional
   ```

### Required NPM Packages
```bash
# Backend dependencies
cd backend
npm install openai@^4.0.0
npm install @types/openai --save-dev

# Frontend dependencies (optional for UI)
cd frontend
npm install openai@^4.0.0
```

---

## 🚀 Step-by-Step Implementation

### **STEP 1: Export Training Data from CRM Database**

#### 1.1 Create Data Export Script
Create file: `backend/scripts/export-ai-training-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TrainingData {
  deals: any[];
  contacts: any[];
  activities: any[];
  emails: any[];
}

async function exportTrainingData() {
  console.log('📊 Exporting CRM data for AI training...');

  // Export successful deals (WON deals with complete data)
  const wonDeals = await prisma.deal.findMany({
    where: {
      status: 'WON',
    },
    include: {
      contact: true,
      company: true,
      activities: true,
      comments: true,
    },
    orderBy: {
      closedDate: 'desc',
    },
  });

  // Export lost deals for comparison
  const lostDeals = await prisma.deal.findMany({
    where: {
      status: 'LOST',
    },
    include: {
      contact: true,
      company: true,
      activities: true,
      comments: true,
    },
    take: wonDeals.length, // Balance the dataset
  });

  // Export email activities (successful follow-ups)
  const emailActivities = await prisma.activity.findMany({
    where: {
      type: 'EMAIL',
      status: 'COMPLETED',
    },
    include: {
      deal: true,
      contact: true,
    },
  });

  // Export all contacts with engagement data
  const contacts = await prisma.contact.findMany({
    include: {
      company: true,
      deals: true,
      activities: true,
    },
  });

  const trainingData: TrainingData = {
    deals: [...wonDeals, ...lostDeals],
    contacts: contacts,
    activities: emailActivities,
    emails: [], // Will be populated from activities
  };

  // Save to JSON file
  const outputPath = path.join(__dirname, '../data/ai-training-data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2));

  console.log(`✅ Exported ${trainingData.deals.length} deals`);
  console.log(`✅ Exported ${trainingData.contacts.length} contacts`);
  console.log(`✅ Exported ${trainingData.activities.length} activities`);
  console.log(`📁 Data saved to: ${outputPath}`);

  await prisma.$disconnect();
}

exportTrainingData().catch(console.error);
```

#### 1.2 Run Export Script
```bash
cd backend
npx ts-node scripts/export-ai-training-data.ts
```

**Output**: `backend/data/ai-training-data.json` (your raw CRM data)

---

### **STEP 2: Format Data for Fine-tuning**

#### 2.1 Create Formatting Script
Create file: `backend/scripts/format-training-data.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface FineTuneExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

async function formatForFineTuning() {
  console.log('🔄 Formatting data for OpenAI fine-tuning...');

  // Read exported data
  const rawData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/ai-training-data.json'), 'utf-8')
  );

  const fineTuneExamples: FineTuneExample[] = [];

  // Format 1: Deal Outcome Prediction
  rawData.deals.forEach((deal: any) => {
    fineTuneExamples.push({
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping predict CRM deal outcomes.',
        },
        {
          role: 'user',
          content: `Analyze this deal: Value: $${deal.value}, Stage: ${deal.stage}, Contact: ${deal.contact?.name}, Company: ${deal.company?.name}, Activities: ${deal.activities?.length || 0}`,
        },
        {
          role: 'assistant',
          content: `Based on the analysis, this deal is likely to be ${deal.status}. ${
            deal.status === 'WON'
              ? 'Strong engagement with multiple activities and decision-maker involvement.'
              : 'Limited engagement or pricing concerns may be barriers.'
          }`,
        },
      ],
    });
  });

  // Format 2: Email Generation
  rawData.activities.forEach((activity: any) => {
    if (activity.type === 'EMAIL' && activity.notes) {
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping write professional CRM emails.',
          },
          {
            role: 'user',
            content: `Generate a follow-up email for: Deal Stage: ${activity.deal?.stage}, Contact: ${activity.contact?.name}, Context: ${activity.title}`,
          },
          {
            role: 'assistant',
            content: activity.notes, // Your actual successful email content
          },
        ],
      });
    }
  });

  // Format 3: Next Action Recommendations
  rawData.deals.forEach((deal: any) => {
    const lastActivity = deal.activities?.[0];
    if (lastActivity) {
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant recommending next actions for CRM deals.',
          },
          {
            role: 'user',
            content: `Deal in ${deal.stage} stage. Last activity: ${lastActivity.type} on ${lastActivity.scheduledDate}. What should be the next step?`,
          },
          {
            role: 'assistant',
            content: `Recommended: Schedule a ${
              deal.stage === 'QUALIFICATION' ? 'discovery call' : 'follow-up meeting'
            } within 48 hours to maintain momentum. ${
              deal.stage === 'PROPOSAL' ? 'Share pricing details and case studies.' : ''
            }`,
          },
        ],
      });
    }
  });

  // Save as JSONL format (required by OpenAI)
  const outputPath = path.join(__dirname, '../data/fine-tune-training.jsonl');
  const jsonlContent = fineTuneExamples.map((ex) => JSON.stringify(ex)).join('\n');
  fs.writeFileSync(outputPath, jsonlContent);

  console.log(`✅ Formatted ${fineTuneExamples.length} training examples`);
  console.log(`📁 Saved to: ${outputPath}`);
}

formatForFineTuning().catch(console.error);
```

#### 2.2 Run Formatting Script
```bash
npx ts-node scripts/format-training-data.ts
```

**Output**: `backend/data/fine-tune-training.jsonl` (OpenAI-ready format)

---

### **STEP 3: Upload Training Data to OpenAI**

#### 3.1 Create Upload Script
Create file: `backend/scripts/upload-training-data.ts`

```typescript
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadTrainingData() {
  console.log('📤 Uploading training data to OpenAI...');

  const filePath = path.join(__dirname, '../data/fine-tune-training.jsonl');

  try {
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'fine-tune',
    });

    console.log('✅ File uploaded successfully!');
    console.log(`📄 File ID: ${file.id}`);
    console.log('📋 Copy this File ID for the next step!');

    // Save file ID for reference
    fs.writeFileSync(
      path.join(__dirname, '../data/openai-file-id.txt'),
      file.id
    );

    return file.id;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

uploadTrainingData().catch(console.error);
```

#### 3.2 Run Upload
```bash
# Set your OpenAI API key first
export OPENAI_API_KEY=sk-your-api-key-here  # Linux/Mac
# OR
set OPENAI_API_KEY=sk-your-api-key-here     # Windows CMD
# OR
$env:OPENAI_API_KEY="sk-your-api-key-here"  # PowerShell

npx ts-node scripts/upload-training-data.ts
```

**Output**: File ID (save this for Step 4)

---

### **STEP 4: Start Fine-tuning Job**

#### 4.1 Create Fine-tune Script
Create file: `backend/scripts/start-fine-tune.ts`

```typescript
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function startFineTune() {
  console.log('🚀 Starting fine-tuning job...');

  // Read the file ID from previous step
  const fileId = fs
    .readFileSync(path.join(__dirname, '../data/openai-file-id.txt'), 'utf-8')
    .trim();

  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: 'gpt-3.5-turbo', // or 'gpt-4' (more expensive)
      suffix: 'crm-assistant', // Custom model name suffix
    });

    console.log('✅ Fine-tuning job started!');
    console.log(`🆔 Job ID: ${fineTune.id}`);
    console.log(`📊 Status: ${fineTune.status}`);
    console.log('⏳ This may take 10-60 minutes...');

    // Save job ID for reference
    fs.writeFileSync(
      path.join(__dirname, '../data/fine-tune-job-id.txt'),
      fineTune.id
    );

    return fineTune.id;
  } catch (error) {
    console.error('❌ Fine-tuning failed:', error);
    throw error;
  }
}

startFineTune().catch(console.error);
```

#### 4.2 Run Fine-tune
```bash
npx ts-node scripts/start-fine-tune.ts
```

#### 4.3 Check Fine-tune Status
Create file: `backend/scripts/check-fine-tune-status.ts`

```typescript
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function checkStatus() {
  const jobId = fs
    .readFileSync(path.join(__dirname, '../data/fine-tune-job-id.txt'), 'utf-8')
    .trim();

  const job = await openai.fineTuning.jobs.retrieve(jobId);

  console.log(`📊 Status: ${job.status}`);
  console.log(`🎯 Model: ${job.model}`);
  console.log(`📈 Trained Tokens: ${job.trained_tokens || 'In progress...'}`);

  if (job.status === 'succeeded') {
    console.log(`✅ Fine-tuned model ready: ${job.fine_tuned_model}`);
    fs.writeFileSync(
      path.join(__dirname, '../data/fine-tuned-model-id.txt'),
      job.fine_tuned_model || ''
    );
  }
}

checkStatus().catch(console.error);
```

```bash
# Check every few minutes
npx ts-node scripts/check-fine-tune-status.ts
```

**Output**: Fine-tuned model ID (e.g., `ft:gpt-3.5-turbo:your-org:crm-assistant:abc123`)

---

### **STEP 5: Integrate AI into Backend**

#### 5.1 Create AI Module
```bash
cd backend/src
nest g module ai
nest g service ai
nest g controller ai
```

#### 5.2 Create AI Service
File: `backend/src/ai/ai.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private fineTunedModel: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });

    // Read fine-tuned model ID
    try {
      this.fineTunedModel = fs
        .readFileSync(path.join(__dirname, '../../data/fine-tuned-model-id.txt'), 'utf-8')
        .trim();
    } catch {
      this.fineTunedModel = 'gpt-3.5-turbo'; // Fallback to base model
    }
  }

  async generateEmail(dealStage: string, contactName: string, context: string) {
    const completion = await this.openai.chat.completions.create({
      model: this.fineTunedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping write professional CRM emails.',
        },
        {
          role: 'user',
          content: `Generate a follow-up email for: Deal Stage: ${dealStage}, Contact: ${contactName}, Context: ${context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  }

  async predictDealOutcome(dealValue: number, stage: string, activityCount: number) {
    const completion = await this.openai.chat.completions.create({
      model: this.fineTunedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping predict CRM deal outcomes.',
        },
        {
          role: 'user',
          content: `Analyze this deal: Value: $${dealValue}, Stage: ${stage}, Activities: ${activityCount}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    return completion.choices[0].message.content;
  }

  async recommendNextAction(dealStage: string, lastActivityType: string, daysSinceLastContact: number) {
    const completion = await this.openai.chat.completions.create({
      model: this.fineTunedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant recommending next actions for CRM deals.',
        },
        {
          role: 'user',
          content: `Deal in ${dealStage} stage. Last activity: ${lastActivityType}. Days since contact: ${daysSinceLastContact}. What should be the next step?`,
        },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  }
}
```

#### 5.3 Create AI Controller
File: `backend/src/ai/ai.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-email')
  async generateEmail(
    @Body() body: { dealStage: string; contactName: string; context: string },
  ) {
    const email = await this.aiService.generateEmail(
      body.dealStage,
      body.contactName,
      body.context,
    );
    return { email };
  }

  @Post('predict-deal')
  async predictDeal(
    @Body() body: { dealValue: number; stage: string; activityCount: number },
  ) {
    const prediction = await this.aiService.predictDealOutcome(
      body.dealValue,
      body.stage,
      body.activityCount,
    );
    return { prediction };
  }

  @Post('recommend-action')
  async recommendAction(
    @Body()
    body: {
      dealStage: string;
      lastActivityType: string;
      daysSinceLastContact: number;
    },
  ) {
    const recommendation = await this.aiService.recommendNextAction(
      body.dealStage,
      body.lastActivityType,
      body.daysSinceLastContact,
    );
    return { recommendation };
  }
}
```

#### 5.4 Update App Module
File: `backend/src/app.module.ts` - Add AiModule to imports

#### 5.5 Add Environment Variable
File: `backend/.env`
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

---

### **STEP 6: Add AI Features to Frontend**

#### 6.1 Add AI Button to Deal Page
File: `frontend/src/app/deals/[id]/page.tsx`

Add this to your deal detail page:

```typescript
const [aiInsight, setAiInsight] = useState('');
const [loadingAI, setLoadingAI] = useState(false);

const handleGetAIInsight = async () => {
  setLoadingAI(true);
  try {
    const response = await api.post('/ai/predict-deal', {
      dealValue: deal.value,
      stage: deal.stage,
      activityCount: activities.length,
    });
    setAiInsight(response.data.prediction);
  } catch (error) {
    console.error('AI prediction failed:', error);
  } finally {
    setLoadingAI(false);
  }
};

// Add button in your JSX:
<Button onClick={handleGetAIInsight} disabled={loadingAI}>
  {loadingAI ? 'Analyzing...' : '🤖 Get AI Insight'}
</Button>

{aiInsight && (
  <Card className="mt-4 bg-blue-50">
    <CardContent className="pt-6">
      <p className="text-sm">{aiInsight}</p>
    </CardContent>
  </Card>
)}
```

#### 6.2 Add Email Generation to Activities
File: `frontend/src/app/activities/page.tsx`

```typescript
const [generatedEmail, setGeneratedEmail] = useState('');

const handleGenerateEmail = async () => {
  const response = await api.post('/ai/generate-email', {
    dealStage: selectedDeal.stage,
    contactName: selectedContact.name,
    context: 'Follow-up after demo',
  });
  setGeneratedEmail(response.data.email);
  // Auto-fill the email notes field
  setFormData({ ...formData, notes: response.data.email });
};
```

---

### **STEP 7: Test AI Features**

#### 7.1 Restart Backend
```bash
docker restart crm-backend-dev
```

#### 7.2 Test Endpoints
```bash
# Test email generation
curl -X POST http://localhost:3001/api/ai/generate-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "dealStage": "PROPOSAL",
    "contactName": "John Doe",
    "context": "Following up after product demo"
  }'

# Test deal prediction
curl -X POST http://localhost:3001/api/ai/predict-deal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "dealValue": 50000,
    "stage": "NEGOTIATION",
    "activityCount": 8
  }'
```

---

## 📊 Training Data Requirements

### **What Data to Use from Your CRM?**

#### 1. **Deal Data** (Most Important)
Export from: `Deal` table
```sql
SELECT 
  id, title, value, stage, status, 
  createdAt, closedDate, 
  contactId, companyId
FROM Deal
WHERE status IN ('WON', 'LOST')
ORDER BY closedDate DESC;
```

**Required Fields**:
- ✅ Deal value ($)
- ✅ Deal stage (LEAD, QUALIFICATION, PROPOSAL, etc.)
- ✅ Final status (WON/LOST)
- ✅ Number of activities
- ✅ Contact engagement level

**Minimum**: 50 WON deals + 50 LOST deals (100 total)
**Recommended**: 200+ deals for better accuracy

#### 2. **Activity Data** (Email Content)
Export from: `Activity` table
```sql
SELECT 
  id, title, type, status, notes, 
  scheduledDate, dealId, contactId
FROM Activity
WHERE type = 'EMAIL' 
  AND status = 'COMPLETED'
  AND notes IS NOT NULL
ORDER BY scheduledDate DESC;
```

**Use For**:
- Email template generation
- Follow-up timing patterns
- Subject line optimization

**Minimum**: 30 successful emails
**Recommended**: 100+ emails

#### 3. **Contact Data** (Enrichment)
Export from: `Contact` table
```sql
SELECT 
  id, name, email, position, 
  companyId, createdAt
FROM Contact
WHERE deals IS NOT NULL;
```

**Use For**:
- Contact role classification
- Decision-maker identification
- Engagement scoring

#### 4. **Company Data** (Context)
Export from: `Company` table
```sql
SELECT 
  id, name, industry, size, 
  website, createdAt
FROM Company;
```

**Use For**:
- Industry-specific insights
- Company size-based strategies

### **Data Quality Checklist**

- [ ] At least 100 deals with known outcomes (WON/LOST)
- [ ] 30+ email activities with actual content in notes
- [ ] Remove test data and dummy entries
- [ ] Ensure no PII (Personal Identifiable Information) in training data
- [ ] Balance WON vs LOST deals (50/50 ratio)
- [ ] Include diverse deal stages and values
- [ ] Remove incomplete or canceled deals
- [ ] Verify all dates are valid

---

## 💰 Cost Estimation

### **OpenAI Fine-tuning Costs** (as of November 2024)

| Model | Training Cost | Usage Cost |
|-------|--------------|------------|
| GPT-3.5-turbo | $0.008 per 1K tokens | $0.012 per 1K tokens |
| GPT-4 | $0.030 per 1K tokens | $0.060 per 1K tokens |

**Example for 100 deals training**:
- Training data: ~50,000 tokens
- Fine-tuning cost: $0.40 (GPT-3.5) or $1.50 (GPT-4)
- Monthly usage (1000 API calls): ~$12 (GPT-3.5) or ~$60 (GPT-4)

**Recommendation**: Start with GPT-3.5-turbo for cost-effectiveness

---

## 🔒 Security & Privacy

### **Important Considerations**

1. **Data Privacy**
   - Remove customer personal information (PII)
   - Anonymize sensitive deal details
   - Don't include credit card numbers, SSNs, etc.

2. **API Key Security**
   - Store in `.env` file (never commit to Git)
   - Use environment variables
   - Rotate keys regularly

3. **Rate Limiting**
   - Implement rate limits on AI endpoints
   - Cache common AI responses
   - Monitor API usage

4. **Compliance**
   - Check if your industry allows AI usage
   - Get customer consent if required
   - Follow GDPR/CCPA guidelines

---

## 🐛 Troubleshooting

### **Common Issues**

#### Issue 1: "Invalid API Key"
```bash
# Verify your key is set
echo $OPENAI_API_KEY  # Linux/Mac
echo %OPENAI_API_KEY% # Windows
```

#### Issue 2: "Training file validation failed"
- Check JSONL format (one JSON per line)
- Ensure all examples have `messages` array
- Minimum 10 examples required

#### Issue 3: "Fine-tuning job failed"
```bash
# Check job status
npx ts-node scripts/check-fine-tune-status.ts

# View error details
curl https://api.openai.com/v1/fine_tuning/jobs/YOUR_JOB_ID \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Issue 4: "Model returns generic responses"
- Need more training data (100+ examples)
- Increase training epochs
- Add more specific examples

---

## 📈 Next Steps

After completing this guide:

1. ✅ **Collect at least 100 deals** from your CRM
2. ✅ **Format and upload training data**
3. ✅ **Wait for fine-tuning** (10-60 minutes)
4. ✅ **Test AI features** in development
5. ✅ **Deploy to production** when satisfied
6. 🔄 **Monitor and improve** based on user feedback
7. 🔄 **Retrain quarterly** with new data

---

## 📚 Additional Resources

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [NestJS OpenAI Integration](https://docs.nestjs.com)
- [Best Practices for AI in CRM](https://openai.com/blog)

---

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review OpenAI status: https://status.openai.com
3. Check backend logs: `docker logs crm-backend-dev`
4. Test API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

---

**Created**: November 8, 2025  
**Version**: 1.0  
**CRM Version**: Next.js 15.5.5 + NestJS + PostgreSQL
