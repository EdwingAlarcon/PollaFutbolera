import { getTeamFlagUrl } from '@/lib/flags'

interface TeamFlagProps {
  team: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { px: 24, cdnSize: 20 as const },
  md: { px: 36, cdnSize: 40 as const },
  lg: { px: 56, cdnSize: 80 as const },
  xl: { px: 80, cdnSize: 80 as const },
}

export default function TeamFlag({ team, size = 'md', className = '' }: TeamFlagProps) {
  const { px, cdnSize } = sizeMap[size]
  const url = getTeamFlagUrl(team, cdnSize)

  if (!url) {
    // Fallback: círculo con inicial del equipo
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-gray-700 text-white font-bold text-xs ${className}`}
        style={{ width: px, height: px * 0.67, fontSize: px * 0.3 }}
        title={team}
      >
        {team.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt={`Bandera de ${team}`}
      width={px}
      height={Math.round(px * 0.67)}
      className={`inline-block rounded-sm shadow-sm object-cover ${className}`}
      style={{ width: px, height: Math.round(px * 0.67) }}
      loading="lazy"
      onError={(e) => {
        // Si la imagen falla, mostrar inicial
        const target = e.currentTarget
        target.style.display = 'none'
        const fallback = target.nextElementSibling as HTMLElement
        if (fallback) fallback.style.display = 'inline-flex'
      }}
    />
  )
}
