'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Static data ───────────────────────────────────────────────────────────────

const STATS = [
  { icon: '⚽', value: '12,847', label: 'Predicciones',     trend: '+342 esta semana'   },
  { icon: '👥', value: '1,203',  label: 'Jugadores activos', trend: '+89 este mes'       },
  { icon: '🏆', value: '89',     label: 'Ligas activas',     trend: '12 nuevas'          },
  { icon: '🎯', value: '67%',    label: 'Precisión media',   trend: '+2% vs mes anterior'},
]

const STEPS = [
  {
    num: '01',
    icon: '🏟️',
    title: 'Únete a una liga',
    desc: 'Crea tu polla privada o únete con un código de invitación en segundos.',
    border: 'border-green-500/30',
    glow: 'hover:shadow-green-500/10',
    badge: 'text-green-400',
  },
  {
    num: '02',
    icon: '🎯',
    title: 'Haz tus predicciones',
    desc: 'Predice el marcador exacto de cada partido antes de que empiece.',
    border: 'border-amber-500/30',
    glow: 'hover:shadow-amber-500/10',
    badge: 'text-amber-400',
  },
  {
    num: '03',
    icon: '📈',
    title: 'Sube en el ranking',
    desc: 'Gana puntos, compite con amigos y domina el marcador cada jornada.',
    border: 'border-blue-500/30',
    glow: 'hover:shadow-blue-500/10',
    badge: 'text-blue-400',
  },
]

const MATCHES = [
  {
    home: { name: 'Brasil',     flag: '🇧🇷', score: 2    },
    away: { name: 'Argentina',  flag: '🇦🇷', score: 1    },
    tournament: 'Copa Mundial 2026', group: 'Grupo A',
    time: "67'", status: 'live' as const, picks: 74, topPick: '2–1',
  },
  {
    home: { name: 'España',  flag: '🇪🇸', score: null },
    away: { name: 'Francia', flag: '🇫🇷', score: null },
    tournament: 'Copa Mundial 2026', group: 'Grupo E',
    time: '13 Jun · 18:00', status: 'upcoming' as const, picks: 61, topPick: '1–0',
  },
  {
    home: { name: 'Alemania',   flag: '🇩🇪',         score: null },
    away: { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: null },
    tournament: 'Copa Mundial 2026', group: 'Grupo C',
    time: '14 Jun · 20:00', status: 'upcoming' as const, picks: 58, topPick: '2–2',
  },
]

const LEADERBOARD = [
  { pos: 1, name: 'CarlosGol',     pts: 1847, change: '+3', streak: 8, medal: '🥇', color: 'border-amber-500/40 shadow-amber-500/10', precision: 72 },
  { pos: 2, name: 'LaPelota10',   pts: 1792, change: '+1', streak: 5, medal: '🥈', color: 'border-slate-400/30 shadow-slate-400/5',  precision: 68 },
  { pos: 3, name: 'TacticaFC',    pts: 1731, change: '—',  streak: 3, medal: '🥉', color: 'border-amber-700/30 shadow-amber-700/5',  precision: 65 },
  { pos: 4, name: 'GolazoMex',    pts: 1690, change: '+2', streak: 4, medal: '',   color: '',                                        precision: 63 },
  { pos: 5, name: 'ElPronostico', pts: 1644, change: '-1', streak: 2, medal: '',   color: '',                                        precision: 60 },
]

const FEATURES = [
  { icon: '📊', title: 'Rankings en tiempo real',    desc: 'Tabla actualizada automáticamente tras cada partido.'         },
  { icon: '🎯', title: 'Predicciones Live',           desc: 'Sigue tus picks mientras el partido transcurre en vivo.'     },
  { icon: '🔒', title: 'Ligas privadas',              desc: 'Invita solo a tus amigos con código de acceso exclusivo.'    },
  { icon: '📈', title: 'Estadísticas avanzadas',      desc: 'Analiza tu precisión, rachas y tendencias históricas.'       },
  { icon: '🏅', title: 'Sistema de puntos flexible',  desc: 'Personaliza los puntos por marcador exacto o resultado.'     },
  { icon: '📅', title: 'Historial completo',          desc: 'Revisa cada predicción que has hecho en tus pollas.'         },
]

