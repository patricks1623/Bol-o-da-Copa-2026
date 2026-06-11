export function generateGroupCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function calculatePoints(
  predA: number,
  predB: number,
  realA: number,
  realB: number
): number {
  // Acerto Exato do Placar (3 pontos)
  if (predA === realA && predB === realB) {
    return 3;
  }

  const predDiff = predA - predB;
  const realDiff = realA - realB;

  // Acerto apenas do resultado (Quem ganhou ou se foi empate) (1 ponto)
  if (
    (predDiff > 0 && realDiff > 0) || // Team A venceu
    (predDiff < 0 && realDiff < 0) || // Team B venceu
    (predDiff === 0 && realDiff === 0) // Empate
  ) {
    return 1;
  }

  // Errou (0 pontos)
  return 0;
}

export function isMatchLocked(matchDate: string): boolean {
  const matchTime = new Date(matchDate).getTime();
  const now = new Date().getTime();
  const fiveMinInMs = 5 * 60 * 1000;
  
  // Trava 5 minutos antes do início
  return now >= (matchTime - fiveMinInMs);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).format(date);
}
