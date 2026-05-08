import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatBDT, formatDate } from '../lib/api';
import { useT } from '../i18n';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#0082c8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
          <div className="font-display text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{value}</div>
          {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
        </div>
        <div className={`w-11 h-11 rounded-xl grid place-items-center bg-${color}-50 text-${color}-600`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useT();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/sales-trend?days=30'),
      api.get('/dashboard/top-products?limit=5&days=30'),
      api.get('/dashboard/category-breakdown?days=30'),
      api.get('/dashboard/recent-sales?limit=8'),
    ]).then(([s, tr, tp, b, r]) => {
      setSummary(s.data);
      setTrend(tr.data);
      setTopProducts(tp.data);
      setBreakdown(b.data);
      setRecent(r.data);
    });
  }, []);

  if (!summary) {
    return <div className="text-slate-400">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('dash.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dash.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-100">{t('dash.todays_revenue')}</div>
              <div className="font-display text-2xl font-bold mt-1">{formatBDT(summary.today.revenue)}</div>
              <div className="text-xs text-brand-200 mt-1">{t('dash.sales_count', { n: summary.today.sales_count })}</div>
            </div>
            <div className="w-11 h-11 rounded-xl grid place-items-center bg-white/15">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-brand-100">
            {t('dash.profit')}: <span className="font-semibold text-white">{formatBDT(summary.today.profit)}</span>
          </div>
        </div>

        <StatCard
          icon={ShoppingBag}
          label={t('dash.this_month')}
          value={formatBDT(summary.month.revenue)}
          sub={`${t('dash.sales_count', { n: summary.month.sales_count })} · ${t('dash.profit')} ${formatBDT(summary.month.profit)}`}
          color="emerald"
        />
        <StatCard
          icon={Wallet}
          label={t('dash.stock_value')}
          value={formatBDT(summary.stock.value)}
          sub={t('dash.units_in_stock', { n: summary.stock.units })}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('dash.low_stock_items')}
          value={summary.counts.low_stock}
          sub={t('dash.need_restocking')}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{t('dash.revenue_profit')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('dash.daily_trend')}</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0082c8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0082c8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(v) => formatBDT(v)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0082c8" strokeWidth={2} fill="url(#revGrad)" name={t('sales.revenue')} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#profGrad)" name={t('dash.profit')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('dash.sales_by_category')}</h2>
          {breakdown.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-12">{t('dash.no_sales_yet')}</div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    label={(e) => e.category}
                  >
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBDT(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{t('dash.top_products')}</h2>
            <Link to="/products" className="text-xs text-brand-600 font-semibold flex items-center gap-1">
              {t('dash.all_link')} <ArrowRight size={12} />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">{t('dash.no_sales_yet')}</div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                  <Tooltip formatter={(v) => formatBDT(v)} />
                  <Bar dataKey="revenue" fill="#0082c8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{t('dash.recent_sales')}</h2>
            <Link to="/sales" className="text-xs text-brand-600 font-semibold flex items-center gap-1">
              {t('dash.all_link')} <ArrowRight size={12} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">{t('dash.no_sales_yet')}</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-ink-800">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  to={`/sales/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-ink-800 -mx-2 px-2 rounded"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{s.invoice_number}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {s.customer_name || t('dash.walk_in')} · {formatDate(s.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{formatBDT(s.total)}</div>
                    <div className="text-xs text-emerald-600 font-semibold">+{formatBDT(s.profit)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label={t('dash.products')} value={summary.counts.products} color="brand" />
        <StatCard icon={Users} label={t('dash.customers')} value={summary.counts.customers} color="emerald" />
        <StatCard
          icon={ShoppingBag}
          label={t('dash.total_sales')}
          value={summary.total.sales_count}
          sub={formatBDT(summary.total.revenue)}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dash.total_profit')}
          value={formatBDT(summary.total.profit)}
          color="emerald"
        />
      </div>
    </div>
  );
}
