import { useState, useRef, useEffect } from 'react'
import { Search, Send, Paperclip, Smile, MoreVertical, Bot, ChevronLeft } from 'lucide-react'
import { marketerApi, chatbotApi } from '../api/client'
import type { CampaignApplicationDto } from '../api/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatContact {
  id: number
  name: string
  company: string
  avatar: string
  color: string
  online: boolean
  lastMessage?: string
  lastTime?: string
  unreadCount: number
}

export default function Messages() {
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [activeContactId, setActiveContactId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Record<number, Message[]>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Colors for avatars
  const avatarColors = ['bg-amber-400', 'bg-yellow-500', 'bg-orange-500', 'bg-amber-600', 'bg-yellow-600', 'bg-blue-500']

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('affilianze_chat_messages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
    fetchContacts()
  }, [])

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      localStorage.setItem('affilianze_chat_messages', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom without moving the window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeContactId, isTyping])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await marketerApi.getmyapplications({ PageSize: 50 })
      const applications = (res as any)?.data || []
      
      const formattedContacts: ChatContact[] = (applications as CampaignApplicationDto[]).map((app, idx) => {
        const brandName = app.campaignTitle || 'Brand Partner';
          
        return {
          id: app.campaignId!,
          name: brandName,
          company: app.campaignTitle || 'Marketing Campaign',
          avatar: brandName.charAt(0),
          color: avatarColors[idx % avatarColors.length],
          online: Math.random() > 0.4,
          unreadCount: 0,
          lastMessage: 'Let\'s discuss the campaign!',
          lastTime: 'Active'
        };
      })

      setContacts(formattedContacts)
      if (formattedContacts.length > 0 && !activeContactId) {
        setActiveContactId(formattedContacts[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch chat contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !activeContactId || loading) return

    const currentContact = contacts.find(c => c.id === activeContactId)
    const text = input.trim()
    setInput('')
    setLoading(true)

    // Increment conversion count in Dashboard for graduation project simulation
    const currentConversions = parseInt(localStorage.getItem('affiliance_chat_conversions') || '0')
    localStorage.setItem('affiliance_chat_conversions', (currentConversions + 1).toString())

    // Per-campaign stats increment
    const statsStr = localStorage.getItem('affiliance_campaign_stats') || '{}'
    const stats = JSON.parse(statsStr)
    const campaignStats = stats[activeContactId] || { clicks: Math.floor(Math.random() * 200) + 100, conversions: 0, earnings: 0, progress: 10 }
    
    const newConversions = campaignStats.conversions + 1
    stats[activeContactId] = {
      ...campaignStats,
      conversions: newConversions,
      earnings: newConversions * 150,
      progress: Math.min(100, (newConversions / 50) * 100 + 10) // Simulate progress based on conversions
    }
    localStorage.setItem('affiliance_campaign_stats', JSON.stringify(stats))

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage]
    }))

    // Update last message in contact list
    setContacts(prev => prev.map(c => 
      c.id === activeContactId ? { ...c, lastMessage: text, lastTime: 'Just now' } : c
    ))

    // Simulate AI Response
    await simulateAiReply(activeContactId, text, currentContact?.name || 'Brand')
    setLoading(false)
  }

  const simulateAiReply = async (contactId: number, userText: string, contactName: string) => {
    setIsTyping(true)
    try {
      const prompt = `Act as ${contactName} representative. A marketer said: "${userText}". Keep it professional and related to affiliate marketing.`
      
      let aiResponse: string | null = null

      // Try the backend chatbot API first (now sends correct "Text" field)
      try {
        const res = await chatbotApi.postsend(prompt)
        aiResponse = res?.response || res?.data?.response || res?.reply || res?.data?.reply || res?.text || res?.data?.text || (typeof res === 'string' ? res : null)
      } catch (backendErr) {
        console.warn('Backend chatbot unavailable for Messages, trying Gemini fallback...', backendErr)
      }

      // Fallback: use Google Gemini API if backend failed and key is configured
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
            console.error('Gemini fallback also failed:', geminiErr)
          }
        }
      }

      if (!aiResponse) {
        aiResponse = `Thanks for your interest in our ${contacts.find(c => c.id === contactId)?.company} campaign! Let's work together. (Check API Quota)`
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      // Add a slight delay for realism
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), aiMsg]
        }))
        setIsTyping(false)
        setContacts(prev => prev.map(c => 
          c.id === contactId ? { ...c, lastMessage: aiResponse!, lastTime: 'Just now' } : c
        ))
      }, 1500)
    } catch (err) {
      setIsTyping(false)
      console.error('AI Reply Error:', err)
    }
  }

  const activeContact = contacts.find(c => c.id === activeContactId)
  const currentMessages = activeContactId ? (messages[activeContactId] || []) : []

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-80px)] md:h-[calc(100vh-8rem)] overflow-hidden relative">
      {/* Sidebar */}
      <aside className={`w-full md:w-[320px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-slate-50/30 ${!showSidebar ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                setActiveContactId(contact.id);
                setShowSidebar(false);
              }}
              className={`w-full p-4 flex gap-3 hover:bg-white transition-colors border-b border-gray-50/50 ${activeContactId === contact.id ? 'bg-white' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${contact.color} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {contact.avatar}
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-slate-900 text-[13px] truncate">{contact.name}</h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{contact.lastTime}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-1 truncate">{contact.company}</p>
                <div className="flex justify-between items-center text-[11px]">
                  <p className={`truncate text-slate-500`}>
                    {contact.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No active conversations yet. Apply to campaigns to start chatting with brands!
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-white ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
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
                <div className={`w-10 h-10 rounded-full ${activeContact.color} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {activeContact.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeContact.name}</h3>
                  <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{activeContact.company}</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Message Thread */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30"
            >
              {currentMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40 grayscale">
                  <Bot className="w-12 h-12 mb-2" />
                  <p className="text-sm">Start a conversation with {activeContact.name}</p>
                </div>
              )}
              
              {currentMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] shadow-sm text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#1E3A8A] text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100">
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none focus:ring-0"
                />
                <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-[#1E3A8A] text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <Bot className="w-16 h-16 mb-4 opacity-10" />
            <h3 className="font-bold text-lg mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs">Select a contact from the list to start chatting with brand representatives.</p>
          </div>
        )}
      </main>
    </div>
  )
}
