import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useT } from '../i18n';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Truck, Phone, Mail, MapPin } from 'lucide-react';

const empty = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Suppliers() {
  const { t } = useT();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  async function load() {
    const r = await api.get('/suppliers');
    setList(r.data);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/suppliers/${editing.id}`, form);
      else await api.post('/suppliers', form);
      toast.success(editing ? t('common.updated') : t('common.created'));
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  async function remove(s) {
    if (!confirm(t('common.confirm_delete', { name: s.name }))) return;
    await api.delete(`/suppliers/${s.id}`);
    toast.success(t('common.deleted'));
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('sup.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('sup.subtitle')}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> {t('sup.add')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 && <div className="col-span-full card p-12 text-center text-slate-400 dark:text-slate-500">{t('sup.empty')}</div>}
        {list.map((s) => (
          <div key={s.id} className="card p-5 hover:shadow-card transition">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 grid place-items-center">
                  <Truck size={18} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400"><Edit3 size={14}/></button>
                <button onClick={() => remove(s)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {s.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400 dark:text-slate-500"/>{s.phone}</div>}
              {s.email && <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400 dark:text-slate-500"/>{s.email}</div>}
              {s.address && <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400 dark:text-slate-500"/>{s.address}</div>}
              {s.notes && <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-ink-800 mt-2">{s.notes}</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('sup.dialog.edit') : t('sup.dialog.add')}>
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
