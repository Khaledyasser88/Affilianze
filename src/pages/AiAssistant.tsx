import { useState, useRef, useEffect } from 'react'
import { Send, Clock, Megaphone, Zap, TrendingUp, Sparkles, Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { chatbotApi } from '../api/client'
import { activityTracker } from '../utils/activityTracker'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface PromptChip {
  icon: any
  label: string
  color: string
  text: string
}

const STATIC_PROMPTS: PromptChip[] = [
  { icon: Clock, label: 'Best posting time', color: 'bg-blue-400 text-white', text: 'When is the best time of day to post affiliate content for maximum engagement?' },
  { icon: Megaphone, label: 'Campaign ideas', color: 'bg-indigo-500 text-white', text: 'Give me 3 creative and unique campaign ideas I can promote as an affiliate marketer.' },
  { icon: Zap, label: 'TikTok content', color: 'bg-amber-500 text-white', text: 'What types of TikTok content drive the most affiliate conversions?' },
  { icon: TrendingUp, label: 'Boost conversions', color: 'bg-emerald-500 text-white', text: 'Give me actionable tips to improve my affiliate conversion rate and earn more commissions.' },
  { icon: Sparkles, label: 'Instagram Reels', color: 'bg-pink-500 text-white', text: 'How do I use Instagram Reels to grow an audience and increase affiliate clicks?' },
]

export default function AiAssistant() {
  const { name, role } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('affilianze_ai_chat')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Cleanup: remove the unwanted prompt if it exists in history
        return parsed.filter((m: any) => !m.content.includes("Suggest the best high-reach hashtags"))
      } catch { return [] }
    }
    return []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<'English' | 'Arabic'>('English')
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingRef = useRef<boolean>(false)

  useEffect(() => {
    localStorage.setItem('affilianze_ai_chat', JSON.stringify(messages))
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const simulateTyping = async (fullText: string) => {
    typingRef.current = true
    const words = fullText.split(' ')
    let currentText = ''

    const aiMsgId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])

    for (let i = 0; i < words.length; i++) {
      if (!typingRef.current) break
      currentText += (i === 0 ? '' : ' ') + words[i]
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: currentText } : m))
      // Adjust typing speed based on word length
      await new Promise(r => setTimeout(r, Math.max(15, 50 - words.length * 0.2)))
    }
    typingRef.current = false
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || loading) return

    typingRef.current = false

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!text) setInput('')
    setLoading(true)

    try {
      const recentActions = activityTracker.getActivities().slice(0, 3).map((a: any) => a.description).join(', ')
      const systemPrompt = `You are "Genie", the official AI assistant for Affilianze. User: ${name} (${role}). Recent Actions: ${recentActions}. Provide concise, professional, and helpful affiliate marketing advice. IMPORTANT: Always respond in ${language}. If Arabic, use modern standard Arabic.`

      let aiResponse: string | null = null

      
      try {
        const res = await chatbotApi.postsend(`${systemPrompt}\n\nQuestion: ${messageText}`)
        const maybeResponse = (res as any)?.response ?? (res as any)?.data?.response ?? (res as any)?.reply ?? (res as any)?.data?.reply ?? (res as any)?.text ?? (res as any)?.data?.text ?? (typeof res === 'string' ? res : null)
        aiResponse = typeof maybeResponse === 'string' ? maybeResponse : null
      } catch (err) { console.warn('Hugging Face chatbot unavailable, trying next fallback', err) }

      // 2️⃣ Fallback: Groq
      if (!aiResponse) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY
        if (groqKey) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: messageText }],
                max_tokens: 1024
              })
            })
            const groqData = await groqRes.json()
            aiResponse = groqData?.choices?.[0]?.message?.content || null
          } catch (e) { }
        }
      }

      // 3️⃣ Final Fallback: Gemini
      if (!aiResponse) {
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (geminiKey) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${messageText}` }] }] })
            })
            const geminiData = await geminiRes.json()
            aiResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null
          } catch (e) { }
        }
      }

      if (aiResponse) {
        await simulateTyping(aiResponse)
      } else {
        await simulateTyping(language === 'Arabic'
          ? 'لم أتمكن من الحصول على رد من المساعد في الوقت الحالي. سأساعدك بدلًا من ذلك مع نصيحة عملية قصيرة عن التسويق بالعمولة.'
          : "I'm having trouble reaching the assistant right now, so here's a quick practical tip instead: focus on one clear benefit, one strong call to action, and a simple proof point.")
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col bg-white overflow-hidden pt-4">
      {/* Quick Prompts - Screenshot Style */}
      <div className="px-6 md:px-12 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <h2 className="text-sm font-bold text-[#1E3A8A]">Quick Prompts:</h2>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setLanguage('English')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'English' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage('Arabic')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'Arabic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              العربية
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {STATIC_PROMPTS.map((p, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(p.text)}
              className="flex flex-col gap-3 min-w-[140px] p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-left flex-shrink-0 group"
            >
              <div className={`w-10 h-10 rounded-lg ${p.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <p.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 md:px-12 space-y-10 scrollbar-hide"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 grayscale">
            <Sparkles className="w-12 h-12 text-[#1E3A8A]" />
            <p className="text-sm font-medium">Ask Genie anything to get started...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2 animate-in fade-in slide-in-from-bottom-2 duration-400`}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800">Genie</span>
              </div>
            )}
            <div className={`px-6 py-4 rounded-[20px] max-w-[85%] text-[14px] font-medium leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#1E3A8A] text-white rounded-tr-none shadow-lg shadow-blue-900/10' 
                : 'bg-[#F1F5F9] text-slate-800 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && !typingRef.current && (
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">Genie</span>
            </div>
            <div className="bg-[#F1F5F9] px-6 py-5 rounded-[20px] rounded-tl-none">
              <div className="flex gap-1.5 h-4 items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 md:px-12 bg-white shrink-0">
        <div className="max-w-5xl mx-auto flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 focus-within:ring-4 focus-within:ring-[#1E3A8A]/5 focus-within:border-[#1E3A8A] transition-all">
          <input 
            type="text" 
            placeholder="Ask me anything about affiliate marketing..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 bg-transparent border-none text-sm font-medium placeholder:text-slate-400 focus:outline-none"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-400 text-white rounded-xl hover:bg-[#1E3A8A] active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
