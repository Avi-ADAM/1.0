// src/routes/negotiation/api/analyze/+server.js
// AI endpoint — powered by Groq (free credits, fast inference)

import { json } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

// llama-3.3-70b-versatile is free-tier, fast, and handles JSON well
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt, userMessage) {
  const response = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,       // lower = more consistent JSON
      max_tokens: 2000,
      response_format: { type: 'json_object' },   // Groq supports this!
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // response_format: json_object guarantees clean JSON — but strip fences just in case
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean);
}

// ──────────────────────────────────────────────────────────────
// POST /negotiation/api/analyze
// body: { action, topic, positions, newPosition, userPosition, currentRound }
// ──────────────────────────────────────────────────────────────
export async function POST({ request }) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {

      // ── 1. Place a new position on the 0-100 axis ──────────────
      case 'analyze_position': {
        const { topic, positions, newPosition } = body;

        const existingPositions = positions.length
          ? positions
              .map((p, i) => `Position ${i + 1} (${p.author}, location ${p.location}): ${p.heading} — ${p.description}`)
              .join('\n')
          : 'No existing positions yet.';

        const result = await callGroq(
          `You are a discussion analyst. You help people understand their positions relative to others.
Always return valid JSON only, no extra text.`,
          `Discussion topic: "${topic}"

Existing positions:
${existingPositions}

New position to analyze:
Title: ${newPosition.heading}
Description: ${newPosition.description}
return the texts in the same language as the input
Return JSON:
{
  "location": <number 0-100, 0=very conservative/traditional, 100=very progressive/liberal>,
  "locationRationale": "<brief explanation for the location>",
  "keyDimensions": [
    { "name": "<dimension name>", "stance": "<user's stance>", "score": <0-100> }
  ],
  "sharedGroundWith": [<indices of positions with common ground>],
  "suggestedClarifications": ["<question to sharpen position>"]
}`
        );

        return json({ success: true, data: result });
      }

      // ── 2. Extract & compare dimensions across all positions ───
      case 'extract_dimensions': {
        const { topic, positions } = body;

        const posText = positions
          .map((p, i) => `Position ${i + 1} (${p.author}): ${p.heading} — ${p.description}`)
          .join('\n\n');

        const result = await callGroq(
          `You are a discussion analyst. Extract key dimensions for comparing positions.
Always return valid JSON only, no extra text.`,
          `Discussion topic: "${topic}"

All positions:
${posText}

Find the main dimensions where positions differ.
Return JSON:
{
  "dimensions": [
    {
      "id": "dim_1",
      "name": "<dimension name>",
      "description": "<short description>",
      "leftLabel": "<left extreme>",
      "rightLabel": "<right extreme>",
      "positionStances": {
        "0": { "stance": "<position[0] stance>", "score": <0-100> },
        "1": { "stance": "<position[1] stance>", "score": <0-100> }
      }
    }
  ],
  "consensusZones": ["<area of broad agreement>"],
  "conflictZones": ["<area of sharp disagreement>"],
  "overallConsensusScore": <0-100>
}`
        );

        return json({ success: true, data: result });
      }

      // ── 3. Per-user AI feedback before next round ───────────────
      case 'round_feedback': {
        const { topic, positions, userPosition, currentRound } = body;

        const allPos = positions
          .map((p, i) => `[${i}] ${p.author} (location ${p.location}, ${p.votes} supports): ${p.heading} — ${p.description}`)
          .join('\n');

        const result = await callGroq(
          `You are a strategic advisor for discussions and disputes. Help participants reach consensus
without abandoning their core values. Return valid JSON only, no extra text.`,
          `Topic: "${topic}"
Current round: ${currentRound}

All positions:
${allPos}

User's current position:
${userPosition.heading} — ${userPosition.description}
Location: ${userPosition.location}
Supports received: ${userPosition.votes}
return the texts in the same language as the input
Provide personal feedback:
{
  "summary": "<brief description of their position vs the group>",
  "strengths": ["<strength>"],
  "bridgeOpportunities": [
    {
      "withPosition": <index>,
      "author": "<name>",
      "commonGround": "<what is shared>",
      "proposedBridge": "<wording that could unite>"
    }
  ],
  "refinementSuggestions": ["<suggestion to attract more support>"],
  "predictedImpact": "<what will happen if they adopt suggestions>",
  "consensusMoveDirection": <-1 left, 0 stay, 1 right>,
  "consensusMoveAmount": <how many units>
}`
        );

        return json({ success: true, data: result });
      }

      // ── 4. Suggest dimensions when topic is entered ─────────────
      case 'suggest_dimensions': {
        const { topic } = body;

        const result = await callGroq(
          `You are an expert in managing discussions. Return valid JSON only, no extra text.`,
          `Discussion topic: "${topic}"
return the texts in the same language as the input

Suggest 4-6 key dimensions/aspects worth discussing.
{
  "suggestedDimensions": [
    { "name": "<dimension name>", "question": "<question to ask yourself>", "examples": ["<one extreme>", "<other extreme>"] }
  ],
  "context": "<general context for the discussion>"
}`
        );

        return json({ success: true, data: result });
      }

      default:
        return json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

  } catch (err) {
    console.error('AI analyze error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}