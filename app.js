const API_ENDPOINT = "https://bvrzv4lsg9.execute-api.ap-southeast-2.amazonaws.com";

// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.querySelector('.theme-toggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
}

// Progress bar animation
function animateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const steps = [
        { width: 20, text: 'Sending to AI model...' },
        { width: 40, text: 'Model processing...' },
        { width: 70, text: 'Generating response...' },
        { width: 100, text: 'Finalizing results...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            progressBar.style.width = steps[currentStep].width + '%';
            progressText.textContent = steps[currentStep].text;
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 400);
}

// Get trust badge
function getTrustBadge(confidence, isFake) {
    let badge = '';
    let color = '';

    if (confidence >= 80) {
        badge = isFake ? '🔴 Low Trust' : '🟢 High Trust';
        color = isFake ? '#ff4757' : '#2ed573';
    } else if (confidence >= 60) {
        badge = '🟡 Medium Trust';
        color = '#ffa502';
    } else {
        badge = '🔴 Low Trust';
        color = '#ff4757';
    }

    return { badge, color };
}

// Restore theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    document.querySelector('.theme-toggle').textContent = '☀️';
}

// Form submission
document.getElementById('newsForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const newsText = document.getElementById('newsText').value.trim();
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const confidenceDiv = document.getElementById('confidence');
    const trustBadgeDiv = document.getElementById('trustBadge');
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.querySelector('.btn');

    if (!newsText) {
        alert('Please enter some news text to analyze.');
        return;
    }

    loadingDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    resultDiv.style.display = 'none';

    animateProgress();

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: newsText })
        });

        const data = await response.json();
        const aiResponse = data.body ? JSON.parse(data.body) : "No response received";

        // Parse AI response to extract confidence and classification
        let classificationMatch = aiResponse.match(/Classification:\s*(.*)/i);
        let confidenceMatch = aiResponse.match(/Accuracy Percentage:\s*(\d+)%/i);

        const classification = classificationMatch ? classificationMatch[1] : "Uncertain";
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

        const isFake = classification.toLowerCase().includes("false");

        // Update UI
        const trustInfo = getTrustBadge(confidence, isFake);

        resultDiv.className = 'result ' + (isFake ? 'fake' : 'real');
        resultText.textContent = isFake ? `⚠️ ${classification}` : `✅ ${classification}`;
        confidenceDiv.textContent = `Confidence: ${confidence}%`;
        trustBadgeDiv.textContent = trustInfo.badge;
        trustBadgeDiv.style.backgroundColor = trustInfo.color;
        trustBadgeDiv.style.color = 'white';

    } catch (error) {
        resultText.textContent = "❌ Error connecting to the AI service.";
        resultDiv.className = 'result fake';
        console.error("Error:", error);
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        resultDiv.style.display = 'block';
    }
});
