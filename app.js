// Original API endpoint
const ORIGINAL_API_ENDPOINT = "https://btg76jdj06.execute-api.ap-southeast-2.amazonaws.com/works";

// CORS Proxy options (try in order):

// Option 1: CORS Anywhere (requires one-time demo access request)
// Visit https://cors-anywhere.herokuapp.com/corsdemo first, then click "Request temporary access"
const API_ENDPOINT = "https://cors-anywhere.herokuapp.com/" + ORIGINAL_API_ENDPOINT;

// Option 2: Corsproxy.io (backup)
// const API_ENDPOINT = "https://corsproxy.io/?" + encodeURIComponent(ORIGINAL_API_ENDPOINT);

// Option 3: AllOrigins (doesn't work well with POST)
// const API_ENDPOINT = "https://api.allorigins.win/raw?url=" + encodeURIComponent(ORIGINAL_API_ENDPOINT);

// Use your original endpoint once CORS is properly configured
// const API_ENDPOINT = ORIGINAL_API_ENDPOINT;

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
        console.log("Sending request to:", API_ENDPOINT);
        console.log("Request payload:", JSON.stringify({ text: newsText }));

        const requestBody = JSON.stringify({ text: newsText });
        console.log("Request body length:", requestBody.length);

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: requestBody
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", [...response.headers.entries()]);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        // Check if the API response has an error or unexpected format
        if (data.statusCode && data.statusCode !== 200) {
            throw new Error(data.body || data.message || "API returned error status");
        }

        // The actual AI response text is in data.body
        const aiText = data.body;

        // Parse AI response to extract confidence, classification, and reasoning
        let classificationMatch = aiText.match(/Classification:\s*[""]?(.+?)[""]?(\n|$)/i);
        let confidenceMatch = aiText.match(/Confidence Percentage:\s*(\d+)%/i);
        let reasoningMatch = aiText.match(/\*\*Reasoning:\*\*([\s\S]*?)(?=\n\n|\*\*|$)/i);

        const classification = classificationMatch ? classificationMatch[1] : "Uncertain";
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "No detailed reasoning provided.";

        const isFake = classification.toLowerCase().includes("false");

        // Update UI
        const trustInfo = getTrustBadge(confidence, isFake);

        resultDiv.className = 'result ' + (isFake ? 'fake' : 'real');
        resultText.textContent = isFake ? `⚠️ ${classification}` : `✅ ${classification}`;
        confidenceDiv.textContent = `Confidence: ${confidence}%`;
        trustBadgeDiv.textContent = trustInfo.badge;
        trustBadgeDiv.style.backgroundColor = trustInfo.color;
        trustBadgeDiv.style.color = 'white';

        // Update reasoning box
        const reasoningDiv = document.getElementById('reasoning');
        const reasoningContent = document.getElementById('reasoningContent');

        if (reasoningDiv && reasoningContent) {
            // Clean up the reasoning text by removing extra markdown and formatting
            let cleanReasoning = reasoning
                .replace(/\*\*/g, '') // Remove bold markdown
                .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
                .replace(/^\s+/gm, '') // Remove leading spaces from lines
                .trim();

            reasoningContent.textContent = cleanReasoning;
            reasoningDiv.style.display = 'block';
        }

    } catch (error) {
        console.error("Detailed error:", error);
        resultText.textContent = `❌ Error: ${error.message}`;
        resultDiv.className = 'result fake';
        confidenceDiv.textContent = '';
        trustBadgeDiv.textContent = '';
        trustBadgeDiv.style.backgroundColor = '';

        // Hide reasoning box on error
        const reasoningDiv = document.getElementById('reasoning');
        if (reasoningDiv) {
            reasoningDiv.style.display = 'none';
        }
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        resultDiv.style.display = 'block';
    }
});