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
  // 마지막으로 본 게임(탭 단위 sessionStorage) — 보드를 오갈 때 같은 게임을 유지하고, 데이터 복호 전에 히어로를 먼저 채우는 데 쓴다(2026-10-30).
  const LAST_KEY = 'grp1:lastGame';
  function rememberGame(key){ try { sessionStorage.setItem(LAST_KEY, key); } catch (e) {} }
  function lastGame(){ try { return sessionStorage.getItem(LAST_KEY) || null; } catch (e) { return null; } }
  // 데이터가 오기 전에 히어로를 게임 이름·색·키아트로 미리 채운다 — ?game= 이 있으면 그것, 없으면 마지막 게임. 둘 다 없으면 자리표시자 그대로(null).
  // 실측(10-30): 전환마다 자리표시자 제목이 0.2~0.6초 보였다(암호문 파싱·복호·렌더가 끝나야 제목이 바뀜) → 첫 그림부터 게임 이름이 나오게.
  function prehero(el){
    const q = new URLSearchParams(location.search).get('game');
    const key = GAMES[q] ? q : (GAMES[lastGame()] ? lastGame() : null);
    if (key) hero(el, key);
    return key;
  }
  // base64 → 바이트. Uint8Array.from(atob(s), cb) 는 글자마다 콜백이라 4.6MB 암호문에 120~140ms(10-30 실측) — 내장 fromBase64 는 2ms, for 루프 9ms.
  function b64(s){
    if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(s);
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // 평문 데이터 파일(*-data.js)은 로컬 점검용 — 공개 사이트(GitHub Pages)엔 없어서 404 왕복(파서 차단, 10-30 실측 15~200ms)만 생겼다.
  // file:·localhost 이거나 ?data= 로 명시했을 때만 읽는다.
  function wantsPlain(){
    return location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || new URLSearchParams(location.search).has('data');
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // 게임 전환 포스터 버튼 — 글자는 게임 이름만(일반 보드 화면 테스트가 버튼 글자를 게임 이름과 대조한다)
  const posterBtn = (key, name, selected) => {
    const g = GAMES[key] || {};
    return `<button class="gx-game" type="button" role="tab" aria-selected="${!!selected}" data-g="${esc(key)}" style="--gc:${g.color || 'var(--accent)'}">`
      + (g.icon ? `<img src="${g.icon}" alt="">` : '') + esc(name || g.name || key) + `</button>`;
  };
  return {GAMES, wireTheme, withHash, hero, posterBtn, esc, rememberGame, lastGame, prehero, b64, wantsPlain};
})();
