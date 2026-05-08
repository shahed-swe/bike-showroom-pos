import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useT } from '../i18n';
import { Bike, Lock, User, Globe, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login } = useAuth();
  const { t, lang, toggle: toggleLang } = useT();
  const { toggle: toggleTheme, isDark } = useTheme();
  const nav = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success(t('common.welcome_back'));
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 relative bg-slate-50 dark:bg-ink-950">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 bg-white dark:bg-ink-900 shadow-soft border border-slate-200 dark:border-ink-800 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-ink-800"
          title="Toggle theme"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 bg-white dark:bg-ink-900 shadow-soft border border-slate-200 dark:border-ink-800 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-ink-800"
        >
          <Globe size={14} /> {t('lang.toggle')}
        </button>
      </div>

      <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-ink-950 text-white">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center">
              <Bike size={26} />
            </div>
            <div>
              <div className="font-display font-bold text-2xl">{t('app.name')}</div>
              <div className="text-brand-200 text-sm">{t('app.tagline')}</div>
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              {t('login.heading_title')}<br/>{t('login.heading_l2')}<br/>{t('login.heading_l3')}
            </h1>
            <p className="text-brand-100 mt-4 text-lg">{t('login.subtitle')}</p>
          </div>
          <div className="text-brand-200 text-sm">
            © {new Date().getFullYear()} {t('app.name')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md card p-8">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white">
              <Bike size={22} />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">{t('app.name')}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{t('login.welcome')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">{t('login.welcome_sub')}</p>

          <div className="space-y-4">
            <div>
              <label className="label">{t('login.username')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  className="input pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  className="input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5">
            {loading ? t('login.signing_in') : t('login.signin')}
          </button>

          <div className="mt-6 p-3 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 text-xs text-brand-800 dark:text-brand-300">
            <strong>{t('login.demo')}</strong>
          </div>
        </form>
      </div>
    </div>
  );
}
