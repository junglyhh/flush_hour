/*
 * Flush Hour: code-native porcelain toilet artwork.
 * Usage: toiletSvg('level-3-node-A', 68.75, 40, 'idle').
 * Supply a unique id for every live instance. Percentages are encoded by the
 * visible height of ochre liquid; the caller owns the numeric percentage label.
 * Modes: idle | flushing | drained. All artwork is inline, with no assets.
 */
function toiletSvg(id, value, threshold, mode = 'idle') {
  const key = 'fh-toilet-' + String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const amount = Math.max(0, Math.min(100, Number(value) || 0));
  const limit = Number(threshold);
  const safe = Number.isFinite(limit) && amount <= limit;
  const stage = ['idle', 'flushing', 'drained'].includes(mode) ? mode : 'idle';
  const level = 94 - (amount / 100) * 52;
  const fillHeight = 94 - level;
  const surfaceY = Math.max(42, level);
  const fmt = n => Number(n.toFixed(3));
  const bubbleOpacity = amount > 8 ? 0.72 : 0;
  const name = amount === 0 ? 'Clean toilet' : `Toilet with ${amount}% waste`;

  return `<svg class="toilet-art ${safe ? 'is-safe' : 'is-over'} is-${stage}" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <title>${name}</title>
    <defs>
      <clipPath id="${key}-bowl"><path d="M50 41C66 41 76 51 74 66C72 83 64 95 50 97C36 95 28 83 26 66C24 51 34 41 50 41Z"/></clipPath>
      <linearGradient id="${key}-porcelain" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffef8"/><stop offset=".56" stop-color="#fffef8"/><stop offset="1" stop-color="#dfede5"/>
      </linearGradient>
      <linearGradient id="${key}-waste" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dba563"/><stop offset="1" stop-color="#b97a45"/>
      </linearGradient>
    </defs>
    <ellipse class="toilet-shadow" cx="50" cy="112" rx="30" ry="4" fill="#234c47" opacity=".10"/>
    <path class="toilet-pedestal" d="M35 88H65L68 109Q50 115 32 109Z" fill="#e0eee6" stroke="#234c47" stroke-width="2.7" stroke-linejoin="round"/>
    <path d="M40 96L39 107Q50 110 61 107L60 96" fill="none" stroke="#fffef8" stroke-width="3" stroke-linecap="round"/>
    <g class="toilet-tank">
      <rect x="24" y="12" width="52" height="29" rx="5" fill="url(#${key}-porcelain)" stroke="#234c47" stroke-width="2.7"/>
      <path d="M30 19V31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <rect x="20" y="6" width="60" height="9" rx="4.5" fill="#fffef8" stroke="#234c47" stroke-width="2.7"/>
      <g class="tank-button">
        <rect x="60" y="22" width="11" height="5" rx="2.5" fill="#88c9bd" stroke="#234c47" stroke-width="1.7"/>
        <path d="M63 23.5H68" stroke="#e3fff5" stroke-width="1.1" stroke-linecap="round"/>
      </g>
    </g>
    <path class="toilet-shell" d="M50 32C74 32 86 47 83 68C81 91 68 105 50 106C32 105 19 91 17 68C14 47 26 32 50 32Z" fill="url(#${key}-porcelain)" stroke="#234c47" stroke-width="2.8"/>
    <path d="M50 41C66 41 76 51 74 66C72 83 64 95 50 97C36 95 28 83 26 66C24 51 34 41 50 41Z" fill="#d8ede7"/>
    <g clip-path="url(#${key}-bowl)">
      <ellipse class="clean-water" cx="50" cy="88" rx="23" ry="10" fill="#99d6cd" opacity=".54"/>
      <g class="waste-column" opacity="${amount > 0 ? 1 : 0}">
        <rect class="waste-fill" x="24" y="${fmt(level)}" width="52" height="${fmt(fillHeight + 4)}" fill="url(#${key}-waste)"/>
        <path class="water-surface" d="M23 ${fmt(surfaceY + 1)}Q35 ${fmt(surfaceY - 2.5)} 48 ${fmt(surfaceY + 1)}T77 ${fmt(surfaceY + 1)}" fill="none" stroke="#f2cc8c" stroke-width="3.5" stroke-linecap="round"/>
        <g class="waste-bubbles" opacity="${bubbleOpacity}" fill="#f5d79b">
          <circle cx="39" cy="${fmt(surfaceY + 9)}" r="2.2"/>
          <circle cx="59" cy="${fmt(surfaceY + 16)}" r="3"/>
          <circle cx="49" cy="${fmt(surfaceY + 26)}" r="1.6"/>
        </g>
      </g>
      <path class="water-wash" d="M22 40H78V99H22Z" fill="#7fd4d0" opacity="0"/>
      <g class="flush-swirl" fill="none" stroke-linecap="round" opacity="0">
        <path d="M66 65C64 53 42 49 35 62C28 75 39 88 53 84C65 80 65 66 53 63C43 60 38 70 44 75C49 79 57 75 53 70" stroke="#fffef8" stroke-width="3.4"/>
        <path d="M34 77C37 84 46 88 55 85M64 58L67 66L60 64" stroke="#d7fff8" stroke-width="2.6"/>
      </g>
    </g>
    <path class="toilet-seat-outline" d="M43 96C28 93 23 75 23 61C23 45 34 37 50 37C66 37 77 45 77 61C77 75 72 93 57 96" fill="none" stroke="#234c47" stroke-width="10.6" stroke-linecap="round"/>
    <path class="toilet-seat" d="M43 96C28 93 23 75 23 61C23 45 34 37 50 37C66 37 77 45 77 61C77 75 72 93 57 96" fill="none" stroke="#fffef8" stroke-width="6.7" stroke-linecap="round"/>
    <path d="M29 58C30 49 37 44 43 43" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    <path d="M37 33V37M63 33V37" stroke="#234c47" stroke-width="3" stroke-linecap="round"/>
    <g class="flush-sparkles" stroke="#399f9b" stroke-width="2" stroke-linecap="round" fill="none" opacity="0">
      <path d="M12 38V45M8.5 41.5H15.5M88 60V69M83.5 64.5H92.5"/>
      <circle cx="85" cy="30" r="2.4"/>
    </g>
  </svg>`;
}

