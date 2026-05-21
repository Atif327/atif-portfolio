const optimizedImages = {
  '/atif-ayyoub-ai-developer.png': '/atif-ayyoub-ai-developer.webp',
  '/atif-ayyoub-profile.png': '/atif-ayyoub-profile.webp',
  '/Atif logo.png': '/atif-logo.webp',
  '/preview.png': '/preview.webp',
  '/Wallpaper Hub.png': '/wallpaper-hub.webp',
  '/Amazone Clone.png': '/amazone-clone.webp',
  '/Student Evalution System.png': '/student-evaluation-system.webp',
  '/Dr assistance.jpeg': '/dr-assistance.webp',
  '/Task Manager.jpeg': '/task-manager.webp',
}

export function getOptimizedImageSrc(src) {
  return optimizedImages[src] || src || ''
}
