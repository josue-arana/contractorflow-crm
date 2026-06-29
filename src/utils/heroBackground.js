export function buildHeroBackgroundStyle(
  backgroundUrl,
  overlay = 'rgba(2, 6, 23, 0.82)',
  accent = 'rgba(15, 23, 42, 0.35)',
  position = 'center'
) {
  return {
    backgroundImage: `linear-gradient(135deg, ${overlay}, ${accent}), url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: position,
  }
}
