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
    response: "**Primeflow Business Advisor**\n\nThis assistant provides structured guidance on company formation, CAC filings, regulatory compliance, taxation, and professional fees in Nigeria.\n\nYou may ask about:\n• Company incorporation and business name registration\n• CAC procedures and documentation\n• SCUML, PENCOM, NSITF and related compliance\n• Tax registration, filing cycles, and tax clearance\n• Indicative timelines and professional fees\n\nInformation provided here is general. Statutory filings and formal advice are handled by Primeflow consultants."
  },
  incorporation: {
    patterns: ['incorporate', 'incorporation', 'company', 'limited liability', 'llc', 'ltd', 'register company', 'form a company'],
    response: "**Company incorporation (CAC)**\n\nA private company limited by shares is a separate legal entity. It is typically appropriate where limited liability, multiple owners, banking facilities, or public-sector contracting is required.\n\n**Usual requirements**\n• Two proposed company names\n• Particulars of directors and shareholders\n• Share capital and shareholding structure\n• Nature of business\n• A registered office address in Nigeria\n• Memorandum and articles of association (prepared as part of the filing)\n\n**Indicative timeline:** 7–14 working days, subject to CAC systems and complete documentation.\n**Indicative professional fee:** from ₦85,000 (government charges may apply in addition, depending on share capital and extras).\n\nPrimeflow prepares, files, and follows the application through to certificate issuance."
  },
  businessname: {
    patterns: ['business name', 'sole proprietorship', 'enterprise', 'trading as'],
    response: "**Business name registration**\n\nBusiness name registration is commonly used by sole proprietors and small trading concerns. It is generally faster and less costly than incorporation, but it does **not** confer limited liability: the proprietor remains personally responsible for the business.\n\n**Usual requirements**\n• Two proposed names\n• Valid identification of the proprietor\n• Residential address\n• Nature of business\n\n**Indicative timeline:** 3–5 working days.\n**Indicative professional fee:** from ₦35,000.\n\nPrimeflow conducts the name search, files with the CAC, and delivers the certificate."
  },
  scuml: {
    patterns: ['scuml', 'money laundering', 'aml', 'anti money'],
    response: "**SCUML registration**\n\nThe Special Control Unit Against Money Laundering (SCUML) registers Designated Non-Financial Businesses and Professions (DNFBPs) in Nigeria. Sectors typically in scope include real estate, motor dealerships, dealers in precious metals and stones, certain professional practices, trust and company service providers, and many non-profit organisations.\n\n**Usual requirements**\n• Evidence of CAC registration\n• Tax Identification Number (TIN)\n• Particulars and identification of directors or principals\n• A concise business or organisational profile\n\n**Indicative timeline:** 7–14 working days.\n**Indicative professional fee:** from ₦40,000.\n\nOperating without registration where it is required may attract regulatory penalties. Primeflow assesses scope, prepares the file, and submits the application."
  },
  pencom: {
    patterns: ['pencom', 'pension', 'retirement', 'pension fund'],
    response: "**PENCOM (pension) compliance**\n\nThe National Pension Commission oversees mandatory contributory pensions. Employers with **three or more employees** are generally required to register staff with a licensed Pension Fund Administrator (PFA) and remit contributions.\n\n**Typical obligations**\n• Enrolment of eligible employees with a PFA\n• Remittance of employee and employer contributions (commonly 8% and 10% of monthly emolument, subject to current law)\n• Periodic reporting as required\n\n**Indicative professional fee:** from ₦50,000 for set-up support.\n\nNon-compliance may attract penalties and can affect eligibility for certain contracts. Primeflow assists with PFA selection, staff enrolment, and remittance arrangements."
  },
  nsitf: {
    patterns: ['nsitf', 'social insurance', 'employee compensation', 'workplace accident'],
    response: "**NSITF registration**\n\nThe Nigeria Social Insurance Trust Fund administers employees’ compensation for occupational injury, disease, or death. Employers with at least one employee in Nigeria are generally required to register and contribute (commonly 1% of total monthly payroll, subject to current rules).\n\n**Indicative timeline:** 7–14 working days.\n**Indicative professional fee:** from ₦45,000.\n\nRegistration is often a prerequisite for public-sector contracting. Primeflow handles registration and ongoing compliance support."
  },
  tax: {
    patterns: ['tax', 'taxation', 'vat', 'company income tax', 'cit', 'nrs', 'tin', 'tax clearance'],
    response: "**Taxation (NRS)**\n\nCompanies and many other entities must obtain a Tax Identification Number and meet filing and payment obligations administered with the Nigeria Revenue Service.\n\n**Company Income Tax (CIT)** is assessed annually (generally within six months of year-end). Rates depend on turnover bands under current law; confirm applicable rates for your period.\n\n**Value Added Tax (VAT)** is currently 7.5% on taxable supplies and is typically filed monthly (often on or before the 21st of the following month).\n\n**Withholding tax** is deducted at source on specified payments, commonly in the 5%–10% range depending on the item.\n\nPrimeflow provides TIN registration, VAT and CIT filings, tax clearance applications, and support during reviews. Indicative annual tax-compliance retainers start from ₦60,000."
  },
  annualreturns: {
    patterns: ['annual returns', 'annual filing', 'yearly returns', 'cac return'],
    response: "**CAC annual returns**\n\nRegistered companies and business names must file annual returns with the CAC.\n\n**Typical deadlines**\n• Business names: within 90 days of the anniversary of registration\n• Companies: generally within 42 days of the annual general meeting (with a longer window for the first return after incorporation)\n\n**Consequences of default** include statutory penalties that accrue, and, in persistent cases, the risk of striking off.\n\n**Usual information:** RC or BN number, current officer particulars, and, for companies, accounts as required.\n\n**Indicative professional fee:** from ₦30,000.\n\nProvide your registration number and Primeflow will confirm status, prepare, and file."
  },
  trademark: {
    patterns: ['trademark', 'brand protection', 'intellectual property', 'ip', 'patent'],
    response: "**Trademark registration**\n\nRegistration of a mark confers exclusive rights in the relevant classes of goods or services and supports enforcement against unauthorised use. It is often required for franchising and brand licensing.\n\n**Process (indicative)**\n1. Availability search (typically 2–3 days)\n2. Application at the registry\n3. Journal publication\n4. Certificate, commonly 12–24 months after filing, subject to oppositions and registry workload\n\n**Indicative professional fee:** from ₦120,000 per class, inclusive of typical government charges.\n\nPrimeflow conducts the search, files the application, and monitors the matter through to grant."
  },
  timeline: {
    patterns: ['how long', 'timeline', 'duration', 'days', 'weeks', 'processing time', 'how many days'],
    response: "**Indicative processing times**\n\n| Service | Working days (typical) |\n|---------|----------|\n| Business name | 3–5 |\n| Company incorporation | 7–14 |\n| Annual returns | 3–5 |\n| SCUML | 7–14 |\n| PENCOM set-up | 7–14 |\n| NSITF | 7–14 |\n| Tax clearance | 14–21 |\n| Trademark (to certificate) | 12–24 months |\n\nTimes depend on agency systems and the completeness of your documents. Incomplete or inconsistent files are the most common cause of delay. Primeflow reviews packs before submission. Expedited options, where available, can be discussed with a consultant."
  },
  pricing: {
    patterns: ['price', 'cost', 'how much', 'fee', 'charge', 'rate', 'quotation', 'quote'],
    response: "**Indicative professional fees**\n\n| Service | From |\n|---------|---------------|\n| Business name registration | ₦35,000 |\n| Company incorporation | ₦85,000 |\n| Annual returns | ₦30,000 |\n| SCUML registration | ₦40,000 |\n| PENCOM set-up | ₦50,000 |\n| NSITF registration | ₦45,000 |\n| Trademark (per class) | ₦120,000 |\n| Tax compliance (annual) | ₦60,000 |\n| Bookkeeping (monthly) | ₦45,000 |\n\nFigures are starting professional fees. Government charges, share capital, additional classes, and the condition of your records may affect the final quotation. Combined mandates can be priced as a package.\n\nFor a written quote, [contact a Primeflow consultant](https://wa.me/2347072928256)."
  },
  contact: {
    patterns: ['contact', 'call', 'reach', 'speak', 'human', 'agent', 'consultant', 'whatsapp', 'phone', 'email'],
    response: "**Primeflow Consulting Services**\n\n**WhatsApp, calls and SMS:** [+234 707 292 8256](https://wa.me/2347072928256)\n**Email:** primeflowconsultingservices@gmail.com\n**Office:** Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja\n\n**Hours:** Monday–Friday, 8:00am–5:00pm; Saturday, 10:00am–2:00pm.\n\nRegistered clients may also use the portal to submit documents, correspond with assigned officers, and track filings."
  },
  cac: {
    patterns: ['cac', 'corporate affairs commission', 'registration number', 'rc number'],
    response: "**Corporate Affairs Commission (CAC)**\n\nThe CAC is the statutory registry for companies, business names, and incorporated trustees in Nigeria. It also receives annual returns, post-incorporation changes, and official searches.\n\n**Matters commonly handled**\n• Incorporation and business name registration\n• Incorporated trustees (associations and NGOs)\n• Annual returns\n• Change of name, directors, share capital, and registered office\n• Certified true copies and status reports\n\nPrimeflow prepares and lodges CAC filings and monitors them to conclusion. The Commission’s portal is cac.gov.ng."
  },
  bookkeeping: {
    patterns: ['bookkeeping', 'accounting', 'financial records', 'payroll', 'financial reporting', 'audit'],
    response: "**Accounting, bookkeeping and payroll**\n\n**Monthly bookkeeping** typically covers transaction recording, bank reconciliation, payables and receivables, management accounts, and VAT computation.\n\n**Payroll** covers salary computation, PAYE, payslips, and pension deductions.\n\n**Year-end** support includes statutory accounts, CIT returns, and liaison with auditors.\n\n**Indicative fees:** bookkeeping from ₦45,000 per month; payroll from ₦25,000 per month; annual accounts from ₦150,000.\n\nA consultant will scope the engagement to turnover, transaction volume, and reporting needs."
  },
  default: {
    patterns: [],
    response: "This question falls outside the topics covered in detail here.\n\nThis advisor addresses:\n• CAC incorporation and business name registration\n• SCUML, PENCOM, NSITF and related compliance\n• Tax registration, VAT, CIT and tax clearance\n• Indicative fees and processing times\n\nPlease rephrase the question, or speak with a consultant for a matter-specific assessment."
  }
};

