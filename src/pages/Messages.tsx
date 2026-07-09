import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Send, MoreVertical, Bot, ChevronLeft, Trash2, Edit2, Check, X, Tag } from 'lucide-react'
import { chatApi, marketerApi, chatbotApi } from '../api/client'
import type { MessageDto } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Conversation {
  partnerId: number
  partnerName: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  messages: MessageDto[]
}

const avatarColors = [
  'bg-amber-400', 'bg-yellow-500', 'bg-orange-500',
  'bg-amber-600', 'bg-blue-500', 'bg-indigo-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
]

function getColor(id: number) {
  return avatarColors[id % avatarColors.length]
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Get current user ID from JWT token stored in localStorage
function getCurrentUserId(): number | null {
  const token = localStorage.getItem('affiliance_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Common JWT claims for user ID
    return payload.nameid || payload.sub || payload.userId || payload.id || null
  } catch {
    return null
  }
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newReceiverId, setNewReceiverId] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState('')
  const [promoDesc, setPromoDesc] = useState('')
  const [useSimulatorMode, setUseSimulatorMode] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentUserId = getCurrentUserId()
  const { role } = useAuth()

  const buildConversations = useCallback((messages: MessageDto[]): Conversation[] => {
    const map = new Map<number, Conversation>()

    messages.forEach(msg => {
      const isMe = msg.senderId === currentUserId
      const partnerId = isMe ? msg.receiverId! : msg.senderId!
      const partnerName = isMe
        ? (msg.receiverName || `User #${msg.receiverId}`)
        : (msg.senderName || `User #${msg.senderId}`)

      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: '',
          lastTime: '',
          unreadCount: 0,
          messages: []
        })
      }

      const conv = map.get(partnerId)!
      conv.messages.push(msg)
      if (!msg.isRead && !isMe) conv.unreadCount++
    })

    // Sort messages within each conversation by sentAt, then sort conversations by latest message
    const convList = Array.from(map.values())
    convList.forEach(c => {
      c.messages.sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime())
      const last = c.messages[c.messages.length - 1]
      c.lastMessage = last?.content || ''
      c.lastTime = timeAgo(last?.sentAt)
    })

    convList.sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.sentAt || ''
      const bLast = b.messages[b.messages.length - 1]?.sentAt || ''
      return new Date(bLast).getTime() - new Date(aLast).getTime()
    })

    return convList
  }, [currentUserId])

  const fetchSimulatorConversations = useCallback(async () => {
    setFetching(true)
    setError(null)
    setUseSimulatorMode(true)
    try {
      let rawContacts: any[] = []
      const roleLower = role?.toLowerCase()
      
      if (roleLower === 'company') {
        rawContacts = [
          { id: 201, name: 'Ahmed Hassan', company: 'Marketer Partner', avatar: 'A', color: 'bg-indigo-500', online: true },
          { id: 202, name: 'Yasmine Ali', company: 'Social Influencer', avatar: 'Y', color: 'bg-pink-500', online: true },
          { id: 203, name: 'John Smith', company: 'SEO Expert', avatar: 'J', color: 'bg-purple-500', online: false }
        ]
      } else {
        try {
          const res = await marketerApi.getmyapplications({ PageSize: 50 })
          const applications = (res as any)?.data || (res as any)?.items || res || []
          if (Array.isArray(applications) && applications.length > 0) {
            rawContacts = applications.map((app: any, idx: number) => {
              const brandName = app.campaignTitle || 'Brand Partner';
              return {
                id: app.campaignId || (100 + idx),
                name: brandName,
                company: app.campaignTitle || 'Marketing Campaign',
                avatar: brandName.charAt(0),
                color: avatarColors[idx % avatarColors.length],
                online: Math.random() > 0.4
              }
            })
          }
        } catch (e) {
          console.warn('Failed to fetch applications, using fallback contacts:', e)
        }
        
        if (rawContacts.length === 0) {
          rawContacts = [
            { id: 101, name: 'Sarah Jenkins', company: 'Gourmet Delivery Service', avatar: 'S', color: 'bg-amber-400', online: true },
            { id: 102, name: 'Alex Rivera', company: 'Fitness Supplement Launch', avatar: 'A', color: 'bg-blue-500', online: true },
            { id: 103, name: 'Emma Chen', company: 'Organic Health Products', avatar: 'E', color: 'bg-teal-500', online: false }
          ]
        }
      }

      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}

      const convs: Conversation[] = rawContacts.map(c => {
        let msgs = messageMap[c.id] || []
        if (msgs.length === 0) {
          msgs = [{
            id: c.id * 1000,
            senderId: c.id,
            senderName: c.name,
            receiverId: currentUserId || 999,
            receiverName: 'Me',
            content: `Hi! I'm the representative for ${c.company || c.name}. Let's discuss our affiliate partnership!`,
            sentAt: new Date(Date.now() - 3600000).toISOString(),
            isRead: true
          }]
          messageMap[c.id] = msgs
        }

        const last = msgs[msgs.length - 1]
        return {
          partnerId: c.id,
          partnerName: c.name,
          lastMessage: last?.content || '',
          lastTime: timeAgo(last?.sentAt),
          unreadCount: msgs.filter((m: any) => !m.isRead && m.senderId !== currentUserId).length,
          messages: msgs
        }
      })

      localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))
      setConversations(convs)
      if (convs.length > 0 && !activePartnerId) {
        setActivePartnerId(convs[0].partnerId)
      }
    } catch (err) {
      console.error('Simulator fetch error:', err)
      setError('Failed to initialize simulator.')
    } finally {
      setFetching(false)
    }
  }, [role, currentUserId, activePartnerId])

  const simulateAiReply = async (partnerId: number, partnerName: string, userText: string) => {
    setIsTyping(true)
    try {
      const prompt = `Act as ${partnerName} representative. A marketer said: "${userText}". Keep it professional and related to affiliate marketing.`
      
      let aiResponse: string | null = null

      try {
        const res = await chatbotApi.postsend(prompt) as any
        aiResponse = res?.response || res?.data?.response || res?.reply || res?.data?.reply || res?.text || res?.data?.text || (typeof res === 'string' ? res : null)
      } catch (backendErr) {
        console.warn('Backend chatbot unavailable, trying Gemini fallback...', backendErr)
      }

      if (!aiResponse) {
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string
        if (geminiKey) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
                })
              }
            )
            const geminiData = await geminiRes.json()
            if (geminiData.error) {
              aiResponse = `Gemini API Error: ${geminiData.error.message}`
            } else {
              aiResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null
            }
          } catch (geminiErr) {
            console.error('Gemini fallback failed:', geminiErr)
          }
        }
      }

      if (!aiResponse) {
        aiResponse = `Thanks for your message! Let's work together to make this campaign a success.`
      }

      const aiMsg: MessageDto = {
        id: Date.now() + 1,
        senderId: partnerId,
        senderName: partnerName,
        receiverId: currentUserId || 999,
        receiverName: 'Me',
        content: aiResponse,
        sentAt: new Date().toISOString(),
        isRead: false
      }

      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}
      messageMap[partnerId] = [...(messageMap[partnerId] || []), aiMsg]
      localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))

      setConversations(prev => prev.map(c => {
        if (c.partnerId !== partnerId) return c
        return {
          ...c,
          lastMessage: aiResponse!,
          lastTime: 'Just now',
          messages: [...c.messages, aiMsg]
        }
      }))
    } catch (err) {
      console.error('AI Reply Error:', err)
    } finally {
      setIsTyping(false)
    }
  }

  const fetchMessages = useCallback(async () => {
    setFetching(true)
    setError(null)
    try {
      const msgs = await chatApi.getAll() as MessageDto[]
      const convs = buildConversations(Array.isArray(msgs) ? msgs : [])
      setConversations(convs)
      if (convs.length > 0 && !activePartnerId) {
        setActivePartnerId(convs[0].partnerId)
      }
    } catch (err: any) {
      console.warn('Backend chat API failed, falling back to local simulator:', err)
      await fetchSimulatorConversations()
    } finally {
      setFetching(false)
    }
  }, [buildConversations, activePartnerId, fetchSimulatorConversations])

  useEffect(() => {
    fetchMessages()
    // Poll every 15 seconds for new messages
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, []) // Only run once on mount

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activePartnerId, conversations, isTyping])

  const activeConversation = conversations.find(c => c.partnerId === activePartnerId)

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !activePartnerId || loading) return

    const text = input.trim()
    setInput('')
    setLoading(true)

    if (useSimulatorMode) {
      const userMsg: MessageDto = {
        id: Date.now(),
        senderId: currentUserId || 999,
        senderName: 'Me',
        receiverId: activePartnerId,
        receiverName: activeConversation?.partnerName || 'Brand',
        content: text,
        sentAt: new Date().toISOString(),
        isRead: true
      }
      
      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}
      messageMap[activePartnerId] = [...(messageMap[activePartnerId] || []), userMsg]
      localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))

      setConversations(prev => prev.map(c => {
        if (c.partnerId !== activePartnerId) return c
        return {
          ...c,
          lastMessage: text,
          lastTime: 'Just now',
          messages: [...c.messages, userMsg]
        }
      }))

      simulateAiReply(activePartnerId, activeConversation?.partnerName || 'Brand', text)
      setLoading(false)
      return
    }

    try {
      await chatApi.send({ receiverId: activePartnerId, content: text })
      setConversations(prev => prev.map(c => {
        if (c.partnerId !== activePartnerId) return c
        return { ...c, lastMessage: text, lastTime: 'Just now' }
      }))
      setTimeout(fetchMessages, 2000)
    } catch (err: any) {
      setError(err?.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const rid = parseInt(newReceiverId)
    if (!rid || isNaN(rid) || !input.trim() || loading) return

    setLoading(true)
    try {
      await chatApi.send({ receiverId: rid, content: input.trim() })
      setInput('')
      setNewReceiverId('')
      setShowNewChat(false)
      await fetchMessages()
      setActivePartnerId(rid)
      setShowSidebar(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  // Duplicate handleDelete and handleEdit removed here to use the unified simulator-aware ones defined below

  const handleSendPromo = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!promoCode.trim() || !activePartnerId || loading) return
    setLoading(true)
    if (useSimulatorMode) {
      const promoMsg: MessageDto = {
        id: Date.now(),
        senderId: currentUserId || 999,
        senderName: 'Me',
        receiverId: activePartnerId,
        receiverName: activeConversation?.partnerName || 'Brand',
        content: `PROMO CODE: ${promoCode.trim()} ${promoDiscount ? `(${promoDiscount}% OFF)` : ''} ${promoDesc ? `- ${promoDesc}` : ''}`,
        sentAt: new Date().toISOString(),
        isRead: true,
        isPromoCode: true
      }

      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}
      messageMap[activePartnerId] = [...(messageMap[activePartnerId] || []), promoMsg]
      localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))

      setConversations(prev => prev.map(c => {
        if (c.partnerId !== activePartnerId) return c
        return {
          ...c,
          lastMessage: `Promo Code: ${promoCode}`,
          lastTime: 'Just now',
          messages: [...c.messages, promoMsg]
        }
      }))

      setPromoCode('')
      setPromoDiscount('')
      setPromoDesc('')
      setShowPromoForm(false)
      setLoading(false)
      return
    }

    try {
      await chatApi.createPromo({
        receiverId: activePartnerId,
        promoCode: promoCode.trim(),
        discountValue: promoDiscount ? parseFloat(promoDiscount) : undefined,
        description: promoDesc.trim() || undefined
      })
      setPromoCode('')
      setPromoDiscount('')
      setPromoDesc('')
      setShowPromoForm(false)
      setTimeout(fetchMessages, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to send promo')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (useSimulatorMode) {
      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}
      if (activePartnerId) {
        messageMap[activePartnerId] = (messageMap[activePartnerId] || []).filter((m: any) => m.id !== id)
        localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))
        setConversations(prev => prev.map(c => ({
          ...c,
          messages: c.messages.filter(m => m.id !== id)
        })))
      }
      return
    }
    try {
      await chatApi.delete(id)
      setConversations(prev => prev.map(c => ({
        ...c,
        messages: c.messages.filter(m => m.id !== id)
      })).filter(c => c.messages.length > 0 || c.partnerId === activePartnerId))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete message')
    }
  }

  const handleEdit = async (id: number) => {
    if (!editContent.trim()) return
    if (useSimulatorMode) {
      const saved = localStorage.getItem('affilianze_chat_messages')
      const messageMap = saved ? JSON.parse(saved) : {}
      if (activePartnerId) {
        messageMap[activePartnerId] = (messageMap[activePartnerId] || []).map((m: any) => m.id === id ? { ...m, content: editContent.trim() } : m)
        localStorage.setItem('affilianze_chat_messages', JSON.stringify(messageMap))
        setConversations(prev => prev.map(c => ({
          ...c,
          messages: c.messages.map(m => m.id === id ? { ...m, content: editContent.trim() } : m)
        })))
        setEditingId(null)
        setEditContent('')
      }
      return
    }
    try {
      await chatApi.update(id, { content: editContent.trim() })
      setConversations(prev => prev.map(c => ({
        ...c,
        messages: c.messages.map(m => m.id === id ? { ...m, content: editContent.trim() } : m)
      })))
      setEditingId(null)
      setEditContent('')
    } catch (err: any) {
      setError(err?.message || 'Failed to edit message')
    }
  }

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-80px)] md:h-[calc(100vh-8rem)] overflow-hidden relative">
      {/* Sidebar */}
      <aside className={`w-full md:w-[320px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-slate-50/30 ${!showSidebar ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowNewChat(v => !v)}
              title="New Message"
              className="p-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E3A8A]/90 transition-colors flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          {showNewChat && (
            <form onSubmit={handleNewChat} className="space-y-2 p-2 bg-blue-50 rounded-xl">
              <input
                type="number"
                placeholder="Receiver User ID"
                value={newReceiverId}
                onChange={e => setNewReceiverId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
              />
              <input
                type="text"
                placeholder="Type message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
              />
              <button
                type="submit"
                disabled={!newReceiverId || !input.trim() || loading}
                className="w-full py-1.5 bg-[#1E3A8A] text-white text-xs rounded-lg disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {fetching && conversations.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Loading messages...</p>
            </div>
          )}
          {!fetching && conversations.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-20" />
              No conversations yet. Click <Edit2 className="inline w-3 h-3" /> to start a new chat.
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => {
                setActivePartnerId(conv.partnerId)
                setShowSidebar(false)
              }}
              className={`w-full p-4 flex gap-3 hover:bg-white transition-colors border-b border-gray-50/50 ${activePartnerId === conv.partnerId ? 'bg-white' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${getColor(conv.partnerId)} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {conv.partnerName.charAt(0).toUpperCase()}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-slate-900 text-[13px] truncate">{conv.partnerName}</h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{conv.lastTime}</span>
                </div>
                <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-white ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
        {error && (
          <div className="mx-4 mt-3 px-4 py-2 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className={`w-10 h-10 rounded-full ${getColor(activeConversation.partnerId)} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {activeConversation.partnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeConversation.partnerName}</h3>
                  <p className="text-[10px] text-gray-400">User #{activeConversation.partnerId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {useSimulatorMode && (
                  <span className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    AI Agent Active
                  </span>
                )}
                <button
                  onClick={fetchMessages}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                  title="Refresh messages"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30"
            >
              {activeConversation.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 grayscale">
                  <Bot className="w-12 h-12 mb-2" />
                  <p className="text-sm">Start a conversation with {activeConversation.partnerName}</p>
                </div>
              )}

              {activeConversation.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.isPromoCode && (
                      <div className={`flex items-center gap-1 text-[10px] ${isMe ? 'text-amber-600' : 'text-amber-600'} mb-0.5`}>
                        <Tag className="w-3 h-3" />
                        <span>Promo Code</span>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      {!isMe && (
                        <div className={`w-7 h-7 rounded-full ${getColor(msg.senderId || 0)} text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0`}>
                          {activeConversation.partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {editingId === msg.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleEdit(msg.id!)
                                if (e.key === 'Escape') { setEditingId(null); setEditContent('') }
                              }}
                              className="px-3 py-1.5 text-sm rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-[120px]"
                              autoFocus
                            />
                            <button onClick={() => handleEdit(msg.id!)} className="p-1 text-green-600 hover:text-green-700">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingId(null); setEditContent('') }} className="p-1 text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] shadow-sm text-sm ${
                            msg.isPromoCode
                              ? 'bg-amber-50 border border-amber-200 text-amber-800'
                              : isMe
                                ? 'bg-[#1E3A8A] text-white rounded-tr-none'
                                : 'bg-white text-slate-700 rounded-tl-none border border-gray-100'
                          }`}>
                            {msg.content}
                          </div>
                        )}
                      </div>
                      {isMe && editingId !== msg.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(msg.id!); setEditContent(msg.content || '') }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id!)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-gray-400 px-1 ${isMe ? 'text-right' : 'text-left ml-9'}`}>
                      {formatTime(msg.sentAt)}
                      {isMe && msg.isRead && <span className="ml-1 text-blue-400">✓✓</span>}
                    </span>
                  </div>
                )
              })}
              {isTyping && (
                <div className="flex flex-col items-start gap-2 pl-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100">
              {showPromoForm && (
                <form onSubmit={handleSendPromo} className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Send Promo Code</span>
                    <button type="button" onClick={() => setShowPromoForm(false)} className="ml-auto text-amber-400 hover:text-amber-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Promo code (e.g. SAVE20)*"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Discount % (optional)"
                      value={promoDiscount}
                      onChange={e => setPromoDiscount(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={promoDesc}
                      onChange={e => setPromoDesc(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!promoCode.trim() || loading}
                    className="w-full py-2 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {loading ? 'Sending...' : 'Send Promo Code'}
                  </button>
                </form>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                <button
                  type="button"
                  onClick={() => setShowPromoForm(v => !v)}
                  title="Send Promo Code"
                  className={`transition-colors ${showPromoForm ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                >
                  <Tag className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-[#1E3A8A] text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <Bot className="w-16 h-16 mb-4 opacity-10" />
            <h3 className="font-bold text-lg mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs">
              {conversations.length > 0
                ? 'Select a conversation from the list to continue chatting.'
                : 'No messages yet. Start a new conversation using the edit icon above.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
