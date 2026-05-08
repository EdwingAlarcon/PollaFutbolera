'use client'

import { getTeamFlagUrl } from '@/lib/flags'
import { getClubLogoUrl } from '@/lib/teamLogos'

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

  const clubUrl = getClubLogoUrl(team)
  const flagUrl = clubUrl ? '' : getTeamFlagUrl(team, cdnSize)
  const url = clubUrl || flagUrl
  const isClub = !!clubUrl

  const imgH = isClub ? px : Math.round(px * 0.67)
  const fallbackH = Math.round(px * 0.67)

  const fallback = (
    <span
      className={`inline-flex items-center justify-center rounded-sm bg-gray-700 text-white font-bold ${className}`}
      style={{ width: px, height: fallbackH, fontSize: Math.round(px * 0.3) }}
      title={team}
    >
      {team.slice(0, 2).toUpperCase()}
    </span>
  )

  if (!url) return fallback

  return (
    <>
      <img
        src={url}
        alt={team}
        width={px}
        height={imgH}
        className={`inline-block shadow-sm object-contain ${
          isClub ? 'rounded-md' : 'rounded-sm'
        } ${className}`}
        style={{ width: px, height: imgH }}
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          const sib = target.nextElementSibling as HTMLElement | null
          if (sib) sib.style.display = 'inline-flex'
        }}
      />
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-gray-700 text-white font-bold ${className}`}
        style={{ display: 'none', width: px, height: fallbackH, fontSize: Math.round(px * 0.3) }}
        title={team}
      >
        {team.slice(0, 2).toUpperCase()}
      </span>
    </>
  )
}
