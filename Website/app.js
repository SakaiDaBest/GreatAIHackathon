const API_ENDPOINT = "https://btg76jdj06.execute-api.ap-southeast-2.amazonaws.com/works";

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
        { width: 25, text: 'Analyzing', delay: 300 },
        { width: 50, text: 'Processing', delay: 300 },
        { width: 75, text: 'Checking', delay: 300 },
        { width: 95, text: 'Finalizing result', delay: 25 }
    ];

    let currentStep = 0;
    progressBar.style.width = steps[0].width + '%';
    progressText.textContent = steps[0].text;
    currentStep++;

    function nextStep() {
        if (currentStep < steps.length) {
            progressBar.style.width = steps[currentStep].width + '%';
            progressText.textContent = steps[currentStep].text;
            const delay = steps[currentStep].delay;
            currentStep++;
            setTimeout(nextStep, delay);
        }
    }

    setTimeout(nextStep, 300);
}

// Get trust badge
function getTrustBadge(confidence, isFake) {
    let badge = '';
    let className = '';

    if (confidence >= 80) {
        badge = isFake ? 'Low Confidence' : 'High Confidence';
        className = isFake ? 'trust-low' : 'trust-high';
    } else if (confidence >= 60) {
        badge = 'Medium Confidence';
        className = 'trust-medium';
    } else {
        badge = 'Low Confidence';
        className = 'trust-low';
    }

    return { badge, className };
}

// Modal functions - Fixed to work with your HTML structure
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('analysisModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// History functions - Fixed
function toggleHistory() {
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
        historyModal.style.display = 'flex';
        loadHistory();
    }
}

function closeHistory(event) {
    if (event && event.target !== event.currentTarget) return;
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
        historyModal.style.display = 'none';
    }
}

function saveToHistory(text, classification, confidence, isFake) {
    const history = JSON.parse(localStorage.getItem('newsHistory') || '[]');
    const item = {
        text: text.substring(0, 120) + (text.length > 120 ? '...' : ''),
        result: classification, // Use the actual classification
        confidence: confidence,
        isFake: isFake,
        date: new Date().toLocaleString()
    };
    history.unshift(item);
    if (history.length > 15) history.pop();
    localStorage.setItem('newsHistory', JSON.stringify(history));
}

