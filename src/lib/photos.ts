import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { supabase } from './supabaseClient'

export interface CapturedPhoto {
  /** Local data URL, for an immediate preview before it's uploaded. */
  previewUrl: string
  blob: Blob
}

/** Opens the device camera (or, on web, the browser's file/camera picker) and
 * returns the captured image ready to preview and upload. Returns null if the
 * user cancels, which is not an error, just "didn't take a photo yet". */
export async function captureSignPhoto(promptHeader = 'Photo of the sign'): Promise<CapturedPhoto | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      quality: 70,
      promptLabelHeader: promptHeader,
      promptLabelPhoto: 'Choose from gallery',
      promptLabelPicture: 'Take photo',
    })
    if (!photo.dataUrl) return null
    const blob = await (await fetch(photo.dataUrl)).blob()
    return { previewUrl: photo.dataUrl, blob }
  } catch {
    return null // user cancelled the camera/picker
  }
}

/** Uploads a captured sign photo and returns its public URL. */
export async function uploadSignPhoto(photo: CapturedPhoto): Promise<string> {
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('sign-photos').upload(path, photo.blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('sign-photos').getPublicUrl(path).data.publicUrl
}

/** Listing photos are private-host uploads with a user-scoped path. The
 * storage policy added by the marketplace migration enforces the same path
 * convention, so one host cannot overwrite another host's evidence. */
export async function uploadListingPhotos(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    const extension = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (error) throw error
    paths.push(path)
  }
  return paths
}

/** Storage object name inside the sign-photos bucket, from a stored photo URL. */
export function signPhotoPath(url: string | null | undefined): string | null {
  const match = url?.match(/\/sign-photos\/([^?#]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

/** The bucket is private: a photo is visible to its uploader, moderators, and
 * everyone once its sign is approved. Viewers get a short-lived signed URL. */
export async function signedSignPhotoUrl(url: string | null | undefined, expiresInSeconds = 3600): Promise<string | null> {
  const path = signPhotoPath(url)
  if (!path) return url?.startsWith('https://') ? url : null
  const { data, error } = await supabase.storage.from('sign-photos').createSignedUrl(path, expiresInSeconds)
  return error ? null : data.signedUrl
}
