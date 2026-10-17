import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize Google GenAI client if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log('[AI Engine] Gemini API client initialized with server credentials');
    } catch (e) {
      console.warn('[AI Engine] Could not initialize GoogleGenAI client:', e);
    }
  } else {
    console.log('[AI Engine] No GEMINI_API_KEY configured; server will signal fallback to rule engine');
  }

  // API endpoint for converting structured alert into short actionable recommendation
  app.post('/api/recommendation', async (req, res) => {
    try {
      const { riskTier, riskScore, primaryEvent, topSignals, currentValues } = req.body;

      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API not configured on server',
          fallback: true,
        });
      }

      const prompt = `You are an expert mission-critical control-room advisor on an industrial supervisory team.
An anomaly has been detected in a live sensor stream:
- Anomaly Event: ${primaryEvent || 'Elevated Risk'}
- Risk Tier: ${riskTier} (Risk Index: ${riskScore}/100)
- Measured Values: Temperature=${currentValues?.temperature_c}°C, Vibration=${currentValues?.vibration_g}g, Pressure=${currentValues?.pressure_kpa}kPa
- Top Contributing Signals: ${JSON.stringify(topSignals || [])}

Generate exactly ONE concise, decisive, authoritative recommendation sentence (under 25 words) instructing the operator on the immediate physical action to take to stabilize the system. Do not use markdown, quotes, bullet points, or pleasantries.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a decisive industrial safety advisor. Produce exactly one direct, practical imperative action sentence for the human operator.',
        },
      });

      const recommendation = response.text?.trim() || '';
      return res.json({
        recommendation,
        source: 'gemini-3.8-flash',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[API Error] Gemini generation failed:', errorMsg);
      return res.status(500).json({
        error: errorMsg,
        fallback: true,
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      geminiAvailable: Boolean(ai),
      uptime: process.uptime(),
    });
  });

  // Mount Vite in dev mode or serve static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live Decision Support Dashboard running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