const CONTACT_CTA = '\n\n**Next step:** [Speak with a Primeflow consultant on WhatsApp](https://wa.me/2347072928256) · +234 707 292 8256';

function withContact(text: string) {
  if (text.includes('Speak with a Primeflow consultant')) return text;
  return text + CONTACT_CTA;
}

const QUICK_PROMPTS = [
  'What is required to incorporate a company?',
  'Who must register with SCUML?',
  'What are your professional fees?',
  'What are the principal tax obligations?',
  'How long do CAC filings take?',
  'How do I reach a consultant?',
];

// ─── Match KB entry ───────────────────────────────────────────────────────────
function matchResponse(input: string, location: { state: string; lga: string } | null): string {
  const lower = input.toLowerCase();

  // Location specific query intercepts
  if (location && location.state && (lower.includes('office') || lower.includes('location') || lower.includes('address') || lower.includes('where are you'))) {
    return withContact(`**Office and regional support**\n\nYour profile indicates activity in **${location.state}**${location.lga ? ` (${location.lga})` : ''}. Primeflow coordinates remote filings nationwide and offers document collection where arranged.\n\n**Head office:** Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja.`);
  }

  for (const key of Object.keys(KB)) {
    if (key === 'default') continue;
    if (KB[key].patterns.some(p => lower.includes(p))) {
      let resp = KB[key].response;
      if (location && location.state && key === 'contact') {
        resp += `\n\nFor clients in **${location.state}**, Primeflow assigns a coordinating officer for regional filings where required.`;
      }
      return withContact(resp);
    }
  }
  return withContact(KB.default.response);
}

