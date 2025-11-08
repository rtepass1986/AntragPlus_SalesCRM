# 🎯 Sales Call Recording Analysis System
## Based on Jordan Belfort's Straight Line Persuasion System

Complete AI-powered sales call analysis platform that evaluates your team's performance using the proven Straight Line methodology.

---

## 🌟 What This System Does

### Automated Call Analysis
- **Transcribes** recordings automatically (Firefly.ai or Google Drive)
- **Analyzes** every call using Jordan Belfort's Straight Line framework
- **Scores** performance across 15+ key metrics
- **Provides** specific coaching recommendations
- **Tracks** improvement over time

### The Three Tens Analysis ⭐⭐⭐
Core of Jordan Belfort's system - evaluates buyer certainty in:
1. **Product/Service** (1-10): Do they believe it solves their problem?
2. **Salesperson** (1-10): Do they trust the rep?
3. **Company** (1-10): Do they trust your business?

> **Belfort's Rule**: Buyer needs 10/10 in ALL THREE to buy

---

## 📋 Complete Feature Set

### 1. Call Analysis Metrics

#### **Tonality Analysis**
- Confidence level (1-10)
- Enthusiasm (1-10)
- Authenticity (1-10)
- Overall tonality score

> *"It's not what you say, it's how you say it"* - Jordan Belfort

#### **Script Adherence**
- Opening strength
- Rapport building quality
- Discovery phase completeness
- Presentation effectiveness
- Objection handling
- Closing attempts

#### **Discovery Phase**
- Number of questions asked
- Quality of questions (1-10)
- Pain points identified
- Emotional vs. logical drivers

#### **Presentation**
- Clarity score (1-10)
- Benefits vs. Features ratio (should be >1)
- Value proposition strength
- Tie-back to pain points

#### **Objection Handling**
- Objections encountered
- Response quality (1-10)
- Resolution rate
- Certainty loop-backs

#### **Closing**
- Number of closing attempts
- Closing techniques used
- Success rate

### 2. AI-Powered Insights

- **Executive Summary**: 2-3 sentence overview
- **Strengths**: Top 3-5 things done well
- **Areas for Improvement**: Specific actionable feedback
- **Key Quotes**: Notable moments with significance
- **Coaching Points**: Prioritized recommendations
- **Recommended Training**: Specific modules to improve

### 3. Integration Support

#### **Firefly.ai**
- Automatic webhook integration
- Real-time transcript fetching
- Meeting metadata sync
- Audio/video URL extraction

#### **Google Drive**
- Folder monitoring
- Automatic file discovery
- Multiple format support
- Webhook notifications

#### **Pipedrive CRM**
- Link recordings to deals
- Associate with contacts/orgs
- Track by sales rep
- Performance analytics

---

## 🚀 Setup Instructions

### 1. Database Setup

Run the schema to create all required tables:

```bash
cd /Users/roberttepass/Desktop/Agenti_Build/AntragPlus_SalesMaschnie/AntragPlus_Sales_Software

# Apply database schema
psql $DATABASE_URL -f src/shared/call-recording-schema.sql
```

This creates:
- `call_recordings` - Main recordings table
- `call_transcripts` - Transcripts with speaker segments
- `straight_line_analysis` - Detailed analysis results
- `call_scripts` - Your call scripts library
- `objections_library` - Common objections & responses
- `call_analytics` - Performance dashboards
- `coaching_sessions` - Coaching session tracking

### 2. Environment Variables

Add to your `.env` file:

```bash
# Call Analysis
OPENAI_API_KEY=your_openai_api_key_here
FIREFLY_API_KEY=your_firefly_api_key_here

# Google Drive (optional)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# Google Drive Folder ID where recordings are stored
RECORDINGS_FOLDER_ID=your_folder_id_here
```

### 3. Install Additional Dependencies

```bash
npm install googleapis openai
```

---

## 📖 Usage Guide

### Process a Firefly Recording

```bash
# Create a processing script
npm run call:process:firefly -- --meeting-id "MEETING_ID"
```

### Process Google Drive Recordings

```bash
# Scan folder and process new recordings
npm run call:process:gdrive -- --folder-id "FOLDER_ID"
```

### Manual Upload

```bash
# Upload and process a local recording
npm run call:upload -- --file "path/to/recording.mp3" --rep "Sales Rep Name"
```

### View Analysis

```bash
# Get analysis for a specific recording
npm run call:analysis -- --recording-id 123
```

### Generate Team Report

```bash
# Generate weekly report for a sales rep
npm run call:report -- --rep-id 1 --period "week"
```

---

## 🎓 Understanding the Scores

