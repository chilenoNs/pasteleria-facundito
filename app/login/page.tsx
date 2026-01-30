'use client'
import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert("Error: " + error.message)
        else router.push('/admin')
    }

    return (
        <div className="flex h-screen items-center justify-center bg-pink-50">
            <form onSubmit={handleLogin} className="bg-white p-10 rounded-[2.5rem] shadow-xl w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-stone-800">Acceso Admin 🧁</h1>
                <input type="email" placeholder="Correo" className="w-full p-4 mb-4 border rounded-2xl" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Contraseña" className="w-full p-4 mb-6 border rounded-2xl" onChange={e => setPassword(e.target.value)} />
                <button className="w-full bg-pink-500 text-white p-4 rounded-2xl font-bold hover:bg-pink-600 transition">Entrar</button>
            </form>
        </div>
    )
}