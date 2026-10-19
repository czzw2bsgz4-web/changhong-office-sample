'use strict';
(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      menu.click(); menu.focus();
    }
  });
  if (!document.querySelector('#product-grid')) {
    // 首頁入口同步採用資料檔中的第一款，上下架無須另改首頁。
    const cards = [...document.querySelectorAll('.category-card')];
    if (cards.length) fetch('products.json', { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error('資料讀取失敗');return response.json();
    }).then(data => {
      for (const card of cards) {
        const id = card.getAttribute('href').split('#')[1];
        const product = data.products.find(p => p.category === id);
        const image = card.querySelector('.category-image img');
        if (product) {
          image.src = product.image;
          image.alt = `${product.series}${product.isIllustration ? '，AI 生成示意圖' : '參考款式'}`;
          image.hidden = false;
        } else image.hidden = true;
      }
    }).catch(() => { /* 保留靜態分類入口，仍可直接來電或進入型錄。 */ });
    return;
  }
  const grid = document.querySelector('#product-grid');
  const status = document.querySelector('#catalog-status');
  const tabs = [...document.querySelectorAll('[data-category]')];
  const dialog = document.querySelector('#product-dialog');
  let data;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const openProduct = p => {
    document.querySelector('#dialog-title').textContent = `${p.series} ${p.model}`;
    const photo = document.querySelector('#dialog-photo');
    photo.src = p.fullImage; photo.alt = `${p.series} ${p.model}${p.isIllustration ? '，AI 生成示意圖' : '，舊站原圖'}`;
    document.querySelector('#dialog-illustration').hidden = !p.isIllustration;
    document.querySelector('#dialog-dimensions').textContent = p.dimensions ? `舊站尺寸：${p.dimensions}` : '';
    document.querySelector('#dialog-note').textContent = p.isIllustration ? '此為 AI 生成示意圖，非實際供貨產品照片。實際款式請來電確認。' : '舊站款式參考。現行規格、顏色與供貨情形，請來電確認。';
    dialog.showModal(); document.body.classList.add('dialog-open');
  };
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }});
  function render(categoryId) {
    if (!data) return;
    const category = data.categories.find(c => c.id === categoryId) || data.categories[0];
    for (const tab of tabs) {
      const active = tab.dataset.category === category.id;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    }
    document.querySelector('#catalog-panel').setAttribute('aria-labelledby', `tab-${category.id}`);
    document.querySelector('#category-heading').textContent = category.name;
    document.querySelector('#category-description').textContent = category.description;
    const selected = data.products.filter(p => p.category === category.id);
    document.querySelector('#product-count').textContent = `${selected.length} 款參考`;
    document.querySelector('#chair-notice').hidden = category.id !== 'chairs' || !selected.length;
    document.querySelector('.catalog-section').classList.toggle('chair-active', category.id === 'chairs');
    const fragment = document.createDocumentFragment();
    for (const p of selected) {
      const card = el('article', 'product-card');
      const button = el('button', 'product-photo');
      if (p.originalSize?.[0] <= 400) button.classList.add('native-size');
      button.type = 'button'; button.setAttribute('aria-label', `查看 ${p.series} ${p.model} 大圖`);
      const image = el('img');image.src = p.image;image.alt = `${p.series} ${p.model}${p.isIllustration ? '，AI 生成示意圖' : ''}`;
      image.loading = 'eager';image.width = 1000;image.height = 667;
      button.append(image);
      if (p.isIllustration) button.append(el('span', 'illustration-badge', '示意圖'));
      const zoom = el('span', 'photo-zoom');const plus = el('img', 'icon');plus.src = 'assets/icons/plus-lg.svg';plus.alt = '';zoom.append(plus);button.append(zoom);
      button.addEventListener('click', () => openProduct(p));card.append(button, el('h3', '', p.series), el('p', 'product-model', p.model));
      if (p.dimensions) card.append(el('p', 'product-dimensions', `尺寸：${p.dimensions}`));
      fragment.append(card);
    }
    grid.replaceChildren(fragment);
    if (!selected.length) {
      status.hidden = false;
      status.textContent = '此類款式整理中，歡迎來電洽詢。';
      status.classList.add('catalog-empty');
    } else {
      status.hidden = true;
      status.classList.remove('catalog-empty');
    }
    document.querySelector('.catalog-note').hidden = !selected.length;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      history.replaceState(null, '', `#${tab.dataset.category}`);render(tab.dataset.category);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();tabs[next].focus();tabs[next].click();
    });
  });
  window.addEventListener('hashchange', () => render(location.hash.slice(1)));
  fetch('products.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('資料讀取失敗');return response.json();
  }).then(result => {
    if (!Array.isArray(result.categories) || !Array.isArray(result.products) || !result.categories.length) throw new Error('資料格式不完整');
    data = result;render(location.hash.slice(1));
  }).catch(() => {
    status.hidden = false;status.textContent = '暫時無法載入型錄，歡迎撥打 07-625-5518 詢問款式。';
    const phone = el('a', 'button', '來電洽詢 07-625-5518');phone.href = 'tel:076255518';status.append(el('br'),phone);
  });
})();
