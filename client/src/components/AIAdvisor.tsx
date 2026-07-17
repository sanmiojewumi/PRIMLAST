import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Minimize2, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────
const KB: Record<string, { patterns: string[]; response: string }> = {
  greeting: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
    response: "Hello! 👋 I'm **Primeflow Business Advisor**, your AI-powered guide to business registration, compliance, and corporate advisory in Nigeria.\n\nHow can I help you today? You can ask me about:\n- 🏢 Company Incorporation\n- 📋 CAC Registration process\n- 🛡️ SCUML, PENCOM, NSITF compliance\n- 💰 Tax filing and accounting\n- 📅 Registration timelines\n- 💵 Service quotations"
  },
  incorporation: {
    patterns: ['incorporate', 'incorporation', 'company', 'limited liability', 'llc', 'ltd', 'register company', 'form a company'],
    response: "**Company Incorporation in Nigeria** 🏢\n\nTo incorporate a company with the CAC, you'll need:\n\n**Required Documents:**\n• 2 proposed company names\n• Memorandum & Articles of Association\n• Directors' details (Name, DOB, Address, Signature)\n• Shareholders' details\n• Share capital structure\n• Registered office address\n\n**Timeline:** 7–14 working days\n\n**Minimum Share Capital:** ₦1,000,000 (for private companies)\n\n**Our Fee:** Starting from ₦85,000 all-inclusive\n\nWould you like to **start the registration process**? Click 'Sign In' or 'Get Started' to access our client portal! 🚀"
  },
  businessname: {
    patterns: ['business name', 'sole proprietorship', 'enterprise', 'trading as'],
    response: "**Business Name Registration** 🏪\n\nBusiness Name registration is ideal for sole proprietors and small businesses.\n\n**Requirements:**\n• 2 proposed business names\n• Proprietor's valid ID\n• Proprietor's home address\n• Nature of business\n\n**Timeline:** 3–5 working days\n**Our Fee:** Starting from ₦35,000\n\n**Key Notes:**\n✅ Faster and cheaper than full incorporation\n✅ Valid for all business activities\n⚠️ No limited liability protection\n\nReady to get started? Our team will handle everything from name search to certificate delivery!"
  },
  scuml: {
    patterns: ['scuml', 'money laundering', 'aml', 'anti money'],
    response: "**SCUML Registration** 🛡️\n\n**What is SCUML?**\nThe Special Control Unit Against Money Laundering (SCUML) is required for Designated Non-Financial Businesses and Professions (DNFBPs) in Nigeria.\n\n**Who Needs SCUML?**\n• Car dealerships\n• Real estate agents/developers\n• Lawyers, accountants, auditors\n• Trust and company service providers\n• Precious metals/stones dealers\n• Non-profit organizations\n\n**Requirements:**\n• CAC certificate\n• Tax Identification Number (TIN)\n• Director IDs and details\n• Business profile\n\n**Timeline:** 7–14 working days\n**Our Fee:** Starting from ₦40,000\n\nNon-registration attracts **penalties and possible prosecution**. Let Primeflow handle your SCUML registration today!"
  },
  pencom: {
    patterns: ['pencom', 'pension', 'retirement', 'pension fund'],
    response: "**PENCOM Compliance** 👥\n\n**What is PENCOM?**\nThe National Pension Commission (PenCom) regulates pension schemes in Nigeria. All employers with **3 or more employees** must comply.\n\n**Requirements for Compliance:**\n• Register employees under a licensed Pension Fund Administrator (PFA)\n• Deduct and remit 8% (employee) + 10% (employer) of monthly emolument\n• File quarterly returns\n\n**Benefits of Compliance:**\n✅ Avoid penalties (up to 2% of unpaid contributions)\n✅ Eligible for government contracts\n✅ Attract quality talent\n\n**Our Services Include:**\n• PFA selection assistance\n• Employee registration\n• Ongoing remittance management\n\n**Fee:** Starting from ₦50,000\n\nContact us to ensure your business is fully PENCOM compliant!"
  },
  nsitf: {
    patterns: ['nsitf', 'social insurance', 'employee compensation', 'workplace accident'],
    response: "**NSITF Registration** 🏥\n\n**What is NSITF?**\nThe Nigeria Social Insurance Trust Fund provides compensation to employees for occupational injuries, diseases, or death.\n\n**Who Must Register:**\nAll employers with at least **one employee** in Nigeria.\n\n**Contribution Rate:** 1% of total monthly payroll\n\n**Benefits:**\n✅ Medical treatment for workplace injuries\n✅ Monthly disability benefits\n✅ Death benefits for dependents\n✅ Required for most government contracts\n\n**Timeline:** 7–14 working days\n**Our Fee:** Starting from ₦45,000\n\nDon't risk non-compliance fines. Let us register your business with NSITF today!"
  },
  tax: {
    patterns: ['tax', 'taxation', 'vat', 'company income tax', 'cit', 'nrs', 'tin', 'tax clearance'],
    response: "**Tax Services in Nigeria** 💰\n\n**Key Tax Obligations for Companies:**\n\n📌 **Company Income Tax (CIT)**\n• 20% for companies with turnover ≤ ₦25M (SMEs)\n• 30% for companies with turnover > ₦100M\n• Due annually within 6 months of financial year-end\n\n📌 **Value Added Tax (VAT)**\n• 7.5% on goods and services\n• Monthly filing on or before 21st of each month\n\n📌 **Withholding Tax (WHT)**\n• Deducted at source on payments\n• Rates vary: 5%–10%\n\n**Our Tax Services:**\n✅ TIN Registration\n✅ VAT filing\n✅ CIT returns preparation\n✅ Tax audit defense\n✅ Tax clearance certificate\n\n**Starting from ₦60,000/year**\n\nLet our tax experts keep your business fully compliant with NRS!"
  },
  annualreturns: {
    patterns: ['annual returns', 'annual filing', 'yearly returns', 'cac return'],
    response: "**Annual Returns Filing** 📋\n\n**What are Annual Returns?**\nAll registered companies and business names in Nigeria must file Annual Returns with the CAC every year.\n\n**Deadline:**\n• Business Names: Within 90 days of anniversary date\n• Companies: Within 42 days of AGM (or within 18 months of incorporation)\n\n**Penalty for Non-Filing:**\n⚠️ ₦10,000 + ₦5,000 per month for late filing\n⚠️ Risk of striking off from CAC register\n\n**What's Required:**\n• RC Number / BN Number\n• Audited accounts (for companies)\n• Directors' details update\n\n**Our Fee:** Starting from ₦30,000\n\nDon't let your business get struck off! Contact us now to file your Annual Returns."
  },
  trademark: {
    patterns: ['trademark', 'brand protection', 'intellectual property', 'ip', 'patent'],
    response: "**Trademark Registration** ™️\n\n**Why Register Your Trademark?**\n• Exclusive rights to your brand name/logo\n• Legal protection against counterfeiting\n• Increases business value\n• Required for franchise businesses\n\n**Process:**\n1. Trademark search (2–3 days)\n2. Application filing at IPONL\n3. Publication in Trademarks Journal\n4. Certificate issuance (12–24 months)\n\n**Classes:** Protect your mark in specific goods/services classes (1–45)\n\n**Our Fee:** Starting from ₦120,000 per class (including government fees)\n\n**Protect your brand today!** Contact Primeflow to begin your trademark registration."
  },
  timeline: {
    patterns: ['how long', 'timeline', 'duration', 'days', 'weeks', 'processing time', 'how many days'],
    response: "**Registration Timelines** ⏱️\n\n| Service | Timeline |\n|---------|----------|\n| Business Name | 3–5 working days |\n| Company Incorporation | 7–14 working days |\n| Annual Returns | 3–5 working days |\n| SCUML Registration | 7–14 working days |\n| PENCOM Compliance | 7–14 working days |\n| NSITF Registration | 7–14 working days |\n| Trademark Application | 12–24 months |\n| Tax Clearance Certificate | 14–21 working days |\n\n**Note:** Timelines depend on CAC system availability and completeness of documents. Primeflow's expert team ensures your applications are error-free to avoid delays.\n\nNeed a faster turnaround? Contact us — we may have express processing options available!"
  },
  pricing: {
    patterns: ['price', 'cost', 'how much', 'fee', 'charge', 'rate', 'quotation', 'quote'],
    response: "**Service Pricing Guide** 💵\n\n| Service | Starting From |\n|---------|---------------|\n| Business Name Registration | ₦35,000 |\n| Company Incorporation | ₦85,000 |\n| Annual Returns | ₦30,000 |\n| SCUML Registration | ₦40,000 |\n| PENCOM Compliance | ₦50,000 |\n| NSITF Registration | ₦45,000 |\n| Trademark Registration | ₦120,000/class |\n| Tax Filing (Annual) | ₦60,000/year |\n| Bookkeeping (Monthly) | ₦45,000/month |\n\n*All prices include VAT and government fees unless otherwise stated.*\n\n💬 **Need a custom quote?** Contact us at:\n📞 **Call & WhatsApp:** +234 707 292 8256\n📱 **WhatsApp Only:** +234 706 671 4961\n\nWe offer **package deals** for businesses that need multiple services!"
  },
  contact: {
    patterns: ['contact', 'call', 'reach', 'speak', 'human', 'agent', 'consultant', 'whatsapp', 'phone', 'email'],
    response: "**Contact Primeflow** 📞\n\nOur expert consultants are ready to help!\n\n📞 **Call & WhatsApp:** [+234 707 292 8256](https://wa.me/2347072928256)\n📱 **WhatsApp Only:** [+234 706 671 4961](https://wa.me/2347066714961)\n📧 **Email:** primeflowconsultingservices@gmail.com\n📍 **Office:** Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja\n\n🕐 **Business Hours:**\nMonday – Friday: 8am – 5pm\nSaturday: 10am – 2pm\n\nYou can also **create a free account** and use our secure client portal to submit applications, chat with consultants, and track your progress in real-time!"
  },
  cac: {
    patterns: ['cac', 'corporate affairs commission', 'registration number', 'rc number'],
    response: "**Corporate Affairs Commission (CAC)** 🏛️\n\nThe CAC is Nigeria's government agency responsible for the regulation and supervision of the formation, incorporation, management and winding-up of companies.\n\n**Services Regulated by CAC:**\n• Company Incorporation\n• Business Name Registration\n• Incorporation of Trustees (NGOs/Associations)\n• Annual Returns filing\n• Post-incorporation changes\n• Company search & certification\n\n**Primeflow as CAC Agents:**\nWe are authorized to process all CAC filings on your behalf, ensuring accuracy and speed.\n\n**CAC Online Portal:** cac.gov.ng\n\nNeed help with any CAC service? Just ask, or create an account to get started!"
  },
  bookkeeping: {
    patterns: ['bookkeeping', 'accounting', 'financial records', 'payroll', 'financial reporting', 'audit'],
    response: "**Accounting & Bookkeeping Services** 📊\n\n**Monthly Bookkeeping Package Includes:**\n✅ Transaction recording & categorization\n✅ Bank reconciliation\n✅ Accounts payable & receivable\n✅ Monthly financial statements\n✅ VAT computation & filing\n\n**Payroll Services Include:**\n✅ Salary computation\n✅ PAYE tax calculation\n✅ Payslip generation\n✅ Pension deduction & remittance\n\n**Annual Packages:**\n✅ Year-end accounts preparation\n✅ CIT returns\n✅ Audit support\n✅ Financial analysis & reporting\n\n**Pricing:**\n• Bookkeeping: From ₦45,000/month\n• Payroll: From ₦25,000/month\n• Annual Accounts: From ₦150,000\n\nGet in touch for a custom quote tailored to your business size!"
  },
  default: {
    patterns: [],
    response: "I'm not sure I fully understand your question, but I'm here to help! 🤔\n\nHere are some things I can assist you with:\n\n• **CAC Registration** — company incorporation, business name\n• **Compliance** — SCUML, PENCOM, NSITF, NRS\n• **Taxation** — VAT, CIT, tax clearance\n• **Pricing & Timelines** — cost and duration estimates\n• **Contact** — reach our human consultants\n\nCould you rephrase your question or choose from the options above? Alternatively, contact our team directly:\n📞 **Call & WhatsApp:** +234 707 292 8256\n📱 **WhatsApp Only:** +234 706 671 4961"
  }
};