### The Three Tens (Most Important!)

| Score | Meaning | Action |
|-------|---------|--------|
| 9-10 | Excellent - Ready to buy | Close! |
| 7-8 | Good - Minor concerns | Address specific objections |
| 5-6 | Uncertain - Major gaps | Rebuild certainty, re-present |
| 1-4 | Poor - Not qualified | May not be a fit |

**All three tens must be 8+ before asking for the sale**

### Tonality Scores

| Score | Assessment |
|-------|-----------|
| 8-10 | Excellent tonality - confident, authentic, engaging |
| 6-7 | Good - minor improvements needed |
| 4-5 | Needs work - sounds uncertain or scripted |
| 1-3 | Poor - major tonality issues |

### Script Adherence

| Score | Assessment |
|-------|-----------|
| 9-10 | Perfect execution of Straight Line script |
| 7-8 | Good - hit most sections |
| 5-6 | Missed key sections |
| 1-4 | Didn't follow script structure |

### Conversion Likelihood

AI prediction of whether this call will convert:

| Score | Likelihood |
|-------|-----------|
| 9-10 | Very High - expect close |
| 7-8 | High - strong pipeline opportunity |
| 5-6 | Medium - needs follow-up |
| 3-4 | Low - major objections remain |
| 1-2 | Very Low - may not be qualified |

---

## 📊 Call Scripts Library

### Included Scripts (Jordan Belfort Methodology)

1. **Discovery Call** (`jordan-belfort-discovery-script.md`)
   - First call with prospect
   - Qualification focus
   - 15-20 minutes

2. **Demo/Presentation** (Coming soon)
   - Product demonstration
   - Benefit-focused
   - 30-45 minutes

3. **Closing Call** (Coming soon)
   - Final push to close
   - Objection handling
   - 20-30 minutes

4. **Follow-up** (Coming soon)
   - Re-engagement
   - Nurture relationship
   - 10-15 minutes

### Creating Custom Scripts

```typescript
// Example: Add a new script
const script = {
  scriptName: "Enterprise Discovery",
  scriptType: "discovery",
  scriptContent: "Your script content here...",
  scriptStructure: {
    sections: [
      {
        sectionName: "opening",
        sectionContent: "Hi [Name], this is...",
        expectedDurationSeconds: 30,
        keyPoints: ["Establish authority", "Get permission"],
        evaluationCriteria: [
          { criterion: "Strong confident opening", weight: 0.5 },
          { criterion: "Got permission to continue", weight: 0.5 }
        ]
      },
      // ... more sections
    ]
  }
};
```

---

## 🎯 Objections Library

The system tracks common objections and best responses:

### Common Objections Included:

1. **Price Objections**
   - "Too expensive"
   - "Not in the budget"
   - "Can you discount?"

2. **Timing Objections**
   - "Not right now"
   - "Call me next quarter"
   - "We're too busy"

3. **Authority Objections**
   - "I need to talk to my boss"
   - "The team needs to approve"
   - "Let me run this by [person]"

4. **Need Objections**
   - "We don't need this"
   - "Current solution works fine"
   - "Not a priority"

5. **Trust Objections**
   - "Never heard of you"
   - "Seems too good to be true"
   - "Can you prove this works?"

Each objection includes:
- Category
- Difficulty level
- Straight Line response
- Multiple response strategies
- Success rate tracking

---

## 📈 Analytics & Reporting

### Individual Rep Analytics

- Average scores across all metrics
- Trend analysis over time
- Strongest areas
- Biggest improvement opportunities
- Conversion rate
- Calls-to-close ratio

### Team Analytics

- Team-wide averages
- Top performers
- Training needs identification
- Script effectiveness
- Common objections
- Win rate by call type

### Coaching Dashboard

- Reps needing attention
- Specific coaching points
- Progress tracking
- Training assignment
- Follow-up scheduling

---

## 🛠️ API Endpoints (for custom integrations)

### Webhook Endpoints

```bash
# Firefly Webhook
POST /api/webhooks/firefly
Content-Type: application/json
{
  "event_type": "transcript_ready",
  "meeting_id": "abc123",
  ...
}

# Google Drive Webhook
POST /api/webhooks/google-drive
Content-Type: application/json
{
  "kind": "drive#change",
  "id": "channel-id",
  ...
}
```

### Analysis API

```bash
# Get analysis for recording
GET /api/analysis/:recordingId

# List recordings
GET /api/recordings?rep_id=1&start_date=2025-01-01

# Get team analytics
GET /api/analytics/team?period=week

# Get coaching recommendations
GET /api/coaching/:repId
```

---