function clearHistory() {
    localStorage.removeItem('newsHistory');
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('newsHistory') || '[]');
    const historyList = document.getElementById('historyList');

    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No analysis history yet</p>';
        return;
    }

    historyList.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <button onclick="clearHistory()" style="background: #ff4757; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; transition: all 0.3s;">Clear History</button>
        </div>
        ${history.map(item => `
            <div class="history-item">
                <div class="history-text">${item.text}</div>
                <div class="history-result ${item.isFake ? 'fake' : 'real'}">${item.result} (${item.confidence}%)</div>
                <div class="history-date">${item.date}</div>
            </div>
        `).join('')}`;
}

// Enhanced analysis details generation
function generateAnalysisDetails(aiResponse, confidence, classification, isFake) {
    const analysisSummary = document.getElementById('analysisSummary');
    const percentageDisplay = document.getElementById('percentageDisplay');

    if (percentageDisplay) {
        // Enhanced percentage display
        const fakePercentage = isFake ? confidence : (100 - confidence);
        const realPercentage = 100 - fakePercentage;
        percentageDisplay.innerHTML = `<strong>Likely False: ${fakePercentage}%</strong> | <strong>Likely True: ${realPercentage}%</strong>`;
    }

    if (analysisSummary) {
        // Extract and clean reasoning from AI response
        let reasoning = '';

        // Try multiple patterns to extract reasoning
        const reasoningPatterns = [
            /\*\*Reasoning:\*\*([\s\S]*?)(?=\n\n|\*\*|$)/i,
            /Reasoning:\s*([\s\S]*?)(?=\n\n|Classification|$)/i,
            /\*\*Reasoning:\*\*([\s\S]*?)$/i,
            /Reasoning:([\s\S]*?)$/i
        ];

        for (const pattern of reasoningPatterns) {
            const match = aiResponse.match(pattern);
            if (match) {
                reasoning = match[1].trim();
                break;
            }
        }

        if (reasoning) {
            // Clean up the reasoning text
            let cleanReasoning = reasoning
                .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown but keep content
                .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
                .replace(/KB Source \d+/g, 'Source') // Clean KB source markers
                .replace(/\(Relevance: [\d.]+\)/g, '') // Remove relevance scores
                .replace(/AUTHORITATIVE KNOWLEDGE BASE INFORMATION:/g, 'Knowledge Base:')
                .replace(/Recent Search Results:/g, 'Live Search:')
                .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
                .replace(/^\s+/gm, '') // Remove leading spaces
                .replace(/•\s*/g, '• ') // Normalize bullet points
                .trim();

            analysisSummary.textContent = cleanReasoning;
        } else {
            // Fallback analysis description
            analysisSummary.textContent = `AI analysis completed with ${confidence}% confidence. The content was classified as "${classification}" based on knowledge base information, live search results, and language pattern analysis.`;
        }
    }
}

// Restore theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = '☀️';
    }
}



// Enhanced keyboard support
document.addEventListener('DOMContentLoaded', function() {
    const newsTextArea = document.getElementById('newsText');
    if (newsTextArea) {
        newsTextArea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                document.getElementById('newsForm').dispatchEvent(new Event('submit'));
            }
        });
    }
});

// Form submission with full functionality
document.getElementById('newsForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const newsText = document.getElementById('newsText').value.trim();
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const confidenceDiv = document.getElementById('confidence');
    const trustBadgeDiv = document.getElementById('trustBadge');
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.querySelector('.btn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // Increased timeout

        console.log("Sending request to:", API_ENDPOINT);

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: newsText }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response received:", typeof data);

        // Handle different response formats
        let aiText;
        if (typeof data === 'string') {
            aiText = data;
        } else if (data.body) {
            aiText = data.body;
        } else if (data.errorType || data.errorMessage) {
            throw new Error(`Server error: ${data.errorMessage || data.errorType}`);
        } else {
            throw new Error("Unexpected response format");
        }

        // Enhanced parsing for multiple response formats
        let classificationMatch = aiText.match(/\*\*Classification:\*\*\s*(.+?)(?:\n|$)/i) ||
                                 aiText.match(/Classification:\s*(.+?)(?:\n|$)/i);
        let confidenceMatch = aiText.match(/\*\*Confidence Percentage:\*\*\s*(\d+)%/i) ||
                             aiText.match(/Confidence Percentage:\s*(\d+)%/i);

        const classification = classificationMatch ? classificationMatch[1].trim() : "Uncertain";
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

        // Enhanced fake detection
        const isFake = classification.toLowerCase().includes("false") ||
                      classification.toLowerCase().includes("unverifiable") ||
                      classification.toLowerCase().includes("partially true");

        const trustInfo = getTrustBadge(confidence, isFake);

        resultDiv.className = 'result ' + (isFake ? 'fake' : 'real');
        resultText.innerHTML = `<strong>${isFake ? classification : classification}</strong><br><small>${isFake ? 'Analysis suggests this content may contain unreliable information.' : 'Analysis suggests this content follows reliable reporting patterns.'}</small>`;
        confidenceDiv.textContent = `Confidence: ${confidence}%`;
        trustBadgeDiv.textContent = trustInfo.badge;
        trustBadgeDiv.className = `trust-badge ${trustInfo.className}`;

        // Save to history with proper data
        saveToHistory(newsText, classification, confidence, isFake);

        // Generate and show detailed analysis
        generateAnalysisDetails(aiText, confidence, classification, isFake);

        // Show the analysis modal
        const analysisModal = document.getElementById('analysisModal');
        if (analysisModal) {
            analysisModal.style.display = 'flex';
        }

    } catch (error) {
        console.error("Analysis error:", error);

        let errorMessage = "Analysis failed. Please try again.";
        if (error.name === 'AbortError') {
            errorMessage = "Request timed out. Please try with shorter text or try again later.";
        } else if (error.message.includes('timeout')) {
            errorMessage = "Analysis timed out. Please try again with shorter text.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        resultText.textContent = `❌ ${errorMessage}`;
        resultDiv.className = 'result fake';
        confidenceDiv.textContent = '';
        trustBadgeDiv.textContent = '';
        trustBadgeDiv.className = 'trust-badge';
    } finally {
        // Complete loading animation
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = 'Complete';

        setTimeout(() => {
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            resultDiv.style.display = 'block';
        }, 500);
    }
});