// ─── Format markdown-like text ────────────────────────────────────────────────
function formatInline(text: string): React.ReactNode[] {
  const chunks = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return chunks.filter(Boolean).map((chunk, j) => {
    const link = chunk.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={j}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#D71920', fontWeight: 700, textDecoration: 'underline' }}
        >
          {link[1]}
        </a>
      );
    }
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={j} style={{ color: '#e2e8f0' }}>{chunk.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={j}>{chunk}</React.Fragment>;
  });
}

function formatText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**') && !line.includes('](')) {
      return <strong key={i} style={{ color: '#fff', display: 'block', marginTop: i > 0 ? '10px' : 0 }}>{line.replace(/\*\*/g, '')}</strong>;
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => c.replace(/-/g, '').trim() === '')) return null;
      return (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `1fr 1fr`, gap: '4px', fontSize: '0.8rem', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {cells.map((c, j) => <span key={j} style={{ color: j === 0 ? '#e2e8f0' : '#D71920', fontWeight: j === 0 ? '400' : '600' }}>{formatInline(c)}</span>)}
        </div>
      );
    }
    if (line.match(/^[•✅⚠️📌📱📧📍🕐]/)) {
      return <div key={i} style={{ display: 'flex', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem', marginTop: '2px' }}><span style={{ flexShrink: 0 }}>{line[0]}</span><span>{formatInline(line.slice(1).trim())}</span></div>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />;
    return <div key={i} style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6', marginTop: '4px' }}>{formatInline(line)}</div>;
  }).filter(Boolean);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AIAdvisor: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: "**Primeflow Business Advisor**\n\nThis assistant outlines CAC registration, regulatory compliance, taxation, fees, and timelines in Nigeria. It does not replace a consultant review of your facts.\n\nAsk a specific question, or open a consultation for a formal instruction." + CONTACT_CTA,
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
      const responseText = withContact(matchResponse(text, userLocation));
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
      text: "The conversation has been cleared. Ask about registration, compliance, taxation, or professional fees." + CONTACT_CTA,
      timestamp: new Date()
    }]);
    setShowPrompts(true);
  };

  return (
    <div className="animate-fade-in ai-advisor-container" style={{ display: 'flex', flexDirection: 'column', height: embedded ? 'min(72vh, 680px)' : 'calc(100vh - var(--header-height))', padding: embedded ? '0' : '20px', gap: '20px' }}>
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
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>General guidance · Consultant review for filings</span>
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
                placeholder="Ask about incorporation, compliance, tax, or fees"
                className="form-input"
                style={{ flex: 1, margin: 0 }}
                disabled={isTyping}
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }} disabled={!inputText.trim() || isTyping}>
                <Send size={18} />
              </button>
            </form>
            <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: '10px', textAlign: 'center' }}>
              Guidance is general and not legal advice. For a filing or opinion,
              <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" style={{ color: '#D71920', textDecoration: 'none', marginLeft: '4px', fontWeight: 700 }}>speak with a Primeflow consultant →</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
