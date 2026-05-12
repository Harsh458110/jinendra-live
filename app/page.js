'use client'
import { useState, useEffect, useRef } from 'react'

const CATEGORIES = ['All','Atta & Flour','Dal & Pulses','Rice','Oil','Spices','Snacks','Soap & Shampoo','Biscuits','Dairy','Other']

export default function Home() {
  const [settings, setSettings] = useState({
    store_name: 'Jinendra Enterprises',
    tagline: 'Your trusted kirana store.',
    address: 'Manasa, Madhya Pradesh',
    phone: '+91 99774 69984',
    whatsapp: '919977469984',
    timing: 'Mon–Sun: 7 AM – 9 PM',
    delivery_area: 'Manasa & nearby areas',
    localities: 'Manasa,Neemuch,Ratlam',
  })
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [orderForm, setOrderForm] = useState(null)
  const [orderData, setOrderData] = useState({ name: '', phone: '', address: '', locality: '', note: '' })

  useEffect(() => {
    fetchAll()
    const saved = localStorage.getItem('je_cart')
    if (saved) setCart(JSON.parse(saved))
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [pRes, sRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/settings'),
    ])
    if (pRes.ok) setProducts(await pRes.json())
    if (sRes.ok) setSettings(await sRes.json())
    setLoading(false)
  }

  function saveCart(c) { setCart(c); localStorage.setItem('je_cart', JSON.stringify(c)) }

  function addToCart(p) {
    const c = [...cart]
    const i = c.findIndex(x => x.id === p.id)
    if (i >= 0) c[i].qty += 1
    else c.push({ ...p, qty: 1 })
    saveCart(c)
    showToast(`${p.name} added!`)
  }

  function removeFromCart(id) { saveCart(cart.filter(x => x.id !== id)) }
  function changeQty(id, d) {
    const c = cart.map(x => x.id === id ? { ...x, qty: x.qty + d } : x).filter(x => x.qty > 0)
    saveCart(c)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const totalQty = cart.reduce((s, x) => s + x.qty, 0)

  const filtered = products.filter(p => {
    const mc = category === 'All' || p.category === category
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || (p.name_hi || '').includes(search)
    return mc && ms
  })

  function waOrder(product) {
    const msg = encodeURIComponent(`Namaste! 🙏\nMujhe *${product.name}* (${product.unit}) order karni hai.\nKripya price batayein.\n— ${settings.store_name}`)
    window.open(`https://wa.me/${settings.whatsapp}?text=${msg}`, '_blank')
  }

  function waGeneral() {
    const msg = encodeURIComponent(`Namaste! 🙏 ${settings.store_name} se order karna chahta/chahti hoon.`)
    window.open(`https://wa.me/${settings.whatsapp}?text=${msg}`, '_blank')
  }

  async function placeOrder() {
    if (!orderData.name || !orderData.phone) { showToast('Name aur phone required hai!'); return }
    const items = cart.map(i => ({ name: i.name, unit: i.unit, qty: i.qty, emoji: i.emoji }))
    const waItems = items.map(i => `• ${i.emoji} ${i.name} (${i.unit}) x${i.qty}`).join('\n')
    const msg = encodeURIComponent(`Namaste! 🙏 Mera order hai:\n\n${waItems}\n\nNaam: ${orderData.name}\nPhone: ${orderData.phone}\nPata: ${orderData.address}, ${orderData.locality}\n${orderData.note ? 'Note: ' + orderData.note : ''}\n\n— ${settings.store_name}`)
    // Save order to DB
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', order: { customer_name: orderData.name, customer_phone: orderData.phone, customer_address: orderData.address, locality: orderData.locality, note: orderData.note, items, status: 'pending' } })
    })
    window.open(`https://wa.me/${settings.whatsapp}?text=${msg}`, '_blank')
    saveCart([])
    setCartOpen(false)
    setOrderForm(null)
    showToast('Order placed! WhatsApp pe bhej diya ✅')
  }

  const localities = (settings.localities || 'Manasa').split(',').map(l => l.trim())

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6EC' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#2D6A2D', color: '#fff', padding: '10px 22px', borderRadius: 999, zIndex: 9999, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
          ✅ {toast}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,.45)' }} onClick={() => { setCartOpen(false); setOrderForm(null) }} />
          <div style={{ width: 360, maxWidth: '100vw', background: '#FDF6EC', height: '100%', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 30px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 20, color: '#4A2C0A' }}>🛒 Inquiry List</h2>
              <button onClick={() => { setCartOpen(false); setOrderForm(null) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4A2C0A' }}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>
                <div style={{ fontSize: 48 }}>🛒</div>
                <p style={{ marginTop: 12 }}>List khali hai</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
                    <div style={{ fontSize: 28 }}>{item.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0A' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{item.unit}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => changeQty(item.id, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #FF6B1A', background: '#fff', color: '#FF6B1A', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>-</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #FF6B1A', background: '#FF6B1A', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: '#fee', border: 'none', borderRadius: 8, padding: '3px 8px', color: '#c00', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}

                {!orderForm ? (
                  <>
                    <button onClick={() => setOrderForm(true)} style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF6B1A,#F5A623)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 12 }}>
                      📝 Place Order
                    </button>
                    <button onClick={waGeneral} className="wa-btn" style={{ width: '100%', marginTop: 10, justifyContent: 'center', fontSize: 14 }}>
                      <WhatsAppIcon /> Direct WhatsApp
                    </button>
                  </>
                ) : (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 14, color: '#4A2C0A' }}>Order Details</h3>
                    {[
                      { key: 'name', label: 'Aapka Naam *', ph: 'e.g. Ramesh Kumar' },
                      { key: 'phone', label: 'Phone Number *', ph: '10-digit number' },
                      { key: 'address', label: 'Ghar ka Pata', ph: 'Street / Mohalla' },
                      { key: 'note', label: 'Koi Note (optional)', ph: 'Koi special instruction' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>{f.label}</label>
                        <input value={orderData[f.key]} onChange={e => setOrderData({ ...orderData, [f.key]: e.target.value })} placeholder={f.ph}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14 }} />
                      </div>
                    ))}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A2C0A', marginBottom: 4 }}>Locality</label>
                      <select value={orderData.locality} onChange={e => setOrderData({ ...orderData, locality: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e0c8a0', fontSize: 14, background: '#fff' }}>
                        <option value="">Select locality</option>
                        {localities.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <button onClick={placeOrder} className="wa-btn" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
                      <WhatsAppIcon /> Confirm & WhatsApp
                    </button>
                    <button onClick={() => setOrderForm(null)} style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 10, border: '1.5px solid #ddd', background: '#fff', color: '#888', cursor: 'pointer', fontSize: 13 }}>Back</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#FF6B1A,#F5A623)', color: '#fff', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(255,107,26,.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 900 }}>🏪 {settings.store_name}</div>
            <div style={{ fontSize: 11, opacity: .85 }}>{settings.address}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setCartOpen(true)} style={{ background: '#fff', color: '#FF6B1A', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              🛒 {totalQty > 0 && <span style={{ background: '#2D6A2D', color: '#fff', borderRadius: 999, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{totalQty}</span>}
            </button>
            <button onClick={waGeneral} className="wa-btn" style={{ padding: '7px 14px', fontSize: 13 }}>
              <WhatsAppIcon size={16}/> Order
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#4A2C0A,#2D6A2D)', color: '#fff', textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(22px,5vw,44px)', fontWeight: 900, marginBottom: 8 }}>आपकी अपनी किराना दुकान</h1>
        <p style={{ opacity: .85, fontSize: 15, marginBottom: 18 }}>{settings.tagline}</p>
        <span style={{ background: 'rgba(255,255,255,.15)', padding: '6px 18px', borderRadius: 999, fontSize: 13 }}>
          ✨ Now delivering in {settings.delivery_area}
        </span>
        <div style={{ marginTop: 20 }}>
          <button onClick={waGeneral} className="wa-btn" style={{ background: '#25D366' }}>
            <WhatsAppIcon /> WhatsApp Order Karo
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Search */}
        <input type="text" placeholder="🔍 Search products... (atta, dal, rice...)" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '2px solid #F5A623', background: '#fff', fontSize: 15, marginBottom: 16 }} />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '7px 16px', borderRadius: 999, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '2px solid', borderColor: category === cat ? '#FF6B1A' : '#e0c8a0', background: category === cat ? '#FF6B1A' : '#fff', color: category === cat ? '#fff' : '#4A2C0A', transition: 'all .2s' }}>{cat}</button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <p style={{ marginTop: 12 }}>Products load ho rahe hain...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <p style={{ marginTop: 12 }}>Koi product nahi mila</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20, marginBottom: 60 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} onWa={() => waOrder(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#4A2C0A', color: '#f5e6d0', textAlign: 'center', padding: '36px 20px' }}>
        <div style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 6 }}>🏪 {settings.store_name}</div>
        <p style={{ fontSize: 13, opacity: .65, marginBottom: 4 }}>{settings.address}</p>
        <p style={{ fontSize: 13, opacity: .65, marginBottom: 18 }}>📞 {settings.phone} &nbsp;|&nbsp; ⏰ {settings.timing}</p>
        <button onClick={waGeneral} className="wa-btn"><WhatsAppIcon /> WhatsApp Us</button>
        <p style={{ fontSize: 11, opacity: .35, marginTop: 24 }}>© 2025 {settings.store_name}. All rights reserved.</p>
      </footer>

      {/* Floating WA */}
      <button onClick={waGeneral} className="wa-btn" style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 500, boxShadow: '0 4px 20px rgba(0,0,0,.2)', padding: '12px 18px' }}>
        <WhatsAppIcon size={20} />
      </button>
    </div>
  )
}

