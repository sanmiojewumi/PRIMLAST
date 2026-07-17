import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, Search, Download, Tag, ChevronRight, TrendingUp, FileText, Shield, BarChart3, Briefcase, Star } from 'lucide-react';

interface Article {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  featured?: boolean;
  content: string[];
}

const CATEGORIES = ['All', 'Business Registration', 'Compliance', 'Taxation', 'Accounting', 'Startup Guide', 'Corporate Governance'];

const CAT_ICONS: Record<string, React.ComponentType<any>> = {
  'Business Registration': FileText,
  'Compliance': Shield,
  'Taxation': BarChart3,
  'Accounting': TrendingUp,
  'Startup Guide': Briefcase,
  'Corporate Governance': Star,
};

const ARTICLES: Article[] = [
  {
    id: '1',
    category: 'Business Registration',
    title: 'How to Register a Company in Nigeria: The Complete 2025 Guide',
    excerpt: 'A step-by-step walkthrough of incorporating a private limited liability company with the CAC, from name search to certificate collection.',
    readTime: '8 min read',
    date: 'June 15, 2025',
    featured: true,
    content: [
      'Company incorporation in Nigeria is handled by the Corporate Affairs Commission (CAC). The process begins with a name search to confirm that your proposed company name is available.',
      'Step 1: Conduct a Name Search — Submit up to 3 proposed names in order of preference via the CAC portal (cac.gov.ng). A name is approved within 24–48 hours.',
      'Step 2: Prepare Incorporation Documents — You will need: Memorandum and Articles of Association (MEMART), Form CAC 1.1 (Application for Registration), details of all directors and shareholders, and the registered office address.',
      'Step 3: Pay Government Fees — The stamp duty fee is based on your share capital. Minimum share capital is ₦1,000,000 for private companies.',
      'Step 4: Submit Application — Documents are submitted online via the CAC portal by an accredited agent. Primeflow handles this on your behalf.',
      'Step 5: Collect Certificate — Upon approval, your Certificate of Incorporation, MEMART, and Status Report are issued. Timeline: 7–14 working days.',
      'Primeflow handles the entire process end-to-end. Contact us to get started today.',
    ]
  },
  {
    id: '2',
    category: 'Compliance',
    title: 'SCUML Registration: Who Needs It and How to Apply in 2025',
    excerpt: 'SCUML registration is mandatory for many businesses in Nigeria. Learn if your business qualifies and how Primeflow can help you comply.',
    readTime: '5 min read',
    date: 'May 28, 2025',
    featured: true,
    content: [
      'The Special Control Unit Against Money Laundering (SCUML) operates under the Economic and Financial Crimes Commission (EFCC). Certain businesses — known as Designated Non-Financial Businesses and Professions (DNFBPs) — are required to register with SCUML.',
      'Who needs SCUML? Businesses in real estate, car dealing, legal services, accounting, precious metals/stones, non-profit organizations, trust/company service providers, and others.',
      'Consequences of Non-Registration: Fines up to ₦10 million, criminal prosecution, and inability to open/maintain bank accounts.',
      'Required Documents: CAC certificate, TIN, board resolution, directors\' IDs, business profile, proof of address.',
      'Timeline: 4–8 working weeks after submission of complete documents.',
      'Primeflow has extensive experience with SCUML registrations across all categories. We ensure your application is complete and error-free.',
    ]
  },
  {
    id: '3',
    category: 'Taxation',
    title: 'Understanding Company Income Tax (CIT) in Nigeria for 2025',
    excerpt: 'A practical breakdown of CIT rates, filing deadlines, allowable deductions, and how to legally reduce your company\'s tax burden.',
    readTime: '6 min read',
    date: 'May 10, 2025',
    content: [
      'Company Income Tax (CIT) is levied on the profits of registered companies in Nigeria under the Companies Income Tax Act (CITA).',
      'CIT Rates (2025): Small companies (turnover ≤ ₦25M): 0% | Medium companies (₦25M–₦100M): 20% | Large companies (> ₦100M): 30%.',
      'Filing Deadline: CIT returns must be filed within 6 months of the company\'s financial year-end. Late filing attracts a penalty of ₦25,000 + ₦5,000 per month.',
      'Allowable Deductions: Business expenses wholly and exclusively incurred for business purposes, capital allowances, bad debt provisions, and approved donations.',
      'Tax Planning Strategies: Utilize pioneer status, invest in qualifying capital expenditure, explore tax incentives in priority sectors.',
      'Primeflow\'s tax team provides full CIT compliance services including preparation, review, filing, and NRS liaison.',
    ]
  },
  {
    id: '4',
    category: 'Startup Guide',
    title: '10 Legal Things Every Nigerian Startup Must Do in Its First Year',
    excerpt: 'From CAC registration to PENCOM compliance — a practical checklist for founders to protect their business legally from day one.',
    readTime: '7 min read',
    date: 'April 22, 2025',
    content: [
      '1. Register with the CAC — Get your Certificate of Incorporation to legally exist as a business entity.',
      '2. Obtain a Tax Identification Number (TIN) — Required for all business transactions, bank accounts, and contracts.',
      '3. Open a Corporate Bank Account — Using your CAC documents and TIN.',
      '4. Register for VAT — If your turnover will exceed ₦25M annually, VAT registration is mandatory.',
      '5. Comply with PENCOM — If you have 3 or more employees, register them with a Pension Fund Administrator.',
      '6. Register with NSITF — Provide social insurance coverage for your employees.',
      '7. File Annual Returns — Required by CAC every year without fail.',
      '8. Protect Your Brand — Register your trademark with IPONL to prevent infringement.',
      '9. Maintain Proper Books — Keep accurate financial records as required by CAMA 2020.',
      '10. Get Professional Advisory — Partner with a firm like Primeflow to stay ahead of regulatory changes.',
    ]
  },
  {
    id: '5',
    category: 'Accounting',
    title: 'The Importance of Bookkeeping for Small Businesses in Nigeria',
    excerpt: 'Many small business owners underestimate bookkeeping. This guide explains why proper financial records are your business\'s best asset.',
    readTime: '5 min read',
    date: 'April 8, 2025',
    content: [
      'Bookkeeping is the systematic recording of all financial transactions in your business. It forms the foundation of your accounting system.',
      'Why It Matters: Accurate books help you understand your cash flow, prepare for taxes, attract investors, and comply with regulatory requirements.',
      'CAMA 2020 Requirements: All companies are required to keep proper books of account and prepare annual financial statements.',
      'Common Mistakes: Mixing personal and business finances, ignoring petty cash, failing to reconcile bank statements monthly.',
      'Benefits of Professional Bookkeeping: Time savings, accuracy, tax readiness, better business decisions, and compliance with NRS.',
      'Primeflow offers monthly bookkeeping services starting from ₦45,000/month. Contact us to get started.',
    ]
  },
  {
    id: '6',
    category: 'Corporate Governance',
    title: 'CAMA 2020: What Nigerian Companies Need to Know',
    excerpt: 'The Companies and Allied Matters Act 2020 brought sweeping changes to Nigerian company law. Here is what it means for your business.',
    readTime: '9 min read',
    date: 'March 20, 2025',
    content: [
      'The Companies and Allied Matters Act (CAMA) 2020 replaced the outdated CAMA 1990 and introduced significant reforms to modernize Nigeria\'s business environment.',
      'Key Changes: Single-member companies are now allowed. Companies can hold virtual AGMs. Electronic share certificates are valid. The concept of "small companies" has been redefined.',
      'Compliance Changes: Auditors must be appointed within 18 months of incorporation. Annual Returns penalties have increased. Directors\' liability has been expanded.',
      'For NGOs/Associations: More stringent reporting requirements for incorporated trustees.',
      'Post-Incorporation Compliance: Companies must update their statutory registers, file changes to directors promptly, and comply with CAMA\'s new AGM provisions.',
      'Primeflow stays current with all legislative changes to ensure your business remains fully compliant.',
    ]
  },
];

