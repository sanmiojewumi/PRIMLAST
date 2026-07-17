import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, ShieldCheck, FileText, TrendingUp, Users, Phone, Mail,
  MapPin, ArrowRight, CheckCircle2, Star, ChevronLeft, ChevronRight,
  Play, Award, Clock, BookOpen, MessageCircle, X,
  BarChart3, Globe, Layers, Zap, Lock, HeartHandshake
} from 'lucide-react';

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
  { icon: Layers, title: 'Trusted Partner', desc: '200+ businesses registered and thriving across Nigeria.' },
];

const TESTIMONIALS = [
  { name: 'Emeka Okonkwo', role: 'CEO, Okonkwo Ventures', stars: 5, text: 'Primeflow handled our company incorporation flawlessly in under 10 days. The team is professional, responsive, and thorough. Highly recommended!' },
  { name: 'Amina Bello', role: 'Founder, AminaDesigns Ltd', stars: 5, text: 'I was overwhelmed by the SCUML registration process until Primeflow stepped in. They made it stress-free and affordable. Absolute lifesavers!' },
  { name: 'Tunde Adeyemi', role: 'Director, Adeyemi Holdings', stars: 5, text: 'Their tax and accounting team saved our company from regulatory penalties. We now file on time every year. Excellent work, Primeflow!' },
  { name: 'Fatima Garba', role: 'MD, Garba Logistics', stars: 5, text: 'From business name registration to PENCOM compliance, Primeflow did it all seamlessly. Their online portal is a game-changer for business owners.' },
  { name: 'Chidi Nwachukwu', role: 'Entrepreneur, Lagos', stars: 5, text: 'I highly recommend Primeflow to every business owner in Nigeria. They are fast, reliable, and honest. My go-to firm for all corporate matters.' },
];

const BLOG_POSTS = [
  { tag: 'Business Registration', title: 'How to Register a Company in Nigeria: Complete 2025 Guide', excerpt: 'Everything you need to know about incorporating a company with the CAC, from name search to certificate collection.', readTime: '8 min read' },
  { tag: 'Compliance', title: 'SCUML Registration: Who Needs It and How to Apply', excerpt: 'SCUML (Special Control Unit Against Money Laundering) registration is mandatory for many businesses. Learn if yours qualifies.', readTime: '5 min read' },
  { tag: 'Taxation', title: 'Understanding Company Income Tax in Nigeria', excerpt: 'A practical breakdown of CIT rates, filing deadlines, and how to reduce your tax burden legally.', readTime: '6 min read' },
];

