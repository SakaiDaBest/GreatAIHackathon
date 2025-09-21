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
        { width: 25, textKey: 'analyzing', delay: 300 },
        { width: 50, textKey: 'processing', delay: 300 },
        { width: 75, textKey: 'checking', delay: 300 },
        { width: 95, textKey: 'finalizing', delay: 25 }
    ];

    let currentStep = 0;
    progressBar.style.width = steps[0].width + '%';
    progressText.textContent = translations[currentLanguage][steps[0].textKey];
    currentStep++;

    function nextStep() {
        if (currentStep < steps.length) {
            progressBar.style.width = steps[currentStep].width + '%';
            progressText.textContent = translations[currentLanguage][steps[currentStep].textKey];
            const delay = steps[currentStep].delay;
            currentStep++;
            setTimeout(nextStep, delay);
        }
    }

    setTimeout(nextStep, 300);
}

// Get trust badge
function getTrustBadge(confidence, isFake) {
    let badgeKey = '';
    let className = '';

    if (confidence >= 80) {
        badgeKey = isFake ? 'low-confidence' : 'high-confidence';
        className = isFake ? 'trust-low' : 'trust-high';
    } else if (confidence >= 60) {
        badgeKey = 'medium-confidence';
        className = 'trust-medium';
    } else {
        badgeKey = 'low-confidence';
        className = 'trust-low';
    }

    const badge = translations[currentLanguage][badgeKey];
    return { badge, className };
}

// Modal functions
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('analysisModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// History functions
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
        result: classification,
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

    const noHistoryText = translations[currentLanguage]['no-history'];
    const clearHistoryText = translations[currentLanguage]['clear-history'];

    if (history.length === 0) {
        historyList.innerHTML = `<p style="text-align: center; color: #666; padding: 2rem;">${noHistoryText}</p>`;
        return;
    }

    historyList.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <button onclick="clearHistory()" style="background: #ff4757; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; transition: all 0.3s;">${clearHistoryText}</button>
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
        const fakePercentage = isFake ? confidence : (100 - confidence);
        const realPercentage = 100 - fakePercentage;
        const likelyFalse = translations[currentLanguage]['likely-false'];
        const likelyTrue = translations[currentLanguage]['likely-true'];
        percentageDisplay.innerHTML = `<strong>${likelyFalse}: ${fakePercentage}%</strong> | <strong>${likelyTrue}: ${realPercentage}%</strong>`;
    }

    if (analysisSummary) {
        let reasoning = '';
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
            let cleanReasoning = reasoning
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\*([^*]+)\*/g, '$1')
                .replace(/KB Source \d+/g, 'Source')
                .replace(/\(Relevance: [\d.]+\)/g, '')
                .replace(/AUTHORITATIVE KNOWLEDGE BASE INFORMATION:/g, 'Knowledge Base:')
                .replace(/Recent Search Results:/g, 'Live Search:')
                .replace(/\n\s*\n/g, '\n\n')
                .replace(/^\s+/gm, '')
                .replace(/•\s*/g, '• ')
                .trim();

            analysisSummary.textContent = translateAnalysisText(cleanReasoning);
        } else {
            // 🔥 Instead of fallback text, just display whatever AI sent back
            analysisSummary.textContent = aiResponse;
        }
    }
}

