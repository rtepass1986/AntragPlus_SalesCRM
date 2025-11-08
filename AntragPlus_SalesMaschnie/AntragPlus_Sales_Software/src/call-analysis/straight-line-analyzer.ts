/**
 * Straight Line Sales Call Analyzer
 * Based on Jordan Belfort's Straight Line Persuasion System
 * 
 * This analyzer evaluates sales calls against the core principles:
 * 1. The Three Tens (Product, Salesperson, Company certainty)
 * 2. Tonality and delivery
 * 3. Script adherence
 * 4. Objection handling
 * 5. Closing technique
 */

import { OpenAI } from 'openai';
import type {
  CallTranscript,
  StraightLineAnalysis,
  ObjectionEncountered,
  ObjectionCategory,
  ClosingTechnique,
} from '../types/call-recording-types';

export class StraightLineAnalyzer {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  /**
   * Analyze a sales call using Jordan Belfort's Straight Line System
   */
  async analyzeSalesCall(
    transcript: CallTranscript,
    recordingId: number,
    scriptType?: string
  ): Promise<Omit<StraightLineAnalysis, 'id' | 'createdAt'>> {
    console.log(`Analyzing call recording ${recordingId} using Straight Line methodology...`);
    
    // Step 1: Analyze the Three Tens
    const threeTens = await this.analyzeThreeTens(transcript);
    
    // Step 2: Analyze Tonality
    const tonality = await this.analyzeTonality(transcript);
    
    // Step 3: Analyze Script Adherence
    const scriptAnalysis = await this.analyzeScriptAdherence(transcript, scriptType);
    
    // Step 4: Analyze Rapport Building
    const rapport = await this.analyzeRapport(transcript);
    
    // Step 5: Analyze Discovery Phase
    const discovery = await this.analyzeDiscovery(transcript);
    
    // Step 6: Analyze Presentation
    const presentation = await this.analyzePresentation(transcript);
    
    // Step 7: Analyze Objection Handling
    const objections = await this.analyzeObjections(transcript);
    
    // Step 8: Analyze Closing
    const closing = await this.analyzeClosing(transcript);
    
    // Step 9: Generate Overall Analysis
    const overall = await this.generateOverallAnalysis(transcript, {
      threeTens,
      tonality,
      scriptAnalysis,
      rapport,
      discovery,
      presentation,
      objections,
      closing,
    });
    
    // Compile the complete analysis
    return {
      recordingId,
      
      // The Three Tens
      certaintyProduct: threeTens.product,
      certaintySalesperson: threeTens.salesperson,
      certaintyCompany: threeTens.company,
      
      // Tonality
      tonalityScore: tonality.overall,
      tonalityConfidence: tonality.confidence,
      tonalityEnthusiasm: tonality.enthusiasm,
      tonalityAuthenticity: tonality.authenticity,
      
      // Script
      scriptAdherenceScore: scriptAnalysis.adherenceScore,
      scriptType: scriptType,
      scriptSectionsCompleted: scriptAnalysis.sectionsCompleted,
      
      // Rapport
      rapportScore: rapport.score,
      mirroringDetected: rapport.mirroringDetected,
      activeListeningScore: rapport.listeningScore,
      
      // Discovery
      discoveryQuestionsAsked: discovery.questionsAsked,
      discoveryQualityScore: discovery.qualityScore,
      painPointsIdentified: discovery.painPoints,
      
      // Presentation
      presentationClarityScore: presentation.clarityScore,
      benefitsVsFeaturesRatio: presentation.benefitsRatio,
      valuePropositionStrength: presentation.valueScore,
      
      // Objections
      objectionsEncountered: objections.objections,
      objectionsHandledCount: objections.handledCount,
      objectionHandlingScore: objections.handlingScore,
      
      // Closing
      closingAttempts: closing.attempts,
      closingTechnique: closing.technique,
      closingSuccess: closing.success,
      
      // Overall
      overallStraightLineScore: overall.overallScore,
      conversionLikelihood: overall.conversionLikelihood,
      
      // AI Analysis
      aiSummary: overall.summary,
      strengths: overall.strengths,
      areasForImprovement: overall.improvements,
      keyQuotes: overall.keyQuotes,
      
      // Coaching
      coachingPoints: overall.coachingPoints,
      recommendedTraining: overall.recommendedTraining,
      
      analyzedBy: 'ai',
      aiModelVersion: 'gpt-4o',
    };
  }
  
