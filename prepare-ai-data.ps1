# PowerShell script to prepare AI training data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM AI Training Data Preparation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Preparing sample training data for AI..." -ForegroundColor Yellow
Write-Host ""

# Create sample training data based on your CRM structure
$sampleData = @{
    deals = @(
        # WON Deals (successful patterns)
        @{
            title = "Enterprise Software License - Tech Corp"
            value = 50000
            stage = "CLOSED_WON"
            priority = "HIGH"
            activities_count = 12
            contact = "John Smith"
            company = "Tech Corp Inc"
            pattern = "High engagement, multiple meetings, decision maker involved"
        },
        @{
            title = "Cloud Migration Project - StartupXYZ"
            value = 35000
            stage = "CLOSED_WON"
            priority = "MEDIUM"
            activities_count = 8
            contact = "Sarah Johnson"
            company = "StartupXYZ"
            pattern = "Quick decision cycle, clear ROI demonstrated"
        },
        # LOST Deals (unsuccessful patterns)
        @{
            title = "Consulting Services - BigCo"
            value = 75000
            stage = "CLOSED_LOST"
            priority = "LOW"
            activities_count = 3
            contact = "Mike Davis"
            company = "BigCo Industries"
            pattern = "Low engagement, pricing concerns, lack of follow-up"
        }
    )
    emailTemplates = @(
        @{
            stage = "QUALIFIED"
            context = "Post-demo follow-up"
            template = @"
Hi [Contact Name],

Thank you for taking the time to join our product demonstration yesterday. I hope you found it valuable and got a clear understanding of how our solution can address [specific pain point discussed].

As discussed, here are the key benefits for [Company Name]:
- [Benefit 1 specific to their needs]
- [Benefit 2 with quantifiable impact]
- [Benefit 3 addressing their concerns]

I've attached case studies from similar companies in your industry who achieved [specific result].

Would you be available for a brief call on [day] at [time] to discuss next steps and answer any questions?

Looking forward to hearing from you.

Best regards,
[Your Name]
"@
        },
        @{
            stage = "NEGOTIATION"
            context = "Proposal follow-up"
            template = @"
Hi [Contact Name],

I wanted to follow up on the proposal I sent last week for [Solution Name].

I understand you may have questions about pricing or implementation timeline. I'm happy to schedule a call to discuss:
- Flexible payment options
- Phased implementation approach  
- ROI projections specific to [Company Name]

Several of our clients started with a pilot program which gave them confidence before full commitment. Would this be of interest?

I'm available [specific times] this week. What works best for you?

Best regards,
[Your Name]
"@
        }
    )
    recommendations = @(
        @{
            stage = "LEAD"
            last_activity = "Initial contact"
            days_since_contact = 2
            action = "Schedule qualification call within 24-48 hours. Prepare discovery questions about business challenges and budget timeline."
        },
        @{
            stage = "QUALIFIED"
            last_activity = "Demo completed"
            days_since_contact = 1
            action = "Send follow-up email with case studies. Schedule pricing discussion within 3 business days while interest is high."
        },
        @{
            stage = "NEGOTIATION"
            last_activity = "Proposal sent"
            days_since_contact = 5
            action = "Immediate follow-up required. Call to address objections, offer trial period, or create urgency with time-limited incentive."
        }
    )
}

# Create data directory if it doesn't exist
$dataDir = "backend\data"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

# Save to JSON file
$outputPath = Join-Path $dataDir "ai-training-data.json"
$sampleData | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath

Write-Host "✅ Sample training data created!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Location: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Data includes:" -ForegroundColor Yellow
Write-Host "   ✓ 3 sample deals (2 WON, 1 LOST)" -ForegroundColor White
Write-Host "   ✓ 2 email templates for different stages" -ForegroundColor White
Write-Host "   ✓ 3 action recommendations for deal progression" -ForegroundColor White
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review the generated data in: backend\data\ai-training-data.json" -ForegroundColor White
Write-Host "   2. Run: cd backend" -ForegroundColor White
Write-Host "   3. Run: npx tsx scripts/format-training-data.ts" -ForegroundColor White
Write-Host "   4. Follow AI_INTEGRATION_GUIDE.md for fine-tuning with OpenAI" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: This is sample data. For best results:" -ForegroundColor Yellow
Write-Host "   - Add more real deals from your CRM (target: 100+ deals)" -ForegroundColor White
Write-Host "   - Include actual email content from successful deals" -ForegroundColor White
Write-Host "   - Export real activity patterns from your database" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