const TRUST_AGENCIES = [
  { name: 'CAC', full: 'Corporate Affairs Commission' },
  { name: 'NRS', full: 'Nigeria Revenue Service' },
  { name: 'SCUML', full: 'Special Control Unit Against Money Laundering' },
  { name: 'PENCOM', full: 'National Pension Commission' },
  { name: 'NSITF', full: 'Nigeria Social Insurance Trust Fund' },
  { name: 'ITF', full: 'Industrial Training Fund' },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  const [activeService, setActiveService] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView(0.3);
  const c1 = useCounter(200, 2200, statsInView);
  const c2 = useCounter(100, 2000, statsInView);
  const c3 = useCounter(10, 1800, statsInView);
  const c4 = useCounter(98, 2500, statsInView);

  // Auto-rotate testimonials
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

  const nextTestimonial = () => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length);
  const prevTestimonial = () => setTestimonialIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── FLOATING WHATSAPP ─────────────────────────────────────────── */}
      <a
        href="https://wa.me/2347066714961"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        title="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="Primeflow Logo" style={{ width: '44px', height: '44px', borderRadius: '8px', border: '1.5px solid rgba(215,25,32,0.4)', boxShadow: '0 0 12px rgba(215,25,32,0.25)' }} />
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>
                PRIME<span style={{ color: '#D71920' }}>FLOW</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '-2px' }}>Consulting Services</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="landing-nav-links">
            <a href="#services">Services</a>
            <a href="#why-us">Why Us</a>
            <a href="#blog">Resources</a>
            <a href="#contact">Contact</a>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => onShowAuth('login')} className="landing-btn-ghost">Sign In</button>
            <button onClick={() => onShowAuth('register')} className="landing-btn-primary">Get Started</button>
            {/* Mobile hamburger */}
            <button className="landing-hamburger" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <button onClick={() => setMobileMenuOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={22} /></button>
            {['Services', 'Why Us', 'Resources', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '16px 0', fontSize: '1.1rem', color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{l}</a>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); onShowAuth('register'); }} className="landing-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>Get Started <ArrowRight size={16} /></button>
          </div>
        )}
      </nav>

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
            <a href="https://wa.me/2347066714961" target="_blank" rel="noopener noreferrer" className="landing-btn-ghost landing-btn-large">
              <Play size={16} style={{ fill: 'currentColor' }} />
              Book Free Consultation
            </a>
          </div>

          {/* Trust badges */}
          <div className="hero-trust-row">
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registered with & Compliant to</span>
            <div className="hero-agencies">
              {TRUST_AGENCIES.map(a => (
                <div key={a.name} className="agency-badge" title={a.full}>{a.name}</div>
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

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────── */}
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
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
              <h2 className="section-title">Trusted by 200+ Businesses</h2>
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

      {/* ── KNOWLEDGE HUB PREVIEW ────────────────────────────────────────── */}
      <section id="blog" className="landing-section">
        <div className="landing-container">
          <FadeSection>
            <div className="section-header">
              <div className="section-badge">Knowledge Hub</div>
              <h2 className="section-title">Business Insights & Guides</h2>
              <p className="section-subtitle">Stay informed with expert articles on registration, compliance, and taxation</p>
            </div>
          </FadeSection>

          <div className="blog-grid">
            {BLOG_POSTS.map((post, i) => (
              <FadeSection key={i} delay={0.1 * i}>
                <div className="blog-card" onClick={() => onShowAuth('register')}>
                  <div className="blog-card-tag">{post.tag}</div>
                  <h4 className="blog-card-title">{post.title}</h4>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-footer">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                      <Clock size={14} /> {post.readTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#D71920', cursor: 'pointer', fontWeight: '600' }}>
                      Read more <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          <FadeSection delay={0.3}>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button onClick={() => onShowAuth('register')} className="landing-btn-ghost landing-btn-large">
                <BookOpen size={18} /> Access Full Knowledge Hub
              </button>
            </div>
          </FadeSection>
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
              Join 200+ businesses that trust Primeflow for their corporate needs. Get your free consultation today.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => onShowAuth('register')} className="landing-btn-primary landing-btn-large">
                Start Registration <ArrowRight size={18} />
              </button>
              <a href="https://wa.me/2347066714961" target="_blank" rel="noopener noreferrer" className="landing-btn-ghost landing-btn-large">
                WhatsApp Us
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
                    <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Call & WhatsApp Support</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <a href="https://wa.me/2347072928256" target="_blank" rel="noopener noreferrer" style={{ color: '#D71920', fontWeight: '600', fontSize: '0.95rem', textDecoration: 'none' }}>
                        📞 +234 707 292 8256 (Call / WA)
                      </a>
                      <a href="https://wa.me/2347066714961" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}>
                        📱 +234 706 671 4961 (WA Only)
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
                <form onSubmit={(e) => { e.preventDefault(); onShowAuth('register'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="text" placeholder="Your Full Name" required className="landing-input" />
                  <input type="email" placeholder="Email Address" required className="landing-input" />
                  <input type="tel" placeholder="Phone Number" required className="landing-input" />
                  <select required className="landing-input" defaultValue="">
                    <option value="" disabled>Select Service</option>
                    {SERVICES.map(s => <option key={s.category} value={s.category}>{s.category}</option>)}
                  </select>
                  <textarea placeholder="Tell us about your business needs..." className="landing-input" style={{ minHeight: '100px', resize: 'vertical' }} />
                  <button type="submit" className="landing-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Book Consultation <ArrowRight size={16} />
                  </button>
                </form>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <img src="/logo.jpg" alt="Primeflow Logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
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
              {['Business Registration', 'Regulatory Compliance', 'Tax & Accounting', 'Business Advisory'].map(l => (
                <a key={l} href="#services" className="footer-link">{l}</a>
              ))}
            </div>
            <div>
              <div className="footer-heading">Company</div>
              {['About Us', 'Our Team', 'Knowledge Hub', 'Contact'].map(l => (
                <a key={l} href="#contact" className="footer-link">{l}</a>
              ))}
            </div>
            <div>
              <div className="footer-heading">Legal</div>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
              <div className="footer-heading" style={{ marginTop: '20px' }}>Registered Agencies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {TRUST_AGENCIES.map(a => (
                  <span key={a.name} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(215,25,32,0.1)', border: '1px solid rgba(215,25,32,0.2)', borderRadius: '20px', color: '#D71920', fontWeight: '600' }}>{a.name}</span>
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
    </div>
  );
};

export default LandingPage;
