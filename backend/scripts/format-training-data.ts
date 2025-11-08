import * as fs from 'fs';
import * as path from 'path';

interface FineTuneExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

async function formatForFineTuning() {
  console.log('🔄 Formatting data for OpenAI fine-tuning...\n');

  try {
    // Read exported data
    const rawDataPath = path.join(__dirname, '../data/ai-training-data.json');
    
    if (!fs.existsSync(rawDataPath)) {
      console.error('❌ Error: ai-training-data.json not found!');
      console.log('📌 Please run: npx ts-node scripts/export-ai-training-data.ts first\n');
      process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'));
    const fineTuneExamples: FineTuneExample[] = [];

    console.log('📊 Processing data:\n');

    // ============================================
    // 1. DEAL OUTCOME PREDICTION
    // ============================================
    console.log('1️⃣  Formatting deal outcome predictions...');
    let dealCount = 0;

    // Process WON deals
    rawData.wonDeals?.forEach((deal: any) => {
      const activityCount = deal.activities?.length || 0;
      const dealValue = deal.value ? `$${parseFloat(deal.value).toLocaleString()}` : 'Not specified';
      const contactName = deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : 'Unknown';
      
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in analyzing CRM deals and predicting outcomes.',
          },
          {
            role: 'user',
            content: `Analyze this deal: Title: "${deal.title}", Value: ${dealValue}, Stage: ${deal.stage}, Contact: ${contactName}, Company: ${deal.company?.name || 'Unknown'}, Total Activities: ${activityCount}, Priority: ${deal.priority || 'MEDIUM'}`,
          },
          {
            role: 'assistant',
            content: `This deal shows strong potential for success (Status: WON). Key factors: ${activityCount > 5 ? 'High engagement with ' + activityCount + ' activities shows consistent follow-up.' : 'Activity count suggests need for more touchpoints.'} The deal value of ${dealValue} and ${deal.priority === 'HIGH' || deal.priority === 'URGENT' ? 'high priority status indicates' : 'priority level suggests'} strong commitment. ${deal.contact ? 'Direct contact with ' + contactName + ' maintained.' : 'Ensure consistent contact engagement.'} Recommendation: This deal successfully closed - similar patterns indicate high win probability.`,
          },
        ],
      });
      dealCount++;
    });

    // Process LOST deals
    rawData.lostDeals?.forEach((deal: any) => {
      const activityCount = deal.activities?.length || 0;
      const dealValue = deal.value ? `$${parseFloat(deal.value).toLocaleString()}` : 'Not specified';
      const contactName = deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : 'Unknown';
      
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in analyzing CRM deals and predicting outcomes.',
          },
          {
            role: 'user',
            content: `Analyze this deal: Title: "${deal.title}", Value: ${dealValue}, Stage: ${deal.stage}, Contact: ${contactName}, Company: ${deal.company?.name || 'Unknown'}, Total Activities: ${activityCount}, Priority: ${deal.priority || 'MEDIUM'}`,
          },
          {
            role: 'assistant',
            content: `This deal shows concerning patterns (Status: LOST). Risk factors: ${activityCount < 3 ? 'Limited engagement with only ' + activityCount + ' activities suggests insufficient follow-up.' : 'Despite ' + activityCount + ' activities, deal progression stalled.'} ${deal.priority === 'LOW' ? 'Low priority status may indicate lack of urgency or fit issues.' : 'Priority level did not translate to successful closure.'} ${deal.contact ? 'Contact engagement with ' + contactName + ' was not sufficient.' : 'Lack of direct contact hurt the opportunity.'} Recommendation: Similar patterns indicate high risk - increase engagement, reassess fit, and address objections early.`,
          },
        ],
      });
      dealCount++;
    });

    console.log(`   ✓ Created ${dealCount} deal prediction examples`);

    // ============================================
    // 2. EMAIL GENERATION
    // ============================================
    console.log('2️⃣  Formatting email generation examples...');
    let emailCount = 0;

    rawData.emailActivities?.forEach((activity: any) => {
      if (activity.description && activity.description.length > 50) {
        const contactName = activity.contact 
          ? `${activity.contact.firstName} ${activity.contact.lastName}` 
          : 'Valued Contact';
        const dealStage = activity.deal?.stage || 'LEAD';
        const companyName = activity.company?.name || 'their company';
        
        fineTuneExamples.push({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant helping write professional, personalized CRM follow-up emails.',
            },
            {
              role: 'user',
              content: `Generate a follow-up email for: Deal Stage: ${dealStage}, Contact: ${contactName}, Company: ${companyName}, Context: ${activity.title || 'Follow-up'}`,
            },
            {
              role: 'assistant',
              content: activity.description,
            },
          ],
        });
        emailCount++;
      }
    });

    console.log(`   ✓ Created ${emailCount} email generation examples`);

    // ============================================
    // 3. NEXT ACTION RECOMMENDATIONS
    // ============================================
    console.log('3️⃣  Formatting action recommendation examples...');
    let actionCount = 0;

    rawData.deals?.forEach((deal: any) => {
      if (deal.activities && deal.activities.length > 0) {
        const lastActivity = deal.activities[deal.activities.length - 1];
        const daysSinceActivity = lastActivity.scheduledDate 
          ? Math.floor((new Date().getTime() - new Date(lastActivity.scheduledDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        // Generate recommendations based on stage and activity
        let recommendation = '';
        
        if (deal.stage === 'LEAD') {
          recommendation = 'Schedule a qualification call within 24-48 hours to assess fit and needs. Prepare discovery questions about their business challenges and budget timeline.';
        } else if (deal.stage === 'QUALIFIED') {
          recommendation = 'Arrange a product demonstration tailored to their specific use case. Send pre-demo questionnaire to understand key requirements and prepare custom presentation.';
        } else if (deal.stage === 'NEGOTIATION') {
          recommendation = 'Schedule pricing discussion call. Prepare proposal with multiple tier options, ROI calculator, and case studies from similar companies. Address any objections proactively.';
        } else {
          recommendation = 'Follow up with stakeholders to maintain momentum. Send relevant content (case studies, testimonials) and schedule check-in meeting within 3 business days.';
        }

        if (daysSinceActivity > 7) {
          recommendation += ' Note: Gap in communication detected - prioritize immediate outreach to re-engage prospect.';
        }

        fineTuneExamples.push({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant recommending next best actions for CRM deals to maximize win rates.',
            },
            {
              role: 'user',
              content: `What should be the next action for this deal? Stage: ${deal.stage}, Last Activity: ${lastActivity.type} - "${lastActivity.title}", Days Since Last Contact: ${daysSinceActivity}, Priority: ${deal.priority || 'MEDIUM'}`,
            },
            {
              role: 'assistant',
              content: recommendation,
            },
          ],
        });
        actionCount++;
      }
    });

    console.log(`   ✓ Created ${actionCount} action recommendation examples`);

    // ============================================
    // 4. CONTACT INTELLIGENCE
    // ============================================
    console.log('4️⃣  Formatting contact intelligence examples...');
    let contactCount = 0;

    rawData.contacts?.slice(0, 100).forEach((contact: any) => {
      const dealCount = contact.deals?.length || 0;
      const activityCount = contact.activities?.length || 0;
      const wonDeals = contact.deals?.filter((d: any) => d.stage === 'CLOSED_WON').length || 0;
      
      let insights = [];
      
      if (wonDeals > 0) {
        insights.push(`Previous customer - won ${wonDeals} deal${wonDeals > 1 ? 's' : ''}`);
      }
      if (activityCount > 5) {
        insights.push('High engagement level with multiple touchpoints');
      }
      if (dealCount > 1) {
        insights.push('Multiple opportunities in pipeline');
      }
      if (!contact.email) {
        insights.push('Missing email - prioritize data completion');
      }
      
      const fullName = `${contact.firstName} ${contact.lastName}`;
      const company = contact.company?.name || 'Unknown Company';
      
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant providing intelligent insights about CRM contacts.',
          },
          {
            role: 'user',
            content: `Provide insights for: ${fullName} at ${company}, Total Deals: ${dealCount}, Won Deals: ${wonDeals}, Total Activities: ${activityCount}`,
          },
          {
            role: 'assistant',
            content: insights.length > 0 
              ? `Contact Insights for ${fullName}: ${insights.join('. ')}. ${wonDeals > 0 ? 'Proven buyer - high conversion potential.' : 'New prospect - focus on building relationship and trust.'} ${activityCount > 5 ? 'Engagement pattern suggests strong interest.' : 'Increase touchpoint frequency to build rapport.'}`
              : `Contact Insights for ${fullName}: New contact with limited history. Recommendation: Initiate discovery conversation, gather additional contact information, and establish communication cadence.`,
          },
        ],
      });
      contactCount++;
    });

    console.log(`   ✓ Created ${contactCount} contact intelligence examples`);

    // ============================================
    // 5. DEAL STAGE PROGRESSION ADVICE
    // ============================================
    console.log('5️⃣  Formatting deal progression advice...');
    let progressionCount = 0;

    rawData.deals?.slice(0, 50).forEach((deal: any) => {
      const activityTypes = deal.activities?.map((a: any) => a.type) || [];
      const hasMeeting = activityTypes.includes('MEETING');
      const hasCall = activityTypes.includes('CALL');
      const hasEmail = activityTypes.includes('EMAIL');
      
      let advice = '';
      
      if (deal.stage === 'LEAD' && (hasMeeting || hasCall)) {
        advice = 'This lead shows engagement readiness. Move to QUALIFIED stage after confirming: budget availability, decision-making authority, timeline for implementation, and specific pain points you can address.';
      } else if (deal.stage === 'QUALIFIED' && hasMeeting) {
        advice = 'Qualified prospect with meeting scheduled. Prepare to move to NEGOTIATION by: presenting tailored solution, providing pricing breakdown, sharing relevant case studies, and identifying key decision makers.';
      } else if (deal.stage === 'NEGOTIATION') {
        advice = 'In negotiation phase - focus on closing. Key actions: address objections, offer trial/pilot program if applicable, create urgency with time-limited incentives, and schedule final decision meeting with all stakeholders.';
      } else {
        advice = 'Maintain momentum with consistent follow-up. Schedule next touchpoint within 3-5 days, provide value in each interaction (insights, industry news, resources), and document all conversations in CRM.';
      }
      
      fineTuneExamples.push({
        messages: [
          {
            role: 'system',
            content: 'You are an AI sales advisor helping progress deals through the pipeline efficiently.',
          },
          {
            role: 'user',
            content: `How should I progress this deal? Current Stage: ${deal.stage}, Has Meeting: ${hasMeeting}, Has Call: ${hasCall}, Has Email: ${hasEmail}, Total Activities: ${deal.activities?.length || 0}`,
          },
          {
            role: 'assistant',
            content: advice,
          },
        ],
      });
      progressionCount++;
    });

    console.log(`   ✓ Created ${progressionCount} progression advice examples`);

    // ============================================
    // SAVE FORMATTED DATA
    // ============================================
    const outputPath = path.join(__dirname, '../data/fine-tune-training.jsonl');
    const jsonlContent = fineTuneExamples.map((ex) => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);

    console.log('\n✅ Formatting Complete!\n');
    console.log('📊 Summary:');
    console.log('─────────────────────────────────────');
    console.log(`✓ Total Examples:          ${fineTuneExamples.length}`);
    console.log(`  ├─ Deal Predictions:     ${dealCount}`);
    console.log(`  ├─ Email Templates:      ${emailCount}`);
    console.log(`  ├─ Action Recommendations: ${actionCount}`);
    console.log(`  ├─ Contact Insights:     ${contactCount}`);
    console.log(`  └─ Progression Advice:   ${progressionCount}`);
    console.log('─────────────────────────────────────');
    console.log(`📁 Saved to: ${outputPath}\n`);

    // Validation
    const minExamplesRequired = 10;
    const hasEnoughExamples = fineTuneExamples.length >= minExamplesRequired;
    
    console.log('📋 Validation:');
    console.log(`${hasEnoughExamples ? '✅' : '❌'} Training Examples: ${fineTuneExamples.length} (min: ${minExamplesRequired})`);
    
    if (hasEnoughExamples) {
      console.log('\n✅ Data is ready for OpenAI fine-tuning!');
      console.log('📌 Next steps:');
      console.log('   1. Set your OpenAI API key:');
      console.log('      Windows CMD:     set OPENAI_API_KEY=sk-your-key');
      console.log('      PowerShell:      $env:OPENAI_API_KEY="sk-your-key"');
      console.log('      Linux/Mac:       export OPENAI_API_KEY=sk-your-key');
      console.log('   2. Run: npx ts-node scripts/upload-training-data.ts\n');
    } else {
      console.log('\n⚠️  Warning: Need more training examples for optimal results.');
      console.log(`   Generate more data by adding deals, contacts, and activities to your CRM.\n`);
    }

  } catch (error) {
    console.error('❌ Formatting failed:', error);
    throw error;
  }
}

// Run the formatting
formatForFineTuning().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
