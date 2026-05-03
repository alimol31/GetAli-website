// apps.js - إعدادات صفحة التطبيقات
// GetAli V3.1 - Bootstrap Icons Edition

class AppsStore extends BaseStore {
  constructor() {
    super({
      dataUrl: 'data/apps.json',
      type: 'apps',
      featuredBadge: 'اختيار المحررين',
      itemsWord: 'تطبيقات',
      itemWord: 'تطبيق'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const appsStore = new AppsStore();
  appsStore.init();
});