import { supabase } from './supabaseClient'
import { signPhotoPath } from './photos'

const LOCAL_KEYS = ['bay.saved-locations.v1']

/** Deletes everything tied to this device's anonymous Bay account: sign photos,
 * database rows (via the delete_my_data RPC, which also removes the account),
 * and device-saved places. A fresh anonymous account starts on next launch. */
export interface DeleteResult { accountDeleted: boolean }

export async function deleteMyData(): Promise<DeleteResult> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('No Bay account on this device to delete.')

  const { data: spots, error: spotsError } = await supabase.from('parking_spots').select('photo_url').eq('created_by', userId)
  if (spotsError) throw new Error('Could not look up your reported signs. Check your connection and try again.')
  const paths = (spots ?? []).map(row => signPhotoPath(row.photo_url)).filter((path): path is string => !!path)
  if (paths.length) {
    const { error } = await supabase.storage.from('sign-photos').remove(paths)
    if (error) throw new Error('Could not delete your sign photos. Nothing else was deleted; try again.')
  }

  // Parking-information report screenshots live under <user id>/ in their own bucket.
  const { data: shots } = await supabase.storage.from('parking-report-screenshots').list(userId, { limit: 1000 })
  if (shots?.length) await supabase.storage.from('parking-report-screenshots').remove(shots.map(file => `${userId}/${file.name}`))

  const { data, error } = await supabase.rpc('delete_my_data')
  if (error) throw new Error('Could not delete your data. Check your connection and try again.')
  const accountDeleted = (data as { account_deleted?: boolean } | null)?.account_deleted !== false

  for (const key of LOCAL_KEYS) { try { window.localStorage.removeItem(key) } catch { /* storage unavailable */ } }
  await supabase.auth.signOut().catch(() => {})
  return { accountDeleted }
}
