import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Upload a profile picture to Supabase Storage
 * @param userId - User ID for folder organization
 * @param imageUri - Local URI of the image
 * @returns Public URL of the uploaded image
 */
export async function uploadProfilePicture(
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Compress and resize image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Convert to ArrayBuffer (React Native compatible)
    const response = await fetch(manipulatedImage.uri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create file path: userId/avatar.jpg
    const filePath = `${userId}/avatar.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true, // Replace existing file
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user profile with avatar URL
    await updateUserAvatar(userId, urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return null;
  }
}

/**
 * Update user's avatar_url in the database
 */
async function updateUserAvatar(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (error) {
    console.error('Error updating avatar URL:', error);
    throw error;
  }
}

/**
 * Delete user's profile picture
 */
export async function deleteProfilePicture(userId: string): Promise<boolean> {
  try {
    const filePath = `${userId}/avatar.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Clear avatar_url in database
    await updateUserAvatar(userId, '');

    return true;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
}

/**
 * Get profile picture URL for a user
 */
export function getProfilePictureUrl(userId: string): string {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.jpg`);

  return data.publicUrl;
}

/**
 * Upload a face registration image to Supabase Storage
 * @param userId - User ID
 * @param imageUri - Local URI of the image
 * @returns Public URL of the uploaded image
 */
export async function uploadFaceRegistrationImage(
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Compress and resize image - keep higher quality for face recognition
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }], // Keep aspect ratio, max width 800
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Convert to ArrayBuffer (React Native compatible)
    const response = await fetch(manipulatedImage.uri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create file path: face_registrations/userId/reference.jpg
    const filePath = `face_registrations/${userId}/reference.jpg`;

    // Upload to Supabase Storage (using 'avatars' bucket for now as it's known to exist/work)
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading face registration image:', error);
    return null;
  }
}
