import json
import logging
import os
import socket
import urllib.request
import urllib.parse
from datetime import datetime, timezone

import boto3

# -------------------- Logging --------------------
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(format="[%(asctime)s] %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(log_level)

# -------------------- AWS / API Keys --------------------
AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-2")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
KB_ID = os.environ.get("KNOWLEDGE_BASE_ID", "OFLYCZAWWQ") 

# -------------------- Bedrock Clients --------------------
bedrock_runtime = boto3.client(service_name="bedrock-runtime", region_name=AWS_REGION)
bedrock_agent_runtime = boto3.client(service_name="bedrock-agent-runtime", region_name=AWS_REGION)
translate_client = boto3.client(service_name="translate", region_name=AWS_REGION)

# -------------------- CORS Headers --------------------
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}

def translate_to_english(text: str) -> tuple[str, str]:
    """
    Detects the source language and translates text into English.
    Returns (translated_text, source_language_code).
    """
    try:
        response = translate_client.translate_text(
            Text=text,
            SourceLanguageCode="auto",
            TargetLanguageCode="en"
        )
        translated_text = response["TranslatedText"]
        source_lang = response["SourceLanguageCode"]
        logger.info(f"Translated from {source_lang} to English")
        return translated_text, source_lang
    except Exception as e:
        logger.error(f"Translation to English failed: {e}")

        return text, "en"

def translate_from_english(text: str, target_language: str) -> str:
    """
    Translates text from English to the target language.
    Returns translated text or original if translation fails.
    """
    if target_language == "en":
        return text  
    try:
        response = translate_client.translate_text(
            Text=text,
            SourceLanguageCode="en",
            TargetLanguageCode=target_language
        )
        translated_text = response["TranslatedText"]
        logger.info(f"Translated output from English to {target_language}")
        return translated_text
    except Exception as e:
        logger.error(f"Translation from English to {target_language} failed: {e}")

        return text

def get_current_date() -> str:
    """Get current date in a readable format."""
    now = datetime.now(timezone.utc)
    return now.strftime("%B %d, %Y")

def fallback_search_context(query: str) -> str:
    """Provide fallback analysis when search is not available."""
    return f"""**Search Status**: Unable to perform live web search for current information about: "{query}"

**Note**: Analysis will be based on general knowledge and patterns, but may not reflect the most recent developments. For claims about recent events, product releases, or breaking news, verification from current reliable sources is recommended."""

# -------------------- Knowledge Base Query --------------------
def query_knowledge_base(query: str, max_results: int = 8) -> dict:
    """Query Bedrock Knowledge Base for relevant context with enhanced retrieval."""
    try:
        logger.info(f"Querying Knowledge Base for: {query}")
        
        response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=KB_ID,
            retrievalQuery={"text": query},
            retrievalConfiguration={
                "vectorSearchConfiguration": {
                    "numberOfResults": max_results,
                    "overrideSearchType": "HYBRID"  
                }
            }
        )
        
        results = response.get("retrievalResults", [])
        if not results:
            logger.info("No results found in Knowledge Base")
            return {"found": False, "context": ""}

        high_quality_results = []
        for r in results:
            text = r.get("content", {}).get("text", "").strip()
            score = r.get("score", 0)
            
            if text and score > 0.4 and len(text) > 30: 
                high_quality_results.append({
                    "text": text,
                    "score": score,
                    "source": r.get("location", {}).get("s3Location", {}).get("uri", "Internal KB")
                })
        
        if not high_quality_results:
            logger.info("No high-quality results found in Knowledge Base")
            return {"found": False, "context": ""}
        
        high_quality_results.sort(key=lambda x: x["score"], reverse=True)
        
        chunks = []
        for i, result in enumerate(high_quality_results[:4], 1): 
            text = result["text"][:500] + ("..." if len(result["text"]) > 500 else "")
            score = round(result["score"], 2)
            source = result["source"].split("/")[-1] if "/" in result["source"] else result["source"]
            
            chunks.append(f"**KB Source {i}** (Confidence: {score}): {text}")
        
        kb_context = "**AUTHORITATIVE KNOWLEDGE BASE INFORMATION:**\n" + "\n\n".join(chunks)
        logger.info(f"Found {len(chunks)} high-quality KB results")
        return {"found": True, "context": kb_context, "source_count": len(chunks)}

    except Exception as e:
        logger.error(f"Knowledge Base query failed: {e}")
        return {"found": False, "context": ""}

