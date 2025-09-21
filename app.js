// Original API endpoint
const ORIGINAL_API_ENDPOINT = "https://btg76jdj06.execute-api.ap-southeast-2.amazonaws.com/works";

// Use your original endpoint now that CORS is fixed in Lambda
const API_ENDPOINT = ORIGINAL_API_ENDPOINT;

// Keep CORS proxy as backup options (commented out)
// const API_ENDPOINT = "https://cors-anywhere.herokuapp.com/" + ORIGINAL_API_ENDPOINT;
// const API_ENDPOINT = "https://corsproxy.io/?" + encodeURIComponent(ORIGINAL_API_ENDPOINT);

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

// Modal functions - THESE WERE MISSING!
function openModal(confidence, reasoning, classification) {
    const modal = document.getElementById('analysisModal');
    const percentageDisplay = document.getElementById('percentageDisplay');
    const analysisSummary = document.getElementById('analysisSummary');

    console.log('Opening modal with:', { confidence, classification });

    // Update modal content
    if (percentageDisplay) {
        percentageDisplay.textContent = `${confidence}% confidence in classification: "${classification}"`;
    }

    if (analysisSummary) {
        // Clean up the reasoning text by removing extra markdown and formatting
        let cleanReasoning = reasoning
            .replace(/\*\*/g, '') // Remove bold markdown
            .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
            .replace(/^\s+/gm, '') // Remove leading spaces from lines
            .replace(/\d+\.\s+/g, '• ') // Convert numbered lists to bullet points
            .trim();

        analysisSummary.textContent = cleanReasoning || "No detailed analysis available.";
    }

    // Show the modal
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(event) {
    const modal = document.getElementById('analysisModal');
    if (!event || event.target === modal || event.target.classList.contains('modal-close')) {
        modal.style.display = 'none';
    }
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

        // The AI response is now directly in the response body (string format)
        let aiText;
        if (typeof data === 'string') {
            // Response is directly the AI text
            aiText = data;
        } else if (data.body) {
            // Response is in data.body
            aiText = data.body;
        } else {
            throw new Error("Unexpected response format");
        }

        console.log("AI Response:", aiText.substring(0, 200) + "...");

        // Parse AI response to extract confidence, classification, and reasoning
        let classificationMatch = aiText.match(/\*\*Classification:\*\*\s*(.+?)(?:\n|$)/i) || aiText.match(/Classification:\s*(.+?)(?:\n|$)/i);
        let confidenceMatch = aiText.match(/\*\*Confidence Percentage:\*\*\s*(\d+)%/i) || aiText.match(/Confidence Percentage:\s*(\d+)%/i);
        let reasoningMatch = aiText.match(/\*\*Reasoning:\*\*([\s\S]*?)$/i) || aiText.match(/Reasoning:\s*([\s\S]*?)$/i);

        const classification = classificationMatch ? classificationMatch[1].trim() : "Uncertain";
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : aiText; // Use full text as fallback

        console.log("Parsed:", { classification, confidence, reasoning: reasoning.substring(0, 100) + "..." });

        const isFake = classification.toLowerCase().includes("false") || classification.toLowerCase().includes("unverifiable");

        // Update UI
        const trustInfo = getTrustBadge(confidence, isFake);

        resultDiv.className = 'result ' + (isFake ? 'fake' : 'real');
        resultText.textContent = isFake ? `⚠️ ${classification}` : `✅ ${classification}`;
        confidenceDiv.textContent = `Confidence: ${confidence}%`;
        trustBadgeDiv.textContent = trustInfo.badge + ' (Click for details)';
        trustBadgeDiv.style.backgroundColor = trustInfo.color;
        trustBadgeDiv.style.color = 'white';
        trustBadgeDiv.style.cursor = 'pointer';

        // Store data for modal and make trust badge clickable
        trustBadgeDiv.onclick = () => openModal(confidence, reasoning, classification);

    } catch (error) {
        console.error("Detailed error:", error);
        resultText.textContent = `❌ Error: ${error.message}`;
        resultDiv.className = 'result fake';
        confidenceDiv.textContent = '';
        trustBadgeDiv.textContent = '';
        trustBadgeDiv.style.backgroundColor = '';
        trustBadgeDiv.style.cursor = 'default';
        trustBadgeDiv.onclick = null;
    } finally {
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        resultDiv.style.display = 'block';
    }
});