const TESTIMONIALS = [
  {
    avatar: 'CG',
    name: 'Carlos G.',
    role: 'Campeón Liga 2025',
    text: '"Desde que descubrí Polla Futbolera no puedo dejar de jugar. Mi grupo tiene una liga activa y la competencia es feroz cada jornada."',
    stars: 5,
  },
  {
    avatar: 'LP',
    name: 'Laura P.',
    role: 'Usuario frecuente',
    text: '"La interfaz es increíble, muy fácil de usar. Me encanta ver el ranking actualizado después de cada partido. ¡Muy adictivo!"',
    stars: 5,
  },
  {
    avatar: 'JM',
    name: 'Julián M.',
    role: 'Admin de 3 pollas',
    text: '"Tengo pollas con familia, trabajo y amigos del barrio. Nunca pensé que predecir resultados fuera tan emocionante."',
    stars: 5,
  },
]

// ── Logo SVG ─────────────────────────────────────────────────────────────────

function PFLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 3 L34 9 L34 22 Q34 32 20 37 Q6 32 6 22 L6 9 Z"
        fill="#22C55E" fillOpacity="0.2"
        stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round"
      />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="900">
        PF
      </text>
    </svg>
  )
}

// ── Activity feed data ────────────────────────────────────────────────────────

const ACTIVITY = [
  { icon: '⚽', bg: 'bg-green-500/15 border-green-500/25',  action: 'Carlos G. acertó el marcador exacto',      detail: '2–1 · Brasil vs Argentina',           time: 'hace 12 min' },
  { icon: '📈', bg: 'bg-blue-500/15 border-blue-500/25',   action: 'Edwing subió 3 posiciones en el ranking',   detail: 'Ahora en el puesto #4',               time: 'hace 28 min' },
  { icon: '🆕', bg: 'bg-amber-500/15 border-amber-500/25', action: 'Nueva jornada disponible',                  detail: 'Jornada 4 · 8 partidos por predecir', time: 'hace 1 h'    },
  { icon: '🎯', bg: 'bg-violet-500/15 border-violet-500/25',action: 'LaPelota10 completó sus pronósticos',      detail: '8/8 partidos predichos esta jornada', time: 'hace 2 h'    },
  { icon: '🏆', bg: 'bg-amber-500/15 border-amber-500/25', action: 'TacticaFC se mantiene en el top 3',         detail: '1,731 pts · racha de 3 aciertos',    time: 'hace 3 h'    },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="min-h-screen bg-[#0B1020] text-slate-50 overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0B1020]/85 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/40'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-5 py-4 flex items-center justify-between max-w-7xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-xl blur-md group-hover:bg-green-500/50 transition-all duration-300" />
              <div className="relative w-9 h-9 rounded-xl bg-[#0B1020] border border-green-500/40 flex items-center justify-center group-hover:border-green-400 transition-colors">
                <PFLogo size={26} />
              </div>
            </div>
            <span className="text-lg font-black tracking-tight">
              Polla<span className="text-green-400">Futbolera</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
            {([
              { label: 'Inicio',        href: '#hero'         },
              { label: 'Rankings',      href: '#rankings'     },
              { label: 'Jornadas',      href: '#jornadas'     },
              { label: 'Cómo funciona', href: '#como-funciona' },
              { label: 'Ligas',         href: '#ligas'        },
            ] as const).map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="hover:text-green-400 transition-colors duration-200 relative group/nl"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-green-400 group-hover/nl:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-400 text-black font-black text-sm py-2.5 px-5 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/50 hover:-translate-y-px"
            >
              Registrarse →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1020] via-[#0d1628] to-[#0B1020]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(34,197,94,0.07) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 85% 15%, rgba(245,158,11,0.05) 0%, transparent 55%)' }} />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0B1020] to-transparent" />

        <div className="container mx-auto px-5 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                  Copa Mundial 2026 · En vivo
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[68px] font-black leading-[1.06] mb-6 tracking-tight">
                Demuestra<br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #86efac 100%)' }}
                >
                  quién sabe más
                </span>
                <br />
                de fútbol
              </h1>

              <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                Haz predicciones, compite con amigos y domina el ranking en cada jornada.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/register"
                  className="group bg-green-500 hover:bg-green-400 text-black font-black text-base py-4 px-8 rounded-2xl transition-all duration-200 shadow-xl shadow-green-500/25 hover:shadow-green-500/50 hover:-translate-y-1 text-center flex items-center justify-center gap-2"
                >
                  Comenzar Ahora
                  <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                </Link>
                <Link
                  href="/login"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-base py-4 px-8 rounded-2xl transition-all duration-200 text-center"
                >
                  Iniciar sesión
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Gratis</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Sin tarjeta</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> 1,203 jugadores activos</span>
              </div>
            </div>

            {/* Right – App preview */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-3xl blur-3xl scale-95" style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, rgba(245,158,11,0.07) 60%, transparent 100%)' }} />

              <div className="relative bg-[#131A2E]/90 backdrop-blur border border-white/8 rounded-3xl p-5 shadow-2xl shadow-black/60">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Copa Mundial 2026</p>
                    <p className="text-sm font-black text-white">Jornada 3</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-red-400 text-xs font-black">LIVE</span>
                  </div>
                </div>

                {/* Live match */}
                <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🇧🇷</span>
                      <div>
                        <p className="font-black text-white text-sm">Brasil</p>
                        <p className="text-xs text-slate-500">Local</p>
                      </div>
                    </div>
                    <div className="text-center bg-[#0B1020] rounded-xl px-4 py-2 shadow-inner">
                      <p className="text-2xl font-black text-white">2 – 1</p>
                      <p className="text-xs text-slate-500">67'</p>
                    </div>
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <span className="text-4xl">🇦🇷</span>
                      <div className="text-right">
                        <p className="font-black text-white text-sm">Argentina</p>
                        <p className="text-xs text-slate-500">Visita</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-slate-500">Tu predicción: <span className="text-green-400 font-bold">2–1 ✓</span></span>
                    <span className="bg-green-500/20 text-green-400 text-xs font-black px-2 py-0.5 rounded-lg">+5 pts</span>
                  </div>
                </div>

                {/* Mini ranking */}
                <div className="bg-[#0B1020]/60 rounded-2xl p-3 mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Tu posición</p>
                  {[
                    { pos: 1, name: 'CarlosGol', pts: 847, you: false },
                    { pos: 2, name: 'Tú',        pts: 792, you: true  },
                    { pos: 3, name: 'TacticaFC', pts: 731, you: false },
                  ].map(row => (
                    <div
                      key={row.pos}
                      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg mb-1 transition-colors ${
                        row.you ? 'bg-green-500/10 border border-green-500/20' : ''
                      }`}
                    >
                      <span className="text-xs font-black text-slate-600 w-4">{row.pos}</span>
                      <span className={`text-sm font-bold flex-1 ${row.you ? 'text-green-400' : 'text-white'}`}>{row.name}</span>
                      <span className={`text-sm font-black ${row.you ? 'text-green-400' : 'text-slate-400'}`}>{row.pts}</span>
                    </div>
                  ))}
                </div>

                {/* Next match */}
                <div className="flex items-center justify-between bg-[#0B1020]/40 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇪🇸</span>
                    <span className="text-xs text-slate-600 font-bold">vs</span>
                    <span className="text-xl">🇫🇷</span>
                  </div>
                  <p className="text-xs text-slate-500">Mañana · 18:00</p>
                  <Link
                    href="/register"
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Predecir
                  </Link>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-amber-500 text-black font-black text-xs px-3 py-2 rounded-xl shadow-lg shadow-amber-500/40">
                🏆 #2 del ranking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="group relative bg-[#131A2E] border border-white/5 hover:border-green-500/20 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-green-500/8 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-3xl font-black text-white mb-1 tabular-nums">{s.value}</div>
                  <div className="text-xs text-slate-400 font-semibold mb-1.5">{s.label}</div>
                  <div className="text-[11px] text-green-400 font-semibold">{s.trend}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Simple y directo</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Cómo funciona?</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">Tres pasos y ya estás compitiendo con tus amigos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`group relative bg-[#131A2E] border ${s.border} rounded-3xl p-8 hover:shadow-2xl ${s.glow} transition-all duration-300 hover:-translate-y-2 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg mb-5 font-mono bg-white/5 ${s.badge}`}>{s.num}</span>
                  <div className="text-4xl mb-5">{s.icon}</div>
                  <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED MATCHES ────────────────────────────────────────────────── */}
      <section id="jornadas" className="py-24 bg-[#0d1424] relative">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.05) 0%, transparent 60%)' }} />
        <div className="container mx-auto px-5 max-w-7xl relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Próximos partidos</p>
              <h2 className="text-4xl md:text-5xl font-black text-white">Partidos destacados</h2>
            </div>
            <Link href="/register" className="hidden sm:block text-sm text-green-400 hover:text-green-300 font-semibold transition-colors">
              Ver todos →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {MATCHES.map((m, i) => (
              <div
                key={i}
                className="group relative bg-[#131A2E] border border-white/5 hover:border-green-500/15 rounded-3xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-2 overflow-hidden"
              >
                {m.status === 'live' && <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{m.tournament}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.group}</p>
                    </div>
                    {m.status === 'live' ? (
                      <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-red-400 text-xs font-black tracking-wider">LIVE</span>
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded-full px-3 py-1">
                        <span className="text-xs text-slate-500">{m.time}</span>
                      </div>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between mb-5 py-1">
                    <div className="text-center flex-1">
                      <div className="text-5xl mb-2">{m.home.flag}</div>
                      <p className="text-sm font-black text-white leading-tight">{m.home.name}</p>
                    </div>
                    <div className="text-center px-3 flex-shrink-0">
                      {m.status === 'live' ? (
                        <div className="bg-[#0B1020] rounded-2xl px-4 py-2 border border-red-500/20">
                          <div className="text-2xl font-black text-white tabular-nums">{m.home.score} – {m.away.score}</div>
                          <div className="text-xs text-red-400 font-bold mt-0.5">{m.time}</div>
                        </div>
                      ) : (
                        <div className="text-xl font-black text-slate-700">VS</div>
                      )}
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-5xl mb-2">{m.away.flag}</div>
                      <p className="text-sm font-black text-white leading-tight">{m.away.name}</p>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Pick más popular</span>
                      <span className="text-white font-black bg-white/5 px-2.5 py-1 rounded-lg">{m.topPick}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
                        <span>Local {m.picks}%</span>
                        <span>Visitante {100 - m.picks}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full" style={{ width: `${m.picks}%` }} />
                      </div>
                    </div>
                    <Link href="/register" className="block w-full text-center bg-white/5 hover:bg-green-500/15 text-slate-400 hover:text-green-400 text-xs font-bold py-2.5 rounded-xl transition-all duration-200">
                      Hacer predicción →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD ─────────────────────────────────────────────────────── */}
      <section id="rankings" className="py-24">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Competencia real</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ranking global</h2>
            <p className="text-slate-400 text-lg">¿Tienes lo que se necesita para estar en el top?</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Podium top 3 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((p, i) => {
                const isFirst = i === 1
                const colors = [
                  'border-slate-400/20',
                  'border-amber-500/40 shadow-amber-500/10',
                  'border-amber-700/20',
                ]
                const ptColors = ['text-slate-300', 'text-amber-400', 'text-amber-700']
                return (
                  <div
                    key={p.pos}
                    className={`bg-[#131A2E] border ${colors[i]} rounded-2xl p-4 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 ${isFirst ? 'scale-105' : ''}`}
                  >
                    <div className="text-2xl mb-2">{p.medal}</div>
                    <div className="w-10 h-10 rounded-full bg-white/8 mx-auto flex items-center justify-center font-black text-xs text-white mb-2">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-white truncate mb-1">{p.name}</p>
                    <p className={`text-lg font-black ${ptColors[i]}`}>{p.pts}</p>
                    <p className="text-xs text-slate-600">pts</p>
                    <div className="mt-2 bg-white/5 rounded-lg px-2 py-1">
                      <p className="text-[10px] text-slate-500">{p.precision}% precisión</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Rows 4–5 */}
            <div className="bg-[#131A2E] border border-white/5 rounded-2xl overflow-hidden mb-6">
              {LEADERBOARD.slice(3).map((p) => (
                <div
                  key={p.pos}
                  className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="w-5 text-sm font-black text-slate-600">{p.pos}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-slate-400">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-600">{p.precision}% precisión</p>
                  </div>
                  <span className="text-xs text-orange-400 font-bold">{p.streak}🔥</span>
                  <span className={`text-xs font-bold w-8 text-right ${p.change.startsWith('+') ? 'text-green-400' : p.change === '—' ? 'text-slate-500' : 'text-red-400'}`}>
                    {p.change}
                  </span>
                  <span className="text-sm font-black text-slate-300 w-12 text-right tabular-nums">{p.pts}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="inline-block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold py-3 px-8 rounded-xl text-sm transition-all duration-200"
              >
                Ver ranking completo →
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* ── ACTIVITY FEED ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0d1424] relative">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 80% 50%, rgba(34,197,94,0.04) 0%, transparent 60%)' }} />
        <div className="container mx-auto px-5 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: timeline feed */}
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">En tiempo real</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Actividad reciente</h2>
              <p className="text-slate-400 text-base mb-10">Lo que está pasando ahora mismo en la plataforma</p>

              <div className="relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-green-500/40 via-white/5 to-transparent" />
                <div className="space-y-4">
                  {ACTIVITY.map((a, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className={`relative z-10 w-10 h-10 rounded-2xl ${a.bg} border flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                        {a.icon}
                      </div>
                      <div className="flex-1 bg-[#131A2E]/70 border border-white/5 group-hover:border-white/10 rounded-2xl px-4 py-3 transition-all duration-200">
                        <p className="text-sm font-bold text-white leading-snug mb-0.5">{a.action}</p>
                        <p className="text-xs text-slate-500">{a.detail}</p>
                        <p className="text-[10px] text-slate-600 mt-1.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: personal stats preview */}
            <div className="space-y-4">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Vista previa · Tu rendimiento</p>

              <div className="bg-[#131A2E] border border-white/8 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[70px]" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Posición actual</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">#2</span>
                        <span className="text-green-400 text-sm font-bold">↑ +3</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Puntos</p>
                      <p className="text-3xl font-black text-amber-400 tabular-nums">792</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Precisión', value: '68%', icon: '🎯', color: 'text-green-400' },
                      { label: 'Racha',      value: '5🔥', icon: '📈', color: 'text-orange-400' },
                    ].map((st, idx) => (
                      <div key={idx} className="bg-white/5 rounded-2xl p-4 text-center">
                        <div className="text-2xl mb-1">{st.icon}</div>
                        <div className={`text-xl font-black ${st.color}`}>{st.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{st.label}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-semibold mb-3 uppercase tracking-wider">Puntos por jornada</p>
                    {[
                      { j: 'J1', pts: 85 },
                      { j: 'J2', pts: 70 },
                      { j: 'J3', pts: 92 },
                    ].map((jr, idx) => (
                      <div key={idx} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-slate-600 w-5">{jr.j}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-green-700 to-green-400" style={{ width: `${jr.pts}%` }} />
                        </div>
                        <span className="text-xs font-black text-green-400 w-7 text-right tabular-nums">{jr.pts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/register" className="block w-full text-center bg-green-500/10 hover:bg-green-500/18 border border-green-500/20 hover:border-green-500/40 text-green-400 font-bold py-3.5 rounded-2xl transition-all duration-200 text-sm">
                Ver mis estadísticas completas →
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="ligas" className="py-24 bg-[#0d1424]">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Todo incluido</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Por qué PollaFutbolera?</h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">Diseñada para jugadores exigentes que quieren algo más que un Excel compartido</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group bg-[#131A2E] border border-white/5 hover:border-green-500/20 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-black text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Comunidad</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Lo que dicen los jugadores</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-[#131A2E] border border-white/5 hover:border-white/10 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
              >
                <div className="flex mb-5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center font-black text-green-400 text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0d1424]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(34,197,94,0.09) 0%, transparent 70%)' }} />
        <div className="container mx-auto px-5 max-w-7xl text-center relative z-10">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-6">¿Listo para competir?</p>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Únete ahora.<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #4ade80 0%, #22c55e 60%, #86efac 100%)' }}
            >
              Es gratis.
            </span>
          </h2>
          <p className="text-slate-400 text-xl mb-12 max-w-xl mx-auto">
            Más de 1,200 jugadores ya están compitiendo. ¿Quién conoce mejor el fútbol?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black text-lg py-5 px-12 rounded-2xl transition-all duration-200 shadow-2xl shadow-green-500/30 hover:shadow-green-500/55 hover:-translate-y-1"
            >
              Crear cuenta gratis <span>→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-lg py-5 px-10 rounded-2xl transition-all duration-200"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#090d1a] border-t border-white/5 py-16">
        <div className="container mx-auto px-5 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#0B1020] border border-green-500/40 flex items-center justify-center">
                  <PFLogo size={22} />
                </div>
                <span className="font-black text-white">Polla<span className="text-green-400">Futbolera</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                La plataforma de predicciones deportivas más emocionante. Compite, aprende y diviértete.
              </p>
            </div>

            {/* Link columns */}
            {[
              { title: 'Producto',  links: ['Cómo funciona', 'Rankings', 'Ligas', 'Jornadas']  },
              { title: 'Cuenta',    links: ['Registrarse', 'Iniciar sesión', 'Dashboard', 'Perfil'] },
              { title: 'Soporte',   links: ['Reglas', 'Privacidad', 'Términos', 'Contacto']    },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors duration-200">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2026 PollaFutbolera. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              {['🐦', '📘', '📸', '▶️'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