function ProductCard({ p, onAdd, onWa }) {
  return (
    <div className="card-hover fade-up" style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 14px rgba(74,44,10,.08)', border: '1px solid #f0e0c8', display: 'flex', flexDirection: 'column' }}>
      {/* Image or emoji */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#FFF3E0,#FDE8CC)', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 64 }}>{p.emoji || '📦'}</span>
        }
        <span style={{ position: 'absolute', top: 10, right: 10, background: p.in_stock ? '#2D6A2D' : '#e00', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
          {p.in_stock ? '✓ In Stock' : 'Out of Stock'}
        </span>
      </div>
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: '#FF6B1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{p.category}</div>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, color: '#4A2C0A', marginBottom: 2 }}>{p.name}</h3>
        {p.name_hi && <p style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{p.name_hi}</p>}
        <p style={{ fontSize: 12, color: '#777', flex: 1, marginBottom: 8 }}>{p.description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4A2C0A' }}>📦 {p.unit}</span>
          <span style={{ fontSize: 12, fontWeight: 600, background: '#FFF3E0', color: '#FF6B1A', padding: '3px 10px', borderRadius: 999 }}>
            📞 {p.price_note || 'Call for price'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAdd} disabled={!p.in_stock} style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', background: p.in_stock ? '#FF6B1A' : '#ddd', color: p.in_stock ? '#fff' : '#999', fontWeight: 700, fontSize: 13, cursor: p.in_stock ? 'pointer' : 'not-allowed' }}>
            + Add
          </button>
          <button onClick={onWa} style={{ padding: '9px 11px', borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
            <WhatsAppIcon size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
