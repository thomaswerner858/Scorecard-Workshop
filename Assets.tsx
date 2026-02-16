export const BILENDO_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" preserveAspectRatio="xMinYMid meet">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:%231d63d3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:%231d4686;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:%236eb5ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:%233a8dff;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
      <feOffset dx="4" dy="4" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- Logo Icon -->
  <g filter="url(%23shadow)" transform="translate(40, 30)">
    <!-- Linker Flügel (zeigt nach rechts) -->
    <path d="M0,20 L220,120 L0,220 Z" fill="url(%23grad1)" />
    <!-- Rechter Flügel (zeigt nach links, überlappt) -->
    <path d="M260,20 L40,120 L260,220 Z" fill="url(%23grad2)" opacity="0.85" style="mix-blend-mode: multiply;" />
  </g>
  <!-- Typography -->
  <g transform="translate(360, 165)">
    <text font-family="Arial, sans-serif" font-size="140" font-weight="900" fill="%231d4686" letter-spacing="-4">Bilendo</text>
    <text y="75" x="5" font-family="Arial, sans-serif" font-size="52" font-weight="500" fill="%231d4686" opacity="0.85">A/R Automation Platform</text>
  </g>
</svg>`;