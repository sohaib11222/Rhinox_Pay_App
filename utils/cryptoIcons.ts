import { ImageSourcePropType } from 'react-native';

const LOCAL_ICONS: Record<string, ImageSourcePropType> = {
  BTC: require('../assets/CurrencyBtc.png'),
  USDT: require('../assets/login/usdt-coin.png'),
};

const REMOTE_ICONS: Record<string, string> = {
  ETH: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
  USDC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdc.png',
  BNB: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png',
  TRX: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/trx.png',
  SOL: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png',
  MATIC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png',
  POL: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png',
  XRP: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png',
  LTC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ltc.png',
  DOGE: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png',
};

export function normalizeCryptoSymbol(currency?: string | null): string {
  if (!currency) {
    return 'BTC';
  }

  const upper = currency.trim().toUpperCase();

  if (upper.startsWith('USDT')) return 'USDT';
  if (upper.startsWith('USDC')) return 'USDC';
  if (upper.includes('BTC') || upper === 'BITCOIN') return 'BTC';
  if (upper.includes('ETH') || upper === 'ETHEREUM') return 'ETH';
  if (upper.includes('BNB')) return 'BNB';
  if (upper.includes('TRX') || upper === 'TRON') return 'TRX';
  if (upper.includes('SOL') || upper === 'SOLANA') return 'SOL';
  if (upper.includes('MATIC') || upper.includes('POLYGON') || upper === 'POL') return 'MATIC';
  if (upper.includes('XRP')) return 'XRP';
  if (upper.includes('LTC')) return 'LTC';
  if (upper.includes('DOGE')) return 'DOGE';

  return upper.split('_')[0];
}

export function getCryptoIconSource(currency?: string | null): ImageSourcePropType {
  const symbol = normalizeCryptoSymbol(currency);

  if (LOCAL_ICONS[symbol]) {
    return LOCAL_ICONS[symbol];
  }

  const remoteUrl =
    REMOTE_ICONS[symbol] ||
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol.toLowerCase()}.png`;

  return { uri: remoteUrl };
}
