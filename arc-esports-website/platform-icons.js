/** Detect social / streaming platform from URL and return icon + label */
const PLATFORM_RULES = [
  { id: 'x', label: 'X', match: /(?:^|\.)x\.com|twitter\.com/i, color: '#fff' },
  { id: 'instagram', label: 'Instagram', match: /instagram\.com/i, color: '#E4405F' },
  { id: 'youtube', label: 'YouTube', match: /(?:youtube\.com|youtu\.be)/i, color: '#FF0000' },
  { id: 'twitch', label: 'Twitch', match: /twitch\.tv/i, color: '#9146FF' },
  { id: 'discord', label: 'Discord', match: /discord\.(?:gg|com)/i, color: '#5865F2' },
  { id: 'tiktok', label: 'TikTok', match: /tiktok\.com/i, color: '#fff' },
  { id: 'telegram', label: 'Telegram', match: /(?:t\.me|telegram\.(?:org|me))/i, color: '#26A5E4' },
  { id: 'snapchat', label: 'Snapchat', match: /snapchat\.com/i, color: '#FFFC00' },
  { id: 'facebook', label: 'Facebook', match: /(?:facebook\.com|fb\.com)/i, color: '#1877F2' },
  { id: 'kick', label: 'Kick', match: /kick\.com/i, color: '#53FC18' },
  { id: 'whatsapp', label: 'WhatsApp', match: /(?:wa\.me|whatsapp\.com)/i, color: '#25D366' },
  { id: 'linkedin', label: 'LinkedIn', match: /linkedin\.com/i, color: '#0A66C2' },
];

export function normalizeUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function detectPlatform(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return { id: 'link', label: 'رابط', color: '#FF8C00' };
  for (const rule of PLATFORM_RULES) {
    if (rule.match.test(normalized)) return rule;
  }
  return { id: 'link', label: 'رابط', color: '#FF8C00' };
}

