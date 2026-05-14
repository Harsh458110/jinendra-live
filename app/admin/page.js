'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').split(',').map(e => e.trim())
const CATEGORIES = ['Atta & Flour','Dal & Pulses','Rice','Oil','Spices','Snacks','Soap & Shampoo','Biscuits','Dairy','Other']
const EMOJIS = ['🌾','🫙','🫘','🍚','🧂','🧈','🍬','🫖','🧃','🧹','🧼','📦','🎁','🥜','🌽','🍯','🧄','🧅','🥛','🍫']

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  function emptyForm() {
    return { name: '', name_hi: '', category: 'Atta & Flour', unit: '1 kg', emoji: '📦', description: '', price_note: 'Call for price', in_stock: true, image_url: '' }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user && isAdmin(user)) {
      fetchProducts()
      fetchOrders()
      fetchSettings()
    }
  }, [user])

  const isAdmin = (u) => ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(u?.email)

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function fetchProducts() {
    const res = await fetch('/api/products')
    if (res.ok) setProducts(await res.json())
  }

  async function fetchOrders() {
    const res = await fetch('/api/orders')
    if (res.ok) setOrders(await res.json())
  }

  async function fetchSettings() {
    const res = await fetch('/api/settings')
    if (res.ok) setSettings(await res.json())
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function saveProduct() {
    if (!form.name.trim()) { showToast('❌ Product name required!'); return }
    const action = editProduct ? 'update' : 'create'
    const product = editProduct ? { ...form, id: editProduct.id } : form
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, product })
    })
    if (res.ok) {
      showToast(editProduct ? '✅ Product updated!' : '✅ Product added!')
      fetchProducts()
      setShowForm(false)
      setEditProduct(null)
      setForm(emptyForm())
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', product: { id } })
    })
    fetchProducts()
    showToast('🗑️ Deleted!')
  }

  async function toggleStock(p) {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', product: { ...p, in_stock: !p.in_stock } })
    })
    fetchProducts()
  }

  async function uploadImage(file) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) { setForm(f => ({ ...f, image_url: data.url })); showToast('✅ Image uploaded!') }
    else showToast('❌ Upload failed')
  }

  async function saveSettings() {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (res.ok) { showToast('✅ Settings saved!') }
  }

  async function updateOrderStatus(id, status) {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', order: { id, status } })
    })
    fetchOrders()
  }

  // ── LOADING ──
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF6EC' }}>
      <p style={{ color: '#888', fontSize: 16 }}>⏳ Loading...</p>
    </div>
  )

  // ── NOT LOGGED IN ──
  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#4A2C0A,#2D6A2D)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🏪</div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 24, color: '#4A2C0A', marginBottom: 6 }}>Jinendra Enterprises</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>Admin Panel — Login karo</p>
        <button onClick={signInWithGoogle} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 15, fontWeight: 600, color: '#4A2C0A', fontFamily: 'Mukta' }}>
          <GoogleIcon /> Google se Login Karo
        </button>
        <p style={{ marginTop: 20, fontSize: 12, color: '#bbb' }}>
          <a href="/" style={{ color: '#FF6B1A', textDecoration: 'none' }}>← Customer Store</a>
        </p>
      </div>
    </div>
  )

  // ── WRONG EMAIL ──
  if (!isAdmin(user)) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF6EC' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ fontFamily: 'Playfair Display', color: '#4A2C0A', margin: '12px 0 8px' }}>Access Denied</h2>
        <p style={{ color: '#888', marginBottom: 20 }}>{user.email} ko admin access nahi hai.</p>
        <button onClick={signOut} style={{ padding: '10px 24px', borderRadius: 999, border: 'none', background: '#FF6B1A', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
      </div>
    </div>
  )

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  )

  // ── ADMIN DASHBOARD ──
  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#2D6A2D', color: '#fff', padding: '10px 24px', borderRadius: 999, zIndex: 9999, fontWeight: 700, fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 20, color: '#4A2C0A' }}>{editProduct ? '✏️ Edit Product' : '➕ Naya Product'}</h2>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(emptyForm()) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {/* Image upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4A2C0A', marginBottom: 8 }}>Product Image</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '1.5px solid #e0c8a0' }} />
                  : <div style={{ width: 72, height: 72, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '1.5px dashed #e0c8a0' }}>{form.emoji}</div>
                }
                <div>
                  <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
                  <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #FF6B1A', background: '#fff', color: '#FF6B1A', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    {uploading ? '⏳ Uploading...' : '📷 Image Upload'}
                  </button>
                  {form.image_url && <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#999', cursor: 'pointer', fontSize: 12 }}>Remove</button>}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'name', label: 'Product Name *', full: true },
                { key: 'name_hi', label: 'Hindi Name (optional)' },
                { key: 'unit', label: 'Pack Size (e.g. 1 kg)' },
                { key: 'price_note', label: 'Price Note' },
                { key: 'description', label: 'Description', full: true },
              ].map(f => (
                <div key={f.key} style={f.full ? { gridColumn: '1/-1' } : {}}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>{f.label}</label>
                  {f.key === 'description'
                    ? <textarea value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14, resize: 'vertical' }} />
                    : <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14 }} />
                  }
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14, background: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>Stock</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setForm({ ...form, in_stock: v })} style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1.5px solid', borderColor: form.in_stock === v ? (v ? '#2D6A2D' : '#e00') : '#e0c8a0', background: form.in_stock === v ? (v ? '#e8f5e9' : '#fee') : '#fff', color: form.in_stock === v ? (v ? '#2D6A2D' : '#c00') : '#888', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                      {v ? '✅ In Stock' : '❌ Out'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Emoji picker */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 6 }}>Emoji (if no image)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMOJIS.map(em => (
                  <button key={em} onClick={() => setForm({ ...form, emoji: em })} style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid', borderColor: form.emoji === em ? '#FF6B1A' : '#e0c8a0', background: form.emoji === em ? '#FFF0E8' : '#fff', cursor: 'pointer', fontSize: 18 }}>{em}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveProduct} style={{ flex: 1, padding: 12, borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#FF6B1A,#F5A623)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>💾 Save</button>
              <button onClick={() => { setShowForm(false); setEditProduct(null); setForm(emptyForm()) }} style={{ padding: '12px 20px', borderRadius: 999, border: '1.5px solid #ddd', background: '#fff', color: '#888', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#4A2C0A,#2D6A2D)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 18, fontWeight: 900 }}>⚙️ Admin Panel</div>
          <div style={{ fontSize: 11, opacity: .7 }}>Logged in: {user.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/" target="_blank" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '7px 14px', borderRadius: 999, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>🛒 View Store</a>
          <button onClick={signOut} style={{ background: '#FF6B1A', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Products', val: products.length, icon: '📦', color: '#FF6B1A' },
            { label: 'In Stock', val: products.filter(p => p.in_stock).length, icon: '✅', color: '#2D6A2D' },
            { label: 'Out of Stock', val: products.filter(p => !p.in_stock).length, icon: '❌', color: '#e00' },
            { label: 'Orders Today', val: orders.filter(o => o.created_at?.startsWith(new Date().toISOString().slice(0,10))).length, icon: '🧾', color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} style={{ flex: '1', minWidth: 130, background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,.07)', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 28, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['products','orders','settings'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 22px', borderRadius: 999, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: tab === t ? '#FF6B1A' : '#fff', color: tab === t ? '#fff' : '#4A2C0A', boxShadow: tab === t ? '0 4px 14px rgba(255,107,26,.3)' : 'none' }}>
              {t === 'products' ? '📦 Products' : t === 'orders' ? '🧾 Orders' : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #F5A623', background: '#fff', fontSize: 14 }} />
              <button onClick={() => { setShowForm(true); setEditProduct(null); setForm(emptyForm()) }} style={{ padding: '10px 22px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#FF6B1A,#F5A623)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>➕ Add Product</button>
            </div>

            <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>
                  <div style={{ fontSize: 48 }}>📭</div>
                  <p style={{ marginTop: 12 }}>Koi product nahi</p>
                </div>
              ) : filteredProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < filteredProducts.length - 1 ? '1px solid #f0e8dc' : 'none', flexWrap: 'wrap' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>{p.emoji}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 700, color: '#4A2C0A', fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{p.category} · {p.unit} · {p.price_note}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => toggleStock(p)} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: p.in_stock ? '#e8f5e9' : '#fee', color: p.in_stock ? '#2D6A2D' : '#c00', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                      {p.in_stock ? '✅ In Stock' : '❌ Out'}
                    </button>
                    <button onClick={() => { setEditProduct(p); setForm({ name: p.name, name_hi: p.name_hi||'', category: p.category, unit: p.unit, emoji: p.emoji||'📦', description: p.description||'', price_note: p.price_note||'Call for price', in_stock: p.in_stock, image_url: p.image_url||'' }); setShowForm(true) }} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: '#FFF0E8', color: '#FF6B1A', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✏️ Edit</button>
                    <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: '#fee', color: '#c00', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
            {orders.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>
                <div style={{ fontSize: 48 }}>🧾</div>
                <p style={{ marginTop: 12 }}>Abhi koi order nahi</p>
              </div>
            ) : orders.map((o, i) => (
              <div key={o.id} style={{ padding: '16px 20px', borderBottom: i < orders.length - 1 ? '1px solid #f0e8dc' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#4A2C0A', fontSize: 15 }}>👤 {o.customer_name} — 📞 {o.customer_phone}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {o.customer_address}, {o.locality}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>🕐 {new Date(o.created_at).toLocaleString('hi-IN')}</div>
                    {o.note && <div style={{ fontSize: 12, color: '#FF6B1A', marginTop: 2 }}>📝 {o.note}</div>}
                    <div style={{ marginTop: 8 }}>
                      {(o.items || []).map((item, j) => (
                        <span key={j} style={{ display: 'inline-block', background: '#FFF3E0', color: '#4A2C0A', borderRadius: 8, padding: '2px 10px', fontSize: 12, marginRight: 6, marginBottom: 4 }}>
                          {item.emoji} {item.name} ×{item.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 999, border: '1.5px solid #e0c8a0', background: o.status === 'delivered' ? '#e8f5e9' : o.status === 'cancelled' ? '#fee' : '#FFF3E0', color: '#4A2C0A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    <option value="pending">⏳ Pending</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="out_for_delivery">🚴 Out for Delivery</option>
                    <option value="delivered">📦 Delivered</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && settings && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,.08)', maxWidth: 620 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 20, color: '#4A2C0A', marginBottom: 20 }}>⚙️ Store Settings</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { key: 'store_name', label: 'Store Name' },
                { key: 'tagline', label: 'Tagline / Description' },
                { key: 'address', label: 'Address' },
                { key: 'phone', label: 'Phone (shown to customers)' },
                { key: 'whatsapp', label: 'WhatsApp Number (91XXXXXXXXXX, no + or spaces)' },
                { key: 'timing', label: 'Business Hours' },
                { key: 'delivery_area', label: 'Delivery Area (hero banner mein)' },
                { key: 'localities', label: 'Localities (comma separated, for order form)' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>{f.label}</label>
                  <input value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14 }} />
                </div>
              ))}
            </div>
            <button onClick={saveSettings} style={{ marginTop: 20, padding: '12px 32px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#FF6B1A,#F5A623)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              💾 Save Settings
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>Changes turant sabko dikhenge — live site pe bhi ✅</p>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
