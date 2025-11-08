/**
 * AI Script Analyzer
 * Uses OpenAI to analyze call transcripts and suggest script improvements
 */

import OpenAI from 'openai'

export class ScriptAnalyzer {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Analyze a call transcript and extract key moments
   */
  async analyzeCallTranscript(transcript: string, dealContext?: any) {
    const prompt = `Analyze this sales call transcript and extract key information.

TRANSCRIPT:
${transcript}

${dealContext ? `DEAL CONTEXT: ${JSON.stringify(dealContext)}` : ''}

Provide a JSON response with:
1. summary: Brief overview of the call
2. keyMoments: Array of important moments with:
   - timestampEstimate: estimated seconds from start
   - type: 'objection' | 'question' | 'win' | 'next_step' | 'insight'
   - description: What happened
   - quote: Exact quote from transcript
3. objections: List of objections raised
4. winningPhrases: Phrases that worked well
5. actionItems: Next steps identified
6. sentiment: overall | positive | neutral | negative
7. recommendations: How to improve future calls

Return valid JSON only.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Compare transcript to existing script and suggest improvements
   */
  async compareAndSuggest(transcript: string, currentScript: string, successfulCall: boolean) {
    const prompt = `Compare this successful sales call to our current script and suggest improvements.

CURRENT SCRIPT:
${currentScript}

ACTUAL CALL (${successfulCall ? 'SUCCESSFUL - resulted in deal progression' : 'UNSUCCESSFUL'}):
${transcript}

Provide a JSON response with:
1. improvements: Array of suggested changes:
   - section: Which part of script
   - type: 'addition' | 'modification' | 'removal'
   - before: Current text
   - after: Suggested text
   - reason: Why this improves the script
   - confidence: 0.0-1.0
2. overallConfidence: Overall confidence in suggestions (0.0-1.0)
3. reasoning: Why these changes will improve performance

Focus on concrete, actionable improvements based on what actually worked in the call.

Return valid JSON only.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Optimize email template based on performance data
   */
  async optimizeEmailTemplate(
    currentTemplate: string,
    performanceData: {
      openRate: number
      responseRate: number
      successfulEmails: string[]
    }
  ) {
    const prompt = `Optimize this email template based on performance data.

CURRENT TEMPLATE:
${currentTemplate}

PERFORMANCE:
- Open Rate: ${performanceData.openRate}%
- Response Rate: ${performanceData.responseRate}%

SUCCESSFUL EXAMPLES:
${performanceData.successfulEmails.join('\n\n---\n\n')}

Provide a JSON response with:
1. improvements: Array of changes:
   - section: 'subject' | 'opening' | 'body' | 'cta' | 'closing'
   - before: Current text
   - after: Improved text
   - reason: Why this increases engagement
   - expectedImpact: 'high' | 'medium' | 'low'
2. confidence: 0.0-1.0
3. reasoning: Overall strategy for improvements

Return valid JSON only.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Analyze customer journey and suggest optimizations
   */
  async analyzeJourney(journeyData: any, wonDeals: any[], lostDeals: any[]) {
    const prompt = `Analyze this B2B sales customer journey and suggest optimizations.

CURRENT JOURNEY:
${JSON.stringify(journeyData, null, 2)}

WON DEALS DATA:
${JSON.stringify(wonDeals.slice(0, 10), null, 2)}

LOST DEALS DATA:
${JSON.stringify(lostDeals.slice(0, 10), null, 2)}

Provide a JSON response with:
1. suggestions: Array of improvements:
   - phase: Which journey phase (1-7)
   - type: 'add_touchpoint' | 'remove_stage' | 'optimize' | 'automate'
   - suggestion: What to do
   - reasoning: Why based on data
   - confidence: 0.0-1.0
   - impact: 'high' | 'medium' | 'low'
2. patterns: Patterns found in successful/unsuccessful deals
3. recommendations: Top 3 priority actions

Return valid JSON only.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }
}

export function createScriptAnalyzer(apiKey: string) {
  return new ScriptAnalyzer(apiKey)
}

