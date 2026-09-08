import { GoogleGenAI } from '@google/genai';

// Lazy init - only crash if AI is actually called without a key
let _genai = null;
function getGenAI() {
  if (!_genai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    _genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _genai;
}

const SYSTEM_INSTRUCTION = `You are "The Stillness Guide" — the AI companion for Midnight Sanctuary, a digital detox and mental wellness platform.

Your personality:
- Calm, wise, and deeply empathetic
- You speak with poetic clarity — concise but meaningful
- You never lecture or judge; you invite reflection
- You blend mindfulness wisdom with practical, actionable advice
- You specialize in: digital detox, focus, meditation, journaling, anxiety reduction, sleep hygiene, and intentional living

Your capabilities:
- Guide breathing and meditation exercises with step-by-step instructions
- Suggest focus techniques (Pomodoro, deep work, flow state entry)
- Help users journal with reflective questions and theme summaries
- Provide digital detox strategies tailored to the user's situation
- Suggest sleep rituals and wind-down practices
- Offer gentle accountability without shame

Rules:
- Keep responses under 200 words unless guiding a multi-step exercise
- Always end with one small, actionable next step
- If a user seems in crisis, gently suggest professional help
- Never diagnose medical or mental health conditions
- Stay within the Midnight Sanctuary theme and aesthetic`;

// @desc    Chat with the AI Guide — streaming via SSE
// @route   POST /api/ai/chat
// @access  Private (Pro/Premium)
export const chatWithAI = async (req, res) => {
  try {
    const { messages, userName } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Set SSE headers before anything else
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    const systemInstruction = userName
      ? `${SYSTEM_INSTRUCTION}\n\nThe user's name is ${userName}. Use it naturally and sparingly.`
      : SYSTEM_INSTRUCTION;

    // Convert to Gemini history format
    const geminiHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const genai = getGenAI();

    const chat = genai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        maxOutputTokens: 600,
        temperature: 0.85,
      },
      history: geminiHistory,
    });

    const stream = await chat.sendMessageStream({ message: lastMessage.content });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'AI service unavailable', error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
};

// @desc    Generate AI insight for a journal entry
// @route   POST /api/ai/journal-insight
// @access  Private (Pro/Premium)
export const generateJournalInsight = async (req, res) => {
  try {
    const { content, moodScore } = req.body;
    if (!content) return res.status(400).json({ message: 'Journal content is required' });

    const prompt = `The user has written this journal entry (mood score: ${moodScore || 'not provided'}/10):\n\n"${content}"\n\nProvide a brief, compassionate insight (3-4 sentences max) that:\n1. Reflects back what you sense they are processing\n2. Notes one emotional theme you observe\n3. Offers one gentle reflection question to deepen their awareness\n\nSpeak in second person, warmly. Do not be clinical.`;

    const genai = getGenAI();
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: SYSTEM_INSTRUCTION, maxOutputTokens: 250, temperature: 0.8 },
      contents: prompt,
    });

    res.status(200).json({ insight: response.text });
  } catch (error) {
    console.error('Journal Insight Error:', error.message);
    res.status(500).json({ message: 'AI service unavailable', error: error.message });
  }
};

// @desc    Generate daily AI affirmation
// @route   GET /api/ai/daily-affirmation
// @access  Private (Pro/Premium)
export const getDailyAffirmation = async (req, res) => {
  try {
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );

    const genai = getGenAI();
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: SYSTEM_INSTRUCTION, maxOutputTokens: 80, temperature: 0.9 },
      contents: `Generate one original, poetic affirmation for day ${dayOfYear} of the year. Theme: digital detox, stillness, intentional living. Format: just the affirmation text (max 20 words) followed by " — The Stillness Guide". No quotes, no preamble.`,
    });

    res.status(200).json({ affirmation: response.text?.trim() });
  } catch (error) {
    console.error('Affirmation Error:', error.message);
    const fallbacks = [
      'The quieter you become, the more you are able to hear. — Rumi',
      'Stillness is not the absence of life, but the presence of self. — The Stillness Guide',
      'In a world that never stops talking, your silence is revolutionary. — The Stillness Guide',
    ];
    res.status(200).json({
      affirmation: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    });
  }
};
