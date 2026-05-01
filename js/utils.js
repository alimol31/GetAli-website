// js/utils.js
const Utils = {
  generateColorPalette() {
    return [
      ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
      ['#ff9a9e', '#fecfef'], ['#ffecd2', '#fcb69f'], ['#8e2de2', '#4a00e0'],
      ['#1e3c72', '#2a5298'], ['#134e5e', '#71b280'], ['#c33764', '#1d2671']
    ];
  },

  generatePlaceholder(name, index) {
    const palette = this.generateColorPalette();
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = palette[index % palette.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
            font-family="Arial,sans-serif" font-size="180" font-weight="800" fill="white" opacity="0.9">${initials}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
};