class HomeStore {
  constructor() {
    this.container = document.getElementById('homeContainer');
  }
  
  async init() {
    this.showSkeleton();
    try {
      const [appsData, gamesData] = await Promise.all([
        fetch('data/apps.json').then(r => r.json()),
        fetch('data/games.json').then(r => r.json())
      ]);
      this.render(appsData, gamesData);
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
    `;
  }
  
  showError() {
    this.container.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:var(--text-secondary)">
        <div style="font-size:48px;margin-bottom:16px">⚠</div>
        <h3>تعذر تحميل المحتوى</h3>
        <p>يرجى تحديث الصفحة أو المحاولة لاحقاً</p>
      </div>
    `;
  }
  
  render(appsData, gamesData) {
    const topApps = appsData.categories?.[0]?.apps?.slice(0, 4) || [];
    const topGames = gamesData.categories?.[0]?.games?.slice(0, 4) || [];
    
    this.container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero hero-home" aria-label="مقدمة">
        <div class="container">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">متجر <span class="text-gradient">GetAli</span></h1>
              <p class="hero-desc">
                حمّل أفضل التطبيقات والألعاب لهاتفك الأندرويد بسرعة وأمان.
                اكتشف مجموعتنا المختارة من التطبيقات المجانية والألعاب المميزة.
              </p>
              <div class="hero-actions">
                <a href="apps.html" class="btn btn-primary btn-lg">📱 تصفح التطبيقات</a>
                <a href="games.html" class="btn btn-secondary btn-lg">🎮 تصفح الألعاب</a>
              </div>
            </div>
            <div class="hero-visual">
              <img src="images/hero-games.png" alt="GetAli Hero" class="hero-img"
                   onerror="this.src='${Utils.generatePlaceholder('Get Ali', 0)}'">
            </div>
          </div>
        </div>
      </section>

      <!-- Apps Section -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">📱 أحدث التطبيقات</h2>
            <a href="apps.html" class="section-action">عرض الكل ←</a>
          </div>
          ${topApps.length ? this.buildCards(topApps, 'apps') : '<p class="empty-state">لا توجد تطبيقات حالياً.</p>'}
        </div>
      </section>

      <!-- Games Section -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">🎮 أشهر الألعاب</h2>
            <a href="games.html" class="section-action">عرض الكل ←</a>
          </div>
          ${topGames.length ? this.buildCards(topGames, 'games') : '<p class="empty-state">لا توجد ألعاب حالياً.</p>'}
        </div>
      </section>

      <!-- Explore Categories -->
      <section class="section explore-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">🔍 تصفح الفئات</h2>
          </div>
          <div class="explore-grid">
            <a href="apps.html" class="explore-card">
              <span class="explore-icon">📱</span>
              <span>جميع التطبيقات</span>
            </a>
            <a href="games.html" class="explore-card">
              <span class="explore-icon">🎮</span>
              <span>جميع الألعاب</span>
            </a>
          </div>
        </div>
      </section>
    `;
  }
  
  buildCards(items, type) {
    return `
      <div class="items-grid">
        ${items.map((item, index) => `
          <div class="game-card" onclick="location.href='detail.html?id=${item.id}&type=${type}'">
            <div class="game-thumb">
              <img src="${item.image}" alt="${item.name}" loading="lazy"
                   onerror="this.src='${Utils.generatePlaceholder(item.name, index)}'">
              <div class="game-rating">★ ${item.rating}</div>
            </div>
            <div class="game-info">
              <div class="game-title">${item.name}</div>
              <div class="game-dev">${item.developer}</div>
              <div class="game-footer">
                <span class="game-size">${item.size}</span>
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