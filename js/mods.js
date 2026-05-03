// mods.js - إعدادات صفحة التطبيقات والألعاب المعدّلة
// بواسطة: Ali & فريق GetAli
// يمتد BaseStore بنفس البنية الموحدة

class ModsStore extends BaseStore {
  constructor() {
    super({
      dataUrl: 'data/mods.json',
      type: 'mods',
      featuredBadge: 'تعديل Ali',
      itemsWord: 'تطبيقات معدّلة',
      itemWord: 'تطبيق معدّل'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modsStore = new ModsStore();
  modsStore.init();
});
