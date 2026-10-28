import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, FileText, LayoutDashboard, ArrowRight, ShieldCheck, Stethoscope, ChevronRight, Activity, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)
      `,
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden'
    }}>

      {/* Top Navbar */}
      <header className="landing-header-bar" role="banner">
        <div className="landing-header-inner">
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-blue))',
              width: '34px', height: '34px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '800', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
              flexShrink: 0
            }} aria-hidden="true">
              M
            </div>
            <div>
              <span style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', margin: 0, lineHeight: 1.2, fontWeight: '800', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap' }}>MediScan AI</span>
              <span className="landing-logo-subtitle" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: '700', textTransform: 'uppercase', display: 'block', whiteSpace: 'nowrap' }}>Intelligence Platform</span>
            </div>
          </Link>

          {/* Nav Actions */}
          <nav className="landing-nav-actions" aria-label="Site navigation">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary landing-nav-btn">
                Dashboard <ChevronRight size={15} aria-hidden="true" style={{ marginLeft: '4px' }} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary landing-nav-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary landing-nav-btn">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: 'clamp(5rem, 15vw, 10rem) clamp(1rem, 4vw, 1.5rem) clamp(3rem, 8vw, 6rem)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        position: 'relative'
      }} className="fade-in">

        {/* Background glow — hidden on small screens for performance */}
        <div style={{
          position: 'absolute', width: 'min(600px, 90vw)', height: 'min(600px, 90vw)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          opacity: 0.1, zIndex: -1, pointerEvents: 'none'
        }} aria-hidden="true" />

        {/* Badge pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '50px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          color: 'var(--primary)', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          maxWidth: '100%', wordBreak: 'break-word'
        }}>
          <ShieldCheck size={14} aria-hidden="true" /> Clinical-Grade Analysis Engine
        </div>

        {/* Hero headline */}
        <h2 style={{
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          lineHeight: '1.1',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          margin: 0,
          color: 'var(--text-primary)',
          wordBreak: 'break-word'
        }}>
          Demystify Your Medical{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-blue), var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block', paddingBottom: '0.1em'
          }}>Records &amp; Prescriptions</span>
        </h2>

        {/* Sub-description */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', color: 'var(--text-secondary)',
          maxWidth: '680px', lineHeight: '1.65', margin: '0 auto'
        }}>
          Advanced AI meets medical OCR. Upload complex lab reports, clinical charts, and medication labels to receive structured, human-readable insights in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="landing-cta-group" style={{ marginTop: '1.5rem' }}>
          <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem)',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(139,92,246,0.35)'
          }}>
            {user ? 'Open Workspace' : 'Start Analyzing Free'} <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link to={user ? "/scanner" : "/login"} className="btn btn-secondary" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem)',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)'
          }}>
            Try Scanner Demo
          </Link>
        </div>

        {/* Trust pills */}
        <div className="landing-trust-pills" style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Cpu size={14} aria-hidden="true" /> Multimodal AI Vision</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Activity size={14} aria-hidden="true" /> Real-time Processing</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={14} aria-hidden="true" /> Privacy-Aware Design</div>
        </div>
      </section>

      {/* Product Showcase Visual */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 1.5rem) 4rem' }} aria-label="Pipeline overview">
        <div className="card pipeline-card" style={{
          background: 'linear-gradient(to bottom, rgba(20,22,40,0.8), rgba(11,13,28,1))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} aria-hidden="true" />
          <div className="pipeline-icons" style={{ display: 'flex', alignItems: 'center', opacity: 0.55 }} aria-hidden="true">
            <div style={{ display: 'flex', alignItems: 'center' }}><FileText size={56} style={{ color: 'var(--accent-cyan)' }}/></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Cpu size={64} style={{ color: 'var(--primary)' }}/></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={28} style={{ color: 'var(--text-muted)' }} /></div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Activity size={56} style={{ color: 'var(--success)' }}/></div>
          </div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', textAlign: 'center', padding: '0 8px' }}>
            End-to-End Clinical Intelligence Pipeline
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 1.5rem) clamp(4rem, 8vw, 8rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
            Enterprise-Grade Capabilities
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginTop: '1rem' }}>Designed for precision, speed, and comprehensive understanding.</p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: Pill, title: "Medicine Scanner", color: "var(--primary)",
              desc: "Upload images of drug labels. Our OCR extracts chemical names and strengths, feeding them to AI to structure dosages, directions, and severe contraindications."
            },
            {
              icon: FileText, title: "Report Analyzer", color: "var(--accent-cyan)",
              desc: "Upload lab blood reports or clinical charts (PDF/Image formats). We parse physiological ranges and highlight abnormal results, complete with medical warnings."
            },
            {
              icon: Stethoscope, title: "Condition Intel", color: "var(--accent-teal)",
              desc: "Search any disease or condition and get AI-powered clinical insights — symptoms, causes, treatments, and when to seek urgent care — all in plain language."
            },
            {
              icon: LayoutDashboard, title: "Unified History", color: "var(--success)",
              desc: "Maintain a personal timeline of medication guides and physiological analyses. Search, filter, and review previous records securely on your dashboard."
            }
          ].map((feature, idx) => (
            <article key={idx} className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                background: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                color: feature.color,
                width: '52px', height: '52px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 8px 24px color-mix(in srgb, ${feature.color} 12%, transparent)`
              }} aria-hidden="true">
                <feature.icon size={26} />
              </div>
              <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)', lineHeight: '1.65', margin: 0 }}>
                {feature.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center', padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 1.5rem)',
        color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
        background: 'rgba(0,0,0,0.2)'
      }} role="contentinfo">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1rem, 3vw, 2rem)', marginBottom: '1.25rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', padding: '4px 8px', minHeight: '44px' }}>Privacy Policy</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', padding: '4px 8px', minHeight: '44px' }}>Terms of Use</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', padding: '4px 8px', minHeight: '44px' }}>Educational Use Disclaimer</button>
        </div>
        <p style={{ margin: 0 }}>© 2026 MediScan AI. Built with state-of-the-art multimodal models.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
