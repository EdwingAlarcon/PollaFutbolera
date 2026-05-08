'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verificar si el perfil existe
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        // Si no existe, crear el perfil
        if (!profile) {
          await supabase.from('users').insert({
            id: user.id,
            username: user.user_metadata.username || user.email?.split('@')[0] || 'user',
            email: user.email!,
            avatar_url: user.user_metadata.avatar_url,
          })
        }

        // Verificar invitación pendiente
        const pendingInvite = localStorage.getItem('pendingInvite')
        if (pendingInvite) {
          const { data: pool } = await supabase
            .from('pools')
            .select('id')
            .eq('invite_code', pendingInvite)
            .single()

          if (pool) {
            await supabase.from('pool_members').insert({
              pool_id: pool.id,
              user_id: user.id,
            })

            localStorage.removeItem('pendingInvite')
            router.push(`/pool/${pool.id}`)
            return
          }
        }

        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-white/10 border-t-green-500 mx-auto mb-5"></div>
        <p className="text-slate-400 text-sm">Completando inicio de sesión...</p>
      </div>
    </div>
  )
}
