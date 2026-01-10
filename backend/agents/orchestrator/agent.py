"""Orchestrator Agent - Coordinates multi-agent workflows"""
from agents.base_agent import BaseAgent
from services.agent_registry import register_agent, get_agents_by_skills
from agents.data_collection.agent import DataCollectionAgent
from agents.extraction.agent import ExtractionAgent
from agents.summarization.agent import SummarizationAgent
from agents.categorization.agent import CategorizationAgent
import asyncio

class OrchestratorAgent(BaseAgent):
    """Coordinates task assignment and agent workflows"""
    
    def __init__(self):
        super().__init__(
            agent_id="orchestrator_agent",
            agent_type="orchestrator",
            skills=["task_routing", "workflow_coordination", "agent_management"],
            capabilities={
                "input_types": ["task_request", "workflow_trigger"],
                "output_types": ["workflow_result", "task_assignment"]
            }
        )
        register_agent(
            self.agent_id,
            self.agent_type,
            self.skills,
            self.capabilities
        )
        
        # Initialize agent instances
        self.data_collection = DataCollectionAgent()
        self.extraction = ExtractionAgent()
        self.summarization = SummarizationAgent()
        self.categorization = CategorizationAgent()
    
    def process_meeting(self, meeting_text, location=None, audio_file=None, photo_files=None, user_id="default"):
        """Process a new meeting through the agent workflow"""
        self.update_status("busy")
        
        try:
            # Step 1: Data Collection
            print("Step 1: Data Collection Agent")
            result = self.data_collection.process(meeting_text, location, audio_file, photo_files, user_id)
            person_id = result["person_id"]
            meeting_id = result["meeting_id"]
            
            # Step 2: Information Extraction
            print("Step 2: Extraction Agent")
            self.extraction.extract(meeting_text, person_id)
            
            # Step 3: Summarization
            print("Step 3: Summarization Agent")
            self.summarization.summarize(meeting_text, meeting_id, user_id=user_id)
            
            # Step 4: Categorization
            print("Step 4: Categorization Agent")
            priority_group = self.categorization.categorize(person_id, meeting_id)
            
            self.update_status("idle")
            
            return {
                "person_id": person_id,
                "meeting_id": meeting_id,
                "priority_group": priority_group,
                "status": "completed"
            }
        
        except Exception as e:
            self.update_status("idle")
            print(f"Error in workflow: {e}")
            raise e
