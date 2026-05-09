import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { formatBDT, assetUrl } from '../lib/api';
import { useT } from '../i18n';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Bike,
  Wrench,
  ImageIcon,
  Edit3,
  Trash2,
  AlertTriangle,
  Tag,
} from 'lucide-react';

const emptyForm = {
  name: '',
  category: 'part',
  brand_id: '',
  model_id: '',
  description: '',
  unit: 'pcs',
  current_selling_price: '',
  low_stock_threshold: 5,
};

export default function Products() {
  const { t } = useT();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showLow, setShowLow] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');

  async function loadProducts() {
    const params = {};
    if (search) params.search = search;
    if (filterCat) params.category = filterCat;
    if (showLow) params.low_stock = 'true';
    const res = await api.get('/products', { params });
    setProducts(res.data);
  }

  async function loadBrandsAndModels() {
    const [b, m] = await Promise.all([api.get('/brands'), api.get('/models')]);
    setBrands(b.data);
    setModels(m.data);
  }

  useEffect(() => { loadProducts(); }, [search, filterCat, showLow]);
  useEffect(() => { loadBrandsAndModels(); }, []);

  const filteredModels = useMemo(() => {
    if (!form.brand_id) return [];
    return models.filter((m) => Number(m.brand_id) === Number(form.brand_id));
  }, [models, form.brand_id]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      brand_id: p.brand_id || '',
      model_id: p.model_id || '',
      description: p.description || '',
      unit: p.unit || 'pcs',
      current_selling_price: p.current_selling_price,
      low_stock_threshold: p.low_stock_threshold,
    });
    setImageFile(null);
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (imageFile) fd.append('image', imageFile);
      if (editing) {
        await api.put(`/products/${editing.id}`, fd);
        toast.success(t('products.product_updated'));
      } else {
        await api.post('/products', fd);
        toast.success(t('products.product_created'));
      }
      setOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(p) {
    if (!confirm(t('common.confirm_delete', { name: p.name }))) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success(t('common.deleted'));
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  async function quickCreateBrand(e) {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await api.post('/brands', { name: newBrandName.trim() });
      toast.success(t('products.brand_added'));
      setNewBrandName('');
      setBrandModalOpen(false);
      await loadBrandsAndModels();
      setForm((f) => ({ ...f, brand_id: res.data.id, model_id: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  async function quickCreateModel(e) {
    e.preventDefault();
    if (!newModelName.trim() || !form.brand_id) return;
    try {
      const res = await api.post('/models', {
        brand_id: Number(form.brand_id),
        name: newModelName.trim(),
      });
      toast.success(t('products.model_added'));
      setNewModelName('');
      setModelModalOpen(false);
      await loadBrandsAndModels();
      setForm((f) => ({ ...f, model_id: res.data.id }));
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.failed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-slate-100">{t('products.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('products.subtitle')}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={16} /> {t('products.add')}
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            className="input pl-9"
            placeholder={t('products.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input max-w-[180px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">{t('products.all_categories')}</option>
          <option value="bike">{t('products.cat_bike')}</option>
          <option value="part">{t('products.cat_part')}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer">
          <input type="checkbox" checked={showLow} onChange={(e) => setShowLow(e.target.checked)} />
          {t('products.low_stock_only')}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.length === 0 && (
          <div className="col-span-full card p-12 text-center text-slate-400 dark:text-slate-500">
            {t('products.empty')}
          </div>
        )}
        {products.map((p) => {
          const isLow = p.total_stock <= p.low_stock_threshold;
          return (
            <div key={p.id} className="card overflow-hidden hover:shadow-card transition group">
              <Link to={`/products/${p.id}`} className="block">
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {p.image ? (
                    <img src={assetUrl(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-300 dark:text-ink-700">
                      {p.category === 'bike' ? <Bike size={48} /> : <Wrench size={40} />}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={p.category === 'bike' ? 'badge-blue' : 'badge-slate'}>
                      {p.category === 'bike' ? <Bike size={10}/> : <Wrench size={10}/>}
                      {p.category === 'bike' ? t('products.cat_bike') : t('products.cat_part')}
                    </span>
                    {isLow && (
                      <span className="badge-rose">
                        <AlertTriangle size={10} />
                        {t('dash.low_stock_items').split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/products/${p.id}`} className="font-semibold text-slate-800 dark:text-slate-100 truncate block hover:text-brand-700">
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.sku} · {p.brand?.name || '—'}
                      {p.model?.name && <> · {p.model.name}</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatBDT(p.current_selling_price)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('products.stock_label')}: <span className={isLow ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>{p.total_stock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-600 dark:text-slate-400">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => remove(p)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('products.dialog.edit') : t('products.dialog.add')} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{t('products.form.name')} *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('products.form.category')} *</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="bike">{t('products.cat_bike')}</option>
                <option value="part">{t('products.cat_part')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('products.form.unit')}</label>
              <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder={t('products.form.unit_placeholder')} />
            </div>

            <div>
              <label className="label flex items-center justify-between">
                <span>{t('products.form.brand')}</span>
                <button type="button" onClick={() => setBrandModalOpen(true)} className="text-brand-600 hover:underline text-[11px] font-semibold flex items-center gap-1 normal-case">
                  <Plus size={11}/> {t('products.form.new_brand')}
                </button>
              </label>
              <select
                className="input"
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value, model_id: '' })}
              >
                <option value="">{t('products.form.select_brand')}</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label flex items-center justify-between">
                <span>{t('products.form.model')}</span>
                <button
                  type="button"
                  disabled={!form.brand_id}
                  onClick={() => setModelModalOpen(true)}
                  className="text-brand-600 hover:underline text-[11px] font-semibold flex items-center gap-1 normal-case disabled:opacity-40"
                >
                  <Plus size={11}/> {t('products.form.new_model')}
                </button>
              </label>
              <select
                className="input"
                value={form.model_id}
                onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                disabled={!form.brand_id}
              >
                <option value="">{form.brand_id ? t('products.form.select_model') : t('products.form.select_brand_first')}</option>
                {filteredModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">{t('products.form.selling_price')}</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.current_selling_price}
                onChange={(e) => setForm({ ...form, current_selling_price: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t('products.form.low_stock_alert')}</label>
              <input
                type="number"
                className="input"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('products.form.description')}</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('common.image')}</label>
              <div className="flex items-center gap-3">
                {(imageFile || editing?.image) && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-ink-800">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : assetUrl(editing.image)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="btn-secondary cursor-pointer">
                  <ImageIcon size={14} />
                  <input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files[0])} />
                  {imageFile ? imageFile.name.slice(0, 30) : t('common.choose_image')}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('common.saving') : editing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} title={t('products.dialog.add_brand')} size="sm">
        <form onSubmit={quickCreateBrand} className="space-y-4">
          <div>
            <label className="label">{t('products.brand_name')} *</label>
            <input
              className="input"
              autoFocus
              required
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder={t('products.brand_placeholder')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setBrandModalOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary"><Tag size={14}/> {t('products.add_brand_btn')}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modelModalOpen} onClose={() => setModelModalOpen(false)} title={t('products.dialog.add_model')} size="sm">
        <form onSubmit={quickCreateModel} className="space-y-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {t('products.for_brand')} <strong className="text-slate-800 dark:text-slate-100">{brands.find((b) => b.id === Number(form.brand_id))?.name}</strong>
          </div>
          <div>
            <label className="label">{t('products.model_name')} *</label>
            <input
              className="input"
              autoFocus
              required
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder={t('products.model_placeholder')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-ink-800">
            <button type="button" onClick={() => setModelModalOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary"><Tag size={14}/> {t('products.add_model_btn')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
