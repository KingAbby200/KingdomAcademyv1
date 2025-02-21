// Utility function to generate consistent avatar URLs across the app
export function getAvatarUrl(seed: string) {
  // Using 'lorelei' style for more realistic, consistent avatars
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundRotation=0`;
}
