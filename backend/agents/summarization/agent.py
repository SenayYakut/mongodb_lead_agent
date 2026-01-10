"""Summarization Agent - Creates conversation summaries"""
from agents.base_agent import BaseAgent
from services.agent_registry import register_agent
from config.settings import OPENAI_API_KEY
from openai import OpenAI
from datetime import datetime

class SummarizationAgent(BaseAgent):
    """Creates concise summaries of conversations"""
    
    def __init__(self):
        super().__init__(
            agent_id="summarization_agent",
            agent_type="summarization",
            skills=["text_summarization", "conversation_analysis"],
            capabilities={
                "input_types": ["text", "conversation"],
                "output_types": ["summary", "key_points"]
            }
        )
        register_agent(
            self.agent_id,
            self.agent_type,
            self.skills,
            self.capabilities
        )
        self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
    
    def summarize(self, text, meeting_id):
        """Create summary of conversation"""
        self.update_status("busy")
        
        try:
            if not self.client:
                # Fallback: simple summary
                return self._simple_summarize(text, meeting_id)
            
            prompt = f"""Summarize this networking conversation in 2-3 sentences. 
Highlight key discussion points, mutual interests, and any commitments made.

Conversation: {text}"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a conversation summarization assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5
            )
            
            summary_text = response.choices[0].message.content.strip()
            
            # Update meeting document
            self.db.meetings.update_one(
                {"meeting_id": meeting_id},
                {
                    "$set": {
                        "summary": {
                            "text": summary_text,
                            "key_points": [],
                            "created_at": datetime.now()
                        }
                    }
                }
            )
            
            self.update_status("idle")
            return summary_text
        
        except Exception as e:
            self.update_status("idle")
            return self._simple_summarize(text, meeting_id)
    
    def _simple_summarize(self, text, meeting_id):
        """Simple fallback summary"""
        # Truncate text as simple summary
        summary = text[:200] + "..." if len(text) > 200 else text
        
        self.db.meetings.update_one(
            {"meeting_id": meeting_id},
            {
                "$set": {
                    "summary": {
                        "text": summary,
                        "key_points": [],
                        "created_at": datetime.now()
                    }
                }
            }
        )
        
        return summary
