'use server'

import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'rock-attachments'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * Upload an image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadImage(formData: FormData): Promise<{ url: string; path: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB')
  }

  // Generate unique path: user_id/timestamp.extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const path = `${user.id}/${timestamp}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error('Failed to upload image')
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return { url: publicUrl, path }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify the path belongs to the user (security check)
  if (!path.startsWith(`${user.id}/`)) {
    throw new Error('Access denied')
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw new Error('Failed to delete image')
  }
}
