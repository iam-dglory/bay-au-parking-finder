import { Capacitor } from '@capacitor/core'

/** City of Melbourne takes app payments through EasyPark (cards and coins at
 * the meter also work). The app needs the four-digit zone number by the sign. */
export function easyParkUrl(): string {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'https://apps.apple.com/au/app/easypark/id449594317'
  if (platform === 'android') return 'https://play.google.com/store/apps/details?id=net.easypark.android'
  return 'https://www.easypark.com/en-au'
}
