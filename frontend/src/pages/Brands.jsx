import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useT } from '../i18n';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Tag, ChevronDown, ChevronRight } from 'lucide-react';

export default function Brands() {
  const { t } = useT();
  const [brands, setBrands] = useState([]);
  const [expanded, setExpanded] = useState({});

  const [brandOpen, setBrandOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({ name: '', notes: '' });

  const [modelOpen, setModelOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelForm, setModelForm] = useState({ brand_id: '', name: '', notes: '' });

  async function load() {
    const r = await api.get('/brands?with_models=true');
    setBrands(r.data);
  }
  useEffect(() => { load(); }, []);

  function openNewBrand() {
    setEditingBrand(null);
    setBrandForm({ name: '', notes: '' });
    setBrandOpen(true);
  }
  function openEditBrand(b) {
    setEditingBrand(b);
    setBrandForm({ name: b.name, notes: b.notes || '' });
    setBrandOpen(true);
  }
  async function submitBrand(e) {
    e.preventDefault();
    try {
      if (editingBrand) await api.put(`/brands/${editingBrand.id}`, brandForm);
      else await api.post('/brands', brandForm);
      toast.success(editingBrand ? t('brands.brand_updated') : t('brands.brand_added'));
      setBrandOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }
  async function removeBrand(b) {
    if (!confirm(t('brands.confirm_brand_delete', { name: b.name }))) return;
    try {
      await api.delete(`/brands/${b.id}`);
      toast.success(t('brands.brand_deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  function openNewModel(brand) {
    setEditingModel(null);
    setModelForm({ brand_id: brand.id, name: '', notes: '' });
    setModelOpen(true);
  }
  function openEditModel(m) {
    setEditingModel(m);
    setModelForm({ brand_id: m.brand_id, name: m.name, notes: m.notes || '' });
    setModelOpen(true);
  }
  async function submitModel(e) {
    e.preventDefault();
    try {
      if (editingModel) {
        await api.put(`/models/${editingModel.id}`, modelForm);
      } else {
        await api.post('/models', modelForm);
      }
      toast.success(editingModel ? t('brands.model_updated') : t('brands.model_added'));
      setModelOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }
  async function removeModel(m) {
    if (!confirm(t('brands.confirm_model_delete', { name: m.name }))) return;
    try {
      await api.delete(`/models/${m.id}`);
      toast.success(t('brands.model_deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('brands.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('brands.subtitle')}</p>
        </div>
        <button onClick={openNewBrand} className="btn-primary"><Plus size={16}/> {t('brands.add')}</button>
      </div>

      <div className="space-y-3">
        {brands.length === 0 && (
          <div className="card p-12 text-center text-slate-400 dark:text-slate-500">{t('brands.empty')}</div>
        )}
        {brands.map((b) => {
          const isOpen = expanded[b.id];
          const count = (b.models || []).length;
          return (
            <div key={b.id} className="card overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setExpanded({ ...expanded, [b.id]: !isOpen })}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-brand-700"
                >
                  {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center">
                    <Tag size={16}/>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{b.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {count === 1
                        ? t('brands.models_count_one', { n: count })
                        : t('brands.models_count_other', { n: count })}
                    </div>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => openNewModel(b)} className="btn-secondary py-1.5 text-xs">
                    <Plus size={12}/> {t('brands.add_model')}
                  </button>
                  <button onClick={() => openEditBrand(b)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400">
                    <Edit3 size={14}/>
                  </button>
                  <button onClick={() => removeBrand(b)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-ink-800 bg-slate-50 dark:bg-ink-900/40 px-4 py-3">
                  {(b.models || []).length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">{t('brands.no_models_yet')}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {b.models.map((m) => (
                        <div key={m.id} className="bg-white dark:bg-ink-900 rounded-lg border border-slate-100 dark:border-ink-800 p-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{m.name}</div>
                            {m.notes && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.notes}</div>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditModel(m)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400"><Edit3 size={13}/></button>
                            <button onClick={() => removeModel(m)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"><Trash2 size={13}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={brandOpen} onClose={() => setBrandOpen(false)} title={editingBrand ? t('brands.dialog.edit_brand') : t('brands.dialog.add_brand')} size="sm">
        <form onSubmit={submitBrand} className="space-y-4">
          <div>
            <label className="label">{t('brands.brand_name')} *</label>
            <input className="input" required value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('common.notes')}</label>
            <textarea className="input min-h-[60px]" value={brandForm.notes} onChange={(e) => setBrandForm({ ...brandForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setBrandOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{editingBrand ? t('common.update') : t('common.add')}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modelOpen} onClose={() => setModelOpen(false)} title={editingModel ? t('brands.dialog.edit_model') : t('brands.dialog.add_model')} size="sm">
        <form onSubmit={submitModel} className="space-y-4">
          <div>
            <label className="label">{t('brands.brand')} *</label>
            <select
              required
              className="input"
              value={modelForm.brand_id}
              onChange={(e) => setModelForm({ ...modelForm, brand_id: Number(e.target.value) })}
            >
              <option value="">{t('brands.select_brand')}</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('brands.model_name')} *</label>
            <input className="input" required value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('common.notes')}</label>
            <textarea className="input min-h-[60px]" value={modelForm.notes} onChange={(e) => setModelForm({ ...modelForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setModelOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{editingModel ? t('common.update') : t('common.add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
