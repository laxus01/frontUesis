// Number to words (Spanish) for amount display
export function numberToSpanishWords(num: number): string {
  if (!isFinite(num)) return '';
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const toWords999 = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    let parts: string[] = [];
    if (c) parts.push(centenas[c]);
    if (d === 1) {
      parts.push(especiales[u]);
    } else if (d === 2) {
      if (u === 0) parts.push('veinte'); else parts.push('veinti' + (u === 2 ? 'dós' : u === 3 ? 'trés' : unidades[u]));
    } else if (d > 2) {
      if (u === 0) parts.push(decenas[d]); else parts.push(`${decenas[d]} y ${unidades[u]}`);
    } else if (u) {
      parts.push(unidades[u]);
    }
    return parts.join(' ').trim();
  };

  const toWords = (n: number): string => {
    if (n === 0) return 'cero';
    let words: string[] = [];
    const millones = Math.floor(n / 1_000_000);
    const miles = Math.floor((n % 1_000_000) / 1000);
    const resto = n % 1000;
    if (millones) {
      words.push(millones === 1 ? 'un millón' : `${toWords(millones)} millones`);
    }
    if (miles) {
      words.push(miles === 1 ? 'mil' : `${toWords999(miles)} mil`);
    }
    if (resto) {
      words.push(toWords999(resto));
    }
    return words.join(' ').trim();
  };

  const entero = Math.floor(Math.abs(num));
  const centavos = Math.round((Math.abs(num) - entero) * 100);
  let texto = toWords(entero);
  texto = texto.replace(/\buno\b/g, 'un');
  return centavos > 0 ? `${texto} con ${centavos.toString().padStart(2, '0')}/100` : texto;
}

export const toTitleCase = (s: string): string => s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

// Formatea solo enteros con separador de miles (es-CO). No permite decimales
export const formatMoneyInput = (input: string): string => {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  return new Intl.NumberFormat('es-CO').format(n);
};

// Convierte a entero: elimina puntos y descarta decimales
export const moneyToInteger = (s: string): number => {
  if (!s) return 0;
  const noThousands = s.replace(/\./g, '');
  const intPart = noThousands.split(',')[0] || '';
  const digits = intPart.replace(/[^0-9]/g, '');
  const n = Number(digits || '0');
  return isNaN(n) ? 0 : n;
};
