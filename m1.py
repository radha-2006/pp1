# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import google.generativeai as genai
from pinecone import Pinecone
from datetime import datetime
import requests
import json

app = FastAPI()

# Configure Gemini
genai.configure(api_key=os.getenv("AIzaSyCMKBE2zBXsPOMrAvUWGZMy2tDca3AWskc"))
model = genai.GenerativeModel('gemini-pro')

# Configure Pinecone
pc = Pinecone(api_key=os.getenv("pcsk_5dkQ6B_TytUw6sHkjEkaG5zsjwPuXv42fKWyiaPxA4dYYCbinKkxhevWLFguz4V7XtuUbK"))
index_name = "job-market-assistant"
index = pc.Index(index_name)

# Serper API for job market data
SERPER_API_KEY = os.getenv("fcafcc2e551066b3beb71737ff8a15d462fc10e0")

class UserProfile(BaseModel):
    user_id: str
    career_field: str
    preferred_locations: List[str]
    experience_level: str
    skills: List[str]
    last_updated: datetime

class ChatMessage(BaseModel):
    user_id: str
    message: str
    is_new_session: bool = False

@app.post("/initialize_user/")
async def initialize_user(profile: UserProfile):
    try:
        # Store in Pinecone
        profile_dict = profile.dict()
        profile_dict["last_updated"] = str(profile_dict["last_updated"])
        
        vector = model.embed_content(content=json.dumps(profile_dict))["embedding"]
        
        index.upsert(
            vectors=[{
                "id": profile.user_id,
                "values": vector,
                "metadata": profile_dict
            }]
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/")
async def chat(chat_message: ChatMessage):
    try:
        # Retrieve user profile if not new session
        user_profile = None
        if not chat_message.is_new_session:
            results = index.query(
                id=chat_message.user_id,
                top_k=1,
                include_metadata=True
            )
            if results.matches:
                user_profile = results.matches[0].metadata
        
        # Get real-time job market data
        job_data = get_job_market_data(
            user_profile.get("career_field") if user_profile else "technology",
            user_profile.get("preferred_locations") if user_profile else ["United States"]
        )
        
        # Generate response
        prompt = build_prompt(chat_message.message, user_profile, job_data)
        response = model.generate_content(prompt)
        
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_job_market_data(career_field: str, locations: List[str]):
    query = f"Latest job market trends for {career_field} in {', '.join(locations)}"
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    return response.json()

def build_prompt(message: str, user_profile: Optional[dict], job_data: dict):
    base_prompt = """
    You are a helpful AI job market assistant. Provide personalized, data-driven advice to job seekers 
    based on their profile and current job market trends. Be concise but informative.
    """
    
    if user_profile:
        profile_section = f"""
        User Profile:
        - Career Field: {user_profile.get('career_field', 'Not specified')}
        - Preferred Locations: {', '.join(user_profile.get('preferred_locations', []))}
        - Experience Level: {user_profile.get('experience_level', 'Not specified')}
        - Skills: {', '.join(user_profile.get('skills', []))}
        """
    else:
        profile_section = "No user profile available for this session."
    
    job_data_str = json.dumps(job_data, indent=2)
    
    return f"""
    {base_prompt}
    
    {profile_section}
    
    Current Job Market Data:
    {job_data_str}
    
    User Question: {message}
    
    Please provide a helpful response considering the user's profile (if available) and current market trends:
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
