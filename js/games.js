// games.js - إعدادات صفحة الألعاب
class GameStore extends BaseStore {
  constructor() {
    super({
      dataUrl: 'data/games.json',
      type: 'games',
      featuredBadge: 'مميز',
      itemsWord: 'ألعاب',
      itemWord: 'لعبة'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gameStore = new GameStore();
  gameStore.init();
});