import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ScamIndicator {
  id: string;
  type: string;
  detected: boolean;
  confidence: number;
  evidence?: string;
}

interface AnalysisResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  indicators: ScamIndicator[];
  guidance: string[];
  transcript?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, language = 'en' } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = transcript.toLowerCase().trim();

    // Rule-based fallback when no API key - works without Lovable
    if (!LOVABLE_API_KEY) {
      console.log('Using rule-based analysis (no LOVABLE_API_KEY)');
      const patterns: { id: string; keywords: string[]; weight: number }[] = [
        { id: 'impersonation', keywords: ['bank', 'bank se', 'from bank', 'rbi', 'government', 'police', 'tax department'], weight: 25 },
        { id: 'otp_request', keywords: ['otp', 'share otp', 'otp batao', 'pin', 'cvv', 'password'], weight: 30 },
        { id: 'urgency', keywords: ['immediately', 'urgent', 'account blocked', 'account will be blocked', 'act now'], weight: 25 },
        { id: 'authority', keywords: ['arrest', 'police', 'legal', 'case', 'fine'], weight: 20 },
        { id: 'money_request', keywords: ['transfer', 'upi', 'gift card', 'pay'], weight: 25 },
      ];
      const indicatorTypes = ['impersonation', 'urgency', 'emotional', 'authority', 'otp_request', 'money_request', 'voice_pattern'];
      let riskScore = 0;
      const indicators: ScamIndicator[] = indicatorTypes.map((type) => {
        const pattern = patterns.find((p) => p.id === type);
        const detected = pattern ? pattern.keywords.some((kw) => text.includes(kw)) : false;
        if (detected && pattern) riskScore += pattern.weight;
        return { id: type, type, detected, confidence: detected ? 0.85 : 0 };
      });
      riskScore = Math.min(100, riskScore);
      const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
      const result: AnalysisResult = {
        riskLevel,
        riskScore: riskLevel === 'high' ? Math.max(riskScore, 75) : riskScore,
        indicators,
        guidance: riskLevel === 'high' ? ['HIGH RISK - Do not share OTP. End call immediately.'] : riskLevel === 'medium' ? ['Be cautious. Verify caller identity.'] : ['Call appears safe.'],
      };
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Analyzing transcript:', transcript.substring(0, 200));
    console.log('Language:', language);

    const systemPrompt = `You are an expert scam detection AI for Indian phone scams. Analyze the transcript and detect scam indicators.

CRITICAL: These phrases ALWAYS indicate HIGH RISK (score 70-100):
- "calling from bank/bank se call" + OTP/password request
- "share your OTP/PIN/CVV" or "OTP batao/bhejo"
- "account will be blocked/suspended" + urgency
- Impersonating bank, police, government, tax department
- "act immediately", "do it now", "urgent"

Scam patterns to detect:
1. impersonation - Claims to be from bank, government, police, RBI, tax dept
2. urgency - "Act now", "immediate", "account will be blocked"
3. emotional - Fear, threats, fake emergencies
4. authority - Legal threats, arrest, fines
5. otp_request - Asking for OTP, PIN, CVV, password, codes
6. money_request - UPI, transfer, gift cards, bank details
7. voice_pattern - Call center, scripted speech

Respond ONLY with valid JSON in this exact format:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": 0-100,
  "indicators": [
    {"id": "impersonation", "type": "impersonation", "detected": true, "confidence": 0.9, "evidence": "quote"},
    {"id": "otp_request", "type": "otp_request", "detected": false, "confidence": 0, "evidence": ""}
  ],
  "guidance": ["action 1", "action 2"]
}

Scoring rules - BE STRICT:
- high (70-100): Bank/authority claim + OTP/account block/urgency = SCAM. Use "high" and score 75-95.
- medium (40-69): Suspicious but not clear scam
- low (0-35): Normal chat, greetings, no red flags

Include ALL 7 indicator types. Use lowercase for riskLevel. Provide guidance in language: ${language}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this phone conversation transcript for scam indicators:\n\n${transcript}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please check your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    if (!content || typeof content !== 'string') {
      console.error('Empty or invalid AI response:', aiResponse);
      throw new Error('AI did not return analysis');
    }
    console.log('AI response:', content.substring(0, 300));

    // Parse the JSON response
    let analysis: AnalysisResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to safe defaults
      analysis = {
        riskLevel: 'medium',
        riskScore: 50,
        indicators: [],
        guidance: ['Unable to fully analyze. Please be cautious.'],
      };
    }

    // Ensure all required indicator types are present
    const indicatorTypes = ['impersonation', 'urgency', 'emotional', 'authority', 'otp_request', 'money_request', 'voice_pattern'];
    const existingIds = new Set(analysis.indicators.map(i => i.id));
    
    for (const type of indicatorTypes) {
      if (!existingIds.has(type)) {
        analysis.indicators.push({
          id: type,
          type: type,
          detected: false,
          confidence: 0,
        });
      }
    }

    console.log('Final analysis:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-scam function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
