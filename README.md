# 📰 AI-Powered News Detector  

**Combating Fake News and Misinformation with AI**  
🔗 **Live Demo:** [https://d30hw8svzk5x6g.cloudfront.net](https://d30hw8svzk5x6g.cloudfront.net)

This project is a prototype solution built for an AWS hackathon challenge.  
It addresses the urgent problem of misinformation spreading faster than facts, especially on social media.  
Using **AI-powered analysis** (AWS Bedrock + Knowledge Base + Real-Time Search), the system helps users assess the credibility of online news in real time.  

---

## 🚀 Features  

- **Real-Time Fake News Detection** – Paste any news article or headline and instantly get a reliability assessment.  
- **Knowledge Base + Live Search** – Combines AWS Knowledge Base retrieval (Titan Embeddings v2) with Tavily AI Search for stronger verification.  
- **Trust Badges & Confidence Scores** – Provides a clear % confidence level for each verdict.  
- **Multilingual Input & Output** – Uses Amazon Translate to automatically detect input language and return results in the same language.  
- **Serverless & Scalable** – Powered by AWS Lambda, API Gateway, S3, and CloudFront.  
- **Frontend-Only Hosting** – Lightweight, static website hosted on S3 + served via CloudFront.  

---

## 🛠️ Architecture  


User (Browser)
   │
   ├──> CloudFront (CDN)
   │       │
   │       └──> S3 (Static Website Hosting)
   │
   └──> API Gateway (REST API)
           │
           └──> Lambda Function (Python 3.12)
                   ├── Detects language (Amazon Comprehend / Translate)
                   ├── Translates to English
                   ├── Queries Bedrock Knowledge Base
                   ├── Runs AI reasoning (Claude 3.7 Sonnet / Claude 3.5 Sonnet)
                   ├── Adds fallback live search context (Tavily API)
                   ├── Translates output back to source language
                   └── Returns JSON response to frontend

## 📂 Project Structure
│
├── WebExtension  
│     ├── icons                # Contians images used 
│     ├── background.js               
│     ├── manifest.js     
│     ├── popup.html  
│     └── popup.js
│         
├── Website  
│     ├── index.html           # Main webpage UI
│     ├── app.js               # Core logic: API calls, analysis parsing, language auto-detection
│     ├── styles.css           # Decoration for the website
│     └── iconaivenger.png     # App icon (used in the browser tab)
│
├── Problem statement.txt # Original hackathon brief
│
└── lambda
    └──lambda_function.py   # Lambda backend function (news analysis pipeline)

## 💻 Usage
1. Clone the repository
git clone https://github.com/your-username/GreatAIHackathon.git
cd GreatAIHackathon

2. Deploy Frontend
Upload index.html, app.js, and assets to your S3 bucket.
Invalidate CloudFront cache to deploy changes.

3. Deploy Backend
Package and deploy lambda_function.py to AWS Lambda.
Attach API Gateway trigger to /analyze POST route.
Set required environment variables:
  AWS_REGION
  KNOWLEDGE_BASE_ID
  TAVILY_API_KEY

4. Run It
Open https://d30hw8svzk5x6g.cloudfront.net
Paste any news headline or article
Click Analyze — get classification, confidence score, and AI reasoning in real time

## 🌍 Multilingual Support
Input language automatically detected
Output reasoning returned in the same language
Supported Languages: EN, ZH, JA, KO, FR, ES, DE, PT (Amazon Translate auto-detection)

## 👥 Team
Built during the Great AI Hackathon event by Team AIvenger ⚡
