const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1d24" />
      <stop offset="50%" stop-color="#121318" />
      <stop offset="100%" stop-color="#090a0d" />
    </linearGradient>

    <!-- Border Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
      <stop offset="50%" stop-color="rgba(255, 94, 58, 0.2)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.04)" />
    </linearGradient>

    <!-- Primary Coral / Sunset Flame Gradient -->
    <linearGradient id="echoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3366" />
      <stop offset="45%" stop-color="#ff5e3a" />
      <stop offset="100%" stop-color="#ff9944" />
    </linearGradient>

    <!-- Warm Amber Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff5e3a" />
      <stop offset="60%" stop-color="#ff8a65" />
      <stop offset="100%" stop-color="#ffc371" />
    </linearGradient>

    <!-- Central Orb Gradient -->
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#ffe4dc" />
      <stop offset="80%" stop-color="#ff5e3a" />
      <stop offset="100%" stop-color="#ff3366" />
    </radialGradient>

    <!-- Ambient Background Radial Glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255, 94, 58, 0.35)" />
      <stop offset="45%" stop-color="rgba(255, 60, 90, 0.15)" />
      <stop offset="80%" stop-color="rgba(255, 94, 58, 0.03)" />
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0)" />
    </radialGradient>

    <!-- Drop Shadow Filter for Waves -->
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#ff5e3a" flood-opacity="0.45" />
    </filter>

    <filter id="coreFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="#ff5e3a" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Base Icon Squircle Background -->
  <rect x="0" y="0" width="1024" height="1024" rx="228" fill="url(#bgGrad)" />
  <rect x="2" y="2" width="1020" height="1020" rx="226" fill="none" stroke="url(#borderGrad)" stroke-width="4" opacity="0.7" />

  <!-- Ambient Glow Center -->
  <circle cx="512" cy="512" r="380" fill="url(#ambientGlow)" />

  <!-- Center Bridge & Waves Group -->
  <g filter="url(#glowFilter)">
    <!-- Outer Wave Arcs (Distance) -->
    <path d="M 270 320 A 280 280 0 0 0 270 704" fill="none" stroke="url(#accentGrad)" stroke-width="26" stroke-linecap="round" opacity="0.7" />
    <path d="M 754 320 A 280 280 0 0 1 754 704" fill="none" stroke="url(#accentGrad)" stroke-width="26" stroke-linecap="round" opacity="0.7" />

    <!-- Mid Wave Arcs (Harmonic) -->
    <path d="M 350 380 A 190 190 0 0 0 350 644" fill="none" stroke="url(#echoGrad)" stroke-width="32" stroke-linecap="round" />
    <path d="M 674 380 A 190 190 0 0 1 674 644" fill="none" stroke="url(#echoGrad)" stroke-width="32" stroke-linecap="round" />

    <!-- Inner Wave Arcs (Core Pulse) -->
    <path d="M 430 440 A 105 105 0 0 0 430 584" fill="none" stroke="url(#echoGrad)" stroke-width="34" stroke-linecap="round" />
    <path d="M 594 440 A 105 105 0 0 1 594 584" fill="none" stroke="url(#echoGrad)" stroke-width="34" stroke-linecap="round" />

    <!-- Connecting Bridge Ring Orbit -->
    <circle cx="512" cy="512" r="62" fill="none" stroke="url(#echoGrad)" stroke-width="8" opacity="0.6" stroke-dasharray="16 12" />

    <!-- Center Pulse Core -->
    <circle cx="512" cy="512" r="42" fill="url(#coreGlow)" filter="url(#coreFilter)" />
    <circle cx="512" cy="512" r="22" fill="#ffffff" />
  </g>
