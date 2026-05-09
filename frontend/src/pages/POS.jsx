import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatBDT, assetUrl } from '../lib/api';
import { useT } from '../i18n';
import toast from 'react-hot-toast';
import { Search, Bike, Wrench, Plus, Minus, ShoppingCart, User, X } from 'lucide-react';

export default function POS() {
  const nav = useNavigate();
  const { t } = useT();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ id: null, name: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/customers').then((r) => setCustomers(r.data));
  }, []);

  // lock body scroll when mobile cart drawer is open
  useEffect(() => {
    if (mobileCartOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileCartOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterCat && p.category !== filterCat) return false;
      if (search) {
        const term = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.brand?.name || '').toLowerCase().includes(term) ||
          (p.model?.name || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [products, search, filterCat]);

  function addToCart(product) {
    if (product.total_stock <= 0) {
      toast.error(t('pos.out_of_stock'));
      return;
    }
    setCart((prev) => {
      const ex = prev.find((c) => c.product_id === product.id);
      if (ex) {
        if (ex.quantity >= product.total_stock) {
          toast.error(t('pos.no_more_stock'));
          return prev;
        }
        return prev.map((c) =>
          c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: product.current_selling_price,
          quantity: 1,
          stock: product.total_stock,
          image: product.image,
        },
      ];
    });
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product_id !== productId) return c;
          const newQ = c.quantity + delta;
          if (newQ <= 0) return null;
          if (newQ > c.stock) {
            toast.error(t('pos.no_more_stock'));
            return c;
          }
          return { ...c, quantity: newQ };
        })
        .filter(Boolean)
    );
  }

  function setItemPrice(productId, price) {
    setCart((prev) => prev.map((c) => (c.product_id === productId ? { ...c, unit_price: price } : c)));
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal - Number(discount || 0) + Number(tax || 0);

  async function checkout() {
    if (cart.length === 0) {
      toast.error(t('pos.cart_empty_err'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/sales', {
        customer_id: customer.id || null,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        payment_method: paymentMethod,
        notes,
      });
      toast.success(t('pos.sale_completed'));
      nav(`/sales/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('pos.checkout_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  // The cart UI block — used inline on desktop, in a drawer on mobile.
  function CartContent() {
    return (
      <>
        <div className="p-4 border-b border-slate-100 dark:border-ink-800 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={18} /> {t('pos.cart')}
            {cartCount > 0 && (
              <span className="badge-blue text-xs">{cartCount}</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:underline">
                {t('pos.clear_all')}
              </button>
            )}
            <button
              onClick={() => setMobileCartOpen(false)}
              className="lg:hidden p-1.5 rounded hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-500 dark:text-slate-400"
              aria-label="Close cart"
            >
              <X size={18}/>
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-ink-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <User size={12} />{t('pos.customer')}
          </div>
          <div className="space-y-2">
            <input
              className="input"
              list="pos-customer-list"
              placeholder={t('pos.customer_name')}
              value={customer.name}
              onChange={(e) => {
                const found = customers.find((c) => c.name === e.target.value);
                if (found) setCustomer({ id: found.id, name: found.name, phone: found.phone || '' });
                else setCustomer({ ...customer, id: null, name: e.target.value });
              }}
            />
            <input
              className="input"
              placeholder={t('pos.phone_optional')}
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              {t('pos.empty_cart_l1')}<br/>{t('pos.empty_cart_l2')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-ink-800">
              {cart.map((item) => (
                <div key={item.product_id} className="p-3 flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-ink-800 overflow-hidden grid place-items-center flex-shrink-0">
                    {item.image
                      ? <img src={assetUrl(item.image)} className="w-full h-full object-cover" alt="" />
                      : <Wrench size={18} className="text-slate-300 dark:text-ink-700"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.sku}</div>
                      </div>
                      <button onClick={() => removeItem(item.product_id)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded">
                        <X size={14}/>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-slate-100 dark:bg-ink-800 rounded-lg">
                        <button onClick={() => updateQty(item.product_id, -1)} className="p-1.5 hover:bg-slate-200 rounded-l-lg">
                          <Minus size={12}/>
                        </button>
                        <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, 1)} className="p-1.5 hover:bg-slate-200 rounded-r-lg">
                          <Plus size={12}/>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="input flex-1 text-right text-sm py-1"
                        value={item.unit_price}
                        onChange={(e) => setItemPrice(item.product_id, Number(e.target.value))}
                      />
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[72px] text-right">
                        {formatBDT(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-ink-800 p-4 space-y-3 bg-slate-50 dark:bg-ink-900/40">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">{t('pos.subtotal')}</span>
            <span className="font-semibold">{formatBDT(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400 flex-1">{t('pos.discount')}</span>
            <input
              type="number"
              className="input max-w-[120px] text-right py-1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400 flex-1">{t('pos.tax')}</span>
            <input
              type="number"
              className="input max-w-[120px] text-right py-1"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400 flex-1">{t('pos.payment')}</span>
            <select className="input max-w-[140px] py-1" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">{t('pos.payment.cash')}</option>
              <option value="card">{t('pos.payment.card')}</option>
              <option value="bkash">{t('pos.payment.bkash')}</option>
              <option value="nagad">{t('pos.payment.nagad')}</option>
              <option value="bank">{t('pos.payment.bank')}</option>
            </select>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-ink-700">
            <span className="font-display font-bold text-slate-700 dark:text-slate-300">{t('pos.total')}</span>
            <span className="font-display text-2xl font-bold text-brand-700">{formatBDT(total)}</span>
          </div>
          <button
            disabled={submitting || cart.length === 0}
            onClick={checkout}
            className="btn-primary w-full py-3 text-base"
          >
            {submitting ? t('pos.processing') : t('pos.checkout')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Single datalist shared by both desktop and mobile cart customer inputs */}
      <datalist id="pos-customer-list">
        {customers.map((c) => <option key={c.id} value={c.name}>{c.phone}</option>)}
      </datalist>

      {/* Desktop layout: side-by-side. Mobile: products fill page; cart is separate drawer. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:h-[calc(100vh-8rem)] pb-20 lg:pb-0">
        {/* Products section */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{t('pos.title')}</h1>
          </div>

          <div className="card p-3 flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                className="input pl-9"
                placeholder={t('pos.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input max-w-[140px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">{t('common.all')}</option>
              <option value="bike">{t('products.cat_bike')}</option>
              <option value="part">{t('products.cat_part')}</option>
            </select>
          </div>

          <div className="card flex-1 lg:overflow-y-auto">
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-slate-400 dark:text-slate-500 py-12">{t('pos.no_products')}</div>
              )}
              {filteredProducts.map((p) => {
                const out = p.total_stock <= 0;
                return (
                  <button
                    key={p.id}
                    disabled={out}
                    onClick={() => addToCart(p)}
                    className={`text-left rounded-xl border-2 transition overflow-hidden group ${
                      out ? 'border-slate-100 dark:border-ink-800 opacity-50 cursor-not-allowed' : 'border-slate-100 dark:border-ink-800 hover:border-brand-400 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 dark:bg-ink-800 relative">
                      {p.image ? (
                        <img src={assetUrl(p.image)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-300 dark:text-ink-700">
                          {p.category === 'bike' ? <Bike size={32} /> : <Wrench size={28} />}
                        </div>
                      )}
                      {out && (
                        <div className="absolute inset-0 bg-rose-50/80 grid place-items-center">
                          <span className="badge-rose">{t('pos.out')}</span>
                        </div>
                      )}
                      <span className="absolute top-1.5 left-1.5 badge-slate text-[10px]">{p.total_stock}</span>
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.sku}</div>
                      <div className="text-sm font-bold text-brand-700 mt-1">{formatBDT(p.current_selling_price)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop cart inline */}
        <div className="hidden lg:flex lg:col-span-2 card flex-col overflow-hidden">
          <CartContent />
        </div>
      </div>

      {/* Mobile: sticky bottom bar trigger */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-ink-900 border-t border-slate-200 dark:border-ink-700 shadow-2xl p-3 z-30">
        <button
          onClick={() => setMobileCartOpen(true)}
          className="btn-primary w-full py-3 flex items-center justify-between gap-3 text-base"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart size={18} />
            {cartCount > 0 ? (
              <span>{t('pos.cart')} ({cartCount})</span>
            ) : (
              <span>{t('pos.cart')}</span>
            )}
          </span>
          <span className="font-display font-bold">{formatBDT(total)}</span>
        </button>
      </div>

      {/* Mobile cart drawer (slide-up) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity ${
          mobileCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setMobileCartOpen(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-ink-900 rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] transition-transform duration-300 ${
            mobileCartOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1" />
          <CartContent />
        </div>
      </div>
    </>
  );
}
