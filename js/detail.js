/**
 * GetAli V3.1 - Detail Page
 * Dynamic apps/games/mods detail renderer
 * Supports modified apps with modUrl, modInfo, modBy fields
 * @version 3.1.0
 */

class DetailPage {
  constructor() {
    this.itemData = null;
    this.itemType = 'games';
    this.downloadManager = null;
    this.placeholderColors = this.generateColorPalette();
  }

  async init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    this.itemType = params.get('type') || 'games';

    if (!id) {
      this.showError();
      return;
    }

    try {
      await this.loadData(id);
      this.downloadManager = new DownloadManager();
      this.render();
      this.setupEvents();
      this.setupHeaderScroll();
    } catch (error) {
      console.error('Detail page error:', error);
      this.showError();
    }
  }

  async loadData(id) {
    const jsonFile = this.getDataUrlForType(this.itemType);
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error('Failed to load data');
    const data = await response.json();

    const categories = data.categories || [];
    for (const category of categories) {
      const items = category.games || category.apps || category.mods || [];
      const found = items.find(item => item.id === id);
      if (found) {
        this.itemData = found;
        this.categoryTitle = category.title;
        return;
      }
    }
    throw new Error('Item not found');
  }

  getDataUrlForType(type) {
    switch (type) {
      case 'apps': return 'data/apps.json';
      case 'mods': return 'data/mods.json';
      default: return 'data/games.json';
    }
  }

  getBackUrl() {
    switch (this.itemType) {
      case 'apps': return 'apps.html';
      case 'mods': return 'mods.html';
      default: return 'games.html';
    }
  }

  getBackLabel() {
    switch (this.itemType) {
      case 'apps': return 'التطبيقات';
      case 'mods': return 'التطبيقات المعدّلة';
      default: return 'الألعاب';
    }
  }

  generateColorPalette() {
    return [
      ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
      ['#ff9a9e', '#fecfef'], ['#ffecd2', '#fcb69f'], ['#8e2de2', '#4a00e0'],
      ['#1e3c72', '#2a5298'], ['#134e5e', '#71b280'], ['#c33764', '#1d2671']
    ];
  }

  generatePlaceholder(name, index = 0) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = this.placeholderColors[index % this.placeholderColors.length];
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

  render() {
    const loadingEl = document.getElementById('detailLoading');
    const contentEl = document.getElementById('detailContent');
    const errorEl = document.getElementById('detailError');

    if (!this.itemData) {
      loadingEl.style.display = 'none';
      errorEl.style.display = '';
      return;
    }

    const item = this.itemData;
    const isMod = this.itemType === 'mods';
    const pageTypeLabel = isMod ? 'معدّل' : (this.itemType === 'apps' ? 'تطبيق' : 'لعبة');

    document.title = `${item.name} | GetAli V3.1`;
    document.getElementById('pageTitle').textContent = `${item.name} | GetAli V3.1`;

    const placeholder = this.generatePlaceholder(item.name, 0);
    const stars = this.renderStars(item.rating);
    const featuresHtml = (item.features || []).map(f => `<li><i class="bi bi-check-lg"></i>${f}</li>`).join('');
    const requirementsHtml = (item.requirements || []).map(r => `<li><i class="bi bi-clock-history"></i>${r}</li>`).join('');
    const changelogHtml = (item.changelog || []).map(c => `<li><span class="changelog-dot"></span>${c}</li>`).join('');

    // Mod info section (only for mods)
    const modInfoHtml = isMod && item.modInfo ? `
      <div class="detail-section mod-info-section">
        <h2 class="detail-section-title">
          <i class="bi bi-pencil-square"></i>
          ما تم تعديله
        </h2>
        <ul class="detail-mod-list">
          ${item.modInfo.map(info => `<li><span class="mod-check"><i class="bi bi-check-lg"></i></span>${info}</li>`).join('')}
        </ul>
        ${item.modBy ? `
        <div class="mod-by">
          <div class="mod-by-label">تم التعديل بواسطة</div>
          <div class="mod-by-value">
            <i class="bi bi-person-circle"></i>
            ${item.modBy}
          </div>
        </div>
        ` : ''}
      </div>
    ` : '';

    // Mod version badge (only for mods)
    const modVersionBadge = isMod && item.modVersion ? `
      <span class="detail-version mod-version-badge"><i class="bi bi-git"></i> تعديل ${item.modVersion}</span>
    ` : '';

    // Screenshots
    const screenshotsHtml = (item.screenshots || []).map((src, i) => `
      <div class="screenshot-item">
        <img src="${src}" alt="Screenshot ${i + 1}" loading="lazy"
             onerror="this.parentElement.style.display='none'"
             onclick="detailPage.openScreenshot('${src}')">
      </div>
    `).join('');

    contentEl.innerHTML = `
      <!-- Back Link -->
      <div class="detail-back">
        <a href="${this.getBackUrl()}" class="back-link">
          <i class="bi bi-chevron-left"></i>
          العودة لقائمة ${this.getBackLabel()}
        </a>
        <span class="detail-category ${isMod ? 'mod-category' : ''}">${this.categoryTitle}</span>
      </div>

      <!-- Hero Section -->
      <div class="detail-hero">
        <div class="detail-hero-bg" style="background-image:url('${item.image}')">
          <div class="detail-hero-overlay"></div>
        </div>
        <div class="detail-hero-content">
          <div class="detail-icon">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='${placeholder}'">
          </div>
          <div class="detail-hero-info">
            <h1 class="detail-title">${item.name}</h1>
            <div class="detail-meta">
              <span class="detail-developer"><i class="bi bi-code-square"></i> ${item.developer}</span>
              <span class="detail-version"><i class="bi bi-tag"></i> v${item.version}</span>
              ${modVersionBadge}
              <span class="detail-age"><i class="bi bi-person"></i> ${item.ageRating || '3+'}</span>
            </div>
            <div class="detail-rating-bar">
              <div class="detail-stars">${stars}<span class="rating-number">${item.rating}</span></div>
              <div class="detail-downloads"><i class="bi bi-download"></i> ${item.downloads || '1M+'} تحميل</div>
              <div class="detail-size"><i class="bi bi-hdd"></i> ${item.size}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Download CTA -->
      <div class="detail-download-cta ${isMod ? 'mod-download-cta' : ''}">
        <div class="download-buttons-row">
          <button class="btn btn-primary btn-lg download-detail-btn ${isMod ? 'btn-mod' : ''}" data-item-id="${item.id}" data-item-type="${this.itemType}">
            <i class="bi bi-download" style="font-size: 1.2em;"></i>
            ${isMod ? 'تحميل النسخة المعدّلة' : 'تحميل الآن'}
          </button>

          ${isMod && item.modMenu ? `
          <button class="btn btn-modmenu btn-lg modmenu-btn" data-url="${item.modMenu}">
            <i class="bi bi-menu-button-wide" style="font-size: 1.2em;"></i>
            تحميل Mod Menu
          </button>
          ` : ''}
        </div>

        <div class="detail-download-info">
          <span><i class="bi bi-tag"></i> الإصدار ${item.version}</span>
          ${item.modVersion ? `<span class="sep">|</span><span><i class="bi bi-git"></i> تعديل ${item.modVersion}</span>` : ''}
          <span class="sep">|</span>
          <span><i class="bi bi-hdd"></i> ${item.size}</span>
          <span class="sep">|</span>
          <span><i class="bi bi-shield-check"></i> ${isMod ? 'نسخة معدّلة قانونية' : 'APK آمن'}</span>
        </div>
      </div>

      <!-- Screenshots -->
      ${item.screenshots && item.screenshots.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-images"></i> لقطات الشاشة</h2>
        <div class="screenshots-grid">
          ${screenshotsHtml}
        </div>
      </div>` : ''}

      <!-- Mod Info (only for mods) -->
      ${modInfoHtml}

      <!-- Description -->
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-info-circle"></i> الوصف</h2>
        <div class="detail-description">
          <p>${item.description}</p>
        </div>
      </div>

      <!-- Features -->
      ${item.features && item.features.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-star-fill"></i> المميزات</h2>
        <ul class="detail-features-list">
          ${featuresHtml}
        </ul>
      </div>` : ''}

      <!-- Requirements -->
      ${item.requirements && item.requirements.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-cpu"></i> متطلبات النظام</h2>
        <ul class="detail-requirements-list">
          ${requirementsHtml}
        </ul>
      </div>` : ''}

      <!-- Changelog -->
      ${item.changelog && item.changelog.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-arrow-repeat"></i> سجل التحديثات</h2>
        <ul class="detail-changelog-list">
          ${changelogHtml}
        </ul>
      </div>` : ''}

      <!-- App Info Grid -->
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="bi bi-clipboard-data"></i> معلومات ${pageTypeLabel}</h2>
        <div class="detail-info-grid">
          <div class="info-card"><div class="info-label"><i class="bi bi-code-square"></i> المطور</div><div class="info-value">${item.developer}</div></div>
          <div class="info-card"><div class="info-label"><i class="bi bi-tag"></i> الإصدار</div><div class="info-value">${item.version}</div></div>
          ${item.modVersion ? `<div class="info-card mod-info-card"><div class="info-label"><i class="bi bi-git"></i> إصدار التعديل</div><div class="info-value">${item.modVersion}</div></div>` : ''}
          <div class="info-card"><div class="info-label"><i class="bi bi-hdd"></i> الحجم</div><div class="info-value">${item.size}</div></div>
          <div class="info-card"><div class="info-label"><i class="bi bi-star"></i> التقييم</div><div class="info-value">${item.rating} <span class="star-small"><i class="bi bi-star-fill" style="font-size: 12px;"></i></span></div></div>
          <div class="info-card"><div class="info-label"><i class="bi bi-download"></i> التحميلات</div><div class="info-value">${item.downloads || '1M+'}</div></div>
          <div class="info-card"><div class="info-label"><i class="bi bi-person"></i> الفئة العمرية</div><div class="info-value">${item.ageRating || '3+'}</div></div>
          ${item.modBy ? `<div class="info-card mod-info-card"><div class="info-label"><i class="bi bi-person-circle"></i> المعدّل</div><div class="info-value">${item.modBy}</div></div>` : ''}
        </div>
      </div>

      <!-- Lightbox -->
      <div class="lightbox" id="lightbox" onclick="detailPage.closeScreenshot()">
        <button class="lightbox-close"><i class="bi bi-x-lg"></i></button>
        <img id="lightboxImg" src="" alt="Screenshot">
      </div>
    `;

    loadingEl.style.display = 'none';
    contentEl.style.display = '';
  }

  renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        html += '<span class="star filled"><i class="bi bi-star-fill"></i></span>';
      } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
        html += '<span class="star half"><i class="bi bi-star-half"></i></span>';
      } else {
        html += '<span class="star empty"><i class="bi bi-star"></i></span>';
      }
    }
    return html;
  }

  openScreenshot(src) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeScreenshot() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  }

  handleDownload() {
    if (!this.downloadManager || !this.itemData) return;
    this.downloadManager.startDownload(this.itemData);
  }

  setupEvents() {
    // 1. زر التحميل الرئيسي
    const dlBtn = document.querySelector('.download-detail-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => this.handleDownload());
    }

    // 2. Event Delegation — أي زر يحمل data-url
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-url]');
      if (!btn) return;

      e.preventDefault();
      const url = btn.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });

    // 3. البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const q = encodeURIComponent(searchInput.value);
          window.location.href = `index.html?search=${q}`;
        }
      });
    }
  }

  setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  showError() {
    document.getElementById('detailLoading').style.display = 'none';
    document.getElementById('detailContent').style.display = 'none';
    document.getElementById('detailError').style.display = '';
  }
}

const detailPage = new DetailPage();
document.addEventListener('DOMContentLoaded', () => detailPage.init());