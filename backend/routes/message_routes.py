from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from auth import get_current_user
from database import get_db
from models import User, Conversation, Message, Profile
from pydantic import BaseModel
from datetime import datetime
import re
import os
import httpx
import json
from openai import OpenAI
from typing import Dict, Set
import asyncio

message_router = APIRouter(prefix="/messages", tags=["Messaging"])

class ConnectionManager:
    def __init__(self):
        # chat_id -> set of active websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, chat_id: str, websocket: WebSocket):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(websocket)
        print(f"[WS] Connected to {chat_id}. Total: {len(self.active_connections[chat_id])}")

    def disconnect(self, chat_id: str, websocket: WebSocket):
        if chat_id in self.active_connections:
            self.active_connections[chat_id].discard(websocket)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
        print(f"[WS] Disconnected from {chat_id}")

    async def broadcast_to_chat(self, chat_id: str, message: dict):
        if chat_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[chat_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"[WS] Broadcast error: {e}")
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(chat_id, conn)

manager = ConnectionManager()

@message_router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str):
    # Note: Token validation in WebSockets can be complex via headers.
    # We will assume initial connection is valid for now, but in production
    # we'd check a query param or an initial 'auth' message.
    await manager.connect(chat_id, websocket)
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text()
            # We don't expect messages FROM the socket yet, we send via POST
            # But we could handle heartbeats here
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
    except Exception as e:
        print(f"[WS] Error: {e}")
        manager.disconnect(chat_id, websocket)

def get_pollinations_client():
    api_key = os.getenv("POLLINATIONS_API_KEY")
    if not api_key:
        return None
    http_client = httpx.Client(timeout=30, verify=False)
    return OpenAI(
        api_key=api_key,
        base_url="https://gen.pollinations.ai/v1",
        http_client=http_client
    )

async def generate_suggestions(context: str, user_role: str):
    client = get_pollinations_client()
    if not client:
        return ["Wait, checking...", "One moment.", "Thinking..."]
    
    system_prompt = f"""You are an elite professional assistant for SkillVibe.
Based on the conversation context, generate 3 SHORT suggested replies that the user (who is a {user_role}) could send.
Keep them professional, concise (max 10 words), and distinct.
Return ONLY a JSON array of strings, e.g. ["Great choice!", "Let's schedule a call.", "Thanks for the info!"]"""

    # Model rotation for robustness
    models = ["openai", "mistral", "gemini"]
    
    for model in models:
        try:
            print(f"[DEBUG] Generating suggestions with model: {model}")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Conversation Context:\n{context}\n\nSuggested Replies:"}
                ],
                max_tokens=150,
                timeout=15.0 # Don't hang for too long
            )
            if not response or not response.choices:
                continue
                
            content = response.choices[0].message.content.strip()
            if not content:
                continue
            
            # Robust JSON extraction
            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                suggestions = json.loads(match.group(0))
                if isinstance(suggestions, list) and len(suggestions) > 0:
                    return suggestions[:3]
        except Exception as e:
            print(f"AI Suggestions Error ({model}): {e}")
            continue
        
    return ["Tell me more!", "Sounds interesting.", "I'll get back to you."]

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    content: str
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    chat_id: str
    recruiter_id: int
    candidate_id: int
    last_message: Optional[str] = None
    updated_at: Optional[datetime] = None
    other_user_name: str
    other_user_pic: Optional[str] = None
    other_user_company: Optional[str] = None
    other_user_role: Optional[str] = None
    other_user_location: Optional[str] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