// Language system
const translations = {
    en: { title: 'News Detector', subtitle: 'Analyze news articles and headlines for authenticity', 'input-label': 'Enter news article or headline:', 'input-placeholder': 'Paste article or headline here...(Ctrl+Enter to analyze)', 'analyze-btn': 'Analyze News', 'likely-fake': 'Likely Fake', 'likely-real': 'Likely Real', confidence: 'Confidence', history: 'Analysis History', 'no-history': 'No analysis history yet', 'clear-history': 'Clear History', 'select-language': 'Select Language', 'language-changed': 'Language changed to English', 'fake-desc': 'Analysis suggests this content may contain unreliable information.', 'real-desc': 'Analysis suggests this content follows reliable reporting patterns.', 'ai-breakdown': 'AI Analysis Breakdown', 'probability-assessment': 'Probability Assessment:', 'detailed-analysis': 'Detailed Analysis:', 'likely-false': 'Likely False', 'likely-true': 'Likely True', 'high-confidence': 'High Confidence', 'medium-confidence': 'Medium Confidence', 'low-confidence': 'Low Confidence', 'unverifiable': 'Unverifiable', 'false': 'False', 'true': 'True', 'partially-true': 'Partially True', 'analyzing': 'Analyzing', 'processing': 'Processing', 'checking': 'Checking', 'finalizing': 'Finalizing result' },
    es: { title: 'Detector de Noticias', subtitle: 'Analiza artículos y titulares para verificar autenticidad', 'input-label': 'Ingresa artículo o titular:', 'input-placeholder': 'Pega artículo o titular aquí...(Ctrl+Enter para analizar)', 'analyze-btn': 'Analizar Noticia', 'likely-fake': 'Probablemente Falso', 'likely-real': 'Probablemente Real', confidence: 'Confianza', history: 'Historial de Análisis', 'no-history': 'No hay historial de análisis aún', 'clear-history': 'Limpiar Historial', 'select-language': 'Seleccionar Idioma', 'language-changed': 'Idioma cambiado a Español', 'fake-desc': 'El análisis sugiere que este contenido puede contener información poco confiable.', 'real-desc': 'El análisis sugiere que este contenido sigue patrones de informes confiables.', 'ai-breakdown': 'Desglose de Análisis IA', 'probability-assessment': 'Evaluación de Probabilidad:', 'detailed-analysis': 'Análisis Detallado:', 'likely-false': 'Probablemente Falso', 'likely-true': 'Probablemente Verdadero', 'high-confidence': 'Alta Confianza', 'medium-confidence': 'Confianza Media', 'low-confidence': 'Baja Confianza', 'unverifiable': 'No Verificable', 'false': 'Falso', 'true': 'Verdadero', 'partially-true': 'Parcialmente Verdadero', 'analyzing': 'Analizando', 'processing': 'Procesando', 'checking': 'Verificando', 'finalizing': 'Finalizando resultado' },
    zh: { title: '新闻检测器', subtitle: '分析新闻文章和标题的真实性', 'input-label': '输入新闻文章或标题：', 'input-placeholder': '在此处粘贴文章或标题...（按 Ctrl+Enter 进行分析）', 'analyze-btn': '分析新闻', 'likely-fake': '可能虚假', 'likely-real': '可能真实', confidence: '置信度', history: '分析历史', 'no-history': '暂无分析历史', 'clear-history': '清除历史', 'select-language': '选择语言', 'language-changed': '语言已更改为中文', 'fake-desc': '分析表明此内容可能包含不可靠信息。', 'real-desc': '分析表明此内容遵循可靠的报道模式。', 'ai-breakdown': 'AI分析细分', 'probability-assessment': '概率评估：', 'detailed-analysis': '详细分析：', 'likely-false': '可能为假', 'likely-true': '可能为真', 'high-confidence': '高置信度', 'medium-confidence': '中等置信度', 'low-confidence': '低置信度', 'unverifiable': '无法验证', 'false': '虚假', 'true': '真实', 'partially-true': '部分真实', 'analyzing': '分析中', 'processing': '处理中', 'checking': '检查中', 'finalizing': '完成结果' },
    ko: { title: '뉴스 탐지기', subtitle: '뉴스 기사와 헤드라인의 진위성을 분석합니다', 'input-label': '뉴스 기사 또는 헤드라인 입력:', 'input-placeholder': '여기에 기사나 헤드라인을 붙여넣으세요...(Ctrl+Enter로 분석)', 'analyze-btn': '뉴스 분석', 'likely-fake': '가짜 뉴스 가능성', 'likely-real': '진짜 뉴스 가능성', confidence: '신뢰도', history: '분석 기록', 'no-history': '분석 기록이 없습니다', 'clear-history': '기록 삭제', 'select-language': '언어 선택', 'language-changed': '언어가 한국어로 변경되었습니다', 'fake-desc': '분석 결과 이 콘텐츠에는 신뢰할 수 없는 정보가 포함되어 있을 수 있습니다.', 'real-desc': '분석 결과 이 콘텐츠는 신뢰할 수 있는 보도 패턴을 따르고 있습니다.', 'ai-breakdown': 'AI 분석 세분화', 'probability-assessment': '확률 평가:', 'detailed-analysis': '상세 분석:', 'likely-false': '거짓일 가능성', 'likely-true': '사실일 가능성', 'high-confidence': '높은 신뢰도', 'medium-confidence': '보통 신뢰도', 'low-confidence': '낮은 신뢰도', 'unverifiable': '검증 불가', 'false': '거짓', 'true': '사실', 'partially-true': '부분적 사실', 'analyzing': '분석 중', 'processing': '처리 중', 'checking': '확인 중', 'finalizing': '결과 완료 중' },
    fr: { title: 'Détecteur de Nouvelles', subtitle: 'Analyser les articles et titres pour vérifier leur authenticité', 'input-label': 'Entrez un article ou titre:', 'input-placeholder': 'Collez l\'article ou titre ici...(Ctrl+Enter pour analyser)', 'analyze-btn': 'Analyser les Nouvelles', 'likely-fake': 'Probablement Faux', 'likely-real': 'Probablement Vrai', confidence: 'Confiance', history: 'Historique d\'Analyse', 'no-history': 'Aucun historique d\'analyse encore', 'clear-history': 'Effacer l\'Historique', 'select-language': 'Sélectionner la Langue', 'language-changed': 'Langue changée en Français', 'fake-desc': 'L\'analyse suggère que ce contenu peut contenir des informations peu fiables.', 'real-desc': 'L\'analyse suggère que ce contenu suit des modèles de rapport fiables.', 'ai-breakdown': 'Décomposition de l\'Analyse IA', 'probability-assessment': 'Évaluation de Probabilité:', 'detailed-analysis': 'Analyse Détaillée:', 'likely-false': 'Probablement Faux', 'likely-true': 'Probablement Vrai', 'high-confidence': 'Haute Confiance', 'medium-confidence': 'Confiance Moyenne', 'low-confidence': 'Faible Confiance', 'unverifiable': 'Invérifiable', 'false': 'Faux', 'true': 'Vrai', 'partially-true': 'Partiellement Vrai', 'analyzing': 'Analyse', 'processing': 'Traitement', 'checking': 'Vérification', 'finalizing': 'Finalisation du résultat' },
    de: { title: 'Nachrichten-Detektor', subtitle: 'Analysieren Sie Nachrichtenartikel und Schlagzeilen auf Authentizität', 'input-label': 'Nachrichtenartikel oder Schlagzeile eingeben:', 'input-placeholder': 'Artikel oder Schlagzeile hier einfügen...(Strg+Enter zum Analysieren)', 'analyze-btn': 'Nachrichten Analysieren', 'likely-fake': 'Wahrscheinlich Falsch', 'likely-real': 'Wahrscheinlich Wahr', confidence: 'Vertrauen', history: 'Analyse-Verlauf', 'no-history': 'Noch kein Analyse-Verlauf', 'clear-history': 'Verlauf Löschen', 'select-language': 'Sprache Auswählen', 'language-changed': 'Sprache zu Deutsch geändert', 'fake-desc': 'Die Analyse deutet darauf hin, dass dieser Inhalt unzuverlässige Informationen enthalten könnte.', 'real-desc': 'Die Analyse deutet darauf hin, dass dieser Inhalt zuverlässigen Berichtsmustern folgt.', 'ai-breakdown': 'KI-Analyse Aufschlüsselung', 'probability-assessment': 'Wahrscheinlichkeitsbewertung:', 'detailed-analysis': 'Detaillierte Analyse:', 'likely-false': 'Wahrscheinlich Falsch', 'likely-true': 'Wahrscheinlich Wahr', 'high-confidence': 'Hohes Vertrauen', 'medium-confidence': 'Mittleres Vertrauen', 'low-confidence': 'Geringes Vertrauen', 'unverifiable': 'Nicht Überprüfbar', 'false': 'Falsch', 'true': 'Wahr', 'partially-true': 'Teilweise Wahr', 'analyzing': 'Analysiere', 'processing': 'Verarbeitung', 'checking': 'Überprüfung', 'finalizing': 'Ergebnis wird finalisiert' },
    ja: { title: 'ニュース検出器', subtitle: 'ニュース記事と見出しの真正性を分析します', 'input-label': 'ニュース記事または見出しを入力:', 'input-placeholder': 'ここに記事や見出しを貼り付けてください...(Ctrl+Enterで分析)', 'analyze-btn': 'ニュースを分析', 'likely-fake': 'フェイクの可能性', 'likely-real': '真実の可能性', confidence: '信頼度', history: '分析履歴', 'no-history': '分析履歴がありません', 'clear-history': '履歴をクリア', 'select-language': '言語を選択', 'language-changed': '言語が日本語に変更されました', 'fake-desc': '分析により、このコンテンツには信頼性の低い情報が含まれている可能性があることが示唆されます。', 'real-desc': '分析により、このコンテンツは信頼性の高い報告パターンに従っていることが示唆されます。', 'ai-breakdown': 'AI分析の内訳', 'probability-assessment': '確率評価:', 'detailed-analysis': '詳細分析:', 'likely-false': '偽情報の可能性', 'likely-true': '真実の可能性', 'high-confidence': '高信頼度', 'medium-confidence': '中信頼度', 'low-confidence': '低信頼度', 'unverifiable': '検証不可', 'false': '偽', 'true': '真', 'partially-true': '部分的に真実', 'analyzing': '分析中', 'processing': '処理中', 'checking': '確認中', 'finalizing': '結果を確定中' },
    pt: { title: 'Detector de Notícias', subtitle: 'Analise artigos e manchetes para verificar autenticidade', 'input-label': 'Digite artigo ou manchete:', 'input-placeholder': 'Cole artigo ou manchete aqui...(Ctrl+Enter para analisar)', 'analyze-btn': 'Analisar Notícia', 'likely-fake': 'Provavelmente Falso', 'likely-real': 'Provavelmente Verdadeiro', confidence: 'Confiança', history: 'Histórico de Análise', 'no-history': 'Nenhum histórico de análise ainda', 'clear-history': 'Limpar Histórico', 'select-language': 'Selecionar Idioma', 'language-changed': 'Idioma alterado para Português', 'fake-desc': 'A análise sugere que este conteúdo pode conter informações não confiáveis.', 'real-desc': 'A análise sugere que este conteúdo segue padrões de relatórios confiáveis.', 'ai-breakdown': 'Detalhamento da Análise IA', 'probability-assessment': 'Avaliação de Probabilidade:', 'detailed-analysis': 'Análise Detalhada:', 'likely-false': 'Provavelmente Falso', 'likely-true': 'Provavelmente Verdadeiro', 'high-confidence': 'Alta Confiança', 'medium-confidence': 'Confiança Média', 'low-confidence': 'Baixa Confiança', 'unverifiable': 'Não Verificável', 'false': 'Falso', 'true': 'Verdadeiro', 'partially-true': 'Parcialmente Verdadeiro', 'analyzing': 'Analisando', 'processing': 'Processando', 'checking': 'Verificando', 'finalizing': 'Finalizando resultado' }
}