  /**
   * Analyze The Three Tens
   * Core of Jordan Belfort's system - buyer needs 10/10 in all three to buy
   */
  private async analyzeThreeTens(transcript: CallTranscript): Promise<{
    product: number;
    salesperson: number;
    company: number;
  }> {
    const prompt = `Analyze this sales call transcript using Jordan Belfort's "Three Tens" framework.

THE THREE TENS:
1. Certainty in the PRODUCT/SERVICE (1-10)
   - Does the prospect understand what it does?
   - Do they believe it will solve their problem?
   - Are they convinced of its value?

2. Trust in the SALESPERSON (1-10)
   - Is the salesperson credible?
   - Does the prospect feel the rep has their best interests?
   - Is there genuine rapport?

3. Trust in the COMPANY (1-10)
   - Does the prospect trust the company?
   - Are they confident the company will deliver?
   - Do they perceive stability and reliability?

TRANSCRIPT:
${transcript.fullTranscript}

INSTRUCTIONS:
Analyze the transcript and rate each of the three tens from 1-10.
Provide evidence from the transcript for each score.

Respond in JSON format:
{
  "product": <score 1-10>,
  "productEvidence": "<specific quotes/moments>",
  "salesperson": <score 1-10>,
  "salespersonEvidence": "<specific quotes/moments>",
  "company": <score 1-10>,
  "companyEvidence": "<specific quotes/moments>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales coach trained in Jordan Belfort\'s Straight Line Persuasion System. Analyze sales calls objectively and provide actionable feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      product: analysis.product || 5,
      salesperson: analysis.salesperson || 5,
      company: analysis.company || 5,
    };
  }
  
  /**
   * Analyze Tonality
   * "It's not what you say, it's how you say it" - Jordan Belfort
   */
  private async analyzeTonality(transcript: CallTranscript): Promise<{
    overall: number;
    confidence: number;
    enthusiasm: number;
    authenticity: number;
  }> {
    const prompt = `Analyze the TONALITY of the salesperson in this call transcript.

Jordan Belfort teaches: "It's not what you say, it's how you say it."

Evaluate these tonality aspects (1-10 each):

1. CONFIDENCE
   - Does the salesperson sound certain and assured?
   - Are there hesitations, filler words, or uncertain language?
   - Do they sound like an expert?

2. ENTHUSIASM
   - Is there genuine excitement about the product?
   - Does the energy level match the conversation?
   - Is the enthusiasm authentic, not forced?

3. AUTHENTICITY
   - Does the salesperson sound genuine?
   - Are they being themselves or reciting a script robotically?
   - Is there real conversation happening?

TRANSCRIPT:
${transcript.fullTranscript}

Look for:
- Filler words (um, uh, like, you know)
- Confident language vs. weak language
- Question marks at end of statements (upspeak)
- Energy and pacing
- Natural conversation flow

Respond in JSON format:
{
  "confidence": <score 1-10>,
  "confidenceNotes": "<observations>",
  "enthusiasm": <score 1-10>,
  "enthusiasmNotes": "<observations>",
  "authenticity": <score 1-10>,
  "authenticityNotes": "<observations>",
  "overall": <average score>
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales tonality analysis, trained in Jordan Belfort\'s methodology.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      overall: analysis.overall || 5,
      confidence: analysis.confidence || 5,
      enthusiasm: analysis.enthusiasm || 5,
      authenticity: analysis.authenticity || 5,
    };
  }
  