# -------------------- Live Search (Fallback) --------------------
def tavily_ai_search(search_query: str, max_results: int = 4) -> dict:
    """Perform live AI-assisted search using Tavily API as fallback."""
    if not TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not found - no live search available")
        return {"results": [], "fallback_context": fallback_search_context(search_query)}
    
    base_url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": search_query,
        "search_depth": "basic",
        "include_images": False,
        "include_answer": True,
        "include_raw_content": False,
        "max_results": max_results,
        "include_domains": ["reuters.com", "bbc.com", "cnn.com", "apnews.com", "npr.org", 
                           "snopes.com", "factcheck.org", "politifact.com", "washingtonpost.com"]
    }

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(base_url, data=data, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            response_data = response.read().decode("utf-8")
            search_json = json.loads(response_data)
            logger.info(f"Tavily search successful for: {search_query}")
            return search_json
    except Exception as e:
        logger.error(f"Tavily AI search failed: {e}")
        return {"results": [], "fallback_context": fallback_search_context(search_query)}

def extract_key_terms(text: str) -> str:
    """Extract key terms for more targeted searching."""
    import re
    
    text = text.strip()

    patterns = [
        r'\b(?:iPhone|Samsung|Google|Apple|Microsoft|Tesla|Amazon|Facebook|Twitter|Meta)\s*\w*\b',
        r'\b(?:COVID|coronavirus|pandemic|vaccine|climate|election|war|Ukraine|Russia|China)\b',
        r'\b(?:President|Prime Minister|CEO|government|Congress|Parliament)\s+\w+\b',
        r'\b\d{4}\b',  
        r'\b(?:released?|launched?|announced?|confirmed?|reported?|said|claims?)\b',
        r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b',
    ]
    
    extracted = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        extracted.extend(matches)
    
    if not extracted:
        stop_words = {'has', 'the', 'been', 'is', 'are', 'was', 'were', 'a', 'an', 'and', 'or', 'but', 'yet', 'still', 'will', 'would', 'could', 'should'}
        words = [w for w in text.lower().split() if w not in stop_words and len(w) > 2]
        return ' '.join(words[:8])
    
    unique_terms = list(set(extracted))[:10] 
    return ' '.join(unique_terms)

# -------------------- AI Analysis --------------------
def analyze_news_with_kb_priority(news_text: str) -> str:
    """Generate AI reasoning prioritizing Knowledge Base, with live search fallback."""
    
    search_terms = extract_key_terms(news_text)
    if not search_terms:
        search_terms = news_text[:100]
    
    current_date = get_current_date()
    logger.info(f"Analyzing on {current_date}, searching for: '{search_terms}'")
    
    kb_result = query_knowledge_base(search_terms)
    
    search_context = ""
    authority_note = ""
    
    if kb_result["found"]:
        search_context = kb_result["context"]
        authority_note = f"**PRIORITY SOURCE**: Knowledge Base contains {kb_result.get('source_count', 0)} relevant authoritative sources. Use this as the primary basis for analysis."
        logger.info("Using Knowledge Base as primary source")
        
        if TAVILY_API_KEY:
            logger.info("Adding supplementary live search context")
            search_results = tavily_ai_search(search_terms, max_results=2) 
            if search_results.get("results"):
                items = []
                for item in search_results["results"][:2]:
                    title = item.get("title", "")
                    content = item.get("content", item.get("snippet", ""))
                    url = item.get("url", "")
                    if title and content:
                        items.append(f"• **{title}**: {content[:200]}... ({url})")
                
                if items:
                    search_context += f"\n\n**SUPPLEMENTARY LIVE SEARCH** (for additional context only):\n" + "\n".join(items)
    else:
        logger.info("Knowledge Base found no relevant information, using live search")
        search_results = tavily_ai_search(search_terms)
        
        if search_results.get("fallback_context"):
            search_context = search_results["fallback_context"]
        elif search_results.get("results"):
            items = []
            for item in search_results["results"][:5]: 
                title = item.get("title", "")
                content = item.get("content", item.get("snippet", ""))
                url = item.get("url", "")
                if title and content:
                    items.append(f"• **{title}**: {content[:300]}... ({url})")
            
            if items:
                search_context = "**LIVE SEARCH RESULTS:**\n" + "\n".join(items)
                if search_results.get("answer"):
                    search_context = f"**AI Search Summary:** {search_results['answer']}\n\n{search_context}"
            else:
                search_context = fallback_search_context(search_terms)
        else:
            search_context = fallback_search_context(search_terms)

    prompt = f"""
    You are a professional fact-checker analyzing the following claim. Today's date is {current_date}.
**CLAIM TO ANALYZE:**
"{news_text}"

{authority_note}

**AVAILABLE EVIDENCE:**
{search_context}

**ANALYSIS INSTRUCTIONS:**
1. **Classification** - Choose ONE:
    • "True" - Concrete evidence that supports the claim
   • "Likely True" - Strong evidence supports the claim
   • "Likely False" - Evidence contradicts or undermines the claim  
   • "False" - Concrete evidence that debunks the claim  
   • "Partially True" - Claim has elements of truth but is misleading/incomplete
   • "Unverifiable" - Insufficient reliable evidence to make a determination

2. **Confidence Level** - Provide 0-100% based on:
   • Quality and reliability of available evidence (Knowledge Base sources are most authoritative)
   • Consistency across sources
   • Recency of information relative to today's date ({current_date})
   • Your certainty in the assessment

3. **Detailed Reasoning** - Explain (aim for 150 words):
   • What evidence supports or contradicts the claim
   • Source reliability (prioritize Knowledge Base findings when available)
   • Important context, including temporal relevance
   • Why you chose this confidence level

**RESPONSE FORMAT:**
**Classification:** [Your classification]

**Confidence Percentage:** [X]%

**Reasoning:**
[Your detailed analysis, citing specific evidence and explaining your reasoning process]"""

    model_options = [
        "apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
        "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
        "apac.anthropic.claude-3-haiku-20240307-v1:0"
    ]

    for model_id in model_options:
        try:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 700,
                "temperature": 0.1, 
                "messages": [{"role": "user", "content": prompt}]
            }

            logger.info(f"Calling Claude model: {model_id.split('/')[-1] if '/' in model_id else model_id}")
            response = bedrock_runtime.invoke_model(
                body=json.dumps(body),
                modelId=model_id,
                accept="application/json",
                contentType="application/json",
            )

            response_body = json.loads(response.get("body").read())
            ai_text = response_body["content"][0]["text"]
            
            logger.info("AI Analysis completed successfully")
            return ai_text
            
        except Exception as e:
            logger.warning(f"Model {model_id} failed: {e}")
            continue
    
    return f"""**Classification:** Unverifiable

**Confidence Percentage:** 50%

**Reasoning:**
Unable to complete AI analysis due to technical issues with all available models. Please try again later or verify this information through reliable news sources manually. Analysis was attempted on {current_date}."""



