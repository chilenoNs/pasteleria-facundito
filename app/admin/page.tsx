'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function AdminPro() {
    const [productos, setProductos] = useState<any[]>([])
    const [form, setForm] = useState({ nombre: '', precio: '', imagen_url: '', descripcion: '', categoria: 'Tortas' })

    useEffect(() => { cargarProductos() }, [])

    async function cargarProductos() {
        const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
        if (data) setProductos(data)
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault()
        const { error } = await supabase.from('productos').insert([form])
        if (!error) {
            setForm({ nombre: '', precio: '', imagen_url: '', descripcion: '', categoria: 'Tortas' })
            cargarProductos()
        }
    }

    async function eliminar(id: number) {
        if (confirm('¿Seguro que quieres eliminar este delicioso pastel?')) {
            await supabase.from('productos').delete().eq('id', id)
            cargarProductos()
        }
    }

    return (
        <div className="min-h-screen bg-stone-100 p-4 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-black text-stone-800 mb-8">Gestión de Inventario 📋</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formulario */}
                    <form onSubmit={guardar} className="bg-white p-6 rounded-3xl shadow-xl border border-stone-200 h-fit sticky top-10">
                        <h2 className="text-xl font-bold mb-4 text-pink-500">Nuevo Producto</h2>
                        <div className="space-y-4">
                            <input className="w-full border-stone-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="Nombre del pastel" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                            <input className="w-full border-stone-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none" type="number" placeholder="Precio ($)" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required />
                            <select className="w-full border-stone-200 border p-3 rounded-xl bg-white" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                                <option>Tortas</option>
                                <option>Galletas</option>
                                <option>Individuales</option>
                                <option>Salados</option>
                            </select>
                            <input className="w-full border-stone-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="URL de la imagen" value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} required />
                            <textarea className="w-full border-stone-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="Breve descripción..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                            <button className="w-full bg-stone-800 text-white font-bold py-4 rounded-2xl hover:bg-pink-600 transition-all shadow-lg">Agregar a la Vitrina</button>
                        </div>
                    </form>

                    {/* Lista de Productos */}
                    <div className="lg:col-span-2 space-y-4">
                        {productos.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-stone-200 hover:border-pink-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={p.imagen_url} className="w-16 h-16 object-cover rounded-xl shadow-inner" alt={p.nombre} />
                                    <div>
                                        <p className="font-bold text-stone-800">{p.nombre}</p>
                                        <p className="text-xs text-pink-500 font-bold uppercase tracking-wider">{p.categoria}</p>
                                        <p className="text-sm text-stone-400">${p.precio}</p>
                                    </div>
                                </div>
                                <button onClick={() => eliminar(p.id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                    Borrar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}