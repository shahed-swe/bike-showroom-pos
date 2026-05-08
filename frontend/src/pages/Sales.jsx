import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatBDT, formatDate } from '../lib/api';
import { useT } from '../i18n';
import { Search, Eye, ReceiptText } from 'lucide-react';

export default function Sales() {
  const { t } = useT();
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    const params = {};
    if (search) params.search = search;
    if (from) params.from = from;
    if (to) params.to = to;
    const r = await api.get('/sales', { params });
    setSales(r.data);
  }

  useEffect(() => { load(); }, [search, from, to]);

  const totals = sales.reduce(
    (acc, s) => ({
      revenue: acc.revenue + Number(s.total),
      profit: acc.profit + Number(s.profit),
      count: acc.count + 1,
    }),
    { revenue: 0, profit: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('sales.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('sales.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">{t('sales.total_sales')}</div>
          <div className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.count}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">{t('sales.revenue')}</div>
          <div className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{formatBDT(totals.revenue)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">{t('sales.profit')}</div>
          <div className="font-display text-2xl font-bold text-emerald-600">{formatBDT(totals.profit)}</div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <label className="label">{t('common.search')}</label>
          <Search size={16} className="absolute left-3 top-9 text-slate-400 dark:text-slate-500" />
          <input
            className="input pl-9"
            placeholder={t('sales.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t('common.from')}</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.to')}</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{t('sales.col.invoice')}</th>
              <th>{t('common.date')}</th>
              <th>{t('sales.col.customer')}</th>
              <th>{t('sales.col.payment')}</th>
              <th>{t('sales.col.total')}</th>
              <th>{t('sales.col.profit')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr><td colSpan="7" className="text-center text-slate-400 dark:text-slate-500 py-12">{t('sales.empty')}</td></tr>
            )}
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ReceiptText size={14} className="text-brand-600" />
                  {s.invoice_number}
                </td>
                <td className="whitespace-nowrap">{formatDate(s.created_at)}</td>
                <td>
                  <div className="font-medium">{s.customer_name || s.customer_full_name || t('dash.walk_in')}</div>
                  {s.customer_phone && <div className="text-xs text-slate-500 dark:text-slate-400">{s.customer_phone}</div>}
                </td>
                <td><span className="badge-slate capitalize">{s.payment_method}</span></td>
                <td className="font-semibold">{formatBDT(s.total)}</td>
                <td className="text-emerald-600 font-semibold">{formatBDT(s.profit)}</td>
                <td>
                  <Link to={`/sales/${s.id}`} className="btn-secondary py-1 px-2 text-xs">
                    <Eye size={12} /> {t('common.view')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