  /**
   * Analyze Script Adherence
   */
  private async analyzeScriptAdherence(
    transcript: CallTranscript,
    scriptType?: string
  ): Promise<{
    adherenceScore: number;
    sectionsCompleted: {
      opening: boolean;
      rapport: boolean;
      discovery: boolean;
      presentation: boolean;
      objections: boolean;
      close: boolean;
    };
  }> {
    const prompt = `Analyze how well this sales call follows the Straight Line script structure.

STRAIGHT LINE SCRIPT STRUCTURE:
1. OPENING (First 4 seconds)
   - Strong, confident intro
   - Establish authority quickly

2. RAPPORT BUILDING (First 30-60 seconds)
   - Build connection
   - Find common ground
   - Not too long - get to business

3. DISCOVERY (3-5 minutes)
   - Ask qualifying questions
   - Identify pain points
   - Understand needs

4. PRESENTATION (5-10 minutes)
   - Present solution
   - Focus on BENEFITS not features
   - Tie back to pain points

5. OBJECTION HANDLING (As needed)
   - Loop back to certainty
   - Answer and re-close

6. CLOSING (Multiple attempts)
   - Ask for the sale
   - Use closing techniques
   - Persist professionally

TRANSCRIPT:
${transcript.fullTranscript}

Respond in JSON format:
{
  "opening": <true/false - was there a strong opening>,
  "rapport": <true/false - was rapport built>,
  "discovery": <true/false - were discovery questions asked>,
  "presentation": <true/false - was solution presented>,
  "objections": <true/false - were objections addressed>,
  "close": <true/false - was there a closing attempt>,
  "adherenceScore": <1-10 overall adherence>,
  "notes": "<observations>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in the Straight Line sales script methodology.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      adherenceScore: analysis.adherenceScore || 5,
      sectionsCompleted: {
        opening: analysis.opening || false,
        rapport: analysis.rapport || false,
        discovery: analysis.discovery || false,
        presentation: analysis.presentation || false,
        objections: analysis.objections || false,
        close: analysis.close || false,
      },
    };
  }
  
  /**
   * Analyze Rapport Building
   */
  private async analyzeRapport(transcript: CallTranscript): Promise<{
    score: number;
    mirroringDetected: boolean;
    listeningScore: number;
  }> {
    const prompt = `Analyze the RAPPORT BUILDING in this sales call.

Key elements of good rapport:
- Mirroring language/style of prospect
- Finding common ground
- Active listening
- Genuine interest
- Appropriate timing (not too long, not too short)

TRANSCRIPT:
${transcript.fullTranscript}

Respond in JSON format:
{
  "rapportScore": <1-10>,
  "mirroringDetected": <true/false>,
  "activeListeningScore": <1-10>,
  "observations": "<specific examples>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales rapport building and relationship development.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: analysis.rapportScore || 5,
      mirroringDetected: analysis.mirroringDetected || false,
      listeningScore: analysis.activeListeningScore || 5,
    };
  }
  
  /**
   * Analyze Discovery Phase
   */
  private async analyzeDiscovery(transcript: CallTranscript): Promise<{
    questionsAsked: number;
    qualityScore: number;
    painPoints: string[];
  }> {
    const prompt = `Analyze the DISCOVERY phase of this sales call.

Good discovery:
- Asks open-ended questions
- Identifies multiple pain points
- Understands current situation
- Uncovers emotional drivers
- Qualifies the prospect

TRANSCRIPT:
${transcript.fullTranscript}

Count the discovery questions and identify pain points.

Respond in JSON format:
{
  "questionsAsked": <count of discovery questions>,
  "qualityScore": <1-10 quality of questions>,
  "painPoints": ["<pain point 1>", "<pain point 2>", ...],
  "observations": "<notes>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales discovery and needs analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      questionsAsked: analysis.questionsAsked || 0,
      qualityScore: analysis.qualityScore || 5,
      painPoints: analysis.painPoints || [],
    };
  }
  
  /**
   * Analyze Presentation Phase
   */
  private async analyzePresentation(transcript: CallTranscript): Promise<{
    clarityScore: number;
    benefitsRatio: number;
    valueScore: number;
  }> {
    const prompt = `Analyze the PRESENTATION phase of this sales call.

Key principles:
- Focus on BENEFITS not features
- Tie benefits to discovered pain points
- Clear and simple language
- Paint a picture of the solution
- Benefits should outnumber features 3:1

TRANSCRIPT:
${transcript.fullTranscript}

Count benefits vs features mentioned.

Respond in JSON format:
{
  "clarityScore": <1-10>,
  "benefitsCount": <number>,
  "featuresCount": <number>,
  "benefitsVsFeaturesRatio": <benefits/features>,
  "valueScore": <1-10>,
  "observations": "<notes>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales presentations and value communication.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      clarityScore: analysis.clarityScore || 5,
      benefitsRatio: analysis.benefitsVsFeaturesRatio || 0,
      valueScore: analysis.valueScore || 5,
    };
  }
  