let currentLanguage = 'en';
let lastAnalysisData = null;
let lastAiResponse = null;

function detectUserRegion() {
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.split('-')[0];
    const regionNames = {
        es: 'Spanish', zh: 'Chinese', ko: 'Korean', fr: 'French',
        de: 'German', ja: 'Japanese', pt: 'Portuguese'
    };
    if (translations[langCode] && langCode !== 'en') {
        setTimeout(() => showLanguageNotification(`Detected ${regionNames[langCode]} region. Click 🌍 to change language.`), 2000);
    }
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) element.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) element.placeholder = translations[lang][key];
    });
    document.querySelectorAll('.language-option').forEach(option => option.classList.remove('active'));
    event.target.classList.add('active');
    updateExistingResults();
    showLanguageNotification(translations[lang]['language-changed']);
    closeLanguage();
}

function toggleLanguage() { document.getElementById('languageModal').style.display = 'flex'; }
function closeLanguage(event) { if (event && event.target !== event.currentTarget) return; document.getElementById('languageModal').style.display = 'none'; }

function translateClassification(classification) {
    const classificationMap = {
        'unverifiable': 'unverifiable',
        'false': 'false',
        'true': 'true',
        'partially true': 'partially-true'
    };
    const key = classificationMap[classification.toLowerCase()];
    return key ? translations[currentLanguage][key] : classification;
}

