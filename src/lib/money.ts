import { CURRENCY_OPTIONS } from '../types'

export function formatMoney(currency: string, amount: number): string {
  const symbol = CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? currency + ' '
  return `${symbol}${amount.toFixed(2)}`
}
