export const colors = {
  purple: '#6422B5',
  ink: '#28133F',
  lavender: '#B784F2',
  pale: '#EFE5FC',
  nav: '#F5F0FB',
  surface: '#F4F1F8',
  line: '#DCD2E6',
  muted: '#665B73',
  body: '#45374F',
  green: '#DEF4E9',
  yellow: '#FFF0CE',
  red: '#FFE2E7',
  sidebar: '#2D1748',
  teal: '#106B57',
  amber: '#865C06',
  danger: '#A62D48',
};

export type Tema = 'claro' | 'escuro';
export type UsoCor = 'texto' | 'fundo' | 'borda';

// Tons antigos convergem para a paleta central. No modo escuro, só as cores mudam.
export function adaptarCor(valor: string, tema: Tema, uso: UsoCor = 'texto'): string {
  if (valor === 'transparent' || valor === 'none') {
    return valor;
  }
  if (tema === 'claro') {
    const legadas: Record<string, string> = {
      '#4c315c': colors.body,
      '#74677d': colors.muted,
      '#f5f0fa': colors.surface,
      '#fcfaff': colors.surface,
      '#f8f0ff': colors.pale,
      '#faf6ff': colors.nav,
      '#7119aa': colors.purple,
      '#390654': colors.ink,
      '#a03ddd': colors.purple,
      '#e6cef8': colors.pale,
      '#e4cbf8': colors.pale,
      '#e8d4f5': colors.line,
      '#e9d5f7': colors.line,
    };
    return legadas[valor.toLowerCase()] || valor;
  }
  const normalizado = valor.toLowerCase();
  let hex = normalizado === 'white' ? '#ffffff' : normalizado === 'black' ? '#000000' : normalizado;
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    hex =
      '#' +
      hex
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('');
  }
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
    return valor;
  }
  if (hex.length === 9) {
    return valor;
  } // Mantém os overlays transparentes.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const claro = (r + g + b) / 3;
  if ([colors.surface.toLowerCase(), colors.nav.toLowerCase()].includes(hex) && uso === 'fundo') {
    return '#17121D';
  }
  if (hex === colors.sidebar.toLowerCase() && uso === 'fundo') {
    return '#21152F';
  }
  if (hex === colors.ink.toLowerCase() && uso === 'fundo') {
    return '#2C1646';
  }
  if (uso === 'texto') {
    const textos: Record<string, string> = {
      [colors.ink.toLowerCase()]: '#F6F0FC',
      [colors.body.toLowerCase()]: '#E5DDEA',
      [colors.muted.toLowerCase()]: '#BDB0C9',
      [colors.purple.toLowerCase()]: '#D7A9FF',
      [colors.amber.toLowerCase()]: '#F3CC79',
    };
    if (textos[hex]) {
      return textos[hex];
    }
  }
  if (uso === 'borda') {
    return claro > 180 ? '#594265' : '#9D68C0';
  }
  if (uso === 'fundo') {
    if (['#fcfaff', '#faf7fd', '#f5f0fa', '#f6f2fb'].includes(hex)) {
      return '#17121D';
    }
    if (hex === '#ffffff' || hex === '#fefbff') {
      return '#241B2D';
    }
    if (claro < 130) {
      return '#7727AD';
    }
    if (g > r + 5 && g > b) {
      return '#19392D';
    }
    if (r > g + 8 && r > b + 4) {
      return '#42252C';
    }
    if (b > r + 8 && g > r + 4) {
      return '#1E3445';
    }
    if (r > 180 && g > 170 && b < r - 15 && Math.abs(r - g) < 25) {
      return '#3D3520';
    }
    // Tonalidades diferentes mantêm abas, filtros e opções selecionadas visíveis.
    return claro > 235 ? '#2B2136' : claro > 210 ? '#382345' : '#51335F';
  }
  if (claro > 235) {
    return valor;
  } // Texto branco sobre botões.
  if (r > g * 1.3 && r > b * 1.1) {
    return '#FFADB9';
  }
  if (g > r * 1.15 && g > b * 1.1) {
    return '#97E4B5';
  }
  if (b > r * 1.2 && g > r) {
    return '#A3D8FF';
  }
  if (b > g * 1.25 && r > g * 1.15) {
    return '#DEB3FF';
  }
  return claro < 85 ? '#F2EAF8' : '#C6B8D1';
}

export function adaptarEstilos<T>(valor: T, tema: Tema, escala = 1): T {
  if (valor == null || typeof valor !== 'object') {
    return valor;
  }
  if (Array.isArray(valor)) {
    return valor.map((v) => adaptarEstilos(v, tema, escala)) as T;
  }
  const resultado: Record<string, unknown> = {};
  for (const [chave, item] of Object.entries(valor)) {
    if (typeof item === 'number' && (chave === 'fontSize' || chave === 'lineHeight')) {
      resultado[chave] = item * escala;
    } else if (
      typeof item === 'string' &&
      /Color$|^color$/.test(chave) &&
      chave !== 'shadowColor'
    ) {
      resultado[chave] = adaptarCor(
        item,
        tema,
        chave === 'backgroundColor' ? 'fundo' : chave === 'color' ? 'texto' : 'borda',
      );
    } else {
      resultado[chave] =
        item && typeof item === 'object' ? adaptarEstilos(item, tema, escala) : item;
    }
  }
  return resultado as T;
}
