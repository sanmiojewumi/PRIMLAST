import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, ShieldCheck, FileText, TrendingUp, Users, Phone, Mail,
  MapPin, ArrowRight, CheckCircle2, Star, ChevronLeft, ChevronRight,
  Award, Clock, MessageCircle, X,
  BarChart3, Globe, Layers, Zap, Lock, HeartHandshake, ChevronDown
} from 'lucide-react';

import DraggableWhatsApp from './DraggableWhatsApp';
import AIAdvisor from './AIAdvisor';

interface LandingPageProps {
  onShowAuth: (view: 'login' | 'register') => void;
}

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

// ─── Intersection Observer Hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Section Fade Wrapper ────────────────────────────────────────────────────
const FadeSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// ─── Data ────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    category: 'Business Registration',
    icon: Building2,
    color: '#D71920',
    items: ['Name Reservation', 'Business Name Registration', 'Company Incorporation', 'Incorporated Trustees', 'Annual Returns', 'Change of Company Name', 'CTC Documents', 'Company Upgrade', 'Historical Search', 'Increase of Share Capital'],
    description: 'Complete CAC registration solutions from name search to certificate collection.',
  },
  {
    category: 'Regulatory Compliance',
    icon: ShieldCheck,
    color: '#D71920',
    items: ['SCUML Registration', 'PENCOM Compliance', 'NSITF Registration', 'ITF Registration', 'Trademark Registration', 'NRS Compliance'],
    description: 'Stay fully compliant with all Nigerian regulatory bodies and avoid penalties.',
  },
  {
    category: 'Tax & Accounting',
    icon: BarChart3,
    color: '#D71920',
    items: ['VAT Filing', 'Company Income Tax', 'Bookkeeping', 'Payroll Management', 'Financial Reporting', 'Audit Preparation'],
    description: 'Expert tax planning, filing, and accounting services for businesses of all sizes.',
  },
  {
    category: 'Business Advisory',
    icon: TrendingUp,
    color: '#D71920',
    items: ['Internal Control Systems', 'Cash Flow Management', 'Inventory Management', 'Business Financing', 'Financial Analysis', 'Staff Training'],
    description: 'Strategic corporate guidance to help your business scale and thrive.',
  },
];

const FEATURES = [
  { icon: Zap, title: 'Fast Turnaround', desc: 'We process filings at record speed, so your business never misses a beat.' },
  { icon: Award, title: 'Expert Advisors', desc: 'Certified consultants with deep expertise in Nigerian corporate law and compliance.' },
  { icon: HeartHandshake, title: 'End-to-End Support', desc: 'From first consultation to certificate delivery, we handle everything.' },
  { icon: Globe, title: 'Transparent Pricing', desc: 'Clear, upfront pricing with no hidden charges or surprises.' },
  { icon: ShieldCheck, title: 'Regulatory Expertise', desc: 'Deep knowledge of CAC, NRS, SCUML, PENCOM, NSITF, and more.' },
  { icon: Lock, title: 'Secure Processes', desc: 'Encrypted document handling and secure client portal for total peace of mind.' },
  { icon: Users, title: 'Dedicated Consultants', desc: 'A personal consultant assigned to every client for focused attention.' },
  { icon: Layers, title: 'Trusted Partner', desc: '700+ businesses registered and thriving across Nigeria.' },
];

const TESTIMONIALS = [
  { name: 'Emeka Okonkwo', role: 'CEO, Okonkwo Ventures', stars: 5, text: 'Primeflow handled our company incorporation flawlessly in under 10 days. The team is professional, responsive, and thorough. Highly recommended!' },
  { name: 'Amina Bello', role: 'Founder, AminaDesigns Ltd', stars: 5, text: 'I was overwhelmed by the SCUML registration process until Primeflow stepped in. They made it stress-free and affordable. Absolute lifesavers!' },
  { name: 'Tunde Adeyemi', role: 'Director, Adeyemi Holdings', stars: 5, text: 'Their tax and accounting team saved our company from regulatory penalties. We now file on time every year. Excellent work, Primeflow!' },
  { name: 'Fatima Garba', role: 'MD, Garba Logistics', stars: 5, text: 'From business name registration to PENCOM compliance, Primeflow did it all seamlessly. Their online portal is a game-changer for business owners.' },
  { name: 'Chidi Nwachukwu', role: 'Entrepreneur, Lagos', stars: 5, text: 'I highly recommend Primeflow to every business owner in Nigeria. They are fast, reliable, and honest. My go-to firm for all corporate matters.' },
];