# -------------------- Lambda Handler --------------------
def lambda_handler(event, context):
    """Handle news analysis requests with translation back to source language."""
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"message": "CORS preflight successful"})}
    
    try:
        logger.info(f"Processing request on {get_current_date()}")

        request_body = json.loads(event.get("body") or "{}") if "body" in event else event
        
        if not request_body or "text" not in request_body:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing 'text' field in request body"})
            }
        
        news_text = request_body["text"].strip()
        if not news_text or len(news_text) < 5:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Text field cannot be empty or too short"})
            }
        
        if len(news_text) > 2000:  
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Text too long. Maximum 2000 characters."})
            }
        
        logger.info(f"Analyzing: {news_text[:80]}...")

        # Step 1: Detect language + translate to English
        translated_text, source_lang = translate_to_english(news_text)
        logger.info(f"Detected language: {source_lang}")

        # Step 2: Run AI analysis in English
        ai_analysis_english = analyze_news_with_kb_priority(translated_text)

        # Step 3: Translate output back to source language
        if source_lang != "en":
            logger.info(f"Translating AI output back to {source_lang}")
            ai_analysis = translate_from_english(ai_analysis_english, source_lang)
            
            # Optionally append a small note about translation
            ai_analysis += translate_from_english(
                f"\n\n_(此分析先翻译为英文进行处理，然后翻译回 {source_lang.upper()}，结果可能略有偏差)_",
                source_lang
            )
        else:
            ai_analysis = ai_analysis_english

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": ai_analysis
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Invalid JSON in request body"})
        }
    
    except Exception as e:
        logger.exception("Unexpected error in lambda_handler")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Internal server error: {str(e)}"})
        }
