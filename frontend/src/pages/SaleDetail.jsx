import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatBDT, formatDate } from '../lib/api';
import { useT } from '../i18n';
import { ArrowLeft, Printer, Bike, Info } from 'lucide-react';

export default function SaleDetail() {
  const { id } = useParams();
  const { t } = useT();
  const [sale, setSale] = useState(null);

  useEffect(() => {
    api.get(`/sales/${id}`).then((r) => setSale(r.data));
  }, [id]);

  if (!sale) return <div className="text-slate-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link to="/sales" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={14} /> {t('sd.back')}
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={14} /> {t('sd.print_receipt')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt area: forced light theme regardless of dark mode (for printing + consistent look) */}
        <div className="lg:col-span-2 print-area">
          <div className="receipt-light rounded-2xl bg-white shadow-card border border-slate-100 p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-600 grid place-items-center text-white">
                  <Bike size={26} />
                </div>
                <div>
                  <div className="font-display text-xl font-bold">{sale.shop?.shop_name || t('app.name')}</div>
                  <div className="text-xs text-slate-500">{sale.shop?.shop_address}</div>
                  {sale.shop?.shop_phone && <div className="text-xs text-slate-500">{sale.shop.shop_phone}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display font-bold text-slate-800">{t('sd.receipt')}</div>
                <div className="text-xs text-slate-500 mt-1">{sale.invoice_number}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('sd.bill_to')}</div>
                <div className="font-semibold text-slate-800">{sale.customer_name || sale.customer_full_name || t('sd.walk_in_customer')}</div>
                {(sale.customer_phone || sale.customer_phone_full) && (
                  <div className="text-sm text-slate-600">{sale.customer_phone || sale.customer_phone_full}</div>
                )}
                {sale.customer_address && <div className="text-sm text-slate-600">{sale.customer_address}</div>}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{t('sd.date_payment')}</div>
                <div className="font-medium text-slate-800">{formatDate(sale.created_at)}</div>
                <div className="text-sm text-slate-600 capitalize">{sale.payment_method} · {sale.payment_status}</div>
              </div>
            </div>

            <table className="w-full my-6 text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2 font-semibold">{t('sd.col.item')}</th>
                  <th className="text-right py-2 font-semibold">{t('sd.col.qty')}</th>
                  <th className="text-right py-2 font-semibold">{t('sd.col.price')}</th>
                  <th className="text-right py-2 font-semibold">{t('sd.col.total')}</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-medium text-slate-800">{item.product_name}</div>
                      <div className="text-xs text-slate-500">{item.product_sku}</div>
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatBDT(item.unit_price)}</td>
                    <td className="text-right font-semibold">{formatBDT(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pos.subtotal')}</span>
                  <span>{formatBDT(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{t('pos.discount')}</span>
                    <span>-{formatBDT(sale.discount)}</span>
                  </div>
                )}
                {sale.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('pos.tax')}</span>
                    <span>{formatBDT(sale.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 font-display text-lg font-bold">
                  <span>{t('pos.total')}</span>
                  <span style={{ color: '#b91c1c' }}>{formatBDT(sale.total)}</span>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div className="mt-6 pt-4 border-t border-slate-200 text-sm text-slate-600">
                <strong>{t('sd.note')}:</strong> {sale.notes}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
              {sale.shop?.receipt_footer || 'Thank you for your purchase!'}
            </div>
          </div>
        </div>

        <div className="no-print space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold mb-3 text-slate-800 dark:text-slate-100">{t('sd.profit_analysis')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">{t('pos.subtotal')}</span>
                <span className="text-slate-800 dark:text-slate-100">{formatBDT(sale.subtotal)}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">− {t('pos.discount')}</span>
                  <span className="text-rose-600">−{formatBDT(sale.discount)}</span>
                </div>
              )}
              {Number(sale.tax) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">+ {t('pos.tax')}</span>
                  <span className="text-slate-800 dark:text-slate-100">{formatBDT(sale.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-ink-800">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">= {t('sales.revenue')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{formatBDT(sale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">− {t('sd.cost_fifo')}</span>
                <span className="font-semibold text-rose-600">−{formatBDT(sale.total_cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-ink-800 font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                <span>= {t('sd.profit')}</span>
                <span className="text-emerald-600">{formatBDT(sale.profit)}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('sd.margin')}: {sale.total > 0 ? ((sale.profit / sale.total) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-ink-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Info size={12} /> {t('sd.how_profit_calculated')}
              </div>
              <div>{t('sd.profit_explain_1')}</div>
              <div>{t('sd.profit_explain_2')}</div>
              <div>{t('sd.profit_explain_3')}</div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-bold mb-3 text-slate-800 dark:text-slate-100">{t('sd.per_item_cost')}</h3>
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{item.product_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('sd.sold')}: {formatBDT(item.total_price)} · {t('sd.cost')}: {formatBDT(item.total_cost)}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    {t('sd.profit')}: {formatBDT(item.profit)}
                  </div>
                  {item.batches?.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-2 border-l-2 border-slate-100 dark:border-ink-800">
                      {item.batches.map((b, i) => (
                        <div key={i}>
                          {b.quantity} × {formatBDT(b.cost_per_unit)} (batch #{b.batch_id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