const INFO_GUIDES = [
  {
    tag: 'Registration',
    title: 'Company or business name: choosing a structure',
    excerpt: 'Limited liability, ownership, banking, and contracting each point to a different CAC vehicle.',
    body: 'A business name is typically used by a sole proprietor. Registration is relatively swift and inexpensive, but the proprietor and the business are not legally separate, so personal assets remain exposed to business liabilities.\n\nA private company limited by shares is a distinct legal person. It is ordinarily preferable where there is more than one owner, a need to ring-fence personal assets, institutional banking, investment, or public-sector contracting. The file will include proposed names, directors, shareholders, share capital, the objects of the company, and a Nigerian registered office.\n\nPrimeflow prepares the CAC submission, monitors name reservation and incorporation, and delivers the certificate. A consultant can advise which structure fits the intended activity.'
  },
  {
    tag: 'Documents',
    title: 'Documents ordinarily required for CAC incorporation',
    excerpt: 'Complete packs reduce queries and delay at name search and filing.',
    body: 'You should expect to provide two proposed names; passport photographs; government-issued identification for each director and shareholder; residential addresses; a description of the business; the proposed shareholding; and a registered office in Nigeria. Occupation, nationality, and contact details are also commonly required.\n\nIncorporated trustees (associations and NGOs) additionally require a constitution and particulars of the trustees.\n\nDocuments may be uploaded in the client portal or sent to Primeflow for a pre-filing review.'
  },
  {
    tag: 'Compliance',
    title: 'SCUML, PENCOM, NSITF and ITF: scope in outline',
    excerpt: 'Post-incorporation registrations depend on sector, headcount, and payroll.',
    body: 'SCUML applies to many designated non-financial businesses and professions, including segments of real estate, dealing, professional practice, and non-profits. Carrying on such a business without registration where it is required may attract penalties.\n\nPENCOM generally applies to employers with three or more employees: staff must be enrolled with a licensed PFA and contributions remitted.\n\nNSITF (employees’ compensation) typically applies from the first employee, with contribution commonly assessed at 1% of payroll.\n\nITF may apply as headcount and payroll increase. Tax registrations (TIN, VAT, CIT) run in parallel. Primeflow sequences these filings so that only obligations that are actually in force are taken on.'
  },
  {
    tag: 'Taxation',
    title: 'Principal tax obligations for companies',
    excerpt: 'TIN, VAT, company income tax, and withholding tax — and when they usually fall due.',
    body: 'A Tax Identification Number should be obtained promptly after incorporation. VAT is currently 7.5% on taxable supplies and is generally filed monthly, often on or before the 21st of the following month. Company Income Tax is an annual charge; rates depend on turnover bands under current NRS rules and should be confirmed for the relevant year.\n\nWithholding tax is deducted at source on specified payments. Maintaining invoices and bank records monthly avoids year-end reconstruction.\n\nPrimeflow undertakes TIN registration, VAT and CIT filings, and tax clearance applications, either as a package or by instruction.'
  },
  {
    tag: 'Deadlines',
    title: 'CAC annual returns and the cost of default',
    excerpt: 'Filing windows, penalties, and the risk of striking off.',
    body: 'Business names generally file annual returns within 90 days of the anniversary of registration. Companies file after the annual general meeting, commonly within 42 days of the AGM, with a longer statutory window for the first return after incorporation.\n\nLate filing attracts penalties that accrue. Persistent default may lead to striking off the register.\n\nSupply your RC or BN number and Primeflow will confirm status, prepare the return, and file.'
  },
  {
    tag: 'Fees',
    title: 'Indicative Primeflow professional fees',
    excerpt: 'Starting fees. Final quotations depend on share capital, extras, and government charges.',
    body: 'Business name from ₦35,000; company incorporation from ₦85,000; annual returns from ₦30,000; SCUML from ₦40,000; PENCOM set-up from ₦50,000; NSITF from ₦45,000; trademark from ₦120,000 per class; tax compliance from ₦60,000 per year.\n\nTypical processing: business name 3–5 working days; company 7–14 working days, subject to CAC systems and a complete file.\n\nA written quotation for a defined mandate is available from a consultant on WhatsApp.'
  }
];

