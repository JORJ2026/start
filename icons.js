/* Shared line-icon set (24px grid, stroke = currentColor). */
const ICON_PATHS = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="2.6"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  swap:'<path d="M7 4 3 8l4 4"/><path d="M3 8h13"/><path d="m17 20 4-4-4-4"/><path d="M21 16H8"/>',
  download:'<path d="M12 4v11"/><path d="m7 9.5 5 5 5-5"/><path d="M5 20h14"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  phone:'<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18h2"/>',
  share:'<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M8 11H6.5A2.5 2.5 0 0 0 4 13.5v5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-5A2.5 2.5 0 0 0 17.5 11H16"/>',
  dots:'<path d="M12 5h.01M12 12h.01M12 19h.01" stroke-width="3"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
  chev:'<path d="m9 6 6 6-6 6"/>',
  inbox:'<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v5.5a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5V13z"/>',
  crown:'<path d="M3 8l4.5 4L12 6l4.5 6L21 8l-2 11H5z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  heart:'<path d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
  leaf:'<path d="M5 19c0-8 5-13.5 15-14-.5 10-6 15-14 15z"/><path d="M5 19 13.5 10.5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  star:'<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6l-5.3 2.8 1.2-6-4.5-4.1 6-.7z"/>',
  gamepad:'<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.5v3M5.5 12h3"/><path d="M15.5 10.8h.01M18 13.3h.01" stroke-width="2.8"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  tv:'<rect x="2.5" y="6.5" width="19" height="13" rx="3"/><path d="m10 10.2 4.6 2.6-4.6 2.6z"/><path d="m8 3.5 4 3 4-3"/>',
  sparkle:'<path d="M11 4.5 12.4 9 17 10.5 12.4 12 11 16.5 9.6 12 5 10.5 9.6 9z"/><path d="M18.5 15.5v4M16.5 17.5h4"/>',
  book:'<path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
  cross:'<path d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z"/>',
  chef:'<path d="M7 13.5A4.5 4.5 0 0 1 8.5 5 5 5 0 0 1 16 5a4.5 4.5 0 0 1 1.5 8.5V20h-11z"/><path d="M7 17h11"/>',
  arrow:'<path d="M7 17 17 7M8 7h9v9"/>',
  notebook:'<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>'
};
export function svgIcon(name){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name]||ICON_PATHS.sparkle) + '</svg>';
}
