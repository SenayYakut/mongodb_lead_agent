"""Meeting API routes"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
from agents.orchestrator.agent import OrchestratorAgent

router = APIRouter()
orchestrator = OrchestratorAgent()

@router.post("/meetings")
async def create_meeting(
    text: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    photos: List[UploadFile] = File([])
):
    """Submit a new meeting for processing with text, audio, and/or photos"""
    try:
        # Process photos if provided (for metadata)
        photo_text = None
        if photos:
            photo_names = [photo.filename for photo in photos]
            photo_text = f"[Photos uploaded: {', '.join(photo_names)}]"
        
        # Start with provided text
        meeting_text = (text or "").strip()
        
        # Audio transcription will be handled by Data Collection Agent
        # Photos will be processed by Data Collection Agent
        
        # Add photo metadata to text if provided
        if photo_text and meeting_text:
            meeting_text = f"{meeting_text}\n{photo_text}"
        elif photo_text:
            meeting_text = photo_text
        
        # At least one input must be provided
        if not meeting_text and not audio and not photos:
            raise HTTPException(status_code=400, detail="Please provide text, audio, or photos")
        
        result = orchestrator.process_meeting(
            meeting_text=meeting_text,
            location=location,
            audio_file=audio,
            photo_files=photos
        )
        return {
            "success": True,
            "meeting_id": result["meeting_id"],
            "person_id": result["person_id"],
            "priority_group": result["priority_group"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