const FAQS = [
  { q: 'How long does a CAC certificate usually take?', a: 'A business name is typically completed in 3–5 working days. A company is typically completed in 7–14 working days where the file is complete. Agency system availability can extend these periods. Primeflow reviews documents before filing to reduce queries.' },
  { q: 'Where is Primeflow based?', a: 'The office is at Suite 29, Ejimuz Plaza, Aso Savings Road, Kubwa, Abuja. Filings are also handled remotely for clients elsewhere in Nigeria.' },
  { q: 'Are published fees the final cost?', a: 'The figures shown are starting professional fees. Government charges, share capital, additional classes, and the state of your records may change the quotation. A consultant will confirm the fee before work begins.' },
  { q: 'Who carries out the official filing?', a: 'Statutory filings are prepared and lodged by Primeflow consultants. This website and the advisor summarise process and documents; they do not themselves constitute a filing or a legal opinion.' },
];

const TRUST_AGENCIES = [
  {
    name: 'CAC',
    id: 'cac',
    full: 'Corporate Affairs Commission',
    more: 'The CAC registers companies, business names, and incorporated trustees, and receives annual returns and post-incorporation changes. Primeflow files name reservations, incorporation, CTCs, share capital increases, and status reports on your behalf.'
  },
  {
    name: 'NRS',
    id: 'nrs',
    full: 'Nigeria Revenue Service',
    more: 'NRS (formerly FIRS at federal level in many filings) handles TIN, VAT, Company Income Tax, withholding tax, and tax clearance. We register your TIN, file returns, and prepare TCC applications so you stay current with tax law.'
  },
  {
    name: 'SCUML',
    id: 'scuml',
    full: 'Special Control Unit Against Money Laundering',
    more: 'SCUML registration is required for many designated non-financial businesses and professions (including some real estate, dealers, professional firms, and NGOs). Operating without it can attract penalties. Primeflow prepares the pack and follows the application through.'
  },
  {
    name: 'PENCOM',
    id: 'pencom',
    full: 'National Pension Commission',
    more: 'Employers with three or more employees must register staff with a licensed PFA and remit pension (typically 8% employee + 10% employer of monthly emolument). We help you choose a PFA, onboard staff, and stay on remittance.'
  },
  {
    name: 'NSITF',
    id: 'nsitf',
    full: 'Nigeria Social Insurance Trust Fund',
    more: 'NSITF covers workplace injury and related employee compensation. Most employers with at least one staff member should register and contribute (commonly 1% of payroll). We handle registration and ongoing compliance.'
  },
  {
    name: 'ITF',
    id: 'itf',
    full: 'Industrial Training Fund',
    more: 'ITF applies as your headcount and payroll grow (statutory thresholds apply). Contribution supports industrial skills training. Primeflow confirms whether you are in scope and files ITF registration and returns when required.'
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  const [activeService, setActiveService] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileServiceCat, setMobileServiceCat] = useState<number | null>(null);
  const { ref: statsRef, inView: statsInView } = useInView(0.3);
  const c1 = useCounter(700, 2200, statsInView);
  const c2 = useCounter(400, 2000, statsInView);
  const c3 = useCounter(10, 1800, statsInView);
  const c4 = useCounter(98, 2500, statsInView);

  const LANDING_NAV = [
    { label: 'Services', href: '#services' },
    { label: 'Guides', href: '#guides' },
    { label: 'AI Advisor', href: '#advisor' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'Contact', href: '#contact' },
  ];

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('landing-menu-open', mobileMenuOpen);
    if (mobileMenuOpen) {
      setMobileServicesOpen(false);
      setMobileServiceCat(null);
    }
    return () => document.body.classList.remove('landing-menu-open');
  }, [mobileMenuOpen]);
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate services
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService(i => (i + 1) % SERVICES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactService, setContactService] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [legalModal, setLegalModal] = useState<{ title: string; body: string } | null>(null);
  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const nextTestimonial = () => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length);
  const prevTestimonial = () => setTestimonialIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  const submitConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hello Primeflow, I would like a free consultation.\n\nName: ${contactName}\nEmail: ${contactEmail}\nPhone: ${contactPhone}\nService: ${contactService}\n\n${contactMessage || 'Please get in touch with me.'}`
    );
    window.open(`https://wa.me/2347072928256?text=${text}`, '_blank', 'noopener,noreferrer');
    setContactSent(true);
  };

  return (
    <div className="landing-root">

      {/* ── FLOATING DRAGGABLE WHATSAPP ───────────────────────────────── */}
      <DraggableWhatsApp />


      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div
            className="landing-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Return to Homepage"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
          >
            <span className="brand-logo-plate">
            <img src="/logo.png?v=4" alt="Primeflow Logo" className="brand-logo" style={{ height: '44px', width: '96px', borderRadius: '8px' }} />
            </span>
            <div className="landing-brand-copy">
              <div style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>
                PRIME<span style={{ color: '#D71920' }}>FLOW</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '-2px' }}>Consulting Services</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="landing-nav-links">
            <a href="#services">Services</a>
            <a href="#guides">Guides</a>
            <a href="#advisor">AI Advisor</a>
            <a href="#why-us">Why Us</a>
            <a href="#contact">Contact</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="landing-nav-cta">
              <button onClick={() => onShowAuth('login')} className="landing-btn-ghost">Sign In</button>
              <button onClick={() => onShowAuth('register')} className="landing-btn-primary">Get Started</button>
            </div>
            <button
              type="button"
              className="landing-hamburger"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen(v => !v);
              }}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && createPortal(
        <div className="landing-mobile-menu" role="dialog" aria-label="Site menu">
          <div className="landing-mobile-menu-inner">
            <div className="landing-mobile-group">
              <button
                type="button"
                className="landing-mobile-group-toggle"
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen(v => !v)}
              >
                <span>Services</span>
                <ChevronDown size={18} style={{ transform: mobileServicesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {mobileServicesOpen && (
                <div className="landing-mobile-services">
                  {SERVICES.map((s, i) => {
                    const Icon = s.icon;
                    const open = mobileServiceCat === i;
                    return (
                      <div key={s.category} className="landing-mobile-service-cat">
                        <button
                          type="button"
                          className={`landing-mobile-cat-btn ${open ? 'active' : ''}`}
                          onClick={() => setMobileServiceCat(open ? null : i)}
                        >
                          <Icon size={16} />
                          <span>{s.category}</span>
                          <ChevronDown size={14} style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {open && (
                          <ul className="landing-mobile-options">
                            {s.items.map(item => (
                              <li key={item}>
                                <a
                                  href="#services"
                                  onClick={() => {
                                    setActiveService(i);
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  {item}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {LANDING_NAV.filter(link => link.href !== '#services').map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="landing-mobile-link"
              >
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => { setMobileMenuOpen(false); onShowAuth('login'); }} className="landing-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>Sign In</button>
            <button type="button" onClick={() => { setMobileMenuOpen(false); onShowAuth('register'); }} className="landing-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>Get Started <ArrowRight size={16} /></button>
          </div>
        </div>,
        document.body
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Animated background elements */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-grid-lines" />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`hero-particle hero-particle-${i + 1}`} />
        ))}

        <div className="landing-container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Nigeria's Premier Corporate Advisory Firm
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            Start, Grow &<br />
            <span className="hero-headline-red">Protect Your Business</span><br />
            in Nigeria
          </h1>

          <p className="hero-subtext">
            We simplify business registration, compliance, taxation and corporate advisory
            so entrepreneurs can <strong>focus on growing their businesses.</strong>
          </p>

          <div className="hero-cta-row">
            <button onClick={() => onShowAuth('register')} className="landing-btn-primary landing-btn-large">
              Start Your Registration <ArrowRight size={18} />
            </button>
            <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" className="landing-btn-ghost landing-btn-large">
              Book a Free Consultation
            </a>
          </div>

          {/* Trust badges */}
          <div className="hero-trust-row">
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registered with & Compliant to — tap for more</span>
            <div className="hero-agencies">
              {TRUST_AGENCIES.map(a => (
                <a key={a.name} href={`#agency-${a.id}`} className="agency-badge" title={`${a.full} — read more`}>
                  {a.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Hero bottom stats */}
        <div ref={statsRef} className="hero-stats-bar">
          <div className="landing-container">
            <div className="hero-stats-grid">
              {[
                { count: c1, suffix: '+', label: 'Business Registrations' },
                { count: c2, suffix: '+', label: 'Compliance Projects' },
                { count: c3, suffix: '+', label: 'Years Combined Experience' },
                { count: c4, suffix: '%', label: 'Client Satisfaction' },
              ].map((s, i) => (
                <div key={i} className="hero-stat-item">
                  <div className="hero-stat-number">{s.count}{s.suffix}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" className="landing-section">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Our Services</div>
              <h2 className="section-title">Everything Your Business Needs</h2>
              <p className="section-subtitle">Comprehensive corporate solutions delivered by certified experts</p>
            </div>
          </FadeSection>

          {/* Service tabs */}
          <FadeSection delay={0.1}>
            <div className="services-tabs">
              {SERVICES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveService(i)}
                    className={`service-tab ${activeService === i ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    {s.category}
                  </button>
                );
              })}
            </div>
          </FadeSection>

          <FadeSection delay={0.2}>
            <div className="service-panel">
              {SERVICES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className={`service-panel-content ${activeService === i ? 'active' : ''}`}>
                    <div className="service-panel-left">
                      <div className="service-icon-box">
                        <Icon size={36} style={{ color: '#D71920' }} />
                      </div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', fontFamily: "'Outfit', sans-serif", marginBottom: '12px' }}>{s.category}</h3>
                      <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '24px' }}>{s.description}</p>
                      <button onClick={() => onShowAuth('register')} className="landing-btn-primary">
                        Get Started <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="service-panel-right">
                      {s.items.map((item, j) => (
                        <div key={j} className="service-item">
                          <CheckCircle2 size={16} style={{ color: '#D71920', flexShrink: 0, marginTop: '2px' }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── WHY CHOOSE US / ABOUT US ───────────────────────────────────────── */}
      <section id="why-us" className="landing-section landing-section-alt">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Why Primeflow</div>
              <h2 className="section-title">The Primeflow Advantage</h2>
              <p className="section-subtitle">We don't just file documents — we build lasting business partnerships</p>
            </div>
          </FadeSection>

          <div className="features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeSection key={i} delay={0.05 * i}>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Icon size={24} />
                    </div>
                    <h4 className="feature-title">{f.title}</h4>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AGENCY EXPLAINERS ───────────────────────────────────────────── */}
      <section id="agencies" className="landing-section landing-section-alt">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Regulators</div>
              <h2 className="section-title">What CAC, NRS, SCUML, PENCOM, NSITF and ITF mean for you</h2>
              <p className="section-subtitle">Select an agency badge above for a short briefing. Statutory filings are prepared and lodged by Primeflow consultants.</p>
            </div>
          </FadeSection>
          <div className="blog-grid">
            {TRUST_AGENCIES.map((a) => (
              <article key={a.id} id={`agency-${a.id}`} className="blog-card" style={{ scrollMarginTop: '96px' }}>
                <div className="blog-card-tag">{a.name}</div>
                <h4 className="blog-card-title">{a.full}</h4>
                <p className="blog-card-excerpt">{a.more}</p>
                <div className="blog-card-footer">
                  <a href="#advisor" style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'none' }}>Ask the AI Advisor</a>
                  <a
                    href="https://wa.me/2347072928256"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#D71920', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Contact Primeflow <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="landing-section">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">How It Works</div>
              <h2 className="section-title">Get Your Business Registered in 3 Steps</h2>
            </div>
          </FadeSection>

          <div className="steps-row">
            {[
              { step: '01', icon: MessageCircle, title: 'Consult with Us', desc: 'Chat with our expert advisors via WhatsApp, phone, or our online portal to discuss your requirements.' },
              { step: '02', icon: FileText, title: 'Submit Documents', desc: 'Upload your documents securely through our client portal. Our team reviews and processes everything.' },
              { step: '03', icon: Award, title: 'Receive Certificates', desc: 'Your CAC certificate, compliance documents, and all official filings are delivered to you digitally.' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeSection key={i} delay={0.15 * i}>
                  <div className="step-card">
                    <div className="step-number">{s.step}</div>
                    <div className="step-icon-wrap">
                      <Icon size={28} style={{ color: '#D71920' }} />
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: '12px 0 8px' }}>{s.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>{s.desc}</p>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="landing-section landing-section-alt" id="testimonials">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Testimonials</div>
              <h2 className="section-title">Trusted by 700+ Businesses</h2>
              <p className="section-subtitle">Here's what our clients say about working with Primeflow</p>
            </div>
          </FadeSection>

          <FadeSection delay={0.1}>
            <div className="testimonials-wrapper">
              <div className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(TESTIMONIALS[testimonialIdx].stars)].map((_, i) => (
                    <Star key={i} size={18} style={{ fill: '#D71920', color: '#D71920' }} />
                  ))}
                </div>
                <p className="testimonial-text">"{TESTIMONIALS[testimonialIdx].text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {TESTIMONIALS[testimonialIdx].name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{TESTIMONIALS[testimonialIdx].name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{TESTIMONIALS[testimonialIdx].role}</div>
                  </div>
                </div>
              </div>

              <div className="testimonial-controls">
                <button onClick={prevTestimonial} className="testimonial-nav-btn" aria-label="Previous">
                  <ChevronLeft size={20} />
                </button>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {TESTIMONIALS.map((_, i) => (
                    <button key={i} onClick={() => setTestimonialIdx(i)} className={`testimonial-dot ${i === testimonialIdx ? 'active' : ''}`} aria-label={`Testimonial ${i + 1}`} />
                  ))}
                </div>
                <button onClick={nextTestimonial} className="testimonial-nav-btn" aria-label="Next">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FREE GUIDES ─────────────────────────────────────────────────── */}
      <section id="guides" className="landing-section">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Briefings</div>
              <h2 className="section-title">Registration and compliance notes</h2>
              <p className="section-subtitle">Open a topic for a concise briefing. Instruct a consultant when you are ready to file.</p>
            </div>
          </FadeSection>

          <div className="blog-grid">
            {INFO_GUIDES.map((post, i) => {
              const open = openGuide === i;
              return (
                <FadeSection key={i} delay={0.05 * i}>
                  <button
                    type="button"
                    className="blog-card"
                    onClick={() => setOpenGuide(open ? null : i)}
                    style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: open ? '1px solid rgba(215,25,32,0.45)' : undefined }}
                  >
                    <div className="blog-card-tag">{post.tag}</div>
                    <h4 className="blog-card-title">{post.title}</h4>
                    <p className="blog-card-excerpt" style={{ whiteSpace: 'pre-line' }}>{open ? post.body : post.excerpt}</p>
                    <div className="blog-card-footer">
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{open ? 'Close briefing' : 'Read briefing'}</span>
                      <a
                        href="https://wa.me/2347072928256"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#D71920', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Contact Primeflow <ArrowRight size={14} />
                      </a>
                    </div>
                  </button>
                </FadeSection>
              );
            })}
          </div>

          <div className="blog-grid" style={{ marginTop: '28px' }}>
            {FAQS.map((item) => (
              <div key={item.q} className="blog-card" style={{ cursor: 'default' }}>
                <h4 className="blog-card-title">{item.q}</h4>
                <p className="blog-card-excerpt">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PUBLIC AI ADVISOR ───────────────────────────────────────────── */}
      <section id="advisor" className="landing-section landing-section-alt">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Business Advisor</div>
              <h2 className="section-title">AI Business Advisor</h2>
              <p className="section-subtitle">Structured guidance on registration, compliance, tax, and fees. Each response includes a link to consult a Primeflow officer.</p>
            </div>
          </FadeSection>
          <div className="landing-advisor-wrap">
            <AIAdvisor embedded />
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <div className="hero-orb" style={{ width: '400px', height: '400px', top: '-100px', left: '-100px', opacity: 0.12 }} />
        <div className="hero-orb" style={{ width: '300px', height: '300px', bottom: '-80px', right: '-80px', opacity: 0.1 }} />
        <div className="landing-container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <FadeSection>
            <div className="section-badge" style={{ margin: '0 auto 20px' }}>Limited Time</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '800', color: '#fff', fontFamily: "'Outfit', sans-serif", marginBottom: '16px', lineHeight: '1.2' }}>
              Ready to Register<br />Your Business?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px' }}>
              Join 700+ businesses that trust Primeflow for their corporate needs. Get your free consultation today.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => onShowAuth('register')} className="landing-btn-primary landing-btn-large">
                Start Registration <ArrowRight size={18} />
              </button>
              <a href="#advisor" className="landing-btn-ghost landing-btn-large">
                Ask the AI Advisor
              </a>
              <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" className="landing-btn-ghost landing-btn-large">
                Contact Primeflow
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section id="contact" className="landing-section landing-section-alt">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Contact Us</div>
              <h2 className="section-title">Get In Touch</h2>
              <p className="section-subtitle">We're always ready to help. Reach us via any channel below.</p>
            </div>
          </FadeSection>

          <div className="contact-grid">
            <FadeSection delay={0.1}>
              <div className="contact-info-col">
                <div className="contact-item">
                  <div className="contact-icon"><MapPin size={20} style={{ color: '#D71920' }} /></div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Office Address</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Suite 29, Ejimuz Plaza<br />
                      Aso Savings Road, Kubwa<br />
                      Abuja, Nigeria
                    </div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><Phone size={20} style={{ color: '#D71920' }} /></div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Call, SMS & WhatsApp Official Helpline</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" style={{ color: '#D71920', fontWeight: '700', fontSize: '1rem', textDecoration: 'none' }}>
                        +234 707 292 8256 (Calls, SMS & WhatsApp)
                      </a>
                    </div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><Mail size={20} style={{ color: '#D71920' }} /></div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Email</div>
                    <a href="mailto:primeflowconsultingservices@gmail.com" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}>
                      primeflowconsultingservices@gmail.com
                    </a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><Clock size={20} style={{ color: '#D71920' }} /></div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Business Hours</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Monday – Friday: 8am – 5pm<br />Saturday: 10am – 2pm</div>
                  </div>
                </div>
                {/* Social links */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  {[
                    { href: 'https://facebook.com/primeflow', label: 'Facebook', d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                    { href: 'https://instagram.com/primeflow', label: 'Instagram', d: null },
                    { href: 'https://linkedin.com/company/primeflow', label: 'LinkedIn', d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                  ].map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-icon-btn" title={s.label}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {s.d ? <path d={s.d} /> : (
                          <>
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                          </>
                        )}
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </FadeSection>

            <FadeSection delay={0.2}>
              <div className="contact-form-card">
                <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Book a Free Consultation</h4>
                {contactSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                      WhatsApp should now be open with your details. If it did not open, tap the helpline number on the left.
                    </p>
                    <button type="button" className="landing-btn-ghost" onClick={() => setContactSent(false)}>Send another enquiry</button>
                  </div>
                ) : (
                  <form onSubmit={submitConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input type="text" placeholder="Your Full Name" required className="landing-input" value={contactName} onChange={e => setContactName(e.target.value)} />
                    <input type="email" placeholder="Email Address" required className="landing-input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                    <input type="tel" placeholder="Phone Number" required className="landing-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                    <select required className="landing-input" value={contactService} onChange={e => setContactService(e.target.value)}>
                      <option value="" disabled>Select Service</option>
                      {SERVICES.map(s => <option key={s.category} value={s.category}>{s.category}</option>)}
                    </select>
                    <textarea placeholder="Tell us about your business needs..." className="landing-input" style={{ minHeight: '100px', resize: 'vertical' }} value={contactMessage} onChange={e => setContactMessage(e.target.value)} />
                    <button type="submit" className="landing-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Send via WhatsApp <ArrowRight size={16} />
                    </button>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                      Prefer a portal account?{' '}
                      <button type="button" onClick={() => onShowAuth('register')} style={{ background: 'none', border: 'none', color: '#D71920', cursor: 'pointer', fontWeight: 700 }}>Create one here</button>
                    </p>
                  </form>
                )}
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="Return to Homepage"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}
              >
                <span className="brand-logo-plate">
                <img src="/logo.png?v=4" alt="Primeflow Logo" className="brand-logo" style={{ height: '36px', width: '80px', borderRadius: '8px' }} />
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                  PRIME<span style={{ color: '#D71920' }}>FLOW</span>
                </div>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.7', maxWidth: '260px' }}>
                Making Business in Nigeria Stress-Free. Your trusted partner for registration, compliance, and corporate advisory.
              </p>
            </div>
            <div>
              <div className="footer-heading">Services</div>
              <a href="#services" className="footer-link">Business Registration</a>
              <a href="#services" className="footer-link">Regulatory Compliance</a>
              <a href="#services" className="footer-link">Tax & Accounting</a>
              <a href="#services" className="footer-link">Business Advisory</a>
            </div>
            <div>
              <div className="footer-heading">Company</div>
              <a href="#why-us" className="footer-link">About Us</a>
              <a href="#testimonials" className="footer-link">Client Reviews</a>
              <a href="#guides" className="footer-link">Knowledge Hub</a>
              <a href="#contact" className="footer-link">Contact Us</a>
            </div>
            <div>
              <div className="footer-heading">Legal & Compliance</div>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setLegalModal({ title: 'Privacy Policy', body: 'PrimeFlow stores client data, incorporation documents, and identity records in accordance with the Nigeria Data Protection Regulation (NDPR) and CAC filing requirements. Access is limited to authorised staff handling your matter.' }); }} className="footer-link">Privacy Policy</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setLegalModal({ title: 'Terms of Service', body: 'All services are delivered in accordance with CAC regulations, Nigeria Revenue Service (NRS) requirements, and CAMA 2020. Filing timelines depend on complete client documents and agency processing.' }); }} className="footer-link">Terms of Service</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setLegalModal({ title: 'Cookie Policy', body: 'We use essential session cookies only to keep your portal login and application state secure. We do not use advertising trackers on this platform.' }); }} className="footer-link">Cookie Policy</a>
              <div className="footer-heading" style={{ marginTop: '20px' }}>Registered Agencies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {TRUST_AGENCIES.map(a => (
                  <a key={a.name} href={`#agency-${a.id}`} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(215,25,32,0.1)', border: '1px solid rgba(215,25,32,0.2)', borderRadius: '20px', color: '#D71920', fontWeight: '600', textDecoration: 'none' }}>{a.name}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Primeflow Consulting Services. All rights reserved.</span>
            <span>Founded 2020 · Abuja, Nigeria</span>
          </div>
        </div>
      </footer>

      {legalModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLegalModal(null); }}>
          <div className="modal-frame" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>{legalModal.title}</h3>
              <button type="button" onClick={() => setLegalModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="legal-modal-body">{legalModal.body}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
