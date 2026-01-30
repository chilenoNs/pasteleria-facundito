'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function PasteleriaElite() {
  const [productos, setProductos] = useState<any[]>([])
  const [filtrados, setFiltrados] = useState<any[]>([])
  const [carrito, setCarrito] = useState<any[]>([])
  const [catActual, setCatActual] = useState('Todos')
  const [isAdmin, setIsAdmin] = useState(false)
  const [modal, setModal] = useState<{ abierto: boolean; modo: string; item: any }>({ abierto: false, modo: 'crear', item: null })
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [form, setForm] = useState({ nombre: '', precio: 0, imagen_url: '', descripcion: '', categoria: 'Tortas', oferta: false })
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({})

  const categorias = ['Todos', 'Tortas', 'Galletas', 'Individuales', 'Salados']

  useEffect(() => { verificarSesion(); cargarDatos(); }, [])

  async function verificarSesion() {
    const { data } = await supabase.auth.getSession()
    setIsAdmin(!!data.session)
  }

  async function cargarDatos() {
    setCargando(true)
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
    if (data) {
      setProductos(data)
      setFiltrados(data)
      // Inicializar cantidades de cada producto en 1
      const cants = data.reduce((acc: any, p: any) => ({ ...acc, [p.id]: 1 }), {})
      setCantidades(cants)
    }
    setCargando(false)
  }

  useEffect(() => {
    setFiltrados(catActual === 'Todos' ? productos : productos.filter(p => p.categoria === catActual))
  }, [catActual, productos])

  const agregarAlCarrito = (p: any) => {
    const cantidad = cantidades[p.id] || 1
    const nuevoItem = { ...p, cantidad, iid: Math.random() }
    setCarrito([...carrito, nuevoItem])
  }

  async function manejarGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (modal.modo === 'crear') {
      await supabase.from('productos').insert([form])
    } else if (modal.item) {
      await supabase.from('productos').update(form).eq('id', modal.item.id)
    }
    setModal({ abierto: false, modo: 'crear', item: null })
    cargarDatos()
  }

  async function eliminar(id: any) {
    if (confirm('¿Eliminar producto?')) {
      await supabase.from('productos').delete().eq('id', id)
      cargarDatos()
    }
  }

  const totalCarrito = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0)

  if (cargando) return <div className="h-screen flex items-center justify-center text-pink-500 font-bold">Cargando...</div>

  return (
    <div className="min-h-screen bg-[#fffdfc] text-stone-800 font-sans">

      {/* HEADER */}
      <header className="py-16 text-center bg-white border-b border-stone-100">
        <h1 className="text-6xl font-serif text-pink-500 italic mb-2 tracking-tighter">Dulce Tentación</h1>
        <p className="text-stone-400 uppercase tracking-[0.3em] text-xs font-bold">Pastelería Boutique & Diseño</p>
        {isAdmin && <button onClick={() => supabase.auth.signOut()} className="mt-4 text-xs bg-stone-100 px-3 py-1 rounded-full">Salir Admin</button>}
      </header>

      {/* NAV CATEGORÍAS */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md py-6 flex justify-center gap-3 border-b border-stone-50 overflow-x-auto px-4">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCatActual(cat)} className={`px-6 py-2 rounded-full font-bold transition-all ${catActual === cat ? 'bg-pink-500 text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-pink-50'}`}>{cat}</button>
        ))}
      </nav>

      {/* GRID PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-12 pb-20">
        {filtrados.map((p) => (
          <div key={p.id} className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 transition-all hover:shadow-2xl">

            {/* BURBUJA OFERTA */}
            {p.oferta && (
              <div className="absolute top-4 left-4 z-20 bg-amber-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-md animate-bounce">
                ✨ Oferta por hoy
              </div>
            )}

            {/* BOTONES ADMIN (Edición y Borrado) */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button onClick={() => { setForm(p); setModal({ abierto: true, modo: 'editar', item: p }); }} className="bg-blue-500 text-white p-2 rounded-full shadow-lg">✏️</button>
                <button onClick={() => eliminar(p.id)} className="bg-red-500 text-white p-2 rounded-full shadow-lg">🗑️</button>
              </div>
            )}

            {/* IMAGEN CON DESCRIPCIÓN (Adaptada para Celular y PC) */}
            <div
              className="h-64 overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                // Esto permite que en celular se "active" al tocar
                const overlay = e.currentTarget.querySelector('.description-overlay');
                overlay?.classList.toggle('opacity-100');
              }}
            >
              <img src={p.imagen_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={p.nombre} />

              {/* Capa de descripción: Opacidad 0 por defecto, 100 en hover (PC) o al tocar (Celular) */}
              <div className="description-overlay absolute inset-0 bg-stone-900/80 text-white p-8 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 md:transition-opacity duration-500">
                <p className="text-sm italic font-medium leading-relaxed">{p.descripcion || "Sin descripción disponible"}</p>
                <span className="mt-4 text-[9px] uppercase tracking-widest text-pink-400 md:hidden">(Toca para cerrar)</span>
              </div>
            </div>

            <div className="p-7">
              <h3 className="text-xl font-bold text-stone-800">{p.nombre}</h3>
              <p className="text-2xl font-black text-pink-500 mt-2">${p.precio.toLocaleString()}</p>

              {/* SELECTOR DE CANTIDAD */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center bg-stone-100 rounded-xl px-2 py-1">
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: Math.max(1, (cantidades[p.id] || 1) - 1) })} className="px-2 font-bold">-</button>
                  <span className="px-4 font-bold text-sm">{(cantidades[p.id] || 1)}</span>
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: (cantidades[p.id] || 1) + 1 })} className="px-2 font-bold">+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-pink-500 transition-all text-sm uppercase tracking-widest">Añadir</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* MODAL ADMIN (Unificado para Crear/Editar) */}
      {modal.abierto && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={manejarGuardar} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl my-auto">
            <h2 className="text-3xl font-bold mb-6">{modal.modo === 'crear' ? 'Nuevo Pastel' : 'Editar Producto'}</h2>
            <div className="space-y-4">
              <input className="w-full p-4 border rounded-2xl" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              <input className="w-full p-4 border rounded-2xl" type="number" placeholder="Precio" value={form.precio} onChange={e => setForm({ ...form, precio: parseInt(e.target.value) })} required />
              <select className="w-full p-4 border rounded-2xl bg-white" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {categorias.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="w-full p-4 border rounded-2xl" placeholder="URL Imagen" value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} required />
              <textarea className="w-full p-4 border rounded-2xl" placeholder="Descripción (Ej: Son 100gr de torta)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required />

              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={form.oferta} onChange={e => setForm({ ...form, oferta: e.target.checked })} />
                <span className="font-bold text-stone-600">¿Es una oferta?</span>
              </label>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setModal({ abierto: false, modo: 'crear', item: null })} className="flex-1 bg-stone-100 py-4 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-pink-500 text-white py-4 rounded-2xl font-bold">Guardar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* CARRITO PROFESIONAL */}
      {carrito.length > 0 && (
        <div className="fixed bottom-8 right-8 w-full max-w-[400px] bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl z-[50]">
          <h4 className="font-bold mb-4 flex justify-between">Tu Carrito 🧁 <button onClick={() => setCarrito([])} className="text-red-400 text-xs uppercase">Vaciar</button></h4>
          <div className="max-h-40 overflow-y-auto mb-6 space-y-3">
            {carrito.map(item => (
              <div key={item.iid} className="flex justify-between text-sm border-b border-stone-800 pb-2">
                <span>{item.cantidad}x {item.nombre}</span>
                <span className="text-pink-400 font-bold">${(item.precio * item.cantidad).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-2xl font-black mb-6"><span>Total</span><span>${totalCarrito.toLocaleString()}</span></div>
          <button onClick={() => {
            const msg = encodeURIComponent(`*NUEVO PEDIDO*\n${carrito.map(i => `• ${i.cantidad}x ${i.nombre} ($${i.precio * i.cantidad})`).join('\n')}\n\n*TOTAL: $${totalCarrito}*`);
            window.open(`https://wa.me/56933954156?text=${msg}`);
          }} className="w-full bg-green-500 py-5 rounded-3xl font-black text-lg">Pedir por WhatsApp</button>
        </div>
      )}

      {/* PIE DE PÁGINA PROFESIONAL */}
      <footer className="bg-stone-900 text-stone-400 py-20 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <h5 className="text-white font-serif italic text-2xl mb-4">Dulce Tentación</h5>
            <p className="text-sm leading-relaxed">Horneando momentos inolvidables con los mejores ingredientes de la región de O'Higgins.</p>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Ubicación</h5>
            <p className="text-sm">Calle Falsa 123, Rancagua, Chile</p>
            <p className="text-sm mt-2">Lunes a Sábado: 09:00 - 20:00</p>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Administración</h5>
            <button onClick={() => setMostrarLogin(true)} className="text-stone-500 hover:text-pink-400 transition-colors text-sm underline">Acceso Administrativo</button>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-stone-800 text-center text-[10px] uppercase tracking-widest">
          © 2026 Todos los derechos reservados. Diseñado para Dulce Tentación.
        </div>
      </footer>

      {/* BOTÓN FLOTANTE AGREGAR */}
      {isAdmin && (
        <button onClick={() => { setForm({ nombre: '', precio: 0, imagen_url: '', descripcion: '', categoria: 'Tortas', oferta: false }); setModal({ abierto: true, modo: 'crear', item: null }) }} className="fixed bottom-10 left-10 bg-pink-600 text-white w-16 h-16 rounded-full text-4xl shadow-2xl z-50 flex items-center justify-center animate-bounce">+</button>
      )}

    </div>
  )
}