const RESOURCES = [
  { title: 'CAC Company Registration Checklist', type: 'PDF', size: '240 KB' },
  { title: 'Nigerian Tax Calendar 2025', type: 'PDF', size: '180 KB' },
  { title: 'SCUML Registration Guide', type: 'PDF', size: '320 KB' },
  { title: 'Annual Returns Filing Template', type: 'XLSX', size: '95 KB' },
  { title: 'Business Name Registration Guide', type: 'PDF', size: '210 KB' },
];

const KnowledgeHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = ARTICLES.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredArticles = ARTICLES.filter(a => a.featured);

  if (selectedArticle) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => setSelectedArticle(null)}
          className="btn-secondary"
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
        >
          ← Back to Knowledge Hub
        </button>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(215,25,32,0.1)', border: '1px solid rgba(215,25,32,0.25)', marginBottom: '16px' }}>
            <Tag size={12} style={{ color: '#D71920' }} />
            <span style={{ color: '#D71920', fontSize: '0.75rem', fontWeight: '600' }}>{selectedArticle.category}</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", lineHeight: '1.3', marginBottom: '12px' }}>{selectedArticle.title}</h1>

          <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '0.8rem', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {selectedArticle.readTime}</span>
            <span>{selectedArticle.date}</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '24px', borderLeft: '3px solid #D71920', paddingLeft: '16px', fontStyle: 'italic' }}>
            {selectedArticle.excerpt}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedArticle.content.map((para, i) => (
              <p key={i} style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.8', margin: 0 }}>
                {para}
              </p>
            ))}
          </div>

          <div style={{ marginTop: '36px', padding: '24px', borderRadius: '12px', background: 'rgba(215,25,32,0.06)', border: '1px solid rgba(215,25,32,0.2)' }}>
            <div style={{ fontWeight: '700', color: '#fff', marginBottom: '8px', fontSize: '1rem' }}>Need Expert Help?</div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.5' }}>
              Primeflow's certified experts are ready to handle all your {selectedArticle.category.toLowerCase()} needs professionally and efficiently.
            </p>
            <a href="https://wa.me/2347066714961" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              Contact Primeflow <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>Knowledge Hub</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>Expert guides on business registration, compliance, and taxation in Nigeria</p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', margin: 0, width: '100%' }}
          />
        </div>
      </div>

      {/* Featured articles */}
      {!searchQuery && activeCategory === 'All' && (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#D71920', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Featured Articles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {featuredArticles.map(a => (
              <div key={a.id} onClick={() => setSelectedArticle(a)} className="glass-panel" style={{ padding: '24px', cursor: 'pointer', borderColor: 'rgba(215,25,32,0.2)', background: 'rgba(215,25,32,0.04)', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(215,25,32,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(215,25,32,0.12)', marginBottom: '12px' }}>
                  <Star size={11} style={{ fill: '#D71920', color: '#D71920' }} />
                  <span style={{ color: '#D71920', fontSize: '0.7rem', fontWeight: '700' }}>FEATURED</span>
                </div>
                <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', lineHeight: '1.4', margin: '0 0 10px' }}>{a.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.5', margin: '0 0 16px' }}>{a.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#475569' }}>
                    <Clock size={13} /> {a.readTime}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#D71920', fontWeight: '600' }}>
                    Read more <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const Icon = CAT_ICONS[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                borderRadius: '24px', border: '1px solid', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500',
                background: activeCategory === cat ? 'var(--accent-red)' : 'rgba(255,255,255,0.03)',
                borderColor: activeCategory === cat ? 'var(--accent-red)' : 'rgba(255,255,255,0.08)',
                color: activeCategory === cat ? '#fff' : '#94a3b8',
                transition: 'all 0.2s ease'
              }}
            >
              {Icon && <Icon size={14} />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* All articles grid */}
      <div>
        {filteredArticles.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <BookOpen size={40} style={{ color: '#475569', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#64748b', margin: 0 }}>No articles found for your search. Try a different keyword.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredArticles.map(a => {
              const Icon = CAT_ICONS[a.category] || BookOpen;
              return (
                <div key={a.id} onClick={() => setSelectedArticle(a)} className="glass-panel" style={{ padding: '22px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(215,25,32,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(215,25,32,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ color: '#D71920' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#D71920', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.category}</span>
                  </div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: '700', lineHeight: '1.4', margin: '0 0 8px' }}>{a.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.5', margin: '0 0 14px' }}>{a.excerpt}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#475569' }}>
                      <Clock size={12} /> {a.readTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#D71920', fontWeight: '600' }}>
                      Read <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Downloadable Resources */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Download size={20} style={{ color: '#D71920' }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Downloadable Resources</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {RESOURCES.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(215,25,32,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: '#D71920' }}>{r.type}</div>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600' }}>{r.title}</div>
                  <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '1px' }}>{r.size}</div>
                </div>
              </div>
              <button
                onClick={() => alert('Download available after creating an account. Register to access all resources.')}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '14px', textAlign: 'center' }}>
          Create a free account to access all downloadable resources and guides.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeHub;
