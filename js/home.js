class HomeStore {
  constructor() {
    this.container = document.getElementById('homeContainer');
  }

  async init() {
    this.showSkeleton();
    try {
      const [appsData, gamesData, modsData] = await Promise.all([
        fetch('data/apps.json').then(r => r.json()),
        fetch('data/games.json').then(r => r.json()),
        fetch('data/mods.json').then(r => r.json())
      ]);
      this.render(appsData, gamesData, modsData);
    } catch (error) {
      console.error('Homepage error:', error);
      this.showError();
    }
  }

  showSkeleton() {
    this.container.innerHTML = `
      <section class="hero hero-home skeleton-hero"></section>
      <div class="container" style="padding:40px 0;">
        <div class="skeleton" style="width:200px;height:28px;margin-bottom:20px;"></div>
        <div class="items-grid">
          ${Array(4).fill('<div class="skeleton" style="height:220px;border-radius:12px"></div>').join('')}
        </div>
      </div>
      <div class="container" style="padding:40px 0;">
        <div class="skeleton" style="width:200px;height:28px;margin-bottom:20px;"></div>
        <div class="items-grid">
          ${Array(4).fill('<div class="skeleton" style="height:220px;border-radius:12px"></div>').join('')}
        </div>
      </div>
      <div class="container" style="padding:40px 0;">
        <div class="skeleton" style="width:200px;height:28px;margin-bottom:20px;"></div>
        <div class="items-grid">
          ${Array(4).fill('<div class="skeleton" style="height:220px;border-radius:12px"></div>').join('')}
        </div>
      </div>
    `;
  }

  showError() {
    this.container.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:var(--text-secondary)">
        <div style="font-size:48px;margin-bottom:16px"><i class="bi bi-exclamation-triangle" style="font-size: 48px; color: var(--error);"></i></div>
        <h3>تعذر تحميل المحتوى</h3>
        <p>يرجى تحديث الصفحة أو المحاولة لاحقاً</p>
      </div>
    `;
  }

  render(appsData, gamesData, modsData) {
    const topApps = appsData.categories?.[0]?.apps?.slice(0, 4) || [];
    const topGames = gamesData.categories?.[0]?.games?.slice(0, 4) || [];
    const topMods = modsData.categories?.[0]?.mods?.slice(0, 4) || [];

    this.container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero hero-home" aria-label="مقدمة">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <span class="hero-tag">
                <i class="bi bi-stars"></i> متجر احترافي 2026
              </span>
              <h1 class="hero-title">متجر <span class="text-gradient">GetAli</span></h1>
              <p class="hero-desc">
                حمّل أفضل التطبيقات والألعاب لهاتفك الأندرويد بسرعة وأمان.
                اكتشف مجموعتنا المختارة من التطبيقات المجانية والألعاب المميزة والنسخ المعدّلة.
              </p>
              <div class="hero-actions">
                <a href="apps.html" class="btn btn-primary btn-lg">
                  <i class="bi bi-grid-3x3-gap" style="font-size: 1.2em;"></i> تصفح التطبيقات
                </a>
                <a href="games.html" class="btn btn-secondary btn-lg">
                  <i class="bi bi-controller" style="font-size: 1.2em;"></i> تصفح الألعاب
                </a>
              </div>
            </div>
            <div class="hero-visual">
              <img src="images/hero-games.png" alt="GetAli Hero" class="hero-img"
                   onerror="this.src='${Utils.generatePlaceholder('Get Ali', 0)}'">
            </div>
          </div>
        </div>
      </section>

      <!-- Mods Section (Featured) -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title" style="--section-accent: #f59e0b;">
              <i class="bi bi-lightning-charge" style="color: #f59e0b;"></i> تعديلات Ali المميزة
            </h2>
            <a href="mods.html" class="section-action" style="color: #f59e0b;">
              عرض الكل <i class="bi bi-arrow-left"></i>
            </a>
          </div>
          ${topMods.length ? this.buildCards(topMods, 'mods', true) : '<p class="empty-state">لا توجد تعديلات حالياً.</p>'}
        </div>
      </section>

      <!-- Apps Section -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-grid-3x3-gap"></i> أحدث التطبيقات
            </h2>
            <a href="apps.html" class="section-action">
              عرض الكل <i class="bi bi-arrow-left"></i>
            </a>
          </div>
          ${topApps.length ? this.buildCards(topApps, 'apps') : '<p class="empty-state">لا توجد تطبيقات حالياً.</p>'}
        </div>
      </section>

      <!-- Games Section -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-controller"></i> أشهر الألعاب
            </h2>
            <a href="games.html" class="section-action">
              عرض الكل <i class="bi bi-arrow-left"></i>
            </a>
          </div>
          ${topGames.length ? this.buildCards(topGames, 'games') : '<p class="empty-state">لا توجد ألعاب حالياً.</p>'}
        </div>
      </section>

      <!-- Explore Categories -->
      <section class="section explore-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-compass"></i> تصفح الفئات
            </h2>
          </div>
          <div class="explore-grid">
            <a href="apps.html" class="explore-card">
              <span class="explore-icon"><i class="bi bi-grid-3x3-gap" style="font-size: 2.5rem; color: var(--primary-500);"></i></span>
              <span>جميع التطبيقات</span>
            </a>
            <a href="games.html" class="explore-card">
              <span class="explore-icon"><i class="bi bi-controller" style="font-size: 2.5rem; color: var(--accent-500);"></i></span>
              <span>جميع الألعاب</span>
            </a>
            <a href="mods.html" class="explore-card" style="background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.08)); border-color: rgba(245,158,11,0.2);">
              <span class="explore-icon"><i class="bi bi-lightning-charge" style="font-size: 2.5rem; color: #f59e0b;"></i></span>
              <span style="color: #d97706; font-weight: 700;">تعديلات Ali</span>
            </a>
          </div>
        </div>
      </section>
    `;
  }

  buildCards(items, type, isMod = false) {
    return `
      <div class="items-grid">
        ${items.map((item, index) => `
          <div class="game-card" onclick="location.href='detail.html?id=${item.id}&type=${type}'">
            <div class="game-thumb" style="${isMod ? 'position: relative;' : ''}">
              <img src="${item.image}" alt="${item.name}" loading="lazy"
                   onerror="this.src='${Utils.generatePlaceholder(item.name, index)}'">
              <div class="game-rating"><i class="bi bi-star-fill" style="font-size: 10px;"></i> ${item.rating}</div>
              ${isMod ? `<div class="mod-badge"><i class="bi bi-lightning-charge" style="font-size: 8px;"></i> معدّل</div>` : ''}
            </div>
            <div class="game-info">
              <div class="game-title">${item.name}</div>
              <div class="game-dev"><i class="bi bi-code-square" style="font-size: 10px;"></i> ${item.developer}</div>
              <div class="game-footer">
                <span class="game-size"><i class="bi bi-hdd" style="font-size: 10px;"></i> ${item.size}</span>
                ${item.modVersion ? `<span class="game-size" style="background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1)); color: #d97706; font-weight: 700;"><i class="bi bi-git" style="font-size: 10px;"></i> ${item.modVersion}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HomeStore().init();
});