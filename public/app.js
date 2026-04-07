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
    const hydrationText = document.getElementById('hydrationText');
    const hydrationContainer = document.getElementById('hydrationContainer');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Form Data Extraction mapping entirely to the new UI bounds
        const payload = {
            goal: document.getElementById('goal').value,
            lastMeal: document.getElementById('lastMeal').value,
            time: document.getElementById('time').value,
            mood: document.getElementById('mood').value,
            dietPreference: document.getElementById('dietPreference').value,
            activityLevel: document.getElementById('activityLevel').value,
            waterIntake: document.getElementById('waterIntake').value
        };

        // UI Loading State (Accessible loading indicator manipulation)
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // If the rate limit hits, it will throw a readable text body message
                const errorCheck = await response.json().catch(() => null);
                throw new Error(errorCheck?.error || "Failed to fetch AI coaching logic.");
            }

            const data = await response.json();

            // Populate the DOM synchronously
            healthScoreVal.textContent = data.healthScore;
            suggestedMeal.textContent = data.suggestedMeal;
            reasonText.textContent = data.reason;
            swapText.textContent = data.swapSuggestion;
            tipText.textContent = data.tip;

            // Conditional Hydration formatting
            if(data.hydrationWarning) {
                hydrationText.textContent = data.hydrationWarning;
                hydrationContainer.style.display = "block";
                
                // Extra visual cue if it's a severe warning mapping to the 'low water' inputs
                if(data.hydrationWarning.toLowerCase().includes("dehydrat") || payload.waterIntake.includes("Less than")) {
                    hydrationContainer.style.borderLeft = "4px solid #ef4444";
                } else {
                    hydrationContainer.style.borderLeft = "4px solid #10b981";
                }
            } else {
                hydrationContainer.style.display = "none";
            }

            // Health badge aesthetic styling mapping dynamically into the AI calculation
            if (data.healthScore >= 8) {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)';
            } else if (data.healthScore >= 5) {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            } else {
                healthScoreBadge.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
            }

            // CSS view switching
            formSection.classList.add('hidden');
            resultCard.classList.remove('hidden');

            // Force ARIA focus to title so screenreaders announce completion seamlessly
            suggestedMeal.focus();

        } catch (error) {
            console.error('Core Logic Execution Error:', error);
            alert(error.message || "Something went wrong! Please ensure the backend is running and the API key is valid.");
        } finally {
            // Revert State
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
        }
    });

    resetBtn.addEventListener('click', () => {
        resultCard.classList.add('hidden');
        formSection.classList.remove('hidden');
        form.reset();
    });
});
