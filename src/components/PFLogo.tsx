export default function PFLogo({ size = 36 }: { size?: number }) {
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
