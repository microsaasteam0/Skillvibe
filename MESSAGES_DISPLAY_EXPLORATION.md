# Messages Count Display System - Frontend Exploration

## Executive Summary
The SkillVibe application has a complete messages/conversations system with unread count tracking at the database level, but **there is currently NO message count badge displayed in the navbar/header**. Message counts are only visible on the `/messages` page itself.

---

## 1. NAVBAR/HEADER COMPONENTS

### **AuthenticatedNavbar.tsx** ← PRIMARY HEADER
📍 **Location:** [frontend/components/AuthenticatedNavbar.tsx](frontend/components/AuthenticatedNavbar.tsx)

**Current Implementation:**
- Logo, desktop navigation, usage stats, logout button, user avatar
- **NO message badge or count display**
- Shows pricing navigation with a highlight dot if user is not premium
- Renders DashboardModal on avatar click

**Key Functions:**
- `loadUsageStats()`: Fetches usage stats only (not messages)
- `refreshUsageStats()`: Refreshes generation stats using `/api/v1/auth/usage-stats`
- Uses caching via `requestCache` with 30-60 minute TTL

**State Variables:**
```javascript
const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
const [statsLoading, setStatsLoading] = useState(false)
const [showDashboard, setShowDashboard] = useState(false)
const [scrolled, setScrolled] = useState(false)
```

### **MobileMenu.tsx** ← MOBILE NAVIGATION
📍 **Location:** [frontend/components/MobileMenu.tsx](frontend/components/MobileMenu.tsx)

**Current Implementation:**
- Slide-in menu for mobile users
- Has "Messages" link pointing to `/messages` with MessageSquare icon
- **NO message count badge**
- Contextual links based on user role (candidate/recruiter)

**Recruiter Links:**
```javascript
{ name: 'Job Posts', href: '/recruiter/jobs', icon: Briefcase },
{ name: 'AI Scout', href: '/ai-scout', icon: Sparkles },
{ name: 'Messages', href: '/messages', icon: MessageSquare }
```

**Candidate Links:**
```javascript
{ name: 'Messages', href: '/messages', icon: MessageSquare }
```

---

## 2. MESSAGES PAGE & DISPLAY

### **Messages Page** - [frontend/app/messages/page.tsx](frontend/app/messages/page.tsx)

**API Integration:**
```javascript
const response = await axios.get(`${API_URL}/api/v1/messages/`)
```

**Data Structure Returned:**
```typescript
interface Conversation {
    id: number
    chat_id: string
    recruiter_id: number
    candidate_id: number
    last_message: string
    updated_at: string
    other_user_name: string
    other_user_pic?: string
    other_user_company?: string
    other_user_role?: string
    other_user_location?: string
    unread_count: number  // ← KEY FIELD
}
```

**How Unread Count is Displayed:**
```jsx
{conv.unread_count > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 
           rounded-full border-4 border-black flex items-center justify-center 
           animate-bounce shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
)}

{/* Badge showing count */}
{conv.unread_count > 0 && (
    <div className="px-2.5 py-1 rounded-full bg-cyan-500 text-black 
          text-[10px] font-black animate-pulse">
        {conv.unread_count} NEW
    </div>
)}
```

**Polling Strategy:**
```javascript
// Refreshes conversations every 3 seconds when page is visible
let pollingInterval = setInterval(fetchConversations, 3000)

// Respects document visibility
const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        startPolling()
    } else {
        clearInterval(pollingInterval)
    }
}
```

---

## 3. DASHBOARD MODAL

### **DashboardModal.jsx** 
📍 **Location:** [frontend/components/DashboardModal.jsx](frontend/components/DashboardModal.jsx)

**Current Implementation:**
- Shows user profile, settings, applied jobs, vibe notes, subscription info
- **NO message count tracking or display**
- Has a "Messages" menu item that navigates to `/messages` page
- Only fetches: usage stats, applied jobs, vibe notes

**Messages Integration:**
```jsx
{ id: 'messages', 
  name: 'Messages', 
  icon: MessageSquare, 
  color: 'text-indigo-400', 
  bg: 'bg-indigo-400/10' }

// On click:
if (item.id === 'messages') {
    onClose()
    router.push('/messages')
}
```

**Current API Calls (NOT including messages):**
- `GET /api/v1/auth/usage-stats` - Usage statistics
- `GET /api/v1/jobs/candidate/me` - Applied jobs (candidates only)
- `GET /api/v1/skillvibe/vibe-notes/me` - Vibe notes

---

## 4. BACKEND MESSAGE API

### **Backend Endpoints** - [backend/routes/message_routes.py](backend/routes/message_routes.py)

**Available Endpoints:**

#### GET `/messages/` - List all conversations
```python
@message_router.get("/", response_model=List[ConversationResponse])
async def get_conversations(current_user: User = Depends(get_current_user), 
                           db: Session = Depends(get_db))
```

