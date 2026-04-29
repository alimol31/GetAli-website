/**
 * DownloadManager - Professional Download System
 * Supports both local files (with progress tracking) and external URLs.
 * @version 2.1.0 - GitHub Pages Ready
 */

class DownloadManager {
  constructor() {
    this.downloads = [];
    this.history = this.loadHistory();
    this.panelOpen = false;
    this.panelEl = document.getElementById('downloadPanel');
    this.listEl = document.getElementById('downloadList');
    this.countEl = document.getElementById('downloadCount');
    this.badgeEl = document.getElementById('downloadBadge');
    this.toastContainer = document.getElementById('toastContainer');

    this.init();
  }

  init() {
    this.renderPanel();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const toggleBtn = document.getElementById('downloadToggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePanel());

    const closeBtn = document.getElementById('downloadClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());

    document.addEventListener('click', (e) => {
      if (this.panelOpen && 
          !this.panelEl.contains(e.target) && 
          !e.target.closest('#downloadToggle')) {
        this.closePanel();
      }
    });
  }

  /**
   * Start a new download
   * @param {Object} game - Game object with id, name, fileName, downloadUrl, size, image
   */
  async startDownload(game) {
    // Check if already downloading
    if (this.downloads.find(d => d.gameId === game.id && d.status === 'downloading')) {
      this.showToast('warning', 'جاري التنزيل', `${game.name} قيد التنزيل بالفعل`);
      return;
    }

    const downloadId = `${game.id}_${Date.now()}`;

    // Determine download source
    const isExternal = !!game.downloadUrl;
    const sourceUrl = isExternal ? game.downloadUrl : `files/${game.fileName}`;

    const downloadItem = {
      id: downloadId,
      gameId: game.id,
      name: game.name,
      fileName: game.fileName || game.downloadUrl.split('/').pop().split('?')[0] || 'download.apk',
      sourceUrl: sourceUrl,
      size: game.size,
      image: game.image,
      progress: 0,
      status: 'downloading',
      speed: '0 MB/s',
      isExternal: isExternal,
      abortController: new AbortController(),
      timestamp: Date.now()
    };

    this.downloads.unshift(downloadItem);
    this.updateCount();
    this.renderPanel();
    this.openPanel();
    this.showToast('info', 'بدأ التنزيل', `جاري تنزيل ${game.name}`);

    try {
      if (isExternal) {
        await this.executeExternalDownload(downloadItem);
      } else {
        await this.executeLocalDownload(downloadItem);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Download failed:', error);
        downloadItem.status = 'error';
        downloadItem.error = error.message;
        this.showToast('error', 'فشل التنزيل', `تعذر تنزيل ${game.name}`);
      } else {
        downloadItem.status = 'cancelled';
        this.showToast('warning', 'تم الإلغاء', `تم إلغاء تنزيل ${game.name}`);
      }
      this.updateCount();
      this.renderPanel();
    }
  }

  /**
   * Handle external URL downloads (GitHub Pages compatible)
   * Uses anchor tag approach since fetch() doesn't support progress on cross-origin
   */
  async executeExternalDownload(item) {
    return new Promise((resolve, reject) => {
      // Simulate progress for external links (since we can't track real progress due to CORS)
      const interval = setInterval(() => {
        if (item.status !== 'downloading') {
          clearInterval(interval);
          reject(new Error('AbortError'));
          return;
        }
        item.progress = Math.min(item.progress + Math.random() * 15 + 5, 90);
        item.speed = `${(Math.random() * 5 + 1).toFixed(1)} MB/s`;
        this.updateItemProgress(item);
      }, 800);

      // Create hidden anchor to trigger download
      const a = document.createElement('a');
      a.href = item.sourceUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = item.fileName;
      document.body.appendChild(a);

      // Small delay then trigger
      setTimeout(() => {
        a.click();
        document.body.removeChild(a);

        // Complete after simulated time
        setTimeout(() => {
          clearInterval(interval);
          item.progress = 100;
          item.status = 'completed';
          item.completedAt = Date.now();

          this.addToHistory({
            gameId: item.gameId,
            name: item.name,
            fileName: item.fileName,
            size: item.size,
            completedAt: item.completedAt,
            source: 'external'
          });

          this.updateCount();
          this.renderPanel();
          this.showToast('success', 'اكتمل التنزيل', `${item.name} تم فتح الرابط بنجاح`);
          resolve();
        }, 2500);
      }, 100);
    });
  }

  /**
   * Handle local file downloads with real progress tracking
   */
  async executeLocalDownload(item) {
    const response = await fetch(item.sourceUrl, {
      signal: item.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = +response.headers.get('Content-Length');
    const reader = response.body.getReader();
    let received = 0;
    const chunks = [];
    const startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      received += value.length;

      if (contentLength) {
        item.progress = Math.round((received / contentLength) * 100);
      } else {
        item.progress = Math.min(item.progress + 5, 95);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? (received / elapsed / 1024 / 1024).toFixed(1) : 0;
      item.speed = `${speed} MB/s`;

      this.updateItemProgress(item);
    }

    // Complete download
    const blob = new Blob(chunks);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 5000);

    item.progress = 100;
    item.status = 'completed';
    item.completedAt = Date.now();

    this.addToHistory({
      gameId: item.gameId,
      name: item.name,
      fileName: item.fileName,
      size: item.size,
      completedAt: item.completedAt,
      source: 'local'
    });

    this.updateCount();
    this.renderPanel();
    this.showToast('success', 'اكتمل التنزيل', `${item.name} تم تنزيله بنجاح`);
  }

  cancelDownload(downloadId) {
    const item = this.downloads.find(d => d.id === downloadId);
    if (item && item.status === 'downloading') {
      item.abortController.abort();
    }
  }

  removeDownload(downloadId) {
    this.downloads = this.downloads.filter(d => d.id !== downloadId);
    this.updateCount();
    this.renderPanel();
  }

  retryDownload(downloadId) {
    const item = this.downloads.find(d => d.id === downloadId);
    if (item) {
      item.status = 'downloading';
      item.progress = 0;
      item.error = null;
      item.abortController = new AbortController();

      if (item.isExternal) {
        this.executeExternalDownload(item);
      } else {
        this.executeLocalDownload(item);
      }
      this.renderPanel();
    }
  }

  updateItemProgress(item) {
    const el = document.querySelector(`[data-download-id="${item.id}"] .download-progress-fill`);
    const metaEl = document.querySelector(`[data-download-id="${item.id}"] .download-item-meta`);

    if (el) el.style.width = `${item.progress}%`;
    if (metaEl && item.status === 'downloading') {
      metaEl.innerHTML = `<span>${Math.round(item.progress)}%</span><span>${item.speed}</span>`;
    }
  }

  renderPanel() {
    if (!this.listEl) return;

    const activeDownloads = this.downloads.filter(d => d.status === 'downloading' || d.status === 'error');
    const recentCompleted = this.downloads.filter(d => d.status === 'completed').slice(0, 3);
    const visibleItems = [...activeDownloads, ...recentCompleted];

    if (visibleItems.length === 0) {
      this.listEl.innerHTML = `
        <div class="download-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"/>
          </svg>
          <div>لا توجد تنزيلات حالية</div>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = visibleItems.map(item => this.createDownloadItemHTML(item)).join('');

    visibleItems.forEach(item => {
      const el = document.querySelector(`[data-download-id="${item.id}"]`);
      if (!el) return;

      const cancelBtn = el.querySelector('.cancel-btn');
      const removeBtn = el.querySelector('.remove-btn');
      const retryBtn = el.querySelector('.retry-btn');

      if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelDownload(item.id));
      if (removeBtn) removeBtn.addEventListener('click', () => this.removeDownload(item.id));
      if (retryBtn) retryBtn.addEventListener('click', () => this.retryDownload(item.id));
    });
  }

  createDownloadItemHTML(item) {
    const isCompleted = item.status === 'completed';
    const isError = item.status === 'error';
    const isCancelled = item.status === 'cancelled';

    let actions = '';
    if (item.status === 'downloading') {
      actions = `<button class="cancel-btn" title="إلغاء">✕</button>`;
    } else if (isError || isCancelled) {
      actions = `
        <button class="retry-btn" title="إعادة المحاولة">↻</button>
        <button class="remove-btn cancel-btn" title="حذف">🗑</button>
      `;
    } else if (isCompleted) {
      actions = `<button class="remove-btn" title="حذف من القائمة">✕</button>`;
    }

    const metaInfo = isCompleted 
      ? `<span>${item.size}</span><span style="color:var(--accent-dark);font-weight:700">✓ مكتمل</span>`
      : isError
      ? `<span style="color:#dc2626">${item.error || 'خطأ'}</span>`
      : `<span>${Math.round(item.progress)}%</span><span>${item.speed}</span>`;

    return `
      <div class="download-item ${item.status}" data-download-id="${item.id}">
        <img src="${item.image}" alt="" class="download-item-thumb" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23ddd%22 width=%2240%22 height=%2240%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22999%22%3E🎮%3C/text%3E%3C/svg%3E'">
        <div class="download-item-info">
          <div class="download-item-name">${item.name}</div>
          <div class="download-item-meta">${metaInfo}</div>
          ${!isCompleted && !isError && !isCancelled ? `
            <div class="download-progress-bar">
              <div class="download-progress-fill" style="width:${item.progress}%"></div>
            </div>
          ` : ''}
        </div>
        <div class="download-item-actions">
          ${actions}
        </div>
      </div>
    `;
  }

  updateCount() {
    const activeCount = this.downloads.filter(d => d.status === 'downloading').length;
    if (this.countEl) {
      this.countEl.textContent = activeCount;
      this.countEl.style.display = activeCount > 0 ? 'flex' : 'none';
    }
    if (this.badgeEl) {
      this.badgeEl.textContent = activeCount;
      this.badgeEl.style.display = activeCount > 0 ? 'flex' : 'none';
    }
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
    this.panelEl.classList.toggle('open', this.panelOpen);
  }

  openPanel() {
    this.panelOpen = true;
    this.panelEl.classList.add('open');
  }

  closePanel() {
    this.panelOpen = false;
    this.panelEl.classList.remove('open');
  }

  showToast(type, title, message) {
    if (!this.toastContainer) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('GetAli_downloads_history')) || [];
    } catch {
      return [];
    }
  }

  addToHistory(record) {
    this.history.unshift(record);
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    localStorage.setItem('GetAli_downloads_history', JSON.stringify(this.history));
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('GetAli_downloads_history');
  }
}

window.DownloadManager = DownloadManager;