const QUICK_PROMPTS = [
  'How do I register a company?',
  'What is SCUML and who needs it?',
  'How much does incorporation cost?',
  'What are the tax obligations?',
  'How long does registration take?',
  'How can I contact Primeflow?',
];

// ─── Match KB entry ───────────────────────────────────────────────────────────
function matchResponse(input: string, location: { state: string; lga: string } | null): string {
  const lower = input.toLowerCase();

  // Location specific query intercepts
  if (location && location.state && (lower.includes('office') || lower.includes('location') || lower.includes('address') || lower.includes('where are you'))) {
    return `📍 **Primeflow Localized Advisory**\n\nSince your business is registered in **${location.state} ${location.lga ? '(' + location.lga + ')' : ''}**, our services are customized for your location!\n\n🏢 **Abuja HQ Office:** Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja.\n\n💼 **Local Support:** We offer remote consultations and physical document pickup services across **${location.state}** to make your compliance filings hassle-free!\n\n💬 **Contact local advisor:**\n📞 **Call & WhatsApp:** +234 707 292 8256\n📱 **WhatsApp Only:** +234 706 671 4961`;
  }

  for (const key of Object.keys(KB)) {
    if (key === 'default') continue;
    if (KB[key].patterns.some(p => lower.includes(p))) {
      let resp = KB[key].response;
      if (location && location.state && key === 'contact') {
        resp += `\n\n📍 *Special Note for clients in **${location.state}**: We have dedicated representatives assigned to coordinate filings in your region!*`;
      }
      return resp;
    }
  }
  return KB.default.response;
}