**Returns:** Array of ConversationResponse with `unread_count` calculated from:
```python
# Batch fetch unread counts
unread_counts = db.query(
    Message.conversation_id, func.count(Message.id)
).filter(
    Message.conversation_id.in_([c.id for c in conversations]),
    Message.sender_id != current_user.id,
    Message.is_read == False
).group_by(Message.conversation_id).all()
```

**Response Model:**
```python
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
    unread_count: int = 0  # ← CALCULATED FIELD
```

#### Other Endpoints:
- `GET /{chat_id}/suggestions` - AI suggested replies
- `GET /{chat_id}/info` - Conversation info
- `GET /{chat_id}` - Get messages in conversation
- `POST /{chat_id}/read` - Mark messages as read
- `POST /{chat_id}/send` - Send message
- `WebSocket /ws/{chat_id}` - Real-time messaging

---

## 5. CONTEXT & HOOKS

### **Available Contexts:**
📍 **Location:** [frontend/contexts/](frontend/contexts/)

Current contexts:
- `AuthContext.tsx` - User authentication
- `SubscriptionContext.tsx` - Subscription management
- `UserPreferencesContext.tsx` - User preferences
- `ThemeContext.tsx` - Theme switching
- `PaymentProcessingContext.tsx` - Payment state

**⚠️ NO dedicated MessageContext exists**

### **Available Hooks:**
📍 **Location:** [frontend/hooks/](frontend/hooks/)

Current hooks:
- `useFeatureGate.ts` - Feature flagging
- `useScrollLock.ts` - Scroll management
- `useTopProgressBar.ts` - Progress bar control

**⚠️ NO custom useMessages hook exists**

---

## 6. STATE MANAGEMENT ARCHITECTURE

### How Message Count Data Flows:

```
┌─────────────────────────────────────┐
│  User Opens /messages Page          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  axios.get('/api/v1/messages/')     │
│  (Initial + Polling every 3 sec)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  ConversationResponse[] returned     │
│  Each has: unread_count             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  State: [conversations, setConv]    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Render conversation list with      │
│  unread badges and highlighting     │
└─────────────────────────────────────┘
```

### Current State Management:
- **Page-level state only** - Messages data not shared globally
- **Polling-based** - Not event-driven (WebSocket available but not used for navbar)
- **No cache layer** - Fresh fetch every 3 seconds on messages page
- **No background updates** - Data only updates when on /messages page

---

## 7. GAP ANALYSIS - What's Missing

### **Critical Gaps:**

| Feature | Status | Location |
|---------|--------|----------|
| **Navbar message badge** | ❌ NOT IMPLEMENTED | Should be in AuthenticatedNavbar.tsx |
| **Global message state** | ❌ NO CONTEXT | Need MessageContext |
| **Background polling** | ❌ NOT RUNNING | Should poll globally, not just on page |
| **Real-time updates** | ⚠️ PARTIAL | WebSocket exists but not used for navbar |
| **Hook for messages** | ❌ NO HOOK | useMessages() hook needed |
| **Dashboard message count** | ❌ NOT SHOWN | DashboardModal doesn't fetch |
| **Mobile menu badge** | ❌ NOT SHOWN | MobileMenu should show count |

---

## 8. API CACHING & PERFORMANCE

### Current Caching Strategy:
```javascript
// Frontend uses custom cache utility
const stats = await requestCache.get(
    cacheKey,
    async () => {
        const response = await axios.get(`${API_URL}/api/...`)
        return response.data
    },
    30 * 60 * 1000  // 30-60 minute TTL
)
```

**Cache Location:** [frontend/lib/cache-util.ts](frontend/lib/cache-util.ts)

---

## 9. IMPLEMENTATION RECOMMENDATIONS

### For Displaying Message Count in Navbar:

1. **Create MessageContext** - Global state for message count
2. **Create useMessages hook** - Custom hook to fetch/update messages
3. **Add background polling** - Update message count every 30-60 seconds globally
4. **Update AuthenticatedNavbar** - Add message badge component
5. **Update MobileMenu** - Add message count to Messages link
6. **Update DashboardModal** - Add message count section
7. **Consider WebSocket** - For real-time updates instead of polling

---

## Summary Table

| Component | File | Has Messages Badge | Fetches Messages | Polling |
|-----------|------|-------------------|------------------|---------|
| **AuthenticatedNavbar** | [AuthenticatedNavbar.tsx](frontend/components/AuthenticatedNavbar.tsx) | ❌ NO | ❌ NO | ❌ NO |
| **MobileMenu** | [MobileMenu.tsx](frontend/components/MobileMenu.tsx) | ❌ NO | ❌ NO | ❌ NO |
| **DashboardModal** | [DashboardModal.jsx](frontend/components/DashboardModal.jsx) | ❌ NO | ❌ NO | ❌ NO |
| **Messages Page** | [app/messages/page.tsx](frontend/app/messages/page.tsx) | ✅ YES | ✅ YES | ✅ YES (3s) |
| **Backend API** | [message_routes.py](backend/routes/message_routes.py) | N/A | ✅ YES | N/A |

