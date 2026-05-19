/* AutoMart — Icon helper (vanilla JS).
   Usage: <span data-icon="search" data-size="20"></span>
   Auto-mounts on DOMContentLoaded. */

(function () {
  const PATHS = {
    search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home:     '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    heart:    '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    'heart-fill': '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor"/>',
    chat:     '<path d="M4 5h16v11H8l-4 4z"/>',
    user:     '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    minus:    '<path d="M5 12h14"/>',
    'arrow-r':'<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-l':'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'chev-r': '<path d="m9 6 6 6-6 6"/>',
    'chev-d': '<path d="m6 9 6 6 6-6"/>',
    'chev-u': '<path d="m6 15 6-6 6 6"/>',
    'chev-l': '<path d="m15 6-6 6 6 6"/>',
    close:    '<path d="M6 6l12 12M18 6 6 18"/>',
    sparkle:  '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
    shield:   '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    check:    '<path d="M5 12l4 4 10-10"/>',
    filter:   '<path d="M4 5h16M7 12h10M10 19h4"/>',
    sort:     '<path d="M7 4v16M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4"/>',
    gauge:    '<path d="M5 19a8 8 0 1 1 14 0"/><path d="m12 13 4-3"/>',
    fuel:     '<rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V7l-2-2"/>',
    cog:      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    pin:      '<path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    cam:      '<path d="M3 8h4l2-2h6l2 2h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
    mic:      '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    send:     '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    eye:      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off':'<path d="M3 3l18 18M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.6 4.5M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.6-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    'bookmark-fill': '<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>',
    rupee:    '<path d="M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5h-3l9 6"/>',
    verified: '<path d="m4 12 2-3-1-3 3-1 2-3 2 3 3 1-1 3 2 3-2 3 1 3-3 1-2 3-2-3-3-1 1-3z"/><path d="m9 12 2 2 4-5"/>',
    car:      '<path d="M5 17h14M5 17l2-6h10l2 6M5 17v3M19 17v3M8 11l1-2h6l1 2"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    doc:      '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
    flame:    '<path d="M12 3c0 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 1-3-1-6-1-9z"/>',
    tag:      '<path d="M12 3 3 12l9 9 9-9V3z"/><circle cx="9" cy="9" r="1.5"/>',
    phone:    '<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    spark:    '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    bell:     '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    grid:     '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list:     '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    menu:     '<path d="M4 6h16M4 12h16M4 18h16"/>',
    flag:     '<path d="M5 21V4M5 5h12l-2 4 2 4H5"/>',
    'arrow-up-r': '<path d="M7 17 17 7M9 7h8v8"/>',
    google:   '<path d="M21.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.4c-.2 1.3-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.5z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.5C4.7 19.7 8.1 22 12 22z" fill="#34A853" stroke="none"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.2 1.1 4.5L6.4 14z" fill="#FBBC04" stroke="none"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.5l3.3 2.5c.8-2.4 3-4.1 5.6-4.1z" fill="#EA4335" stroke="none"/>',
    'logo-am': '<rect x="2" y="2" width="20" height="20" rx="6" fill="#2563eb"/><path d="M7 16 12 6l5 10M9 13h6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  };

  function renderIcon(name, opts = {}) {
    const inner = PATHS[name] || PATHS.car;
    const size = opts.size || 20;
    const stroke = opts.stroke || 1.75;
    const color = opts.color || 'currentColor';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  function mount(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      if (el.dataset.iconMounted) return;
      const name = el.getAttribute('data-icon');
      const size = parseFloat(el.getAttribute('data-size')) || 20;
      const stroke = parseFloat(el.getAttribute('data-stroke')) || 1.75;
      el.innerHTML = renderIcon(name, { size, stroke });
      el.style.display = el.style.display || 'inline-flex';
      el.style.alignItems = 'center';
      el.dataset.iconMounted = '1';
    });
  }

  window.AMIcon = { render: renderIcon, mount };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount());
  } else {
    mount();
  }
})();
