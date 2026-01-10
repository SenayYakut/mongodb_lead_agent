"""Data Collection Agent - Processes meeting input and creates initial records"""
from agents.base_agent import BaseAgent
from services.agent_registry import register_agent
from services.transcription import transcribe_audio
from datetime import datetime
import uuid

class DataCollectionAgent(BaseAgent):
    """Processes meeting data and creates person/meeting records"""
    
    def __init__(self):
        super().__init__(
            agent_id="data_collection_agent",
            agent_type="data_collection",
            skills=["voice_processing", "image_processing", "data_validation"],
            capabilities={
                "input_types": ["text", "voice", "image"],
                "output_types": ["person_profile", "meeting_record"]
            }
        )
        register_agent(
            self.agent_id,
            self.agent_type,
            self.skills,
            self.capabilities
        )
    
    def process(self, meeting_text, location=None, audio_file=None, photo_files=None):
        """Process meeting input and create records"""
        self.update_status("busy")
        
        try:
            # Create person ID
            person_id = str(uuid.uuid4())
            meeting_id = str(uuid.uuid4())
            
            # Process audio file if provided - transcribe it
            audio_data = None
            transcribed_text = None
            if audio_file:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[DATA_COLLECTION] Processing audio file: {audio_file.filename}")
                
                transcribed_text = transcribe_audio(audio_file)
                
                audio_data = {
                    "filename": audio_file.filename,
                    "content_type": audio_file.content_type,
                    "size": audio_file.size if hasattr(audio_file, 'size') else None,
                    "transcribed": transcribed_text is not None,
                    "transcribed_at": datetime.now().isoformat() if transcribed_text else None
                }
                
                if transcribed_text:
                    logger.info(f"[DATA_COLLECTION] Transcription successful: {len(transcribed_text)} characters")
                    # Combine transcribed text with existing text
                    if meeting_text:
                        meeting_text = f"{meeting_text}\n\n[Audio Transcription]\n{transcribed_text}"
                    else:
                        meeting_text = transcribed_text
                else:
                    logger.warning("[DATA_COLLECTION] Transcription failed or skipped")
            
            # Process photo files if provided (store references for now)
            photo_data = []
            if photo_files:
                for photo in photo_files:
                    photo_data.append({
                        "filename": photo.filename,
                        "content_type": photo.content_type,
                        "size": photo.size if hasattr(photo, 'size') else None
                    })
                    # In production, extract text from images using OCR here
            
            # Create person document
            person = {
                "person_id": person_id,
                "name": None,  # Will be filled by extraction agent
                "company": None,
                "job_title": None,
                "extracted_data": {},
                "researched_data": {},
                "categorization": {},
                "meeting_ids": [meeting_id],
                "created_at": datetime.now()
            }
            
            # Create meeting document
            meeting = {
                "meeting_id": meeting_id,
                "person_id": person_id,
                "date": datetime.now(),
                "location": location or "Unknown",
                "raw_data": {
                    "text": meeting_text,
                    "audio": audio_data,
                    "photos": photo_data,
                    "transcribed_text": transcribed_text  # Store transcription separately
                },
                "summary": {},
                "priority_group": None,
                "status": "processing",
                "created_at": datetime.now()
            }
            
            # Store in MongoDB
            self.db.people.insert_one(person)
            self.db.meetings.insert_one(meeting)
            
            self.update_status("idle")
            
            return {
                "person_id": person_id,
                "meeting_id": meeting_id
            }
        
        except Exception as e:
            self.update_status("idle")
            raise e
