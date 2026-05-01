class BaseStore {
  /**
   * @param {Object} config - إعدادات التخصيص
   * @param {string} config.dataUrl - مسار ملف JSON
   * @param {string} config.type - نوع المحتوى ('apps' | 'games')
   * @param {string} config.featuredBadge - نص شارة المميز
   * @param {string} config.itemsWord - جمع الكلمة للعرض (مثلاً: 'تطبيقات' / 'ألعاب')
   * @param {string} config.itemWord - مفرد الكلمة (مثلاً: 'تطبيق' / 'لعبة')
   */
  constructor(config) {
    this.config = config;
    this.data = null;
    this.downloadManager = null;
    this.sectionsContainer = document.getElementById('sectionsContainer');
    this.searchInput = document.getElementById('searchInput');
    this.placeholderColors = this.generateColorPalette();
  }

  async init() {
    try {
      this.showSkeleton();
      await this.loadData();
      this.downloadManager = new DownloadManager();
      this.renderAll();
      this.setupEvents();
      this.setupHeaderScroll();
    } catch (error) {
      console.error(`Failed to initialize ${this.config.type} store:`, error);
      this.showError('تعذر تحميل البيانات. يرجى تحديث الصفحة.');
    }
  }

  async loadData() {
    const response = await fetch(this.config.dataUrl);
    if (!response.ok) throw new Error('Failed to load data');
    this.data = await response.json();
  }

  generateColorPalette()  {
    return [
      ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
      ['#ff9a9e', '#fecfef'], ['#ffecd2', '#fcb69f'], ['#8e2de2', '#4a00e0'],
      ['#1e3c72', '#2a5298'], ['#134e5e', '#71b280'], ['#c33764', '#1d2671']
    ];
  }

  generatePlaceholder(name, index)  {
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

  renderAll() {
    if (!this.sectionsContainer || !this.data) return;
    this.sectionsContainer.innerHTML = '';

    const featuredItem = this.data.categories[0][this.config.type][0];
    this.renderFeatured(featuredItem);

    this.data.categories.forEach((category, catIndex) => {
      this.renderCategory(category, catIndex);
    });

    this.checkEmptyCategories();
  }

  renderFeatured(item) {
    const placeholder = this.generatePlaceholder(item.name, 0);
    const featuredHTML = `
      <div class="featured-card" data-item-id="${item.id}">
        <div class="featured-media">
          <img src="${item.image}" alt="${item.name}" loading="eager"
               onerror="this.src='${placeholder}'">
          <div class="featured-overlay">
            <span class="featured-badge">${this.config.featuredBadge}</span>
          </div>
        </div>
        <div class="featured-body">
          <h2 class="featured-title">${item.name}</h2>
          <div class="featured-meta">
            <span class="rating"> ${item.rating}</span>
            <span>•</span>
            <span>${item.developer}</span>
            <span>•</span>
            <span>${item.size}</span>
            <span>•</span>
            <span>${item.downloads || '1M+'} تحميل</span>
          </div>
          <p class="featured-desc">${item.description}</p>
          <div class="featured-actions">
            <button class="btn btn-primary download-featured-btn" data-item-id="${item.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-left:6px">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              تحميل APK
            </button>
            <a href="detail.html?id=${item.id}&type=${this.config.type}" class="btn btn-secondary btn-sm">التفاصيل</a>
          </div>
        </div>
      </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = featuredHTML;
    this.sectionsContainer.appendChild(wrapper.firstElementChild);
  }

  renderCategory(category, catIndex) {
    const section = document.createElement('section');
    section.className = 'section';
    section.dataset.category = category.id;

    section.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">${category.title}</h2>
      </div>
      <div class="items-grid" id="grid-${category.id}"></div>
    `;
    this.sectionsContainer.appendChild(section);

    const grid = section.querySelector('.items-grid');
    const items = category[this.config.type]; // apps أو games
    items.forEach((item, itemIndex) => {
      grid.appendChild(this.createCard(item, catIndex * 10 + itemIndex));
    });
  }

  createCard(item, colorIndex) {
    const card = document.createElement('div');
    card.className = 'game-card'; // يمكن تغييره إلى 'item-card' مستقبلاً
    card.dataset.itemId = item.id;
    card.dataset.name = item.name.toLowerCase();
    card.dataset.dev = item.developer.toLowerCase();

    const placeholder = this.generatePlaceholder(item.name, colorIndex);

    card.innerHTML = `
      <div class="game-thumb">
        <img src="${item.image}" alt="${item.name}" loading="lazy"
             onerror="this.src='${placeholder}'">
        <div class="game-rating">
          <span>★</span><span>${item.rating}</span>
        </div>
      </div>
      <div class="game-info">
        <div class="game-title">${item.name}</div>
        <div class="game-dev">${item.developer}</div>
        <div class="game-footer">
          <span class="game-size">${item.size}</span>
          <div class="app-card-actions">
            <a href="detail.html?id=${item.id}&type=${this.config.type}" class="details-link" title="التفاصيل">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="true" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </a>
            <button class="download-btn" data-item-id="${item.id}" title="تحميل">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // النقر على البطاقة يذهب للتفاصيل
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.download-btn') && !e.target.closest('.details-link')) {
        window.location.href = `detail.html?id=${item.id}&type=${this.config.type}`;
      }
    });

    // زر التحميل
    const dlBtn = card.querySelector('.download-btn');
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDownload(item);
    });

    return card;
  }

  handleDownload(item) {
    if (!this.downloadManager) return;
    const fullItem = this.findItemById(item.id);
    if (fullItem) this.downloadManager.startDownload(fullItem);
  }

  findItemById(id) {
    for (const category of this.data.categories) {
      const items = category[this.config.type];
      const found = items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  }

  setupEvents() {
    if (!this.searchInput) return;

    let debounceTimer;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filterItems(e.target.value);
      }, 300);
    });

    // زر التحميل في البطاقة المميزة
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.download-featured-btn');
      if (btn) {
        const itemId = btn.dataset.itemId;
        const item = this.findItemById(itemId);
        if (item) this.handleDownload(item);
      }
    });
  }

  filterItems(query) {
    const term = query.toLowerCase().trim();
    const cards = document.querySelectorAll('.game-card');
    const sections = document.querySelectorAll('.section');

    if (!term) {
      cards.forEach(card => card.style.display = '');
      sections.forEach(sec => sec.style.display = '');
      return;
    }

    sections.forEach(section => {
      let hasVisible = false;
      const gridCards = section.querySelectorAll('.game-card');
      gridCards.forEach(card => {
        const name = card.dataset.name;
        const dev = card.dataset.dev;
        const match = name.includes(term) || dev.includes(term);
        card.style.display = match ? '' : 'none';
        if (match) hasVisible = true;
      });
      section.style.display = hasVisible ? '' : 'none';
    });
  }

  checkEmptyCategories() {
    if (!this.data?.categories || !this.sectionsContainer) return;

    this.data.categories.forEach(category => {
      const section = this.sectionsContainer.querySelector(`section[data-category="${category.id}"]`);
      if (!section) return;

      const items = category[this.config.type];
      const isEmpty = !items || items.length === 0;

      const grid = section.querySelector('.items-grid');
      if (grid) grid.style.display = isEmpty ? 'none' : '';

      let emptyMsg = section.querySelector('.empty-state');
      if (isEmpty) {
        if (!emptyMsg) {
          emptyMsg = document.createElement('div');
          emptyMsg.className = 'empty-state';
          emptyMsg.innerHTML = this._buildEmptyStateHTML(category.title);
          section.appendChild(emptyMsg);
        }
      } else {
        if (emptyMsg) emptyMsg.remove();
      }
    });
  }

  _buildEmptyStateHTML(categoryTitle = '') {
    const itemWordPlural = this.config.itemsWord; // 'تطبيقات' أو 'ألعاب'
    return `
      <div class="empty-state-content">
        <div class="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke-dasharray="4 2"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M13.5 10.5l2-2M10.5 13.5l-2 2"/>
          </svg>
        </div>
        <h3 class="empty-state-title">قريباً</h3>
        <p class="empty-state-desc">
          ${categoryTitle
            ? `لا توجد ${itemWordPlural} حالياً في قسم "${categoryTitle}".`
            : `لا توجد ${itemWordPlural} حالياً في هذا القسم.`
          }
          <br>نعمل على إضافة محتوى جديد
        </p>
      </div>
    `;
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

  showSkeleton() {
    if (!this.sectionsContainer) return;
    this.sectionsContainer.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:20px;margin-top:40px">
        ${Array(8).fill(0).map(() => `
          <div class="skeleton" style="height:220px;border-radius:12px"></div>
        `).join('')}
      </div>
    `;
  }

  showError(msg) {
    if (!this.sectionsContainer) return;
    this.sectionsContainer.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-secondary)">
        <div style="font-size:48px;margin-bottom:16px">⚠</div>
        <h3 style="margin-bottom:8px;color:var(--text)">حدث خطأ</h3>
        <p>${msg}</p>
      </div>
    `;
  }
}