</svg>`;

const adaptiveSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="echoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3366" />
      <stop offset="45%" stop-color="#ff5e3a" />
      <stop offset="100%" stop-color="#ff9944" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff5e3a" />
      <stop offset="60%" stop-color="#ff8a65" />
      <stop offset="100%" stop-color="#ffc371" />
    </linearGradient>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#ffe4dc" />
      <stop offset="80%" stop-color="#ff5e3a" />
      <stop offset="100%" stop-color="#ff3366" />
    </radialGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255, 94, 58, 0.4)" />
      <stop offset="45%" stop-color="rgba(255, 60, 90, 0.15)" />
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0)" />
    </radialGradient>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#ff5e3a" flood-opacity="0.5" />
    </filter>
  </defs>

  <circle cx="512" cy="512" r="320" fill="url(#ambientGlow)" />

  <g filter="url(#glowFilter)">
    <path d="M 290 340 A 240 240 0 0 0 290 684" fill="none" stroke="url(#accentGrad)" stroke-width="24" stroke-linecap="round" opacity="0.75" />
    <path d="M 734 340 A 240 240 0 0 1 734 684" fill="none" stroke="url(#accentGrad)" stroke-width="24" stroke-linecap="round" opacity="0.75" />

    <path d="M 365 395 A 165 165 0 0 0 365 629" fill="none" stroke="url(#echoGrad)" stroke-width="28" stroke-linecap="round" />
    <path d="M 659 395 A 165 165 0 0 1 659 629" fill="none" stroke="url(#echoGrad)" stroke-width="28" stroke-linecap="round" />

    <path d="M 440 450 A 90 90 0 0 0 440 574" fill="none" stroke="url(#echoGrad)" stroke-width="30" stroke-linecap="round" />
    <path d="M 584 450 A 90 90 0 0 1 584 574" fill="none" stroke="url(#echoGrad)" stroke-width="30" stroke-linecap="round" />

    <circle cx="512" cy="512" r="54" fill="none" stroke="url(#echoGrad)" stroke-width="7" opacity="0.6" stroke-dasharray="14 10" />
    <circle cx="512" cy="512" r="36" fill="url(#coreGlow)" />
    <circle cx="512" cy="512" r="18" fill="#ffffff" />
  </g>
</svg>`;

function createIco(pngImages) {
  const count = pngImages.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (const img of pngImages) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngImages.map((p) => p.buffer)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  async function renderSvgToPng(svg, width, height) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { width: 100vw; height: 100vh; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
            svg { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          ${svg}
        </body>
      </html>
    `;

    win.setSize(width, height);
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((r) => setTimeout(r, 400));
    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });
    return image.toPNG();
  }

  const rootDir = path.resolve(__dirname, '..');
  const mobileAssetsDir = path.join(rootDir, 'apps', 'mobile', 'assets');
  const desktopPublicDir = path.join(rootDir, 'apps', 'desktop', 'public');
  const desktopBuildDir = path.join(rootDir, 'apps', 'desktop', 'build');

  if (!fs.existsSync(mobileAssetsDir)) fs.mkdirSync(mobileAssetsDir, { recursive: true });
  if (!fs.existsSync(desktopPublicDir)) fs.mkdirSync(desktopPublicDir, { recursive: true });
  if (!fs.existsSync(desktopBuildDir)) fs.mkdirSync(desktopBuildDir, { recursive: true });

  // Clean up any accidentally created scripts/apps folder
  const accidentalDir = path.join(__dirname, 'apps');
  if (fs.existsSync(accidentalDir)) {
    fs.rmSync(accidentalDir, { recursive: true, force: true });
  }

  console.log('Rendering 1024x1024 icons...');
  const icon1024 = await renderSvgToPng(svgContent, 1024, 1024);
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.png'), icon1024);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon.png'), icon1024);
  fs.writeFileSync(path.join(desktopBuildDir, 'icon.png'), icon1024);

  console.log('Rendering adaptive & splash icons...');
  const adaptive1024 = await renderSvgToPng(adaptiveSvgContent, 1024, 1024);
  fs.writeFileSync(path.join(mobileAssetsDir, 'adaptive-icon.png'), adaptive1024);

  const splash512 = await renderSvgToPng(adaptiveSvgContent, 512, 512);
  fs.writeFileSync(path.join(mobileAssetsDir, 'splash-icon.png'), splash512);

  console.log('Rendering desktop & web sizes...');
  const icon512 = await renderSvgToPng(svgContent, 512, 512);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon-512.png'), icon512);

  const icon256 = await renderSvgToPng(svgContent, 256, 256);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon-256.png'), icon256);

  const icon64 = await renderSvgToPng(svgContent, 64, 64);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon-64.png'), icon64);

  const icon48 = await renderSvgToPng(svgContent, 48, 48);
  fs.writeFileSync(path.join(mobileAssetsDir, 'favicon.png'), icon48);
  fs.writeFileSync(path.join(desktopPublicDir, 'favicon.png'), icon48);

  const icon32 = await renderSvgToPng(svgContent, 32, 32);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon-32.png'), icon32);

  const icon16 = await renderSvgToPng(svgContent, 16, 16);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon-16.png'), icon16);

  console.log('Creating Windows multi-size .ico files...');
  const icoBuffer = createIco([
    { width: 256, height: 256, buffer: icon256 },
    { width: 64, height: 64, buffer: icon64 },
    { width: 48, height: 48, buffer: icon48 },
    { width: 32, height: 32, buffer: icon32 },
    { width: 16, height: 16, buffer: icon16 },
  ]);
  fs.writeFileSync(path.join(desktopPublicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(desktopPublicDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(desktopBuildDir, 'icon.ico'), icoBuffer);

  fs.writeFileSync(path.join(desktopPublicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.svg'), svgContent);

  console.log('All icons generated and written successfully!');
  app.quit();
});
