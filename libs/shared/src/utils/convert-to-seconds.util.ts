export function convertToSecondsUtil(timeStr: string): number {
  // Если строка содержит только число, возвращаем его
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr, 10);
  }

  // Проверяем, что строка имеет формат "число + буква"
  const match = timeStr.match(/^(\d+)([smhdMy])$/);
  if (!match) {
    throw new Error("Invalid time string format");
  }

  const [, numStr, unit] = match;
  const num = parseInt(numStr, 10);

  const multipliers: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 60 * 60,
    'd': 24 * 60 * 60,
    'M': 30 * 24 * 60 * 60,
    'y': 365 * 24 * 60 * 60
  };

  return num * multipliers[unit];
}