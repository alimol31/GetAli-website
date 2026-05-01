/**
 * GetAli V2.5 - Detail Page
 * Dynamic apps/games detail renderer
 * @version 2.5.0
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
    const jsonFile = this.itemType === 'apps' ? 'data/apps.json' : 'data/games.json';
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error('Failed to load data');
    const data = await response.json();

    const categories = data.categories || [];
    for (const category of categories) {
      const items = category.games || category.apps || [];
      const found = items.find(item => item.id === id);
      if (found) {
        this.itemData = found;
        this.categoryTitle = category.title;
        return;
      }
    }
    throw new Error('Item not found');
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
    document.title = `${item.name} | GetAli V2.5`;
    document.getElementById('pageTitle').textContent = `${item.name} | GetAli V2.5`;

    const placeholder = this.generatePlaceholder(item.name, 0);
    const stars = this.renderStars(item.rating);
    const featuresHtml = (item.features || []).map(f => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('');
    const requirementsHtml = (item.requirements || []).map(r => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${r}</li>`).join('');
    const changelogHtml = (item.changelog || []).map(c => `<li><span class="changelog-dot"></span>${c}</li>`).join('');

    // Screenshot placeholders
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
        <a href="${this.itemType === 'apps' ? 'apps.html' : 'index.html'}" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          العودة لقائمة ${this.itemType === 'apps' ? 'التطبيقات' : 'الألعاب'}
        </a>
        <span class="detail-category">${this.categoryTitle}</span>
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
              <span class="detail-developer"><i class="fas fa-code"></i> ${item.developer}</span>
              <span class="detail-version"><i class="fas fa-tag"></i> v${item.version}</span>
              <span class="detail-age"><i class="fas fa-user"></i> ${item.ageRating || '3+'}</span>
            </div>
            <div class="detail-rating-bar">
              <div class="detail-stars">${stars}<span class="rating-number">${item.rating}</span></div>
              <div class="detail-downloads"><i class="fas fa-download"></i> ${item.downloads || '1M+'} تحميل</div>
              <div class="detail-size"><i class="fas fa-hdd"></i> ${item.size}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Download CTA -->
      <div class="detail-download-cta">
        <button class="btn btn-primary btn-lg download-detail-btn" data-item-id="${item.id}" data-item-type="${this.itemType}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          تحميل الآن
        </button>
        <div class="detail-download-info">
          <span>الإصدار ${item.version}</span>
          <span class="sep">|</span>
          <span>${item.size}</span>
          <span class="sep">|</span>
          <span>APK آمن</span>
        </div>
      </div>

      <!-- Screenshots -->
      ${item.screenshots && item.screenshots.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-images"></i> لقطات الشاشة</h2>
        <div class="screenshots-grid">
          ${screenshotsHtml}
        </div>
      </div>` : ''}

      <!-- Description -->
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-info-circle"></i> الوصف</h2>
        <div class="detail-description">
          <p>${item.description}</p>
        </div>
      </div>

      <!-- Features -->
      ${item.features && item.features.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-star"></i> المميزات</h2>
        <ul class="detail-features-list">
          ${featuresHtml}
        </ul>
      </div>` : ''}

      <!-- Requirements -->
      ${item.requirements && item.requirements.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-microchip"></i> متطلبات النظام</h2>
        <ul class="detail-requirements-list">
          ${requirementsHtml}
        </ul>
      </div>` : ''}

      <!-- Changelog -->
      ${item.changelog && item.changelog.length > 0 ? `
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-sync-alt"></i> سجل التحديثات</h2>
        <ul class="detail-changelog-list">
          ${changelogHtml}
        </ul>
      </div>` : ''}

      <!-- App Info Grid -->
      <div class="detail-section">
        <h2 class="detail-section-title"><i class="fas fa-clipboard-list"></i> معلومات التطبيق</h2>
        <div class="detail-info-grid">
          <div class="info-card"><div class="info-label">المطور</div><div class="info-value">${item.developer}</div></div>
          <div class="info-card"><div class="info-label">الإصدار</div><div class="info-value">${item.version}</div></div>
          <div class="info-card"><div class="info-label">الحجم</div><div class="info-value">${item.size}</div></div>
          <div class="info-card"><div class="info-label">التقييم</div><div class="info-value">${item.rating} <span class="star-small">★</span></div></div>
          <div class="info-card"><div class="info-label">التحميلات</div><div class="info-value">${item.downloads || '1M+'}</div></div>
          <div class="info-card"><div class="info-label">الفئة العمرية</div><div class="info-value">${item.ageRating || '3+'}</div></div>
        </div>
      </div>

      <!-- Lightbox -->
      <div class="lightbox" id="lightbox" onclick="detailPage.closeScreenshot()">
        <button class="lightbox-close">&times;</button>
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
        html += '<span class="star filled">★</span>';
      } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star empty">☆</span>';
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
    // Download button
    const dlBtn = document.querySelector('.download-detail-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => this.handleDownload());
    }

    // Search
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
