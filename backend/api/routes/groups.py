"""Groups API routes"""
from fastapi import APIRouter
from database.connection import get_database

router = APIRouter()

@router.get("/groups")
async def get_groups():
    """Get all meetings grouped by priority (P0, P1, P2)"""
    db = get_database()
    
    # Aggregate meetings grouped by priority_group
    pipeline = [
        {
            "$match": {
                "priority_group": {"$in": ["P0", "P1", "P2"]},
                "status": "completed"
            }
        },
        {
            "$lookup": {
                "from": "people",
                "localField": "person_id",
                "foreignField": "person_id",
                "as": "person"
            }
        },
        {
            "$unwind": "$person"
        },
        {
            "$group": {
                "_id": "$priority_group",
                "meetings": {
                    "$push": {
                        "name": "$person.name",
                        "company": "$person.company",
                        "designation": "$person.job_title",
                        "summary": "$summary.text",
                        "meeting_date": "$date",
                        "meeting_id": "$meeting_id"
                    }
                }
            }
        }
    ]
    
    results = list(db.meetings.aggregate(pipeline))
    
    # Format response
    groups = {"P0": [], "P1": [], "P2": []}
    
    for result in results:
        priority = result["_id"]
        if priority in groups:
            groups[priority] = result["meetings"]
    
    return groups
