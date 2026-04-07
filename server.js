import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Calculate Health Score based on logic rules
function calculateHealthScore(lastMeal, time) {
    let score = 7;
    const lowerMeal = lastMeal.toLowerCase();
    const lowerTime = time.toLowerCase();

    // -2 if junk food
    const junkKeywords = ['pizza', 'burger', 'fries', 'chips', 'soda', 'candy', 'cake', 'ice cream', 'fast food', 'samosa', 'vada pav', 'kachori', 'chole bhature', 'jalebi', 'pakora', 'bhujia', 'gulab jamun'];
    if (junkKeywords.some(keyword => lowerMeal.includes(keyword))) {
        score -= 2;
    }

    // -2 if late night
    const lateNightKeywords = ['late night', 'midnight', '11pm', '12am', '1am', '2am', 'late', '11 pm', '12 am', '1 am'];
    if (lateNightKeywords.some(keyword => lowerTime.includes(keyword))) {
        score -= 2;
    }

    // +2 if balanced
    const healthyKeywords = ['salad', 'salmon', 'chicken breast', 'vegetables', 'water', 'balanced', 'fruit', 'dal', 'paneer', 'khichdi', 'sprouts', 'roti', 'palak', 'millets', 'oats'];
    if (healthyKeywords.some(keyword => lowerMeal.includes(keyword))) {
        score += 2;
    }

    return Math.min(Math.max(score, 1), 10);
}

// Generate Behavior Insight based on rules
function generateBehaviorInsight(goal, lastMeal, time, mood, activityLevel) {
    let insight = [];
    const lowerGoal = goal.toLowerCase();
    const lowerMeal = lastMeal.toLowerCase();
    const lowerTime = time.toLowerCase();
    const lowerMood = mood ? mood.toLowerCase() : '';
    const lowerActivity = activityLevel ? activityLevel.toLowerCase() : '';

    if (lowerTime.includes('late')) {
        insight.push("Late night eating detected. Recommend digestable, light food.");
    }

    if (lowerMeal.includes('pizza') || lowerMeal.includes('burger') || lowerMeal.includes('pasta') || lowerMeal.includes('bread') || lowerMeal.includes('rice') || lowerMeal.includes('samosa') || lowerMeal.includes('bhature')) {
        if (lowerActivity.includes('active') || lowerActivity.includes('athlete')) {
            insight.push("High carb intake detected, but acceptable given high activity level. Suggest balanced protein for recovery.");
        } else {
            insight.push("User consumed high carbs recently. Emphasize protein and fiber.");
        }
    } else if (lowerMeal.includes('skip') || lowerMeal.includes('nothing')) {
        insight.push("User skipped a meal. Suggest a balanced recovery meal without overcompensating.");
    }

    if (lowerGoal.includes('weight loss') || lowerGoal.includes('lose weight')) {
        insight.push("Goal requires calorie deficit. Prioritize volume-eating and lower calorie dense foods.");
    }

    if (lowerMood.includes('stress') || lowerMood.includes('anxious') || lowerMood.includes('sad')) {
        insight.push("Potential stress eating scenario. Suggest comforting but healthy alternatives, avoiding sugar crashes.");
    }

    return insight.length > 0 ? insight.join(" ") : "Normal eating pattern. Maintain balance.";
}

app.post('/api/coach', async (req, res) => {
    try {
        const { goal, lastMeal, time, mood, dietPreference, activityLevel } = req.body;

        if (!goal || !lastMeal || !time) {
            return res.status(400).json({ error: "Goal, last meal, and time are required." });
        }

        // --- SMART LOGIC LAYER ---
        const healthScore = calculateHealthScore(lastMeal, time);
        const behaviorInsight = generateBehaviorInsight(goal, lastMeal, time, mood, activityLevel);

        // --- AI LAYER ---
        const prompt = `You are a smart nutrition assistant who specializes in Indian health and nutrition.

User context:
- Goal: ${goal}
- Dietary Preference: ${dietPreference || "Not specified"}
- Activity Level: ${activityLevel || "Not specified"}
- Last meal: ${lastMeal}
- Time: ${time}
- Mood: ${mood || "Not specified"}
- Behavior insight: ${behaviorInsight}
- Calculated Health Score: ${healthScore} / 10

Tasks:
1. Suggest next meal (Strictly align with Indian cuisines, using local ingredients and realistic Indian household dishes like Dal, Roti, Sabzi, Paneer, Chicken Tikka, Upma, Poha, etc. MUST respect the Dietary Preference)
2. Explain WHY (based on health logic)
3. Give a small habit improvement tip
4. Provide a healthy "Swap Suggestion" ("Instead of X -> try Y" using Indian foods)

Respond strictly in the following JSON format without any markdown wrappers or code block identifiers (just the raw JSON string):
{
  "suggestedMeal": "Meal suggestion here",
  "reason": "Why this meal is suggested",
  "healthScore": ${healthScore},
  "tip": "Short habit tip",
  "swapSuggestion": "Instead of X -> try Y"
}`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        
        // Clean up markdown in case the model returns it
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        let aiResponse;
        try {
            aiResponse = JSON.parse(rawText);
        } catch (e) {
            console.error("JSON parsing failed. Raw response:", rawText);
            throw new Error("Failed to parse AI response into JSON.");
        }

        res.json(aiResponse);

    } catch (error) {
        console.error("Error in /api/coach:", error);
        res.status(500).json({ error: "An error occurred while communicating with the AI." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