export function platformIconSvg(platformId) {
  const icons = {
    x: '<path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.8L5.2 22H2.1l7.3-8.4L1 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.7L7.1 3.9H5.3L17.7 20z"/>',
    instagram:
      '<path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .5.5.8.9 1 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.5.5-.9.8-1.5 1-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.5-.5-.8-.9-1-1.5-.2-.4-.4-1.1-.4-2.3-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.5-.5.9-.8 1.5-1 .4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1 .0-1.6.2-2 .3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.4-.3 1-.3 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1 .2 1.6.3 2 .2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.1 1 .3 2 .3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1 0 1.6-.2 2-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.4.3-1 .3-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1-.2-1.6-.3-2-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.4-.1-1-.3-2-.3-1.2-.1-1.6-.1-4.7-.1zm0 3.4a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2zm0 1.8a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm6.2-2.2a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0z"/>',
    youtube:
      '<path fill="currentColor" d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C17.8 5 12 5 12 5s-5.8 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9C2 9.1 2 12 2 12s0 2.9.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.9.3 7.7.3 7.7.3s5.8 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9c.4-1.9.4-4.8.4-4.8s0-2.9-.4-4.8zM10 15.5V8.5l6.2 3.5L10 15.5z"/>',
    twitch:
      '<path fill="currentColor" d="M4 3 2 6.5v12H6V22h3.5l3-3H14l6-6V3H4zm15 9-3 3h-3l-3 3v-3H6V5h13v7zm-4-5h2v5h-2V7zm-5 0h2v5H10V7z"/>',
    discord:
      '<path fill="currentColor" d="M18.9 5.5A16 16 0 0 0 14.6 4c-.2.3-.4.7-.6 1.1a14.7 14.7 0 0 0-4 0C9.8 4.7 9.6 4.3 9.4 4a16 16 0 0 0-4.3 1.5C3.5 9.2 2.7 12.8 3.1 16.3a16.2 16.2 0 0 0 4.9 2.5c.4-.5.7-1.1 1-1.7-.5-.2-1-.5-1.5-.8.1-.1.3-.2.4-.3 2.9 1.4 6.1 1.4 9 0l.4.3c-.5.3-1 .6-1.5.8.3.6.6 1.2 1 1.7a16.2 16.2 0 0 0 4.9-2.5c.5-4.1-.8-7.7-2.1-10.8zM8.5 13.8c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8zm7 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8z"/>',
    tiktok:
      '<path fill="currentColor" d="M16.6 5.8a5.5 5.5 0 0 0 3.4-3.4H15v11.8a3.4 3.4 0 1 1-3.4-3.4c.3 0 .7.1 1 .2V9.8a6.8 6.8 0 1 0 5.8 6.7V9.2a7.2 7.2 0 0 0 4.2 1.4V7.2a5.5 5.5 0 0 1-2.4-.6z"/>',
    telegram:
      '<path fill="currentColor" d="M21.9 4.6 2.8 11.5c-1.2.5-1.2 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.6.5.8 1 .8.4 0 .6-.2.9-.5l2.7-2.6 5.6 4.1c1 .6 1.7.3 1.9-1l3.3-15.6c.3-1.3-.5-1.9-1.4-1.5zM8.7 13.8l9.8-6.1c.4-.3.8-.1.5.2l-8.3 7.5-.3 3.5-1.7-5.1z"/>',
    snapchat:
      '<path fill="currentColor" d="M12 2c2.8 0 5 2.2 5 5.1 0 .8-.2 1.5-.5 2.2 2.1.5 3.7 1.2 4.8 2 .6.5.4 1.2-.3 1.4-1.1.4-2.2.7-3.3 1 .3.8.5 1.6.5 2.5 0 .8-.6 1.3-1.4 1.1-1.4-.4-2.8-.9-4.1-1.5-.5 2.2-1.2 3.5-2.2 3.5s-1.7-1.3-2.2-3.5c-1.3.6-2.7 1.1-4.1 1.5-.8.2-1.4-.3-1.4-1.1 0-.9.2-1.7.5-2.5-1.1-.3-2.2-.6-3.3-1-.7-.2-.9-.9-.3-1.4 1.1-.8 2.7-1.5 4.8-2-.3-.7-.5-1.4-.5-2.2C7 4.2 9.2 2 12 2z"/>',
    facebook:
      '<path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H8.2V12h2.2V9.8c0-2.2 1.3-3.4 3.3-3.4.9 0 1.9.2 1.9.2v2.1h-1.1c-1.1 0-1.4.7-1.4 1.4V12h2.4l-.4 2.9h-2v7A10 10 0 0 0 22 12z"/>',
    kick:
      '<path fill="currentColor" d="M3 3h6.5L15 9.5V3H21v18h-6.5L9 14.5V21H3V3z"/>',
    whatsapp:
      '<path fill="currentColor" d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .2-1.6-.2-.4-.3-1.5-.6-2.6-1.8-1-1-1.6-2.2-1.8-2.6-.2-.4 0-.9.2-1.2.2-.2.4-.6.6-.8.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7 0-.2-.5-1.2-.7-1.6-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3z"/>',
    linkedin:
      '<path fill="currentColor" d="M6.5 8.7H2.9V21h3.6V8.7zM4.7 2a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2zM8.7 8.7H12v1.8h.1c.5-.9 1.7-1.8 3.5-1.8 3.7 0 4.4 2.4 4.4 5.6V21h-3.8v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21H8.7V8.7z"/>',
    link: '<path fill="currentColor" d="M10.6 13.4 9.2 12l8.5-8.5a3.5 3.5 0 0 1 5 5l-2.1 2.1-1.4-1.4 2.1-2.1a1.7 1.7 0 0 0-2.4-2.4l-8.5 8.5zm2.8 2.8-1.4 1.4-2.1-2.1-1.4 1.4 2.1 2.1a3.5 3.5 0 0 1-5 5l-2.1-2.1 1.4-1.4 2.1 2.1a1.7 1.7 0 0 0 2.4-2.4z"/>',
  };
  return icons[platformId] || icons.link;
}

export function createPlatformLinkElement(url, options = {}) {
  const href = normalizeUrl(url);
  if (!href) return null;
  const platform = detectPlatform(href);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = options.className || 'platform-link';
  anchor.setAttribute('aria-label', platform.label);
  anchor.title = platform.label;
  anchor.style.setProperty('--platform-color', platform.color);
  anchor.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${platformIconSvg(platform.id)}</svg>`;
  return anchor;
}