function translateAnalysisText(text) {
    if (!text) return '';

    const termMap = {
        'Knowledge Base': { en: 'Knowledge Base', es: 'Base de Conocimiento', zh: '知识库', ko: '지식 베이스', fr: 'Base de Connaissances', de: 'Wissensbasis', ja: 'ナレッジベース', pt: 'Base de Conhecimento' },
        'Live Search': { en: 'Live Search', es: 'Búsqueda en Vivo', zh: '实时搜索', ko: '실시간 검색', fr: 'Recherche en Direct', de: 'Live-Suche', ja: 'ライブ検索', pt: 'Busca ao Vivo' },
        'Source': { en: 'Source', es: 'Fuente', zh: '来源', ko: '출처', fr: 'Source', de: 'Quelle', ja: 'ソース', pt: 'Fonte' },
        'Analysis': { en: 'Analysis', es: 'Análisis', zh: '分析', ko: '분석', fr: 'Analyse', de: 'Analyse', ja: '分析', pt: 'Análise' }
    };

    let translatedText = text;
    Object.keys(termMap).forEach(term => {
        const translation = termMap[term][currentLanguage] || term;
        const regex = new RegExp(term, 'gi');
        translatedText = translatedText.replace(regex, translation);
    });

    return translatedText;
}

function updateExistingResults() {
    if (lastAnalysisData) {
        const { classification, confidence, isFake } = lastAnalysisData;
        const resultText = document.getElementById('resultText');
        const confidenceDiv = document.getElementById('confidence');
        const percentageDisplay = document.getElementById('percentageDisplay');
        const trustBadgeDiv = document.getElementById('trustBadge');
        const analysisSummary = document.getElementById('analysisSummary');

        if (resultText) {
            const descKey = isFake ? 'fake-desc' : 'real-desc';
            const translatedClassification = translateClassification(classification);
            resultText.innerHTML = `<strong>${translatedClassification}</strong><br><small>${translations[currentLanguage][descKey]}</small>`;
        }
        if (confidenceDiv) {
            const confidenceText = translations[currentLanguage]['confidence'];
            confidenceDiv.textContent = `${confidenceText}: ${confidence}%`;
        }
        if (percentageDisplay) {
            const fakePercentage = isFake ? confidence : (100 - confidence);
            const realPercentage = 100 - fakePercentage;
            const likelyFalse = translations[currentLanguage]['likely-false'];
            const likelyTrue = translations[currentLanguage]['likely-true'];
            percentageDisplay.innerHTML = `<strong>${likelyFalse}: ${fakePercentage}%</strong> | <strong>${likelyTrue}: ${realPercentage}%</strong>`;
        }
        if (trustBadgeDiv) {
            const trustInfo = getTrustBadge(confidence, isFake);
            trustBadgeDiv.textContent = trustInfo.badge;
        }
        if (analysisSummary && lastAiResponse) {
            generateAnalysisDetails(lastAiResponse, confidence, classification, isFake);
        }
    }
}

