document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('coachForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    
    // Result elements
    const formSection = document.querySelector('.form-section');
    const resultCard = document.getElementById('resultCard');
    const healthScoreBadge = document.getElementById('healthScoreBadge');
    const healthScoreVal = document.getElementById('healthScoreVal');
    const suggestedMeal = document.getElementById('suggestedMeal');
    const reasonText = document.getElementById('reasonText');
    const swapText = document.getElementById('swapText');
    const tipText = document.getElementById('tipText');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Form Data
        const goal = document.getElementById('goal').value;
        const lastMeal = document.getElementById('lastMeal').value;
        const time = document.getElementById('time').value;
        const mood = document.getElementById('mood').value;
        const dietPreference = document.getElementById('dietPreference').value;
        const activityLevel = document.getElementById('activityLevel').value;

        // UI Loading State
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ goal, lastMeal, time, mood, dietPreference, activityLevel })
            });

            if (!response.ok) {
                throw new Error("Failed to fetch advice.");
            }

            const data = await response.json();

            // Populate Results
            healthScoreVal.textContent = data.healthScore;
            suggestedMeal.textContent = data.suggestedMeal;
            reasonText.textContent = data.reason;
            swapText.textContent = data.swapSuggestion;
            tipText.textContent = data.tip;

            // Health badge styling based on score
            if (data.healthScore >= 8) {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)';
            } else if (data.healthScore >= 5) {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
            }

            // Switch Views
            formSection.classList.add('hidden');
            resultCard.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert("Something went wrong! Please ensure the backend is running and the API key is configured.");
        } finally {
            // Revert Loading State
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', () => {
        resultCard.classList.add('hidden');
        formSection.classList.remove('hidden');
        form.reset();
    });
});
