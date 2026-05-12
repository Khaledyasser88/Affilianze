import { useState } from 'react'
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react'
import { complaintApi } from '../api/client'
import { activityTracker } from '../utils/activityTracker'

export default function Contact() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await complaintApi.post({
        subject: formData.subject,
        description: `From: ${formData.name} (${formData.email})\n\n${formData.message}`,
        defendantId: 1
      })
      alert('Message sent successfully!')
      
      // Log local activity
      activityTracker.addActivity({
        description: `Sent message/complaint: ${formData.subject}`,
        type: 'system'
      })

      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const faqs = [
    { q: "What's the typical response time?", a: 'We aim to respond to all inquiries within 24 hours during business days. Urgent matters are prioritized.' },
    { q: 'Do you offer phone support?', a: 'Yes! Phone support is available Monday-Friday, 9am-6pm PST. You can also reach us 24/7 via email or live chat.' },
    { q: 'Can I schedule a demo?', a: "Absolutely! Contact our sales team and they'll be happy to schedule a personalized demo of the platform." }
  ]

  const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15 focus:border-[#1E3A8A] transition-all"

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-[#1E3A8A] text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-[44px] font-bold mb-3 tracking-tight">Get in Touch</h1>
        <p className="max-w-lg mx-auto text-[15px] text-blue-100/80 leading-relaxed">
          Have questions? We'd love to hear from you. Send us a message and we'll respond
          as soon as possible.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Info + Form */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left – Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contact Information</h2>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed">
              Reach out to us through any of these channels, and our team will
              be happy to assist you.
            </p>

            <div className="space-y-7">
              {/* Email */}
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E3A8A] transition-colors duration-300">
                  <Mail className="w-5 h-5 text-[#1E3A8A] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px]">Email</h3>
                  <p className="text-gray-500 text-sm mt-0.5">support@affilianze.com</p>
                  <p className="text-gray-500 text-sm">sales@affilianze.com</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px]">Phone</h3>
                  <p className="text-gray-500 text-sm mt-0.5">+1 (555) 123-4567</p>
                  <p className="text-gray-400 text-xs mt-0.5">Mon-Fri 9am-6pm PST</p>
                </div>
              </div>

              {/* Office */}
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px]">Office</h3>
                  <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                    123 Marketing Street<br />
                    San Francisco, CA 94102<br />
                    United States
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#1E3A8A]" />
                <span className="font-semibold text-slate-900 text-sm">Business Hours</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monday – Friday:</span>
                  <span className="font-semibold text-slate-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saturday:</span>
                  <span className="font-semibold text-slate-900">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sunday:</span>
                  <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Closed</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/60">
                <p className="text-xs text-gray-400">
                  <span className="text-[#1E3A8A] font-semibold">24/7 Support:</span> Available via email and live chat
                </p>
              </div>
            </div>
          </div>

          {/* Right – Send Us a Message Form */}
          <div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg shadow-gray-100/60">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Send Us a Message</h2>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                  <textarea 
                    rows={5}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can help you..."
                    className={inputClass + " resize-none"}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1E3A8A] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#152C6E] transition-all shadow-md shadow-blue-900/15 disabled:opacity-50 active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Visit Our Office */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Visit Our Office</h2>
          <p className="text-gray-500 text-sm mb-10">We'd love to meet you in person</p>
          <div className="bg-[#EEF2F7] rounded-2xl h-[320px] flex items-center justify-center border border-gray-100 group">
             <div className="text-center group-hover:scale-105 transition-transform duration-500">
               <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-3 shadow-sm">
                 <MapPin className="w-7 h-7 text-[#1E3A8A]" />
               </div>
               <p className="text-slate-600 font-semibold text-sm mb-1">Map View Placeholder</p>
               <p className="text-xs text-gray-400">123 Marketing Street, San Francisco, CA 94102</p>
             </div>
          </div>
        </div>

        {/* Quick Answers */}
        <div className="mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Answers</h2>
              <p className="text-gray-500 text-sm">Common questions we receive</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300">
                   <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                   <p className="text-gray-500 leading-relaxed text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
