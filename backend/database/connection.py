"""MongoDB connection manager"""
from pymongo import MongoClient
from config.settings import MONGODB_URI, DATABASE_NAME
from pymongo.errors import PyMongoError

# Global MongoDB client
_client = None
_db = None


def get_client():
    """Get MongoDB client instance"""
    global _client
    if _client is None:
        # Keep timeouts low so the API fails fast (especially in dev environments
        # where MongoDB may not be running).
        uri = MONGODB_URI or "mongodb://localhost:27017"
        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=2000,
            connectTimeoutMS=2000,
            socketTimeoutMS=2000,
        )
        try:
            # Force a connection attempt now (otherwise errors happen later and can
            # look like random failures deep in the call stack).
            _client.admin.command("ping")
        except PyMongoError as e:
            _client = None
            raise RuntimeError(
                "MongoDB is not reachable. Set MONGODB_URI (recommended: MongoDB Atlas) "
                "or start a local MongoDB instance on mongodb://localhost:27017."
            ) from e
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
