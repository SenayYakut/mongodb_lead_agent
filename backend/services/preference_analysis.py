"""Preference analysis service for extracting insights from user comments"""
from config.settings import OPENAI_API_KEY
from openai import OpenAI
import json
import re

def analyze_comments(comments):
    """
    Analyze user comments to extract implicit preferences
    
    Args:
        comments: Free-form text from user
        
    Returns:
        dict: Extracted preferences including custom criteria, value indicators, etc.
    """
    if not comments or not comments.strip():
        return {}
    
    if not OPENAI_API_KEY:
        # Fallback: simple keyword extraction
        return _simple_extract(comments)
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""Analyze this user comment about what they want from networking and extract:
1. Additional industries/companies mentioned
2. Custom criteria (e.g., "Series A or later", "remote-first culture")
3. Value indicators (what makes contacts valuable)
4. Special requirements (geographic, cultural, etc.)
5. Exclusion criteria (what to avoid)

Comment: {comments}

Return as JSON with keys: additional_industries, custom_criteria, value_indicators, special_requirements, exclusion_criteria"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a preference extraction assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON
        try:
            # Remove markdown code blocks if present
            result_text = re.sub(r'```json\s*', '', result_text)
            result_text = re.sub(r'```\s*', '', result_text)
            extracted = json.loads(result_text)
            return extracted
        except:
            # If JSON parsing fails, use simple extraction
            return _simple_extract(comments)
    
    except Exception as e:
        print(f"Error analyzing comments: {e}")
        return _simple_extract(comments)

def _simple_extract(comments):
    """Simple fallback extraction using keyword matching"""
    extracted = {
        "additional_industries": [],
        "custom_criteria": [],
        "value_indicators": [],
        "special_requirements": [],
        "exclusion_criteria": []
    }
    
    # Simple keyword extraction (basic implementation)
    text_lower = comments.lower()
    
    # Look for funding mentions
    if any(word in text_lower for word in ['series a', 'series b', 'funding', 'raised']):
        extracted["custom_criteria"].append("Funding stage mentioned")
    
    # Look for remote work mentions
    if any(word in text_lower for word in ['remote', 'remote-first', 'distributed']):
        extracted["custom_criteria"].append("Remote work culture")
    
    return extracted