// ─── Format markdown-like text ────────────────────────────────────────────────
function formatText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong key={i} style={{ color: '#fff', display: 'block', marginTop: i > 0 ? '10px' : 0 }}>{line.replace(/\*\*/g, '')}</strong>;
    }
    // Table rows
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => c.replace(/-/g, '').trim() === '')) return null;
      return (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `1fr 1fr`, gap: '4px', fontSize: '0.8rem', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {cells.map((c, j) => <span key={j} style={{ color: j === 0 ? '#e2e8f0' : '#D71920', fontWeight: j === 0 ? '400' : '600' }}>{c}</span>)}
        </div>
      );
    }
    // Bullet points
    if (line.match(/^[•✅⚠️📌📱📧📍🕐]/)) {
      const cleaned = line.replace(/\*\*(.*?)\*\*/g, '$1');
      return <div key={i} style={{ display: 'flex', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem', marginTop: '2px' }}><span style={{ flexShrink: 0 }}>{line[0]}</span><span>{cleaned.slice(line[0].length === 1 ? 1 : 2).trim()}</span></div>;
    }
    // Inline bold
    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return <div key={i} style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px', lineHeight: '1.6' }}>
        {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: '#e2e8f0' }}>{p.replace(/\*\*/g, '')}</strong> : p)}
      </div>;
    }
    // Empty line
    if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />;
    // Default
    return <div key={i} style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', marginTop: '2px' }}>{line}</div>;
  }).filter(Boolean);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AIAdvisor: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Welcome to **Primeflow Business Advisor!** 🚀\n\nI'm your AI-powered guide to business registration, regulatory compliance, and corporate advisory in Nigeria.\n\nAsk me anything about CAC registration, SCUML, taxes, pricing, or timelines. I'm here to help!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [userLocation, setUserLocation] = useState<{ state: string; lga: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !token) return;
    const fetchLoc = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/profile/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.state) {
            setUserLocation({
              state: data.profile.state,
              lga: data.profile.lga || ''
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLoc();
  }, [user, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setShowPrompts(false);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const responseText = matchResponse(text, userLocation);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      text: "Chat cleared! How can I help you today? Ask about registration, compliance, taxes, or our services.",
      timestamp: new Date()
    }]);
    setShowPrompts(true);
  };

  return (
    <div className="animate-fade-in ai-advisor-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', padding: '20px', gap: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #D71920 0%, #8B0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(215,25,32,0.4)' }}>
            <Sparkles size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Primeflow Business Advisor</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulseGlow 2s infinite' }} />
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>AI-Powered · Always Available</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={clearChat} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Clear Chat
          </button>
          <button onClick={() => setMinimized(v => !v)} className="btn-secondary" style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {minimized ? <ChevronDown size={18} /> : <Minimize2 size={18} />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          {/* Messages area */}
          <div className="glass-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: msg.role === 'assistant' ? 'linear-gradient(135deg, #D71920, #8B0000)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: msg.role === 'assistant' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: msg.role === 'assistant' ? '0 0 12px rgba(215,25,32,0.3)' : 'none'
                }}>
                  {msg.role === 'assistant' ? <Bot size={18} style={{ color: '#fff' }} /> : <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '700' }}>You</span>}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '78%',
                  padding: '14px 16px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #D71920 0%, #991111 100%)' : 'rgba(255,255,255,0.04)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(215,25,32,0.2)' : 'none'
                }}>
                  {msg.role === 'user'
                    ? <p style={{ color: '#fff', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>{msg.text}</p>
                    : <div>{formatText(msg.text)}</div>
                  }
                  <div style={{ fontSize: '0.68rem', color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#475569', marginTop: '8px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #D71920, #8B0000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} style={{ color: '#fff' }} />
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#D71920', animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {showPrompts && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: '20px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(215,25,32,0.4)'; e.currentTarget.style.color = '#D71920'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="glass-panel" style={{ padding: '16px', flexShrink: 0 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ask about registration, compliance, taxes, pricing..."
                className="form-input"
                style={{ flex: 1, margin: 0 }}
                disabled={isTyping}
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }} disabled={!inputText.trim() || isTyping}>
                <Send size={18} />
              </button>
            </form>
            <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: '10px', textAlign: 'center' }}>
              AI responses are informational. For legal advice, consult our certified team. 
              <a href="https://wa.me/2347066714961" target="_blank" rel="noopener noreferrer" style={{ color: '#D71920', textDecoration: 'none', marginLeft: '4px' }}>Chat with a human →</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