@message_router.get("/", response_model=List[ConversationResponse])
async def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all conversations for the current user (Optimized)"""
    try:
        conversations = db.query(Conversation).filter(
            (Conversation.recruiter_id == current_user.id) | 
            (Conversation.candidate_id == current_user.id)
        ).order_by(Conversation.updated_at.desc()).all()
        
        if not conversations:
            return []
        
        # Batch fetch all other users
        other_user_ids = {
            conv.candidate_id if conv.recruiter_id == current_user.id else conv.recruiter_id
            for conv in conversations
        }
        users_map = {
            u.id: u for u in db.query(User).filter(User.id.in_(other_user_ids)).all()
        }

        # Batch fetch unread counts
        from sqlalchemy import func
        unread_counts = db.query(
            Message.conversation_id, func.count(Message.id)
        ).filter(
            Message.conversation_id.in_([c.id for c in conversations]),
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).group_by(Message.conversation_id).all()
        
        unread_map = {conv_id: count for conv_id, count in unread_counts}
        
        results = []
        for conv in conversations:
            other_id = conv.candidate_id if conv.recruiter_id == current_user.id else conv.recruiter_id
            other_user = users_map.get(other_id)
            
            results.append({
                "id": conv.id,
                "chat_id": conv.chat_id,
                "recruiter_id": conv.recruiter_id,
                "candidate_id": conv.candidate_id,
                "last_message": conv.last_message,
                "updated_at": conv.updated_at,
                "other_user_name": other_user.full_name or other_user.username if other_user else "Deleted User",
                "other_user_pic": other_user.profile_picture if other_user else None,
                "other_user_company": other_user.company_info if other_user else None,
                "other_user_role": other_user.role if other_user else None,
                "other_user_location": other_user.company_location if other_user else None,
                "unread_count": unread_map.get(conv.id, 0)
            })
        
        return results
    except Exception as e:
        print(f"[ERROR] get_conversations failed for user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversations: {str(e)}")

@message_router.get("/{chat_id}/suggestions")
async def get_suggested_replies(chat_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get AI suggested replies based on conversation history"""
    try:
        conv = db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.recruiter_id != current_user.id and conv.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Fetch last 5 messages for context
        messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).limit(5).all()
        messages.reverse() # Back to chronological
        
        # If the last message was sent by ME, don't suggest anything (UX: wait for their reply)
        if messages and messages[-1].sender_id == current_user.id:
            return []
            
        context = ""
        for msg in messages:
            sender_label = "Me" if msg.sender_id == current_user.id else "Other"
            context += f"{sender_label}: {msg.content}\n"
        
        user_role = "recruiter" if conv.recruiter_id == current_user.id else "candidate"
        
        suggestions = await generate_suggestions(context, user_role)
        return suggestions
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_suggested_replies failed for chat_id={chat_id}, user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@message_router.get("/{chat_id}/info")
async def get_conversation_info(chat_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get lightweight conversation metadata without loading all messages"""
    try:
        conv = db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.recruiter_id != current_user.id and conv.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        other_id = conv.candidate_id if conv.recruiter_id == current_user.id else conv.recruiter_id
        other_user = db.query(User).filter(User.id == other_id).first()
        
        return {
            "id": conv.id,
            "chat_id": conv.chat_id,
            "recruiter_id": conv.recruiter_id,
            "candidate_id": conv.candidate_id,
            "other_user_name": other_user.full_name or other_user.username if other_user else "Deleted User",
            "other_user_pic": other_user.profile_picture if other_user else None,
            "other_user_company": other_user.company_info if other_user else None,
            "other_user_role": other_user.role if other_user else None,
            "other_user_location": other_user.company_location if other_user else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_conversation_info failed for chat_id={chat_id}, user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get conversation info: {str(e)}")

@message_router.get("/{chat_id}", response_model=List[MessageResponse])
async def get_messages(chat_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all messages in a conversation"""
    try:
        conv = db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.recruiter_id != current_user.id and conv.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
        messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
        
        # Ensure we're returning serializable objects
        response_data = []
        for msg in messages:
            response_data.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "content": msg.content,
                "created_at": msg.created_at,
                "is_read": msg.is_read
            })
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] get_messages failed for chat_id={chat_id}, user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve messages: {str(e)}")

@message_router.post("/{chat_id}/read")
async def mark_conversation_read(chat_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark all messages in a conversation as read"""
    try:
        conv = db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        updated_count = db.query(Message).filter(
            Message.conversation_id == conv.id, 
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).update({"is_read": True})
        
        if updated_count > 0:
            db.commit()
        
        return {"status": "success", "marked_read": updated_count}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] mark_conversation_read failed for chat_id={chat_id}, user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to mark messages as read: {str(e)}")

@message_router.post("/{chat_id}/send")
async def send_message(chat_id: str, payload: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Send a new message"""
    try:
        conv = db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.recruiter_id != current_user.id and conv.candidate_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to message here")
        
        new_msg = Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=payload.content
        )
        
        conv.last_message = payload.content[:100]
        conv.updated_at = datetime.utcnow()
        
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        
        # Broadcast to WebSocket users
        msg_data = {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "content": new_msg.content,
            "created_at": new_msg.created_at.isoformat(),
            "is_read": new_msg.is_read
        }
        await manager.broadcast_to_chat(chat_id, msg_data)
        
        return new_msg
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] send_message failed for chat_id={chat_id}, user_id={current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