function showLanguageNotification(message) {
    const notification = document.getElementById('languageNotification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 3000);
}

// Restore theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) themeToggle.textContent = '☀️';
}

// Initialize language
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    currentLanguage = 'en'; // Ensure default is English
    if (savedLang !== 'en') {
        changeLanguage(savedLang);
    }
    detectUserRegion();
});

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
        const timeoutId = setTimeout(() => controller.abort(), 25000);

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

        let classificationMatch = aiText.match(/\*\*Classification:\*\*\s*(.+?)(?:\n|$)/i) ||
                                 aiText.match(/Classification:\s*(.+?)(?:\n|$)/i);
        let confidenceMatch = aiText.match(/\*\*Confidence Percentage:\*\*\s*(\d+)%/i) ||
                             aiText.match(/Confidence Percentage:\s*(\d+)%/i);

        const classification = classificationMatch ? classificationMatch[1].trim() : "Uncertain";
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

        const isFake = classification.toLowerCase().includes("false") ||
                      classification.toLowerCase().includes("unverifiable") ||
                      classification.toLowerCase().includes("partially true");

        const trustInfo = getTrustBadge(confidence, isFake);

        resultDiv.className = 'result ' + (isFake ? 'fake' : 'real');
        const descKey = isFake ? 'fake-desc' : 'real-desc';
        const confidenceText = translations[currentLanguage]['confidence'];
        const translatedClassification = translateClassification(classification);
        resultText.innerHTML = `<strong>${translatedClassification}</strong><br><small>${translations[currentLanguage][descKey]}</small>`;
        confidenceDiv.textContent = `${confidenceText}: ${confidence}%`;
        trustBadgeDiv.textContent = trustInfo.badge;
        trustBadgeDiv.className = `trust-badge ${trustInfo.className}`;

        lastAnalysisData = { classification, confidence, isFake };
        lastAiResponse = aiText;

        saveToHistory(newsText, classification, confidence, isFake);
        generateAnalysisDetails(aiText, confidence, classification, isFake);

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