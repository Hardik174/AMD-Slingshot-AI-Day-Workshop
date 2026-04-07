import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Modular imported logic hooks
import { calculateHealthScore, generateBehaviorInsight } from './utils/smartLogic.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- SECURITY PROTOCOLS ---
// Helmet automatically shields standard Express HTTP Headers vulnerabilities
app.use(helmet()); 

// Rate limit: Max 10 requests per minute from any IP to prevent API cost overages
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 10,
    message: { error: "Too many requests to the Food Coach API, please try again in a minute." }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/coach', apiLimiter);

// --- GOOGLE SDK INITIALIZATION ---
// Using advanced capabilities: Explicit Schema Mapping guarantees JSON safety vs Regex string matching
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        suggestedMeal: {
            type: SchemaType.STRING,
            description: "The name of the Indian meal recommendation."
        },
        reason: {
            type: SchemaType.STRING,
            description: "Detailed logic determining why the meal aligns with user context."
        },
        healthScore: {
            type: SchemaType.INTEGER,
            description: "The dynamic health score calculation matching the provided prompt score."
        },
        tip: {
            type: SchemaType.STRING,
            description: "A small, actionable habit improvement tip."
        },
        swapSuggestion: {
            type: SchemaType.STRING,
            description: "A 'Instead of X -> try Y' structured swap for an Indian ingredient/meal."
        },
        hydrationWarning: {
            type: SchemaType.STRING,
            description: "Actionable hydration warning if their current intake is low."
        }
    },
    required: ["suggestedMeal", "reason", "healthScore", "tip", "swapSuggestion", "hydrationWarning"]
};

// Bind configuration explicitly to output application/json mapping to schema
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
});

// --- API ROUTE CONTROLLER ---
app.post('/api/coach', async (req, res) => {
    try {
        const { goal, lastMeal, time, mood, dietPreference, activityLevel, waterIntake } = req.body;

        // Basic Security Validation for bad actors bypassing frontend limits
        if (!goal || !lastMeal || !time) {
            return res.status(400).json({ error: "Required fields (goal, lastMeal, time) missing." });
        }

        // --- SMART LOGIC LAYER ---
        const healthScore = calculateHealthScore(lastMeal, time);
        const behaviorInsight = generateBehaviorInsight(goal, lastMeal, time, mood, activityLevel, waterIntake);

        // --- AI PROMPT INJECTION LAYER ---
        const prompt = `You are a smart nutrition assistant who specializes in Indian health and nutrition.

Contextual Data Payload:
- Objective Goal: ${goal}
- Dietary Preference Boundary: ${dietPreference || "Not specified"}
- Total Somatic Activity Level: ${activityLevel || "Not specified"}
- Fluid Intake Marker: ${waterIntake || "Not specified"}
- Historical Input (Last meal): ${lastMeal}
- Chronological State (Time): ${time}
- Emotional State (Mood): ${mood || "Not specified"}
- Backend Computed Behavior Insight: ${behaviorInsight}
- Calculated Base Health Score: ${healthScore} / 10

Tasks:
1. Suggest next meal (Strictly align with Indian cuisines, using local ingredients. MUST strictly respect the Dietary Preference. MUST incorporate the 'Backend Computed Behavior Insight').
2. Explain WHY based strictly on nutritional logic and the user's objective goal.
3. Provide an isolated Indian habit improvement tip.
4. Calculate a structured "Swap Suggestion" ("Instead of X -> try Y" using Indian foods).
5. Add a "hydrationWarning" if the Fluid Intake Marker mentions "Less than". Otherwise just say "Hydration on track."

The output is locked to JSON schema generation. Use valid strings. Keep output clean.`;

        // Direct Generation
        const result = await model.generateContent(prompt);
        
        // Native parse due to JSON strictness constraint
        const rawText = result.response.text();
        const aiResponse = JSON.parse(rawText);

        res.json(aiResponse);

    } catch (error) {
        console.error("Critical Route Error in /api/coach:", error);
        res.status(500).json({ error: "Internal AI processing error. Details kept secure." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running securely on port ${PORT}`);
});