/* Optional CSS; the host may use these hooks for its own animation timeline.
 * Change mode to "flushing", leave the current amount in place for 2 seconds,
 * then replace with toiletSvg(id, 0, threshold, "drained").
 */
const TOILET_VISUAL_CSS = `
.toilet-art{display:block;width:100%;height:auto;overflow:visible;pointer-events:none}
.toilet-art .tank-button{transform-origin:65px 24px}
.toilet-art .flush-swirl{transform-origin:50px 69px}
.toilet-art.is-flushing .tank-button{animation:fh-handle .6s ease-in-out}
.toilet-art.is-flushing .waste-column{transform-origin:50px 98px;animation:fh-drain 1.9s cubic-bezier(.5,.05,.65,1) both}
.toilet-art.is-flushing .water-wash{animation:fh-water 1.9s ease-in-out both}
.toilet-art.is-flushing .flush-swirl{animation:fh-swirl 1.9s ease-in-out both}
.toilet-art.is-flushing .flush-sparkles{animation:fh-sparkles 1.9s ease-in-out both}
.toilet-art.is-drained .flush-sparkles{opacity:1}
@keyframes fh-handle{0%,100%{transform:rotate(0deg)}40%,70%{transform:rotate(18deg)}}
@keyframes fh-drain{0%,12%{transform:scaleY(1);opacity:1}76%{opacity:.85}100%{transform:scaleY(0);opacity:0}}
@keyframes fh-water{0%{opacity:0}20%,65%{opacity:.68}100%{opacity:0}}
@keyframes fh-swirl{0%{opacity:0;transform:rotate(0deg) scale(.9)}15%{opacity:1}75%{opacity:1}100%{opacity:0;transform:rotate(600deg) scale(.22)}}
@keyframes fh-sparkles{0%,15%{opacity:0}35%{opacity:1}60%{opacity:.2}85%,100%{opacity:1}}
@media(prefers-reduced-motion:reduce){.toilet-art.is-flushing .tank-button,.toilet-art.is-flushing .waste-column,.toilet-art.is-flushing .water-wash,.toilet-art.is-flushing .flush-swirl,.toilet-art.is-flushing .flush-sparkles{animation-duration:.01ms;animation-iteration-count:1}}
`;
