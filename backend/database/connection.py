"""MongoDB connection manager"""
import os
from pymongo import MongoClient
from config.settings import MONGODB_URI, DATABASE_NAME

# Global MongoDB client
_client = None
_db = None


def get_client():
    """Get MongoDB client instance"""
    global _client
    if _client is None:
        # If MONGODB_URI isn't set, PyMongo defaults to localhost anyway, but we make it explicit
        # and keep timeouts short so the API doesn't hang for ~30s on startup when Mongo isn't running.
        uri = (MONGODB_URI or "").strip() or "mongodb://localhost:27017"

        server_selection_timeout_ms = int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "2000"))
        connect_timeout_ms = int(os.getenv("MONGODB_CONNECT_TIMEOUT_MS", "2000"))
        socket_timeout_ms = int(os.getenv("MONGODB_SOCKET_TIMEOUT_MS", "2000"))

        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=server_selection_timeout_ms,
            connectTimeoutMS=connect_timeout_ms,
            socketTimeoutMS=socket_timeout_ms,
        )
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
