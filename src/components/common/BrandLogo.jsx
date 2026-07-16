export function BrandLogo({
  variant = 'horizontal',
  tone = 'dark',
  alt = 'Aymero',
  className = '',
  imageClassName = '',
}) {
  const sourceByVariant = {
    horizontal: '/AymeroLogo_h.png',
    stacked: '/AymeroLogo_v.png',
    icon: tone === 'light' ? '/AppLogoLight.png' : '/AppLogoDark.png',
  }

  const src = sourceByVariant[variant] || sourceByVariant.horizontal

  return (
    <div className={className}>
      <img src={src} alt={alt} className={`h-full w-full object-contain ${imageClassName}`.trim()} />
    </div>
  )
}
