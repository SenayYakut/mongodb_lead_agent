"""Categorization Agent - Groups contacts into P0, P1, P2"""
from agents.base_agent import BaseAgent
from services.agent_registry import register_agent
from datetime import datetime
import random

class CategorizationAgent(BaseAgent):
    """Categorizes contacts by priority (P0, P1, P2)"""
    
    def __init__(self):
        super().__init__(
            agent_id="categorization_agent",
            agent_type="categorization",
            skills=["scoring", "categorization", "priority_assignment"],
            capabilities={
                "input_types": ["person_profile", "meeting_data"],
                "output_types": ["priority_group", "score"]
            }
        )
        register_agent(
            self.agent_id,
            self.agent_type,
            self.skills,
            self.capabilities
        )
    
    def categorize(self, person_id, meeting_id):
        """Categorize contact into P0, P1, or P2"""
        self.update_status("busy")
        
        try:
            # Get person data
            person = self.db.people.find_one({"person_id": person_id})
            meeting = self.db.meetings.find_one({"meeting_id": meeting_id})
            
            if not person or not meeting:
                raise ValueError("Person or meeting not found")
            
            # Simple scoring logic (for demo)
            # In real implementation, this would use user preferences
            score = self._calculate_score(person, meeting)
            
            # Assign priority group
            if score >= 0.7:
                priority_group = "P0"
            elif score >= 0.4:
                priority_group = "P1"
            else:
                priority_group = "P2"
            
            # Update person
            self.db.people.update_one(
                {"person_id": person_id},
                {
                    "$set": {
                        "categorization": {
                            "score": score,
                            "priority_group": priority_group,
                            "reasons": [f"Score: {score:.2f}"],
                            "categorized_at": datetime.now()
                        }
                    }
                }
            )
            
            # Update meeting
            self.db.meetings.update_one(
                {"meeting_id": meeting_id},
                {
                    "$set": {
                        "priority_group": priority_group,
                        "status": "completed"
                    }
                }
            )
            
            self.update_status("idle")
            return priority_group
        
        except Exception as e:
            self.update_status("idle")
            raise e
    
    def _calculate_score(self, person, meeting):
        """Calculate priority score (simplified for demo)"""
        score = 0.5  # Base score
        
        # Boost score if we have more information
        if person.get("name") and person["name"] != "Unknown":
            score += 0.1
        if person.get("company") and person["company"] != "Unknown":
            score += 0.1
        if person.get("job_title") and person["job_title"] != "Unknown":
            score += 0.1
        
        # Add some randomness for demo variety
        score += random.uniform(-0.2, 0.2)
        
        return max(0.0, min(1.0, score))
