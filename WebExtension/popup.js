document.addEventListener('DOMContentLoaded', async function() {
  // Load personal stats
  loadPersonalStats();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load website URL
  const websiteUrl = "https://d30hw8svzk5x6g.cloudfront.net/";
  document.getElementById('open-website').href = websiteUrl;
});

async function loadPersonalStats() {
  try {
    const result = await chrome.storage.local.get(['factsChecked']);
    const factsChecked = result.factsChecked || 0;
    document.getElementById('facts-checked').textContent = factsChecked;
  } catch (error) {
    console.log('Could not load stats:', error);
  }
}

function setupEventListeners() {
  // Test extension button
  document.getElementById('test-extension').addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      // Show instruction
      showNotification('Go to any website, highlight some text, then right-click and select "⚡ AIvengers Assemble!"', 'info');
      
      // Close popup
      window.close();
    } catch (error) {
      showNotification('Please try again!', 'error');
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    background: ${type === 'error' ? '#dc2626' : '#059669'};
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 1000;
    text-align: center;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Add some visual flair
function addSparkles() {
  const sparkles = ['⭐', '✨', '💫', '🌟'];
  const container = document.querySelector('.header');
  
  setInterval(() => {
    const sparkle = document.createElement('div');
    sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    sparkle.style.cssText = `
      position: absolute;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      font-size: ${Math.random() * 10 + 10}px;
      animation: sparkle 2s linear forwards;
      pointer-events: none;
      z-index: 0;
    `;
    
    container.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2000);
  }, 1000);
}

// Add sparkle animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes sparkle {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-20px) scale(1.5); }
  }
`;
document.head.appendChild(style);

// Start sparkles
addSparkles();
