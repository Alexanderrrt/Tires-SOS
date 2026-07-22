import { jsonAiClient as client } from "./ai-json-client.js";

/**
 * Generate ad variations using Claude AI
 * Creates bilingual (EN/ES) ad copy for testing
 */
export async function generateAdVariations(serviceType, targetAudience) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert ad copywriter for Tires SOS Rescue, a tire shop in San José, CA.

Generate 5 high-converting ad variations for the following:

Service Type: ${serviceType}
Target Audience: ${targetAudience}
Budget: $500/month total
Goal: Drive phone calls, bookings, and store visits

For EACH variation, provide:
1. English Headline (max 30 characters, compelling, action-oriented)
2. Spanish Headline (max 30 characters, compelling, action-oriented)
3. English Description (max 90 characters, benefit-focused)
4. Spanish Description (max 90 characters, benefit-focused)
5. Call-to-Action (short, urgent)
6. Recommended audience insight (who this ad works best for)

Make them different in tone and angle. One should be price-focused, one urgency-focused, one quality-focused, one trust-focused, one convenience-focused.

Return as valid JSON array only, no other text.

Example structure:
[
  {
    "id": 1,
    "type": "price",
    "en_headline": "Tire Sale: 40% OFF This Week",
    "es_headline": "Venta de Llantas: 40% DESCUENTO",
    "en_description": "Best prices in San José. Professional installation. Free alignment check.",
    "es_description": "Los mejores precios. Instalación profesional. Revisión de alineación gratis.",
    "cta": "Call Now: (408) 332-8962",
    "audience": "Price-conscious shoppers, budget-aware"
  }
]`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating ad variations:", error);
    throw error;
  }
}

/**
 * Generate landing page copy based on ad performance
 */
export async function generateLandingPageCopy(adPerformance) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Create a short landing page copy for Tires SOS Rescue based on this ad performance:

Winning Ad Headline: "${adPerformance.headline}"
Click-Through Rate: ${adPerformance.ctr}%
Conversions: ${adPerformance.conversions}
Target Audience: ${adPerformance.audience}

Write compelling, bilingual (EN/ES) landing page copy that:
1. Matches the ad headline tone
2. Emphasizes the benefit the audience wants
3. Includes a clear call-to-action
4. Is optimized for phone/mobile

Return as JSON:
{
  "en_headline": "...",
  "es_headline": "...",
  "en_body": "...",
  "es_body": "...",
  "en_cta": "...",
  "es_cta": "..."
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse landing page response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating landing page copy:", error);
    throw error;
  }
}

/**
 * Analyze ad performance and recommend optimizations
 */
export async function analyzeAdPerformance(performanceData) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this tire shop ad performance and provide actionable recommendations:

Google Ads:
- Spend: $${performanceData.google.spend}
- Conversions: ${performanceData.google.conversions}
- CTR: ${performanceData.google.ctr}%
- CPC: $${performanceData.google.avgCpc}
- ROAS: ${performanceData.google.roas}x

Meta Ads:
- Spend: $${performanceData.meta.spend}
- Conversions: ${performanceData.meta.conversions}
- CTR: ${performanceData.meta.ctr}%
- CPC: $${performanceData.meta.avgCpc}
- ROAS: ${performanceData.meta.roas}x

Yelp Ads (no public API for spend/CPC — figures are manually entered by the owner):
- Spend: $${performanceData.yelp.spend}
- Conversions: ${performanceData.yelp.conversions ?? "unknown"}
- CPC: ${performanceData.yelp.avgCpc != null ? `$${performanceData.yelp.avgCpc}` : "unknown"}

Total Budget: $500/month

Provide recommendations as JSON:
{
  "budget_reallocation": {
    "google": number,
    "meta": number,
    "yelp": number,
    "reason": "string"
  },
  "actions": ["action1", "action2", ...],
  "pause_keywords": ["kw1", "kw2", ...],
  "test_variations": ["variation1", "variation2", ...]
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse analysis response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error analyzing ad performance:", error);
    throw error;
  }
}
