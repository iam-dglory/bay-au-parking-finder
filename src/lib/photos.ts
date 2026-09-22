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
