import { useEffect, useState } from 'react';
import api, { formatBDT, formatDate } from '../lib/api';
import { useT } from '../i18n';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Warehouse, TrendingDown, TrendingUp, Edit3, Trash2, Info } from 'lucide-react';

export default function Stock() {
  const { t } = useT();
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    product_id: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    notes: '',
    received_at: '',
  });

  async function load() {
    const [b, p, s] = await Promise.all([
      api.get('/stock/batches'),
      api.get('/products'),
      api.get('/suppliers'),
    ]);
    setBatches(b.data);
    setProducts(p.data);
    setSuppliers(s.data);
  }

  useEffect(() => { load(); }, []);

  function openModal() {
    setEditing(null);
    setForm({
      product_id: '',
      supplier_id: '',
      purchase_price: '',
      selling_price: '',
      quantity: '',
      notes: '',
      received_at: '',
    });
    setOpen(true);
  }

  function openEdit(b) {
    setEditing(b);
    setForm({
      product_id: String(b.product_id),
      supplier_id: b.supplier_id ? String(b.supplier_id) : '',
      purchase_price: b.purchase_price,
      selling_price: b.selling_price,
      quantity: b.quantity_added,
      notes: b.notes || '',
      received_at: '',
    });
    setOpen(true);
  }

  async function removeBatch(b) {
    const sold = b.quantity_added - b.quantity_remaining;
    if (sold > 0) {
      toast.error(t('stock.delete_blocked', { sold }));
      return;
    }
    if (!confirm(t('stock.confirm_delete', { name: b.product_name }))) return;
    try {
      await api.delete(`/stock/batches/${b.id}`);
      toast.success(t('common.deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  useEffect(() => {
    if (form.product_id) {
      const p = products.find((x) => x.id === Number(form.product_id));
      if (p && !form.selling_price) {
        setForm((f) => ({ ...f, selling_price: p.current_selling_price }));
      }
    }
  }, [form.product_id]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/stock/batches/${editing.id}`, {
          supplier_id: form.supplier_id || null,
          purchase_price: Number(form.purchase_price),
          selling_price: Number(form.selling_price),
          quantity_added: Number(form.quantity),
          notes: form.notes,
        });
        toast.success(t('common.updated'));
      } else {
        await api.post('/stock/in', {
          ...form,
          purchase_price: Number(form.purchase_price),
          selling_price: Number(form.selling_price),
          quantity: Number(form.quantity),
        });
        toast.success(t('stock.added'));
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('stock.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('stock.subtitle')}</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus size={16} /> {t('stock.add_btn')}
        </button>
      </div>

      <div className="table-wrap overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{t('pd.col.date')}</th>
              <th>{t('stock.col.product')}</th>
              <th>{t('stock.col.category')}</th>
              <th>{t('pd.col.supplier')}</th>
              <th>{t('pd.col.purchase_price')}</th>
              <th>{t('pd.col.selling_price')}</th>
              <th>{t('pd.col.margin')}</th>
              <th>{t('pd.col.added')}</th>
              <th>{t('pd.col.remaining')}</th>
              <th>{t('pd.col.notes')}</th>
              <th className="text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 && (
              <tr><td colSpan="11" className="text-center text-slate-400 dark:text-slate-500 py-12">{t('stock.empty')}</td></tr>
            )}
            {batches.map((b) => {
              const margin = b.selling_price - b.purchase_price;
              const marginPct = b.purchase_price > 0 ? ((margin / b.purchase_price) * 100).toFixed(1) : 0;
              return (
                <tr key={b.id}>
                  <td className="whitespace-nowrap">{formatDate(b.received_at)}</td>
                  <td className="font-medium text-slate-800 dark:text-slate-100">{b.product_name}<div className="text-xs text-slate-500 dark:text-slate-400">{b.sku}</div></td>
                  <td>
                    <span className={b.category === 'bike' ? 'badge-blue' : 'badge-slate'}>
                      {b.category === 'bike' ? t('products.cat_bike') : t('products.cat_part')}
                    </span>
                  </td>
                  <td className="text-sm">{b.supplier_name || '—'}</td>
                  <td className="text-rose-600 font-semibold">{formatBDT(b.purchase_price)}</td>
                  <td className="text-emerald-600 font-semibold">{formatBDT(b.selling_price)}</td>
                  <td>
                    <span className={`font-semibold ${margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {margin >= 0 ? <TrendingUp size={12} className="inline mr-1"/> : <TrendingDown size={12} className="inline mr-1" />}
                      {formatBDT(margin)} <span className="text-xs">({marginPct}%)</span>
                    </span>
                  </td>
                  <td>{b.quantity_added}</td>
                  <td>
                    <span className={b.quantity_remaining > 0 ? 'badge-green' : 'badge-slate'}>
                      {b.quantity_remaining}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500 dark:text-slate-400">{b.notes || '—'}</td>
                  <td className="whitespace-nowrap text-right">
                    <button
                      onClick={() => openEdit(b)}
                      title={t('common.edit')}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400"
                    >
                      <Edit3 size={14}/>
                    </button>
                    <button
                      onClick={() => removeBatch(b)}
                      title={t('common.delete')}
                      disabled={b.quantity_added !== b.quantity_remaining}
                      className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('stock.dialog.edit_title') : t('stock.dialog.title')} size="md">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('stock.form.product')} *</label>
            <select
              required
              disabled={!!editing}
              className="input disabled:bg-slate-50 dark:disabled:bg-ink-800 disabled:cursor-not-allowed"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value, selling_price: '' })}
            >
              <option value="">{t('stock.form.select_product')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {t('stock.form.current_stock')}: {p.total_stock}
                </option>
              ))}
            </select>
            {editing && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stock.form.product_locked')}</div>
            )}
          </div>

          <div>
            <label className="label">{t('stock.form.supplier')}</label>
            <select
              className="input"
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
            >
              <option value="">— {t('common.none')} —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('stock.form.purchase_price')} *</label>
              <input
                required type="number" step="0.01" className="input"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stock.form.purchase_hint')}</div>
            </div>
            <div>
              <label className="label">{t('stock.form.selling_price')} *</label>
              <input
                required type="number" step="0.01" className="input"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stock.form.selling_hint')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('stock.form.quantity')} *</label>
              <input
                required type="number" min="1" className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              {editing && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('stock.form.edit_qty_hint', {
                    sold: editing.quantity_added - editing.quantity_remaining,
                  })}
                </div>
              )}
            </div>
            {!editing && (
              <div>
                <label className="label">{t('stock.form.received_at')}</label>
                <input
                  type="datetime-local" className="input"
                  value={form.received_at}
                  onChange={(e) => setForm({ ...form, received_at: e.target.value })}
                />
              </div>
            )}
          </div>

          {form.purchase_price && form.selling_price && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-sm">
              <strong className="text-brand-900">{t('stock.margin_label')}</strong>{' '}
              <span className="font-semibold">
                {formatBDT(Number(form.selling_price) - Number(form.purchase_price))}
                {' '}{t('stock.margin_per_unit')}
                {form.purchase_price > 0 && (
                  <> · {(((form.selling_price - form.purchase_price) / form.purchase_price) * 100).toFixed(1)}%</>
                )}
              </span>
            </div>
          )}

          <div>
            <label className="label">{t('common.notes')}</label>
            <textarea
              className="input min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t('common.optional')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Warehouse size={14} />
              {submitting
                ? (editing ? t('common.saving') : t('stock.adding'))
                : (editing ? t('common.update') : t('stock.add_btn'))}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
