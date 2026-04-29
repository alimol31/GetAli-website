/**
 * GetAli V2.5 - Games Page
 * @version 2.5.0
 */

class GameStore {
  constructor() {
    this.gamesData = null;
    this.downloadManager = null;
    this.sectionsContainer = document.getElementById('sectionsContainer');
    this.searchInput = document.getElementById('searchInput');
    this.placeholderColors = this.generateColorPalette();
  }

  async init() {
    try {
      this.showSkeleton();
      await this.loadGames();
      this.downloadManager = new DownloadManager();
      this.renderAll();
      this.setupEvents();
      this.setupHeaderScroll();
    } catch (error) {
      console.error('Failed to initialize store:', error);
      this.showError('تعذر تحميل البيانات. يرجى تحديث الصفحة.');
    }
  }

  async loadGames() {
    const response = await fetch('data/games.json');
    if (!response.ok) throw new Error('Failed to load games');
    this.gamesData = await response.json();
  }

  generateColorPalette() {
    return [
      ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
      ['#ff9a9e', '#fecfef'], ['#ffecd2', '#fcb69f'], ['#8e2de2', '#4a00e0'],
      ['#1e3c72', '#2a5298'], ['#134e5e', '#71b280'], ['#c33764', '#1d2671']
    ];
  }

  generatePlaceholder(name, index) {
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
    if (!this.sectionsContainer || !this.gamesData) return;
    this.sectionsContainer.innerHTML = '';

    const featuredGame = this.gamesData.categories[0].games[0];
    this.renderFeatured(featuredGame);

    this.gamesData.categories.forEach((category, catIndex) => {
      this.renderCategory(category, catIndex);
    });
  }

  renderFeatured(game) {
    const placeholder = this.generatePlaceholder(game.name, 0);
    const featuredHTML = `
      <div class="featured-card" data-game-id="${game.id}">
        <div class="featured-media">
          <img src="${game.image}" alt="${game.name}" loading="eager"
               onerror="this.src='${placeholder}'">
          <div class="featured-overlay">
            <span class="featured-badge">مميز</span>
          </div>
        </div>
        <div class="featured-body">
          <h2 class="featured-title">${game.name}</h2>
          <div class="featured-meta">
            <span class="rating">★ ${game.rating}</span>
            <span>•</span>
            <span>${game.developer}</span>
            <span>•</span>
            <span>${game.size}</span>
            <span>•</span>
            <span>${game.downloads || '1M+'} تحميل</span>
          </div>
          <p class="featured-desc">${game.description}</p>
          <div class="featured-actions">
            <button class="btn btn-primary download-game-btn" data-game-id="${game.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-left:6px">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              تحميل APK
            </button>
            <a href="detail.html?id=${game.id}&type=games" class="btn btn-secondary btn-sm">التفاصيل</a>
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
      <div class="games-grid" id="grid-${category.id}"></div>
    `;

    this.sectionsContainer.appendChild(section);

    const grid = section.querySelector('.games-grid');
    category.games.forEach((game, gameIndex) => {
      grid.appendChild(this.createGameCard(game, catIndex * 10 + gameIndex));
    });
  }

  createGameCard(game, colorIndex) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;
    card.dataset.name = game.name.toLowerCase();
    card.dataset.dev = game.developer.toLowerCase();

    const placeholder = this.generatePlaceholder(game.name, colorIndex);

    card.innerHTML = `
      <div class="game-thumb">
        <img src="${game.image}" alt="${game.name}" loading="lazy"
             onerror="this.src='${placeholder}'">
        <div class="game-rating">
          <span>★</span><span>${game.rating}</span>
        </div>
      </div>
      <div class="game-info">
        <div class="game-title">${game.name}</div>
        <div class="game-dev">${game.developer}</div>
        <div class="game-footer">
          <span class="game-size">${game.size}</span>
          <div class="app-card-actions">
            <a href="detail.html?id=${game.id}&type=games" class="details-link" title="التفاصيل">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </a>
            <button class="download-btn" data-game-id="${game.id}" title="تحميل">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Click on card navigates to detail page
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.download-btn') && !e.target.closest('.details-link')) {
        window.location.href = `detail.html?id=${game.id}&type=games`;
      }
    });

    const dlBtn = card.querySelector('.download-btn');
    dlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDownload(game);
    });

    return card;
  }

  handleDownload(game) {
    if (!this.downloadManager) return;
    const fullGame = this.findGameById(game.id);
    if (fullGame) this.downloadManager.startDownload(fullGame);
  }

  findGameById(id) {
    for (const category of this.gamesData.categories) {
      const game = category.games.find(g => g.id === id);
      if (game) return game;
    }
    return null;
  }

  setupEvents() {
    if (!this.searchInput) return;

    let debounceTimer;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filterGames(e.target.value);
      }, 300);
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.download-game-btn');
      if (btn) {
        const gameId = btn.dataset.gameId;
        const game = this.findGameById(gameId);
        if (game) this.handleDownload(game);
      }
    });
  }

  filterGames(query) {
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

document.addEventListener('DOMContentLoaded', () => {
  const store = new GameStore();
  store.init();
});
