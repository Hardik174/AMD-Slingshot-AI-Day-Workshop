/**
 * @fileoverview Smart rule-engine logic for calculating base health scores
 * and extracting behavior insights from user contexts before initiating AI prompts.
 * Designed to deeply integrate with Indian cultural diet norms.
 */

/**
 * Calculates a baseline health score based on string matching against specific food descriptors.
 * Operates on a 1-10 numerical scale.
 * 
 * @param {string} lastMeal - Text descriptor of the last consumed meal. 
 * @param {string} time - Time string descriptor of meal consumption.
 * @returns {number} Score mapping between 1 and 10.
 */
export function calculateHealthScore(lastMeal, time) {
    let score = 7; // Baseline dynamic score
    const lowerMeal = lastMeal.toLowerCase();
    const lowerTime = time.toLowerCase();

    // -2: Severe Point Deduction for Heavy Junk/Fried Foods
    const junkKeywords = [
        'pizza', 'burger', 'fries', 'chips', 'soda', 'candy', 'cake', 'ice cream', 'fast food', 
        'samosa', 'vada pav', 'kachori', 'chole bhature', 'jalebi', 'pakora', 'bhujia', 'gulab jamun'
    ];
    if (junkKeywords.some(keyword => lowerMeal.includes(keyword))) {
        score -= 2;
    }

    // -2: Chrono-biological Point Deduction (Circadian impact on digestion)
    const lateNightKeywords = ['late night', 'midnight', '11pm', '12am', '1am', '2am', 'late', '11 pm', '12 am', '1 am'];
    if (lateNightKeywords.some(keyword => lowerTime.includes(keyword))) {
        score -= 2;
    }

    // +2: Point Rewarding for optimized clean eating choices
    const healthyKeywords = [
        'salad', 'salmon', 'chicken breast', 'vegetables', 'water', 'balanced', 'fruit', 
        'dal', 'paneer', 'khichdi', 'sprouts', 'roti', 'palak', 'millets', 'oats'
    ];
    if (healthyKeywords.some(keyword => lowerMeal.includes(keyword))) {
        score += 2;
    }

    // Restrict score inside physical 1-10 boundaries
    return Math.min(Math.max(score, 1), 10);
}

/**
 * Generates an array of strict behavioral insight strings mapping physical contexts and 
 * mental cues into actionable AI prompt context logic.
 * 
 * @param {string} goal - Physical objective (e.g. "Weight loss", "Muscle gain")
 * @param {string} lastMeal - Food previously consumed
 * @param {string} time - Current dietary window
 * @param {string} mood - Immediate emotional state
 * @param {string} activityLevel - Somatic baseline energy output
 * @param {string} waterIntake - Hydration levels tracker
 * @returns {string} Compiled AI insight constraints
 */
export function generateBehaviorInsight(goal, lastMeal, time, mood, activityLevel, waterIntake) {
    let insight = [];
    const lowerGoal = goal.toLowerCase();
    const lowerMeal = lastMeal.toLowerCase();
    const lowerTime = time.toLowerCase();
    const lowerMood = mood ? mood.toLowerCase() : '';
    const lowerActivity = activityLevel ? activityLevel.toLowerCase() : '';
    const lowerWater = waterIntake ? waterIntake.toLowerCase() : '';

    // Temporal context analysis
    if (lowerTime.includes('late')) {
        insight.push("Late night eating detected. Recommend digestable, light food.");
    }

    // Glycemic load versus kinetic output analysis
    const carbKeywords = ['pizza', 'burger', 'pasta', 'bread', 'rice', 'samosa', 'bhature'];
    const consumedHeavyCarbs = carbKeywords.some(carb => lowerMeal.includes(carb));

    if (consumedHeavyCarbs) {
        if (lowerActivity.includes('active') || lowerActivity.includes('athlete')) {
            insight.push("High carb intake detected, but acceptable given high absolute kinetic output. Suggest balanced protein for glycogen recovery mapping.");
        } else {
            insight.push("User consumed high carb density with sedentary background. Strongly emphasize lower calorie dense fiber and lean proteins to avoid energy crash.");
        }
    } else if (lowerMeal.includes('skip') || lowerMeal.includes('nothing')) {
        insight.push("User skipped a meal. Suggest a balanced systemic recovery meal without overcompensating on calories.");
    }

    // Directive goal mapping
    if (lowerGoal.includes('weight loss') || lowerGoal.includes('lose weight')) {
        insight.push("Goal strictly requires a stable caloric deficit. Prioritize volume-eating via Indian ingredients (low calorie dense).");
    }

    // Psychosomatic triggers
    if (lowerMood.includes('stress') || lowerMood.includes('anxious') || lowerMood.includes('sad')) {
        insight.push("Warning: Potential psychosomatic stress eating scenario. Suggest physically comforting but metabolically healthy alternatives, aggressively avoiding sugar crashes.");
    }

    // Hydration vector
    if (lowerWater.includes('less than') || lowerWater.includes('low')) {
        insight.push("Critical Deficit: User is underhydrated. Recommend water-dense foods (cucumber, watermelon) and emphasize drinking immediate fluids.");
    }

    // Safe return baseline
    return insight.length > 0 ? insight.join(" ") : "Stable pattern architecture. Maintain balance.";
}
