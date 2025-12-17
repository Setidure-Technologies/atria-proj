# Public Assets Folder

This folder contains static assets that will be served publicly by the application.

## 📁 Folder Structure

### `/images`
- **Purpose**: Store images, photos, graphics, and visual assets
- **Supported formats**: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`
- **Examples**: 
  - Logo files (`logo.png`, `logo.svg`)
  - Background images (`bg-pattern.svg`)
  - Assessment illustrations
  - User interface graphics

### `/icons`
- **Purpose**: Store icon files and favicons
- **Supported formats**: `.png`, `.ico`, `.svg`
- **Examples**:
  - App icons (`icon-192.png`, `icon-512.png`)
  - Favicon (`favicon.ico`)
  - UI icons for buttons and features

### `/documents`
- **Purpose**: Store downloadable documents and PDFs
- **Supported formats**: `.pdf`, `.doc`, `.docx`, `.txt`
- **Examples**:
  - User manuals
  - Assessment guidelines
  - Result reports
  - Terms and conditions

### `/audio`
- **Purpose**: Store audio files for the application
- **Supported formats**: `.mp3`, `.wav`, `.ogg`
- **Examples**:
  - Notification sounds
  - Audio instructions
  - Background music
  - Accessibility audio cues

### `/fonts`
- **Purpose**: Store custom font files
- **Supported formats**: `.woff`, `.woff2`, `.ttf`, `.otf`
- **Examples**:
  - Custom brand fonts
  - Icon fonts
  - Accessibility fonts

## 🔗 How to Use

### In React Components
```jsx
// Images
<img src="/images/logo.png" alt="Logo" />
<div style={{ backgroundImage: 'url(/images/background.jpg)' }} />

// Icons
<link rel="icon" href="/favicon.ico" />

// Documents (downloadable)
<a href="/documents/user-guide.pdf" download>Download Guide</a>

// Audio
<audio src="/audio/notification.mp3" />
```

### In CSS Files
```css
/* Background images */
.hero {
  background-image: url('/images/hero-bg.jpg');
}

/* Custom fonts */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font.woff2') format('woff2');
}
```

### Direct Access
Files in the public folder are accessible directly via URL:
- `http://localhost:3005/images/logo.png`
- `http://localhost:3005/documents/guide.pdf`
- `http://localhost:3005/audio/sound.mp3`

## 📝 Best Practices

### File Naming
- Use lowercase letters and hyphens: `app-logo.png`
- Avoid spaces and special characters
- Be descriptive: `assessment-complete-sound.mp3`

### Optimization
- **Images**: Optimize for web (compress, use appropriate formats)
- **Audio**: Use compressed formats like MP3 or OGG
- **Documents**: Keep file sizes reasonable for download

### Organization
- Group related files in subfolders
- Use consistent naming conventions
- Include version numbers for assets that change frequently

## 🚀 Ready to Use

The folder structure is now ready! You can start uploading your assets to the appropriate folders.

### Essential Files Already Created:
- ✅ `favicon.ico` (placeholder - replace with your actual favicon)
- ✅ `manifest.json` (PWA configuration for mobile app-like experience)

### Next Steps:
1. Upload your actual favicon to replace the placeholder
2. Add app icons (192x192px and 512x512px) to `/icons/`
3. Upload any images, documents, or other assets your app needs
4. Update the manifest.json with your actual app details if needed