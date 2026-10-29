/* GRP1 대시보드 공용 — 게임 표시 정보 · 테마 · 공유 링크 비밀번호 전달 · 보드 히어로.
   index.html · general.html · ua.html 이 각자 스크립트보다 먼저 읽는다. 데이터와 무관(평문·암호문 어느 쪽이든 같다). */
window.GX = (function(){
  'use strict';
  // 게임 키 = general.config.GAMES / ua.config.GAMES 의 키. 아이콘·키아트는 web/icons (sf 는 SmashFest da_default_512,
  // cl·rr·tj·co 는 GRP1 레벨 카탈로그 사이트와 같은 파일, mc 는 Bash2024 da_default_1024 를 같은 규칙으로 변환). color = 아이콘에서 고른 강조색(히어로 배지·선택 테두리) — 게임끼리 겹치지 않게.
  const GAMES = {
    co: {name:'Cube Coaster',       icon:'icons/co.webp', art:'icons/co-art.webp', color:'#a58bff'},
    mc: {name:'Merge Cube Blast',   icon:'icons/mc.webp', art:'icons/mc-art.webp', color:'#36d6c8'},
    sf: {name:'Bash Fiesta',        icon:'icons/sf.webp', art:'icons/sf-art.webp', color:'#4fa3ff'},
    cl: {name:'Color Crush Cannon', icon:'icons/cl.webp', art:'icons/cl-art.webp', color:'#ff6b5e'},
    rr: {name:'Spin the Yarn',      icon:'icons/rr.webp', art:'icons/rr-art.webp', color:'#ff6fb5'},
    tj: {name:'Tail Jam',           icon:'icons/tj.webp', art:'icons/tj-art.webp', color:'#ffc93c'},
  };
  const THEME_KEY = 'grp1:theme';
  const root = document.documentElement;
  let theme = 'dark';
  try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) {}
  const apply = () => { if (theme === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme'); };
  apply();   // 스크립트가 <head> 끝에서 읽히므로 첫 그림부터 저장된 테마로 나온다

  function wireTheme(btn){
    if (!btn) return;
    const label = () => { btn.textContent = theme === 'light' ? '다크' : '라이트'; };
    label();
    btn.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light'; apply(); label();
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    });
  }
  // 공유 링크의 #k=비밀번호 를 화면 사이 링크에 그대로 넘긴다(# 뒤는 서버로 가지 않는다)
  function withHash(scope){
    const h = location.hash || '';
    if (!h) return;
    (scope || document).querySelectorAll('a[data-keep-hash]').forEach(a => {
      const base = a.getAttribute('href').split('#')[0];
      a.setAttribute('href', base + h);
    });
  }
  // 보드 히어로를 게임에 맞춘다. el = .gx-hero, 안에 .gx-wash · .gx-art · .gx-name 이 있다.
  function hero(el, key, fallbackName){
    if (!el) return;
    const g = GAMES[key] || {};
    el.style.setProperty('--gc', g.color || 'var(--accent)');
    root.style.setProperty('--gc', g.color || 'var(--accent)');   // 페이지 전체(전환 버튼·합계 줄·포커스)가 게임 색을 따른다
    const wash = el.querySelector('.gx-wash'), art = el.querySelector('.gx-art'), name = el.querySelector('.gx-name');
    if (wash) wash.style.backgroundImage = g.art ? `url("${g.art}")` : 'none';
    if (art) { if (g.art) { art.src = g.art; art.hidden = false; } else art.hidden = true; }
    if (name) name.textContent = g.name || fallbackName || key;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // 게임 전환 포스터 버튼 — 글자는 게임 이름만(일반 보드 화면 테스트가 버튼 글자를 게임 이름과 대조한다)
  const posterBtn = (key, name, selected) => {
    const g = GAMES[key] || {};
    return `<button class="gx-game" type="button" role="tab" aria-selected="${!!selected}" data-g="${esc(key)}" style="--gc:${g.color || 'var(--accent)'}">`
      + (g.icon ? `<img src="${g.icon}" alt="">` : '') + esc(name || g.name || key) + `</button>`;
  };
  return {GAMES, wireTheme, withHash, hero, posterBtn, esc};
})();
