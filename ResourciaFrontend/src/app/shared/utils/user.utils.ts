export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function hashString(str: string): number {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export function getUserGradient(seed: string): string {
  const hash = hashString(seed); // ❗ no "this"

  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;

  return `linear-gradient(135deg, 
    hsl(${hue1}, 70%, 55%), 
    hsl(${hue2}, 70%, 45%)
  )`;
}