## 🎓 Jordan Belfort's Straight Line Principles

### Core Concepts Implemented:

1. **The Straight Line**
   - Every sale follows a straight path
   - Your job: Keep prospect on the line
   - Don't get distracted by tangents

2. **The Three Tens**
   - Product certainty
   - Salesperson certainty
   - Company certainty
   - All must be 10/10 to close

3. **Tonality is Everything**
   - 90% of communication is tonality
   - Sound confident, certain, enthusiastic
   - Match and mirror prospect's energy

4. **Script Everything**
   - Have a script for every situation
   - Practice until it sounds natural
   - Scripts = consistency = results

5. **Objections are Opportunities**
   - Every objection means low certainty
   - Loop back to building certainty
   - Never argue, always agree then redirect

6. **Close, Close, Close**
   - Always ask for the sale
   - Multiple closing attempts are professional
   - Don't give up after first no

7. **Qualify Hard**
   - Don't waste time on unqualified leads
   - BANT: Budget, Authority, Need, Timeline
   - Better to disqualify early

---

## 🎬 Example Analysis Output

```json
{
  "recordingId": 123,
  "overallStraightLineScore": 8.5,
  "conversionLikelihood": 9.2,
  
  "threeTens": {
    "certaintyProduct": 9.0,
    "certaintySalesperson": 8.5,
    "certaintyCompany": 8.0
  },
  
  "tonality": {
    "overall": 8.7,
    "confidence": 9.0,
    "enthusiasm": 8.5,
    "authenticity": 8.5
  },
  
  "summary": "Excellent discovery call. Rep built strong rapport and identified 3 key pain points. Product certainty is high (9/10). Minor improvement needed on company certainty. Strong closing with 3 attempts.",
  
  "strengths": [
    "Asked 7 high-quality discovery questions",
    "Identified emotional and logical pain points",
    "Excellent tonality - confident and authentic",
    "Strong tie-back to pain points in presentation",
    "3 closing attempts with assumptive technique"
  ],
  
  "areasForImprovement": [
    "Build more company certainty - only mentioned 1 case study",
    "Talk ratio was 65/35 (should be 40/60)",
    "Missed opportunity to address timing objection earlier",
    "Could have looped back to certainty before final close"
  ],
  
  "coachingPoints": [
    {
      "area": "Company Certainty",
      "observation": "Only mentioned one client success story",
      "recommendation": "Prepare 3-4 relevant case studies. Use throughout call, not just in presentation.",
      "priority": "high"
    },
    {
      "area": "Talk Ratio",
      "observation": "Rep spoke 65% of the time vs. 35% for prospect",
      "recommendation": "Ask more open-ended questions. Let prospect talk more. Listen 60% of the time.",
      "priority": "medium"
    }
  ],
  
  "recommendedTraining": [
    "Building Company Certainty module",
    "Active Listening workshop",
    "Advanced Objection Handling"
  ]
}
```

---

## 🔧 Troubleshooting

### "No transcript found"
- Check Firefly API key is valid
- Ensure meeting has finished processing
- Verify webhook is properly configured

### "Low analysis scores"
- Review actual call recording
- Check if AI correctly identified speakers
- May need manual review for complex calls

### "Google Drive not syncing"
- Verify OAuth tokens are valid
- Check folder permissions
- Ensure folder ID is correct

---

## 📚 Additional Resources

### Training Materials
- Jordan Belfort's Straight Line Persuasion book
- Straight Line System training videos
- Sales coaching best practices

### Support
- Email: your-support-email
- Slack: #sales-coaching channel
- Wiki: Your internal wiki link

---

## 🚦 Next Steps

1. ✅ **Setup Database** - Run schema SQL
2. ✅ **Configure APIs** - Add environment variables
3. ⏳ **Process First Recording** - Test with a sample call
4. ⏳ **Review Analysis** - Check AI output quality
5. ⏳ **Train Team** - Share scripts and methodology
6. ⏳ **Schedule Coaching** - Use insights for 1-on-1s
7. ⏳ **Track Progress** - Monitor improvements over time

---

## 📊 Success Metrics to Track

- **Average Straight Line Score**: Target 8+
- **Average Three Tens**: Each should be 8+
- **Conversion Likelihood**: Target 7+
- **Script Adherence**: Target 8+
- **Closing Attempts per Call**: Target 2-3
- **Talk Ratio**: Target 40% rep, 60% prospect
- **Discovery Questions**: Target 5-7 per call

---

*"Sales is the greatest profession in the world, and the Straight Line is the greatest sales system ever created."* - Jordan Belfort

**Your team is now equipped with world-class sales analysis!** 🎯🚀

