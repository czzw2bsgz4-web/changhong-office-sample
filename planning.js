'use strict';
(() => {
  const demo=document.querySelector('.plan-demo');
  if(!demo)return;
  const buttons=[...demo.querySelectorAll('[data-plan]')];
  const description=demo.querySelector('.plan-description');
  const descriptions={work:'桌位多一點：示意保留 6 個工作位置與小型討論區，讓配置從日常工作的需要開始。',discussion:'討論多一點：示意調整為 4 個工作位置，留出較大的討論區。實際配置，由我們陪你一起確認。'};
  buttons.forEach(button=>button.addEventListener('click',()=>{
    demo.dataset.layout=button.dataset.plan;
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    description.textContent=descriptions[button.dataset.plan];
  }));
})();
