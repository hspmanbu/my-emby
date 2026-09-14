import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14181f" />
      <stop offset="50%" stop-color="#0d0f12" />
      <stop offset="100%" stop-color="#060709" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="106" fill="none" stroke="#10b981" stroke-opacity="0.3" stroke-width="4" />

  <!-- Yamby Style Play Emblem -->
  <g filter="url(#glow)">
    <!-- Outer decorative arc / wave -->
    <path d="M 160 140 C 130 180, 130 332, 160 372" stroke="url(#emeraldGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.4" />
    <path d="M 190 170 C 170 200, 170 312, 190 342" stroke="url(#emeraldGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.7" />

    <!-- Central Play Triangle -->
    <path d="M 230 176 C 230 162 245 153 257 160 L 376 238 C 388 245 388 267 376 274 L 257 352 C 245 359 230 350 230 336 Z" fill="url(#emeraldGrad)" />

    <!-- Top-Right Accent Dot -->
    <circle cx="360" cy="160" r="14" fill="#34d399" />
  </g>
</svg>
`;

const maskableSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14181f" />
      <stop offset="50%" stop-color="#0d0f12" />
      <stop offset="100%" stop-color="#060709" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full bleed background for maskable safe zone -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Center Content scaled down to 72% for 15% safe padding -->
  <g transform="translate(71.68, 71.68) scale(0.72)" filter="url(#glow)">
    <path d="M 160 140 C 130 180, 130 332, 160 372" stroke="url(#emeraldGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.4" />
    <path d="M 190 170 C 170 200, 170 312, 190 342" stroke="url(#emeraldGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.7" />
    <path d="M 230 176 C 230 162 245 153 257 160 L 376 238 C 388 245 388 267 376 274 L 257 352 C 245 359 230 350 230 336 Z" fill="url(#emeraldGrad)" />
    <circle cx="360" cy="160" r="14" fill="#34d399" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
  console.log('Saved public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);
  const maskableSvgBuffer = Buffer.from(maskableSvgContent);

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // Generate Maskable 512x512
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // Generate Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Generate favicon-32x32.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(console.error);
