import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useT } from '../i18n';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  ReceiptText,
  Users,
  Truck,
  Tag,
  LogOut,
  Bike,
  Globe,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, toggle: toggleLang } = useT();
  const { theme, toggle: toggleTheme, isDark } = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  const NAV = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/pos', label: t('nav.pos'), icon: ShoppingCart },
    { to: '/products', label: t('nav.products'), icon: Package },
    { to: '/brands', label: t('nav.brands'), icon: Tag },
    { to: '/stock', label: t('nav.stock'), icon: Warehouse },
    { to: '/sales', label: t('nav.sales'), icon: ReceiptText },
    { to: '/customers', label: t('nav.customers'), icon: Users },
    { to: '/suppliers', label: t('nav.suppliers'), icon: Truck },
  ];

  function SidebarBody({ onItemClick }) {
    return (
      <>
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
            <Bike size={22} />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">{t('app.name')}</div>
            <div className="text-xs text-brand-200">{t('app.tagline')}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-brand-700 shadow-soft'
                      : 'text-brand-100 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 pb-2 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-100 hover:bg-white/10 transition"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="flex-1 text-left">{isDark ? 'Light mode' : 'Dark mode'}</span>
            <span className="text-[10px] uppercase font-bold bg-white/15 rounded px-1.5 py-0.5">
              {isDark ? 'DARK' : 'LIGHT'}
            </span>
          </button>
          <button
            onClick={toggleLang}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-100 hover:bg-white/10 transition"
          >
            <Globe size={18} />
            <span className="flex-1 text-left">{t('lang.toggle')}</span>
            <span className="text-[10px] uppercase font-bold bg-white/15 rounded px-1.5 py-0.5">
              {lang === 'en' ? 'EN' : 'BN'}
            </span>
          </button>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user?.full_name || user?.username}</div>
              <div className="text-xs text-brand-200 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={() => { logout(); nav('/login'); }}
              className="p-2 rounded-lg hover:bg-white/10 text-brand-100"
              title={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // Sidebar gradient: deep red → near-black
  const sidebarGradient = 'bg-gradient-to-b from-brand-800 via-brand-900 to-ink-950 text-white';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-64 flex-col ${sidebarGradient} sticky top-0 h-screen`}>
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] flex flex-col ${sidebarGradient} shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/70"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          <SidebarBody onItemClick={() => setMobileOpen(false)} />
        </aside>
      </div>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white dark:bg-ink-900 border-b border-slate-200 dark:border-ink-800 px-3 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-700 dark:text-slate-200"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <Bike size={20} className="text-brand-600" />
            <span className="font-display font-bold text-slate-800 dark:text-slate-100">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-600 dark:text-slate-300"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={toggleLang}
              className="text-xs font-bold text-brand-700 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-300 px-2.5 py-1.5 rounded-lg"
              title="Switch language"
            >
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>
            <button
              onClick={() => { logout(); nav('/login'); }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-300"
              aria-label={t('nav.logout')}
            >
              <LogOut size={18}/>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
