import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, Pill, FileText, History, LogOut, Menu, X, 
  User as UserIcon, ShieldCheck, Stethoscope, Settings, 
  ChevronLeft, ChevronRight, Activity, ChevronRight as ChevronRightIcon
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = user && user.email && (
    user.email.trim().toLowerCase().includes('premkardani2006') ||
    user.email.trim().toLowerCase().includes('panchaldhyan007')
  );

  const clinicalApps = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('diseaseSearch'), path: '/disease', icon: Stethoscope },
    { name: t('medicineScanner'), path: '/scanner', icon: Pill },
    { name: t('reportAnalyzer'), path: '/report', icon: FileText },
    { name: t('medicalHistory'), path: '/history', icon: History },
  ];

  const managementApps = [
    ...(isAdmin ? [{ name: t('adminPanel'), path: '/admin', icon: ShieldCheck }] : []),
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ item, onClick, collapsed }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <NavLink
        to={item.path}
        onClick={onClick}
        className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
        title={collapsed ? item.name : ''}
      >
        <div className="nav-icon-container">
          <Icon size={20} className="nav-icon" />
        </div>
        {!collapsed && <span className="nav-label">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <div className="app-container">
      {/* Skip to main content — screen reader accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Desktop Sidebar */}
      <aside className={`desktop-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-icon">M</div>
          {!isCollapsed && (
            <div className="logo-text-container">
              <h2 className="logo-text">MediScan AI</h2>
              <span className="logo-badge">Clinical Portal</span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="sidebar-scrollable">
          {/* User Card */}
          {user && (
            <div className="profile-card" onClick={() => navigate('/settings')} title={isCollapsed ? "Profile Settings" : ""}>
              <div className="profile-avatar">
                <UserIcon size={18} />
              </div>
              {!isCollapsed && (
                <div className="profile-info">
                  <p className="profile-name">{user.name}</p>
                  <p className="profile-email" title={user.email}>{user.email}</p>
                </div>
              )}
              {!isCollapsed && <ChevronRightIcon size={16} className="profile-chevron" />}
            </div>
          )}

          {/* Section: Clinical */}
          <div className="nav-section">
            {!isCollapsed && <p className="nav-section-title">Clinical Apps</p>}
            {isCollapsed && <div className="nav-section-divider" />}
            <nav className="nav-list">
              {clinicalApps.map((item) => <NavItem key={item.path} item={item} collapsed={isCollapsed} />)}
            </nav>
          </div>

          {/* Section: Management */}
          <div className="nav-section">
            {!isCollapsed && <p className="nav-section-title">Management</p>}
            {isCollapsed && <div className="nav-section-divider" />}
            <nav className="nav-list">
              {managementApps.map((item) => <NavItem key={item.path} item={item} collapsed={isCollapsed} />)}
            </nav>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button className={`logout-btn ${isCollapsed ? 'collapsed' : ''}`} onClick={handleLogout} title={isCollapsed ? t('logOut') : ""}>
            <LogOut size={20} />
            {!isCollapsed && <span>{t('logOut')}</span>}
          </button>
          
          <button className="collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="mobile-header" role="banner">
        <div className="mobile-logo-area">
          <div className="logo-icon" aria-hidden="true">M</div>
          <h2 className="mobile-logo-text">MediScan AI</h2>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop — tap to close */}
          <div
            style={{ position: 'fixed', inset: 0, top: '60px', zIndex: 98, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div id="mobile-nav-drawer" className="mobile-drawer" role="navigation" aria-label="Mobile navigation">
            <div className="mobile-drawer-content">
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                </div>
              )}
              <p className="nav-section-title">Clinical Apps</p>
              <nav className="nav-list" aria-label="Clinical navigation">
                {clinicalApps.map((item) => (
                  <NavItem key={item.path} item={item} collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </nav>
              <p className="nav-section-title" style={{ marginTop: '1.5rem' }}>Management</p>
              <nav className="nav-list" aria-label="Management navigation">
                {managementApps.map((item) => (
                  <NavItem key={item.path} item={item} collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </nav>
              <button className="mobile-logout-btn" onClick={() => { setMobileMenuOpen(false); handleLogout(); }} aria-label="Log out">
                <LogOut size={20} aria-hidden="true" />
                <span>{t('logOut')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main id="main-content" className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`} role="main">
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          
          <footer className="app-footer">
            <div className="footer-badges">
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              <span>Educational Demo • Privacy-Aware Design</span>
            </div>
            <p className="footer-text">
              © 2026 MediScan AI. AI interpretations are informational and do not replace a physician's advice.
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {clinicalApps.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={22} className="bottom-nav-icon" />
              <span className="bottom-nav-label">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        /* Sidebar Base */
        .desktop-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-card);
          border-right: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(0,0,0,0.4);
        }
        .desktop-sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        /* Sidebar Header (Logo) */
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px;
          height: 88px;
          flex-shrink: 0;
        }
        .logo-icon {
          background: linear-gradient(135deg, var(--primary), var(--primary-blue));
          min-width: 40px;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        .logo-text-container {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
          opacity: 1;
          animation: fadeIn 0.3s ease forwards;
        }
        .logo-text {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .logo-badge {
          font-size: 11px;
          color: var(--primary);
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Scrollable Area */
        .sidebar-scrollable {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-scrollable::-webkit-scrollbar {
          width: 4px;
        }

        /* Profile Card */
        .profile-card {
          padding: 12px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .profile-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .desktop-sidebar.collapsed .profile-card {
          padding: 10px;
          border-radius: 12px;
          justify-content: center;
        }
        .profile-avatar {
          min-width: 38px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(139, 92, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
        .profile-info {
          min-width: 0;
          flex: 1;
          white-space: nowrap;
          animation: fadeIn 0.3s ease forwards;
        }
        .profile-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .profile-email {
          font-size: 12px;
          color: var(--text-muted);
          white-space: normal;
          word-break: break-all;
          line-height: 1.35;
        }
        .profile-chevron {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .profile-card:hover .profile-chevron {
          color: var(--text-primary);
          transform: translateX(2px);
        }

        /* Nav Sections */
        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-section-title {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding-left: 12px;
          white-space: nowrap;
        }
        .nav-section-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 8px 12px;
        }
        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Nav Items */
        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          color: var(--text-secondary);
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .nav-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: var(--primary);
          transition: width 0.2s ease;
          border-radius: 4px;
        }
        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
        }
        .nav-item.active {
          color: #fff;
          font-weight: 600;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 100%);
        }
        .nav-item.active::before {
          width: 4px;
        }
        .nav-icon-container {
          min-width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .nav-item:hover .nav-icon-container {
          color: var(--text-primary);
        }
        .nav-item.active .nav-icon-container {
          color: var(--primary);
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
        }
        .nav-label {
          white-space: nowrap;
          opacity: 1;
          animation: fadeIn 0.3s ease forwards;
        }
        .desktop-sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 14px;
        }
        .desktop-sidebar.collapsed .nav-item.active::before {
          width: 100%;
          opacity: 0.1;
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-card);
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 12px;
          color: var(--danger);
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          width: 100%;
          justify-content: flex-start;
          white-space: nowrap;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        .logout-btn.collapsed {
          justify-content: center;
          padding: 12px;
        }
        
        .collapse-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .collapse-toggle:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }

        /* Mobile Header */
        .mobile-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: var(--bg-card);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
          box-shadow: 0 2px 16px rgba(0,0,0,0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .mobile-logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mobile-logo-text {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .mobile-menu-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        /* Mobile Drawer */
        .mobile-drawer {
          position: fixed;
          top: 60px; left: 0; right: 0; bottom: 0;
          background: var(--bg-primary);
          z-index: 99;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-drawer-content {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .mobile-logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: var(--danger);
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          margin-top: 32px;
          justify-content: center;
        }

        /* Footer */
        .app-footer {
          margin-top: 48px;
          padding: 24px;
          border-top: 1px solid rgba(255,255,255,0.03);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .footer-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 12px;
          background: rgba(255,255,255,0.02);
          padding: 6px 12px;
          border-radius: 50px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .footer-text {
          color: var(--text-muted);
          font-size: 12px;
        }

        /* Mobile Bottom Nav */
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(17, 21, 42, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.05);
          display: none;
          align-items: center;
          justify-content: space-around;
          padding: 8px 12px;
          z-index: 99;
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
          box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 6px;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.2s ease;
          min-width: 60px;
          position: relative;
        }
        .bottom-nav-icon {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s;
        }
        .bottom-nav-item:hover {
          color: var(--text-secondary);
        }
        .bottom-nav-item.active {
          color: var(--primary);
        }
        .bottom-nav-item.active .bottom-nav-icon {
          transform: translateY(-2px);
          filter: drop-shadow(0 4px 8px rgba(139, 92, 246, 0.4));
        }
        .bottom-nav-label {
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          transition: color 0.2s;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive Layout Overrides */
        @media (min-width: 1025px) {
          .main-content {
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: var(--sidebar-width);
            width: calc(100% - var(--sidebar-width));
          }
          .main-content.sidebar-collapsed {
            margin-left: var(--sidebar-collapsed-width);
            width: calc(100% - var(--sidebar-collapsed-width));
          }
        }

        @media (max-width: 1024px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding-top: calc(60px + 16px);
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
