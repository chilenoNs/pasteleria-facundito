'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function PasteleriaProfesional() {
  const [productos, setProductos] = useState<any[]>([])
  const [filtrados, setFiltrados] = useState<any[]>([])
  const [carrito, setCarrito] = useState<any[]>([])
  const [catActual, setCatActual] = useState('Todos')
  const [isAdmin, setIsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [abiertoId, setAbiertoId] = useState<number | null>(null)

  // Modales y Auth
  const [modal, setModal] = useState({ abierto: false, modo: 'crear', item: null })
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [auth, setAuth] = useState({ email: '', password: '' })

  // Formulario y UI
  const [form, setForm] = useState({ nombre: '', precio: 0, imagen_url: '', descripcion: '', categoria: 'Tortas', oferta: false })
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({})

  const categorias = ['Todos', 'Tortas', 'Galletas', 'Individuales', 'Salados']

  useEffect(() => {
    verificarSesion()
    cargarDatos()
  }, [])

  async function verificarSesion() {
    const { data } = await supabase.auth.getSession()
    setIsAdmin(!!data.session)
  }

  async function cargarDatos() {
    setCargando(true)
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false })
    if (data) {
      setProductos(data)
      setFiltrados(data)
      const cants = data.reduce((acc: any, p: any) => ({ ...acc, [p.id]: 1 }), {})
      setCantidades(cants)
    }
    setCargando(false)
  }

  useEffect(() => {
    setFiltrados(catActual === 'Todos' ? productos : productos.filter(p => p.categoria === catActual))
  }, [catActual, productos])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword(auth)
    if (error) alert("Acceso denegado")
    else { setIsAdmin(true); setMostrarLogin(false); }
  }

  async function manejarGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (modal.modo === 'crear') {
      await supabase.from('productos').insert([form])
    } else {
      await supabase.from('productos').update(form).eq('id', (modal.item as any).id)
    }
    setModal({ abierto: false, modo: 'crear', item: null })
    setForm({ nombre: '', precio: 0, imagen_url: '', descripcion: '', categoria: 'Tortas', oferta: false })
    cargarDatos()
  }

  async function eliminar(id: any) {
    if (confirm('¿Eliminar este producto permanentemente?')) {
      await supabase.from('productos').delete().eq('id', id)
      cargarDatos()
    }
  }

  const agregarAlCarrito = (p: any) => {
    const cantidad = cantidades[p.id] || 1
    setCarrito([...carrito, { ...p, cantidad, iid: Math.random() }])
  }

  const totalCarrito = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0)

  if (cargando) return <div className="h-screen flex items-center justify-center text-pink-500 font-bold text-xl animate-pulse">Horneando...</div>

  return (
    <div className="min-h-screen bg-[#fffdfc] text-stone-800 font-sans pb-10">

      {/* HEADER PROFESIONAL */}
      <header className="py-16 text-center bg-white border-b border-stone-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-pink-500"></div>
        <h1 className="text-6xl md:text-7xl font-serif text-pink-500 italic mb-2 tracking-tighter">Dulce Tentación</h1>
        <p className="text-stone-400 uppercase tracking-[0.4em] text-[10px] font-black">Rancagua • Pastelería de Autor</p>
        {isAdmin && (
          <button onClick={() => { supabase.auth.signOut(); setIsAdmin(false); }}
            className="absolute top-6 right-6 bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase">
            Cerrar Admin
          </button>
        )}
      </header>

      {/* NAVEGACIÓN */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md py-6 flex justify-center gap-3 border-b border-stone-50 overflow-x-auto px-4">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCatActual(cat)}
            className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${catActual === cat ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>
            {cat}
          </button>
        ))}
      </nav>

      {/* GRID DE PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-12 mb-20">
        {filtrados.map((p) => (
          <div key={p.id} className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 transition-all hover:shadow-2xl flex flex-col">

            {p.oferta && (
              <div className="absolute top-5 left-5 z-20 bg-amber-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md animate-bounce">
                ✨ Oferta Especial
              </div>
            )}

            {isAdmin && (
              <div className="absolute top-5 right-5 z-30 flex gap-2">
                <button onClick={() => { setForm(p); setModal({ abierto: true, modo: 'editar', item: p }); }} className="bg-white text-blue-600 p-2 rounded-full shadow-xl hover:scale-110 transition">✏️</button>
                <button onClick={() => eliminar(p.id)} className="bg-white text-red-600 p-2 rounded-full shadow-xl hover:scale-110 transition">🗑️</button>
              </div>
            )}

            {/* IMAGEN Y DESCRIPCIÓN TÁCTIL */}
            <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => setAbiertoId(abiertoId === p.id ? null : p.id)}>
              <img src={p.imagen_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt={p.nombre} />
              <div className={`absolute inset-0 bg-stone-900/90 text-white p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${abiertoId === p.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                <p className="text-sm italic font-medium leading-relaxed mb-4">{p.descripcion || "Receta tradicional de la casa"}</p>
                <div className="md:hidden bg-pink-500 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-tighter">Cerrar Info</div>
              </div>
            </div>

            <div className="p-7 flex flex-col flex-grow">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{p.categoria}</span>
              <h3 className="text-xl font-bold text-stone-800 mt-1 h-14 line-clamp-2">{p.nombre}</h3>
              <p className="text-2xl font-black text-stone-900 mt-2">${p.precio.toLocaleString()}</p>

              <div className="mt-auto pt-6 flex items-center justify-between gap-3">
                <div className="flex items-center bg-stone-100 rounded-2xl px-2 py-1 border border-stone-200">
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: Math.max(1, (cantidades[p.id] || 1) - 1) })} className="px-3 font-bold text-lg text-stone-500">-</button>
                  <span className="px-2 font-black text-sm w-6 text-center">{(cantidades[p.id] || 1)}</span>
                  <button onClick={() => setCantidades({ ...cantidades, [p.id]: (cantidades[p.id] || 1) + 1 })} className="px-3 font-bold text-lg text-stone-500">+</button>
                </div>
                <button onClick={() => agregarAlCarrito(p)} className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-pink-500 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-stone-200">Añadir</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* LOGIN MODAL */}
      {mostrarLogin && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Panel de Control</h2>
            <input type="email" placeholder="Email" className="w-full p-4 border rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-pink-300" onChange={e => setAuth({ ...auth, email: e.target.value })} />
            <input type="password" placeholder="Password" className="w-full p-4 border rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-pink-300" onChange={e => setAuth({ ...auth, password: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMostrarLogin(false)} className="flex-1 py-4 font-bold text-stone-400">Cancelar</button>
              <button type="submit" className="flex-1 bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg">Entrar</button>
            </div>
          </form>
        </div>
      )}

      {/* FORMULARIO ADMIN (Crear/Editar) */}
      {modal.abierto && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <form onSubmit={manejarGuardar} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl my-auto">
            <h2 className="text-2xl font-bold mb-6">{modal.modo === 'crear' ? 'Nuevo Producto' : 'Editar Producto'}</h2>
            <div className="space-y-4">
              <input className="w-full p-4 border rounded-2xl" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              <input className="w-full p-4 border rounded-2xl" type="number" placeholder="Precio" value={form.precio} onChange={e => setForm({ ...form, precio: parseInt(e.target.value) })} required />
              <select className="w-full p-4 border rounded-2xl bg-white" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {categorias.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="w-full p-4 border rounded-2xl" placeholder="URL de la Imagen" value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} required />
              <textarea className="w-full p-4 border rounded-2xl h-24" placeholder="Descripción (Ej: Pack de 6 unidades)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required />
              <label className="flex items-center gap-3 p-2 cursor-pointer bg-stone-50 rounded-2xl">
                <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={form.oferta} onChange={e => setForm({ ...form, oferta: e.target.checked })} />
                <span className="font-bold text-sm text-stone-600">Marcar como Oferta</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModal({ abierto: false, modo: 'crear', item: null })} className="flex-1 py-4 font-bold text-stone-400 text-sm">Cerrar</button>
                <button type="submit" className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-lg text-sm">Guardar Cambios</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* CARRITO FLOTANTE */}
      {carrito.length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[400px] bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl z-50 animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-xl tracking-tighter italic">Tu Pedido</h4>
            <button onClick={() => setCarrito([])} className="text-red-400 text-[10px] font-black uppercase tracking-widest">Vaciar</button>
          </div>
          <div className="max-h-40 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-hide">
            {carrito.map(item => (
              <div key={item.iid} className="flex justify-between text-xs border-b border-stone-800 pb-2">
                <span><span className="text-pink-400 font-bold">{item.cantidad}x</span> {item.nombre}</span>
                <span className="font-bold">${(item.precio * item.cantidad).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end mb-6">
            <span className="text-stone-500 text-[10px] uppercase font-black tracking-widest">Total Estimado</span>
            <span className="text-4xl font-black text-pink-500 tracking-tighter">${totalCarrito.toLocaleString()}</span>
          </div>
          <button onClick={() => {
            const tel = "56933954156"; // <-- TU NÚMERO AQUÍ
            const resumen = carrito.map(i => `• ${i.cantidad}x ${i.nombre} ($${(i.precio * i.cantidad).toLocaleString()})`).join('\n');
            const msg = encodeURIComponent(`*NUEVO PEDIDO PASTELERÍA*\n\n${resumen}\n\n*TOTAL: $${totalCarrito.toLocaleString()}*`);
            window.open(`https://wa.me/${tel}?text=${msg}`);
          }} className="w-full bg-green-500 hover:bg-green-600 py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl shadow-green-900/20 active:scale-95">
            Pedir por WhatsApp 📱
          </button>
        </div>
      )}

      {/* FOOTER PROFESIONAL */}
      <footer className="bg-stone-950 text-stone-500 py-24 px-8 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 text-center md:text-left">
          <div className="space-y-4">
            <h5 className="text-white font-serif italic text-3xl">Dulce Tentación</h5>
            <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0">Creando experiencias dulces desde el corazón de Rancagua. Calidad premium en cada detalle.</p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Encuéntranos</h5>
            <p className="text-sm">Av. Principal 1234, Rancagua<br />Región de O'Higgins, Chile</p>
            <p className="text-pink-500 font-bold text-sm">@dulcetentacion_cl</p>
          </div>
          <div className="space-y-4">
            <h5 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Gestión</h5>
            <button onClick={() => setMostrarLogin(true)} className="text-xs hover:text-white transition-colors underline decoration-stone-800 underline-offset-8">Acceso Administrativo</button>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-stone-900 text-center text-[9px] uppercase tracking-[0.5em] font-medium">
          © 2026 Todos los derechos reservados • Hecho con amor para tu paladar.
        </div>
      </footer>

      {/* BOTÓN FLOTANTE AGREGAR (Sólo Admin) */}
      {isAdmin && (
        <button onClick={() => { setForm({ nombre: '', precio: 0, imagen_url: '', descripcion: '', categoria: 'Tortas', oferta: false }); setModal({ abierto: true, modo: 'crear', item: null }) }}
          className="fixed bottom-10 left-10 bg-pink-600 text-white w-16 h-16 rounded-full text-4xl shadow-2xl z-50 flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all">
          +
        </button>
      )}

    </div>
  )
}