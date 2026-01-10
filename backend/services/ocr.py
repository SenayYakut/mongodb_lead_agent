"""OCR service for extracting text from images using OpenAI Vision API"""
from config.settings import OPENAI_API_KEY
from openai import OpenAI
import base64
import logging

logger = logging.getLogger(__name__)

def extract_text_from_image(image_file):
    """
    Extract text from image using OpenAI Vision API
    
    Args:
        image_file: FastAPI UploadFile object
        
    Returns:
        str: Extracted text or None if extraction fails
    """
    if not OPENAI_API_KEY:
        logger.warning("[OCR] OPENAI_API_KEY not set. Skipping OCR.")
        return None
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Read image content
        image_content = image_file.file.read()
        image_file.file.seek(0)  # Reset for potential reuse
        
        # Encode image to base64
        base64_image = base64.b64encode(image_content).decode('utf-8')
        
        # Determine image format
        content_type = image_file.content_type or "image/jpeg"
        
        # Use Vision API to extract text
        logger.info(f"[OCR] Processing image: {image_file.filename}")
        
        response = client.chat.completions.create(
            model="gpt-4o",  # or "gpt-4-turbo" for vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Include names, companies, job titles, contact information, and any other relevant text. Return the text in a structured format."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{content_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        extracted_text = response.choices[0].message.content.strip()
        logger.info(f"[OCR] Successfully extracted text: {len(extracted_text)} characters")
        logger.info(f"[OCR] Extracted text preview: {extracted_text[:100]}...")
        
        return extracted_text
    
    except Exception as e:
        logger.error(f"[OCR] Error extracting text from image {image_file.filename}: {str(e)}")
        return None
