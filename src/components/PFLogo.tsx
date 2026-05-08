export default function PFLogo({ size = 36, className }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/logo.png"
      alt="Polla Futbolera"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className={className}
    />
  )
}
