import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatBDT, formatDate, assetUrl } from '../lib/api';
import { useT } from '../i18n';
import { Bike, Wrench, ArrowLeft, TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useT();
  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/products/${id}`), api.get(`/dashboard/profit-analysis/${id}`)]).then(
      ([p, a]) => {
        setProduct(p.data);
        setAnalysis(a.data);
      }
    );
  }, [id]);

  if (!product || !analysis) return <div className="text-slate-400 dark:text-slate-500">{t('common.loading')}</div>;

  const priceHistoryData = analysis.purchases.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    purchase_price: p.purchase_price,
    selling_price: p.selling_price,
  }));

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center gap-1">
        <ArrowLeft size={14} /> {t('pd.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200">
            {product.image ? (
              <img src={assetUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-slate-300 dark:text-ink-700">
                {product.category === 'bike' ? <Bike size={80} /> : <Wrench size={64} />}
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <span className={product.category === 'bike' ? 'badge-blue' : 'badge-slate'}>
                {product.category === 'bike' ? t('products.cat_bike') : t('products.cat_part')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{product.sku}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{product.name}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {product.brand?.name || '—'}
              {product.model?.name && ` · ${product.model.name}`}
            </div>
            {product.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{product.description}</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4">
              <Package className="text-brand-600 mb-2" size={20} />
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('pd.current_stock')}</div>
              <div className="font-display text-xl font-bold">{product.total_stock} {product.unit}</div>
            </div>
            <div className="card p-4">
              <DollarSign className="text-emerald-600 mb-2" size={20} />
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('pd.selling_price')}</div>
              <div className="font-display text-xl font-bold">{formatBDT(product.current_selling_price)}</div>
            </div>
            <div className="card p-4">
              <ShoppingBag className="text-amber-600 mb-2" size={20} />
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('pd.units_sold')}</div>
              <div className="font-display text-xl font-bold">{analysis.summary.units_sold}</div>
            </div>
            <div className="card p-4">
              <TrendingUp className="text-emerald-600 mb-2" size={20} />
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('pd.total_profit')}</div>
              <div className="font-display text-xl font-bold text-emerald-600">{formatBDT(analysis.summary.profit)}</div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display font-bold text-lg mb-1">{t('pd.price_history')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('pd.price_history_sub')}</p>
            {priceHistoryData.length === 0 ? (
              <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">{t('pd.no_stock_yet')}</div>
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={priceHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip formatter={(v) => formatBDT(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="purchase_price" stroke="#ef4444" strokeWidth={2} name={t('pd.purchase')} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="selling_price" stroke="#22c55e" strokeWidth={2} name={t('pd.selling')} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-lg mb-4">{t('pd.batches_title')}</h2>
        {product.batches.length === 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">{t('pd.batches_empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('pd.col.date')}</th>
                  <th>{t('pd.col.supplier')}</th>
                  <th>{t('pd.col.purchase_price')}</th>
                  <th>{t('pd.col.selling_price')}</th>
                  <th>{t('pd.col.margin')}</th>
                  <th>{t('pd.col.added')}</th>
                  <th>{t('pd.col.remaining')}</th>
                  <th>{t('pd.col.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {product.batches.map((b) => {
                  const margin = b.selling_price - b.purchase_price;
                  const marginPct = b.purchase_price > 0 ? ((margin / b.purchase_price) * 100).toFixed(1) : 0;
                  return (
                    <tr key={b.id}>
                      <td className="whitespace-nowrap">{formatDate(b.received_at)}</td>
                      <td>{b.supplier_name || '—'}</td>
                      <td className="font-semibold text-rose-600">{formatBDT(b.purchase_price)}</td>
                      <td className="font-semibold text-emerald-600">{formatBDT(b.selling_price)}</td>
                      <td>
                        <span className={margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {formatBDT(margin)} ({marginPct}%)
                        </span>
                      </td>
                      <td>{b.quantity_added}</td>
                      <td>
                        <span className={b.quantity_remaining > 0 ? 'badge-green' : 'badge-slate'}>
                          {b.quantity_remaining}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">{b.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-lg mb-4">{t('pd.sales_history')}</h2>
        {analysis.sales.length === 0 ? (
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">{t('dash.no_sales_yet')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('pd.col.date')}</th>
                  <th>{t('pd.col.quantity')}</th>
                  <th>{t('pd.col.unit_price')}</th>
                  <th>{t('pd.col.revenue')}</th>
                  <th>{t('pd.col.cost')}</th>
                  <th>{t('pd.col.profit')}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.sales.map((s, i) => (
                  <tr key={i}>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.quantity}</td>
                    <td>{formatBDT(s.unit_price)}</td>
                    <td>{formatBDT(s.total_price)}</td>
                    <td className="text-rose-600">{formatBDT(s.total_cost)}</td>
                    <td className="text-emerald-600 font-semibold">{formatBDT(s.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
