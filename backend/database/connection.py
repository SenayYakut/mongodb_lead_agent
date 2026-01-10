"""MongoDB connection manager"""
from pymongo import MongoClient
from config.settings import MONGODB_URI, DATABASE_NAME

# Global MongoDB client
_client = None
_db = None


def get_client():
    """Get MongoDB client instance"""
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI)
    return _client


def get_database():
    """Get database instance"""
    global _db
    if _db is None:
        client = get_client()
        _db = client[DATABASE_NAME]
    return _db


def close_connection():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        _client = None
