/**
 * DownloadManager - Professional Download System
 * Supports local files, external URLs, and mod URLs for modified apps.
 * @version 3.1.0 - Bootstrap Icons integration
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
   * @param {Object} item - Item with id, name, fileName, downloadUrl, modUrl, size, image
   */
  async startDownload(item) {
    // Priority: modUrl (for mods) > downloadUrl (external) > fileName (local)
    const isMod = !!item.modUrl;
    const isExternal = isMod || !!item.downloadUrl;
    const sourceUrl = isMod ? item.modUrl : (item.downloadUrl || `files/${item.fileName}`);
    const displayName = isMod ? `${item.name} (معدّل)` : item.name;

    if (this.downloads.find(d => d.sourceUrl === sourceUrl && d.status === 'downloading')) {
      this.showToast('warning', 'جاري التنزيل', `${displayName} قيد التنزيل بالفعل`);
      return;
    }

    const downloadId = `${item.id}_${Date.now()}`;

    const downloadItem = {
      id: downloadId,
      gameId: item.id,
      name: displayName,
      fileName: item.fileName || sourceUrl.split('/').pop().split('?')[0] || 'download.apk',
      sourceUrl: sourceUrl,
      size: item.size,
      image: item.image,
      progress: 0,
      status: 'downloading',
      speed: '0 MB/s',
      isExternal: isExternal,
      isMod: isMod,
      abortController: new AbortController(),
      timestamp: Date.now()
    };

    this.downloads.unshift(downloadItem);
    this.updateCount();
    this.renderPanel();
    this.openPanel();

    const toastTitle = isMod ? 'بدأ تنزيل النسخة المعدّلة' : 'بدأ التنزيل';
    this.showToast('info', toastTitle, `جاري تنزيل ${displayName}`);

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
        this.showToast('error', 'فشل التنزيل', `تعذر تنزيل ${displayName}`);
      } else {
        downloadItem.status = 'cancelled';
        this.showToast('warning', 'تم الإلغاء', `تم إلغاء تنزيل ${displayName}`);
      }
      this.updateCount();
      this.renderPanel();
    }
  }

  async executeExternalDownload(item) {
    return new Promise((resolve, reject) => {
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

      const a = document.createElement('a');
      a.href = item.sourceUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = item.fileName;
      document.body.appendChild(a);

      setTimeout(() => {
        a.click();
        document.body.removeChild(a);

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
            source: item.isMod ? 'mod' : 'external'
          });

          this.updateCount();
          this.renderPanel();

          const successTitle = item.isMod ? 'اكتمل تنزيل النسخة المعدّلة' : 'اكتمل التنزيل';
          const successMsg = item.isMod 
            ? `${item.name} تم فتح الرابط بنجاح — تعديل قانوني`
            : `${item.name} تم فتح الرابط بنجاح`;
          this.showToast('success', successTitle, successMsg);
          resolve();
        }, 2500);
      }, 100);
    });
  }

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
          <i class="bi bi-cloud-download" style="font-size: 56px; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
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
      actions = `<button class="cancel-btn" title="إلغاء"><i class="bi bi-x-lg"></i></button>`;
    } else if (isError || isCancelled) {
      actions = `
        <button class="retry-btn" title="إعادة المحاولة"><i class="bi bi-arrow-clockwise"></i></button>
        <button class="remove-btn cancel-btn" title="حذف"><i class="bi bi-trash"></i></button>
      `;
    } else if (isCompleted) {
      actions = `<button class="remove-btn" title="حذف من القائمة"><i class="bi bi-x-lg"></i></button>`;
    }

    const metaInfo = isCompleted 
      ? `<span><i class="bi bi-hdd" style="font-size: 10px;"></i> ${item.size}</span><span style="color:var(--accent-dark);font-weight:700"><i class="bi bi-check-lg"></i> مكتمل</span>`
      : isError
      ? `<span style="color:#dc2626"><i class="bi bi-exclamation-triangle" style="font-size: 10px;"></i> ${item.error || 'خطأ'}</span>`
      : `<span>${Math.round(item.progress)}%</span><span>${item.speed}</span>`;

    const modBadge = item.isMod ? '<span class="mod-badge-tag"><i class="bi bi-lightning-charge" style="font-size: 8px;"></i> معدّل</span>' : '';

    return `
      <div class="download-item ${item.status}" data-download-id="${item.id}">
        <img src="${item.image}" alt="" class="download-item-thumb" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23ddd%22 width=%2240%22 height=%2240%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22999%22%3E&#127918;%3C/text%3E%3C/svg%3E'">
        <div class="download-item-info">
          <div class="download-item-name">${item.name} ${modBadge}</div>
          <div class="download-item-meta">${metaInfo}</div>
          ${!isCompleted && !isError && !isCancelled ? `
            <div class="download-progress-bar">
              <div class="download-progress-fill ${item.isMod ? 'mod-progress' : ''}" style="width:${item.progress}%"></div>
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
      success: '<i class="bi bi-check-lg"></i>',
      error: '<i class="bi bi-x-lg"></i>',
      warning: '<i class="bi bi-exclamation-triangle"></i>',
      info: '<i class="bi bi-info-circle"></i>'
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