  /**
   * Analyze Objection Handling
   */
  private async analyzeObjections(transcript: CallTranscript): Promise<{
    objections: ObjectionEncountered[];
    handledCount: number;
    handlingScore: number;
  }> {
    const prompt = `Analyze OBJECTION HANDLING in this sales call.

Common objection categories:
- PRICE: "Too expensive"
- TIMING: "Not right now"
- AUTHORITY: "Need to check with someone"
- NEED: "Don't need it"
- TRUST: "Not sure about this"

Good objection handling:
- Listen fully
- Acknowledge
- Loop back to certainty
- Re-present value
- Re-close

TRANSCRIPT:
${transcript.fullTranscript}

Identify all objections and how they were handled.

Respond in JSON format:
{
  "objections": [
    {
      "timestamp": <estimated seconds>,
      "objectionType": "<price|timing|authority|need|trust>",
      "objectionText": "<what was said>",
      "response": "<how it was handled>",
      "responseQuality": <1-10>,
      "wasResolved": <true/false>
    }
  ],
  "handledCount": <number>,
  "overallHandlingScore": <1-10>,
  "observations": "<notes>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales objection handling.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      objections: analysis.objections || [],
      handledCount: analysis.handledCount || 0,
      handlingScore: analysis.overallHandlingScore || 5,
    };
  }
  
  /**
   * Analyze Closing
   */
  private async analyzeClosing(transcript: CallTranscript): Promise<{
    attempts: number;
    technique?: ClosingTechnique;
    success: boolean;
  }> {
    const prompt = `Analyze the CLOSING attempts in this sales call.

Closing techniques:
- Alternative Choice: "Would you prefer A or B?"
- Assumptive: "When should we get started?"
- Urgency: "This offer expires..."
- Takeaway: "Maybe this isn't for you..."
- Summary: "Based on everything we discussed..."
- Direct Ask: "Are you ready to move forward?"

Jordan Belfort teaches: Always ask for the sale. Multiple closing attempts are professional.

TRANSCRIPT:
${transcript.fullTranscript}

Count closing attempts and identify techniques used.

Respond in JSON format:
{
  "closingAttempts": <number>,
  "closingTechnique": "<technique name>",
  "closingSuccess": <true/false>,
  "observations": "<notes>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in sales closing techniques.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      attempts: analysis.closingAttempts || 0,
      technique: analysis.closingTechnique,
      success: analysis.closingSuccess || false,
    };
  }
  
  /**
   * Generate Overall Analysis and Coaching Recommendations
   */
  private async generateOverallAnalysis(
    transcript: CallTranscript,
    components: any
  ): Promise<{
    overallScore: number;
    conversionLikelihood: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    keyQuotes: any[];
    coachingPoints: any[];
    recommendedTraining: string[];
  }> {
    const prompt = `Generate an OVERALL ANALYSIS and COACHING RECOMMENDATIONS for this sales call.

Component Scores:
- Three Tens: Product ${components.threeTens.product}/10, Salesperson ${components.threeTens.salesperson}/10, Company ${components.threeTens.company}/10
- Tonality: ${components.tonality.overall}/10
- Script Adherence: ${components.scriptAnalysis.adherenceScore}/10
- Rapport: ${components.rapport.score}/10
- Discovery: ${components.discovery.qualityScore}/10
- Presentation: ${components.presentation.valueScore}/10
- Objection Handling: ${components.objections.handlingScore}/10
- Closing Attempts: ${components.closing.attempts}

TRANSCRIPT:
${transcript.fullTranscript.substring(0, 4000)}...

Provide:
1. Overall Straight Line score (1-10)
2. Conversion likelihood (1-10)
3. Executive summary (2-3 sentences)
4. Top 3-5 strengths
5. Top 3-5 areas for improvement
6. 2-3 key quotes with significance
7. Specific coaching points with priority
8. Recommended training modules

Respond in JSON format:
{
  "overallScore": <1-10>,
  "conversionLikelihood": <1-10>,
  "summary": "<executive summary>",
  "strengths": ["<strength 1>", ...],
  "areasForImprovement": ["<area 1>", ...],
  "keyQuotes": [
    {"timestamp": 0, "speaker": "sales_rep", "quote": "...", "significance": "..."}
  ],
  "coachingPoints": [
    {"area": "...", "observation": "...", "recommendation": "...", "priority": "high"}
  ],
  "recommendedTraining": ["module1", ...]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an elite sales coach trained in Jordan Belfort\'s Straight Line Persuasion System. Provide actionable, specific coaching feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      overallScore: analysis.overallScore || 5,
      conversionLikelihood: analysis.conversionLikelihood || 5,
      summary: analysis.summary || '',
      strengths: analysis.strengths || [],
      improvements: analysis.areasForImprovement || [],
      keyQuotes: analysis.keyQuotes || [],
      coachingPoints: analysis.coachingPoints || [],
      recommendedTraining: analysis.recommendedTraining || [],
    };
  }
}

