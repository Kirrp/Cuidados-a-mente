/** Converte o horário do plano para um instante, mesmo em outro fuso no aparelho. */
export function instanteDoRegistro(data: string, horario: string, fuso?: string): Date | null {
  if (!fuso) {
    const local = new Date(data + 'T' + horario + ':00');
    return Number.isNaN(local.getTime()) ? null : local;
  }
  try {
    const [ano, mes, dia] = data.split('-').map(Number);
    const [hora, minuto] = horario.split(':').map(Number);
    const alvo = Date.UTC(ano, mes - 1, dia, hora, minuto);
    const formatador = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    function partes(t: number) {
      return Object.fromEntries(
        formatador.formatToParts(new Date(t)).map((p) => [p.type, p.value]),
      );
    }
    let t = alvo;
    for (let i = 0; i < 3; i++) {
      const p = partes(t);
      t +=
        alvo -
        Date.UTC(
          Number(p.year),
          Number(p.month) - 1,
          Number(p.day),
          Number(p.hour),
          Number(p.minute),
        );
    }
    const p = partes(t);
    if (p.year + '-' + p.month + '-' + p.day !== data || p.hour + ':' + p.minute !== horario) {
      return null;
    }
    return new Date(t);
  } catch {
    return null;
  }
}
