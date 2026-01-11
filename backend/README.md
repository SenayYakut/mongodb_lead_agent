# Networking Assistant Backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```
Tip: you can start from the included template:
```bash
cp .env.example .env
```

3. Setup database:
```bash
python scripts/setup_database.py
```

4. Run server:
```bash
uvicorn api.main:app --reload
```

API will be available at `http://localhost:8000`
