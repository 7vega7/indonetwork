// Format nama game: gate_of_olympus → Gate of Olympus
export function formatNamaGame(nama: string): string {
  if (!nama) return ''
  return nama
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
