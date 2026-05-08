import { useEffect, useState } from 'react';
import api, { formatBDT, formatDate } from '../lib/api';
import { useT } from '../i18n';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Search, Phone, Mail, MapPin } from 'lucide-react';

const empty = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const { t } = useT();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  async function load() {
    const r = await api.get('/customers', { params: { search } });
    setList(r.data);
  }

  useEffect(() => { load(); }, [search]);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form);
      else await api.post('/customers', form);
      toast.success(editing ? t('common.updated') : t('common.created'));
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  async function remove(c) {
    if (!confirm(t('common.confirm_delete', { name: c.name }))) return;
    await api.delete(`/customers/${c.id}`);
    toast.success(t('common.deleted'));
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('cust.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('cust.subtitle')}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> {t('cust.add')}</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input className="input pl-9" placeholder={t('cust.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 && (
          <div className="col-span-full card p-12 text-center text-slate-400 dark:text-slate-500">{t('cust.empty')}</div>
        )}
        {list.map((c) => (
          <div key={c.id} className="card p-5 hover:shadow-card transition">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t('cust.joined')} {formatDate(c.created_at)}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400"><Edit3 size={14}/></button>
                <button onClick={() => remove(c)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {c.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400 dark:text-slate-500"/>{c.phone}</div>}
              {c.email && <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400 dark:text-slate-500"/>{c.email}</div>}
              {c.address && <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400 dark:text-slate-500"/>{c.address}</div>}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-ink-800 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('cust.purchases')}</div>
                <div className="font-bold text-slate-800 dark:text-slate-100">{c.total_purchases}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('cust.total_spent')}</div>
                <div className="font-bold text-slate-800 dark:text-slate-100">{formatBDT(c.total_spent)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('cust.dialog.edit') : t('cust.dialog.add')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('common.name')} *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('common.phone')}</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('common.email')}</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">{t('common.address')}</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('common.notes')}</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{editing ? t('common.update') : t('common.create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
