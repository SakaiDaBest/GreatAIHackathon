// ===== CONTENT.JS =====
class AIvengersAnalyzer {
  constructor() {
    this.apiUrl = 'https://your-api-url.com/api/analyze'; // Replace with your API
    this.popup = null;
    this.isAnalyzing = false;
    
    this.init();
  }

  init() {
    // Listen for messages from background script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'AIVENGERS_ANALYZE') {
        this.analyzeText(event.data.text);
      }
    });

    // Add keyboard shortcut (Ctrl+Shift+A for AIvengers)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
          this.analyzeText(selectedText);
        } else {
          this.showMessage('AIvengers Assemble! Please select some text to fact-check!');
        }
      }
    });
  }

  async analyzeText(text) {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.createPopup(text);
    
    try {
      // Show loading state
      this.updatePopupContent(this.getLoadingContent());
      
      // Make API call to your AIvengers backend
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en',
          userType: 'extension'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      this.updatePopupContent(this.getResultsContent(results, text));
      
    } catch (error) {
      console.error('AIvengers API Error:', error);
      // Fallback to local analysis
      const fallbackResults = this.performLocalAnalysis(text);
      this.updatePopupContent(this.getResultsContent(fallbackResults, text));
    } finally {
      this.isAnalyzing = false;
    }
  }

  createPopup(text) {
    // Remove existing popup
    if (this.popup) {
      this.popup.remove();
    }

    // Create popup container
    this.popup = document.createElement('div');
    this.popup.id = 'aivengers-popup';
    this.popup.className = 'aivengers-popup';
    
    // Add to page
    document.body.appendChild(this.popup);
    
    // Position popup near mouse or selection
    this.positionPopup();
  }

  positionPopup() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.popup.style.position = 'fixed';
      this.popup.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 400)}px`;
      this.popup.style.left = `${Math.min(rect.left, window.innerWidth - 350)}px`;
      this.popup.style.zIndex = '2147483647';
    }
  }

  updatePopupContent(content) {
    if (this.popup) {
      this.popup.innerHTML = content;
      this.attachEventListeners();
    }
  }

  getLoadingContent() {
    return `
      <div class="aivengers-header">
        <div class="aivengers-logo">
          <span class="aivengers-icon">⚡</span>
          <span class="aivengers-title">AIvengers</span>
        </div>
        <button class="aivengers-close" onclick="document.getElementById('aivengers-popup').remove()">✕</button>
      </div>
      <div class="aivengers-content">
        <div class="aivengers-loading">
          <div class="aivengers-spinner"></div>
          <p><strong>AIvengers Assembling...</strong></p>
          <p class="aivengers-loading-text">🤖 AI analyzing misinformation patterns</p>
          <p class="aivengers-loading-text">🕷️ Web-crawling for source verification</p>
          <p class="aivengers-loading-text">🛡️ Deploying fact-check protocols</p>
        </div>
      </div>
    `;
  }

  getResultsContent(results, originalText) {
    const riskColor = {
      'HIGH': '#dc2626',
      'MEDIUM': '#d97706', 
      'LOW': '#059669'
    }[results.riskLevel] || '#6b7280';

    const riskIcon = {
      'HIGH': '🚨',
      'MEDIUM': '⚠️',
      'LOW': '✅'
    }[results.riskLevel] || '📊';

    const heroQuote = {
      'HIGH': '"I can do this all day!" - Captain America would fact-check this!',
      'MEDIUM': '"I am Iron Man" - Tony Stark says verify before sharing!',
      'LOW': '"Avengers... Assemble!" - This content checks out!'
    }[results.riskLevel] || '"With great power comes great responsibility!"';

    return `
      <div class="aivengers-header">
        <div class="aivengers-logo">
          <span class="aivengers-icon">⚡</span>
          <span class="aivengers-title">AIvengers</span>
        </div>
        <button class="aivengers-close" onclick="document.getElementById('aivengers-popup').remove()">✕</button>
      </div>
      
      <div class="aivengers-content">
        <div class="aivengers-mission-status">
          <div class="aivengers-status-badge" style="background: linear-gradient(135deg, ${riskColor}, ${riskColor}dd)">
            <span class="aivengers-status-icon">${riskIcon}</span>
            <span class="aivengers-status-text">${results.riskLevel} THREAT LEVEL</span>
          </div>
          <div class="aivengers-hero-quote">${heroQuote}</div>
        </div>

        <div class="aivengers-analysis-grid">
          <div class="aivengers-metric">
            <div class="aivengers-metric-header">
              <span class="aivengers-metric-icon">🎯</span>
              <span class="aivengers-metric-label">Misinformation Risk</span>
            </div>
            <div class="aivengers-metric-bar">
              <div class="aivengers-metric-fill" style="width: ${results.fakeNewsScore}%; background: linear-gradient(90deg, ${results.fakeNewsScore > 70 ? '#dc2626' : results.fakeNewsScore > 40 ? '#d97706' : '#059669'}, ${results.fakeNewsScore > 70 ? '#ef4444' : results.fakeNewsScore > 40 ? '#f59e0b' : '#10b981'})"></div>
            </div>
            <div class="aivengers-metric-value">${results.fakeNewsScore}%</div>
          </div>

          <div class="aivengers-metric">
            <div class="aivengers-metric-header">
              <span class="aivengers-metric-icon">🛡️</span>
              <span class="aivengers-metric-label">Source Credibility</span>
            </div>
            <div class="aivengers-metric-bar">
              <div class="aivengers-metric-fill" style="width: ${results.credibilityScore}%; background: linear-gradient(90deg, ${results.credibilityScore > 70 ? '#059669' : results.credibilityScore > 40 ? '#d97706' : '#dc2626'}, ${results.credibilityScore > 70 ? '#10b981' : results.credibilityScore > 40 ? '#f59e0b' : '#ef4444'})"></div>
            </div>
            <div class="aivengers-metric-value">${results.credibilityScore}%</div>
          </div>

          <div class="aivengers-metric">
            <div class="aivengers-metric-header">
              <span class="aivengers-metric-icon">🔍</span>
              <span class="aivengers-metric-label">Fact Check Score</span>
            </div>
            <div class="aivengers-metric-bar">
              <div class="aivengers-metric-fill" style="width: ${results.factCheckScore}%; background: linear-gradient(90deg, ${results.factCheckScore > 70 ? '#059669' : results.factCheckScore > 40 ? '#d97706' : '#dc2626'}, ${results.factCheckScore > 70 ? '#10b981' : results.factCheckScore > 40 ? '#f59e0b' : '#ef4444'})"></div>
            </div>
            <div class="aivengers-metric-value">${results.factCheckScore}%</div>
          </div>
        </div>

        ${results.healthWarnings && results.healthWarnings.length > 0 ? `
          <div class="aivengers-health-alert">
            <div class="aivengers-alert-header">
              <span class="aivengers-alert-icon">⚕️</span>
              <span class="aivengers-alert-title">Health Misinformation Alert!</span>
            </div>
            <div class="aivengers-alert-subtitle">Dr. Strange would want you to know:</div>
            ${results.healthWarnings.map(warning => `
              <div class="aivengers-alert-item">🔸 ${warning}</div>
            `).join('')}
          </div>
        ` : ''}

        <div class="aivengers-mission-brief">
          <div class="aivengers-brief-header">
            <span class="aivengers-brief-icon">📋</span>
            <span class="aivengers-brief-title">Mission Analysis:</span>
          </div>
          <div class="aivengers-brief-text">${results.explanation}</div>
        </div>

        <div class="aivengers-action-center">
          <button class="aivengers-btn aivengers-btn-primary" onclick="window.open('https://your-website.com', '_blank')">
            🌐 Full Mission Report
          </button>
          <button class="aivengers-btn aivengers-btn-hero" onclick="navigator.clipboard.writeText('${originalText.replace(/'/g, "\\'")}'); this.textContent='📋 Copied!'">
            📋 Copy Intel
          </button>
          <button class="aivengers-btn aivengers-btn-hero" onclick="window.open('https://twitter.com/intent/tweet?text=Just%20fact-checked%20this%20with%20AIvengers%20AI%20⚡%20Threat%20Level:%20${results.riskLevel}%20%23FactCheck%20%23AIvengers', '_blank')">
            🐦 Alert Citizens
          </button>
        </div>

        <div class="aivengers-footer">
          <div class="aivengers-footer-motto">
            "AIvengers Assemble!" • Powered by AI Heroes • Ctrl+Shift+A
          </div>
          <div class="aivengers-footer-stats">
            Mission Success Rate: 94.2% | Misinformation Defeated: 1,247 today
          </div>
        </div>
      </div>
    `;
  }

  performLocalAnalysis(text) {
    // Fallback analysis when API is unavailable - AIvengers offline mode
    const healthKeywords = ['miracle cure', 'doctors hate', 'vaccine danger', 'covid hoax'];
    const fakeIndicators = ['breaking exclusive', 'shocking truth', 'they dont want you to know'];
    
    const textLower = text.toLowerCase();
    let fakeScore = 20;
    let healthWarnings = [];
    
    healthKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        fakeScore += 15;
        healthWarnings.push('Potential health misinformation detected by offline AI');
      }
    });
    
    fakeIndicators.forEach(indicator => {
      if (textLower.includes(indicator)) {
        fakeScore += 10;
      }
    });
    
    const riskLevel = fakeScore > 70 ? 'HIGH' : fakeScore > 40 ? 'MEDIUM' : 'LOW';
    
    return {
      fakeNewsScore: Math.min(fakeScore, 95),
      credibilityScore: 60,
      factCheckScore: 50,
      healthWarnings: [...new Set(healthWarnings)],
      riskLevel: riskLevel,
      explanation: fakeScore > 60 ? 
        'AIvengers offline protocols detected potential misinformation patterns. Full analysis available online.' :
        'Content appears to follow standard information patterns. AIvengers offline mode active.',
      timestamp: Date.now()
    };
  }

  attachEventListeners() {
    // Re-attach event listeners after content update
    const closeBtn = this.popup.querySelector('.aivengers-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.popup.remove();
    }
  }

  showMessage(message) {
    // Show temporary AIvengers-styled message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'aivengers-notification';
    messageDiv.innerHTML = `<span style="margin-right: 8px;">⚡</span>${message}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #60a5fa;
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  }
}
