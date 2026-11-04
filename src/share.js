/* Flush Hour sharing: no SDKs, tracking, remote assets, or automatic posts.
 * Integration: include this file at __SHARE_CODE__ before the app closure.
 * Header click: FlushSharing.open(language); optional close(): FlushSharing.close().
 * FlushSharing.isOpen() can guard host shortcuts. The dialog also stops its own
 * key events from reaching host shortcuts. Nothing touches the DOM at startup.
 * Canonical URL intentionally stays fixed when the game runs from a local file.
 * Provider/standard sources reviewed 2026-11-04:
 * Telegram custom URL: https://core.telegram.org/widgets/share
 * WhatsApp click-to-chat: https://faq.whatsapp.com/5913398998672934
 * X current share publisher: https://publish.x.com/
 * LinkedIn official share plugin: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/plugins/share-plugin
 * Web Share activation/cancel semantics: https://www.w3.org/TR/web-share/
 * Meta share documentation: https://developers.facebook.com/docs/plugins/share-button/
 * WeChat JS-SDK reference: https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
 * Meta/WeChat documentation was not fetchable in this environment; LinkedIn's
 * documentation describes its SDK rather than the public share-offsite route.
 * Their standard handoff URLs are not an API delivery guarantee. No SDK or
 * authenticated provider action is used. WeChat deliberately uses QR/copy and
 * its own in-app menu, with no claimed generic one-click web share endpoint.
 */
const FlushSharing = (() => {
  'use strict';
  const CANONICAL_URL = 'https://junglyhh.github.io/flush_hour/';
  const COPY = {
    en: {
      title:'Share a little relief.', intro:'Invite a friend to share the load — and earn the big flush.',
      close:'Close sharing', gameLink:'Game link', copy:'Copy link', copied:'Link copied. Paste it into any chat.',
      manual:'Select and copy the link above, then paste it into your chosen app.',
      native:'More apps…', nativeNote:'Open your device’s share sheet', nativeDone:'Your device handled the share request.',
      canceled:'Sharing canceled. You can choose another option.', unavailable:'This browser could not open sharing. Try an app below or copy the link.',
      socialTitle:'Choose where to share', newTab:'opens a new tab', external:'Finish sharing in the chosen app. You choose the recipient or audience.',
      wechat:'WeChat', showQR:'Show WeChat QR code', hideQR:'Hide WeChat QR code',
      qrTitle:'Scan with WeChat', qrAlt:'QR code for the Flush Hour game',
      qrText:'Scan this code with WeChat on another device, or copy the game link into a chat.',
      wechatMenu:'Already viewing the game in WeChat? Use its ⋯ menu to send the page to a chat or Moments.',
      wechatNote:'The QR code opens the game. Sending to a chat or Moments happens inside WeChat.',
      qrReady:'WeChat QR code shown below.', linkTip:'You can edit or cancel before sending.',
      shareTitle:'Flush Hour · 冲冲大作战', shareText:'A little strategy. A big relief. Can you master all 30 plumbing puzzles in Flush Hour?'
    },
    zh: {
      title:'把畅快分享出去。', intro:'邀请朋友一起分担，解锁最痛快的冲水时刻。',
      close:'关闭分享', gameLink:'游戏链接', copy:'复制链接', copied:'链接已复制，可以粘贴到任意聊天中。',
      manual:'请选中并复制上方链接，再粘贴到你想使用的应用中。',
      native:'更多应用…', nativeNote:'打开设备的系统分享菜单', nativeDone:'已将分享请求交给你的设备处理。',
      canceled:'已取消分享，可以选择其他方式。', unavailable:'此浏览器无法打开系统分享，请选择下方应用或复制链接。',
      socialTitle:'选择分享方式', newTab:'在新标签页中打开', external:'请在所选应用中完成分享，接收人或可见范围由你选择。',
      wechat:'微信', showQR:'显示微信分享二维码', hideQR:'收起微信分享二维码',
      qrTitle:'用微信扫一扫', qrAlt:'冲冲大作战游戏二维码',
      qrText:'用另一台设备的微信扫描此二维码，或复制游戏链接后粘贴到聊天中。',
      wechatMenu:'如果已经在微信里打开游戏，可点击右上角的 ⋯，发送给朋友或分享到朋友圈。',
      wechatNote:'二维码用于打开游戏；发送给朋友或朋友圈需要在微信中完成。',
      qrReady:'微信分享二维码已在下方展开。', linkTip:'发送前可以修改内容，也可以取消。',
      shareTitle:'冲冲大作战 · Flush Hour', shareText:'动一点脑筋，享一冲轻松。来挑战《冲冲大作战》的三十道水管谜题吧！'
    }
  };
  // Static, standards-compliant QR: version 4, error correction M, quiet zone 4.
  // Generated locally with ReportLab's QR encoder for CANONICAL_URL. No QR SDK
  // is shipped. tests/share-qa.cjs independently decodes this matrix to the URL.
  const QR_ROWS = [
    '111111100111011011011011001111111',
    '100000100111111101000010101000001',
    '101110101100010111100000001011101',
    '101110101100001010011111001011101',
    '101110101101100100100000101011101',
    '100000101011001110001100001000001',
    '111111101010101010101010101111111',
    '000000001110101100000110100000000',
    '101111100011111101000010101111100',
    '010101001001001010111101001101101',
    '111010110111000100100100011010110',
    '000111010100001010001111001011111',
    '000110101100100100100100111101011',
    '010010000001111110001010000100011',
    '110011101110000001110101111010110',
    '000001010010111010111101011011100',
    '001111111011101001111011110110001',
    '111001000100100011111001001101110',
    '100000101000100111001010100110110',
    '011111000000100011100001010111100',
    '000111110010000010011111000111001',
    '110110010111111101100000110101001',
    '101010100011000111001100001111010',
    '100011001101010100100100101101101',
    '101001100001110101000000111111010',
    '000000001100000000111100100010101',
    '111111100011010110101101101010110',
    '100000101000100010011111100011111',
    '101110101100101000100100111111000',
    '101110101001100111001011110011101',
    '101110101011100000110011111101100',
    '100000100111100010011100111011100',
    '111111101001101001010011001101010'
  ];
  const STYLE = `
  dialog.fh-share-dialog{width:510px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);padding:0;box-sizing:border-box;border:1.5px solid #9cbaa8;border-radius:25px;color:#214b47;background:#fffef7;box-shadow:0 24px 90px #183e4433;overflow:auto;text-align:left;overscroll-behavior:contain;font-family:inherit}
  dialog.fh-share-dialog::backdrop{background:#163b4266;backdrop-filter:blur(5px)}
  .fh-share-dialog .fh-share-body{padding:27px;position:relative}.fh-share-dialog .fh-share-eyebrow{font-size:10px;font-weight:900;letter-spacing:1.8px;color:#58716b;margin:0 38px 9px 0}.fh-share-dialog h2{font-size:28px;line-height:1.16;letter-spacing:-.7px;margin:0 28px 11px 0;color:#214b47}.fh-share-dialog p{margin:0}.fh-share-dialog .fh-share-intro{font-size:13px;line-height:1.6;color:#58716b;margin-bottom:18px}
  .fh-share-dialog .fh-share-close{position:absolute;right:14px;top:14px;width:34px;height:34px;padding:0;border:1px solid #cfddce;border-radius:50%;background:#fffdf5;font-size:23px;line-height:1;box-shadow:none;color:#214b47;display:grid;place-items:center}
  .fh-share-dialog button,.fh-share-dialog a{font:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.fh-share-dialog button{cursor:pointer}.fh-share-dialog button:focus-visible,.fh-share-dialog a:focus-visible,.fh-share-dialog input:focus-visible{outline:3px solid #b45a35;outline-offset:3px}.fh-share-dialog button:disabled{opacity:.55;cursor:wait}.fh-share-dialog .fh-share-link-label,.fh-share-dialog .fh-share-section-title{display:block;font-size:11px;font-weight:900;color:#58716b;letter-spacing:.45px;margin:0 0 7px}
  .fh-share-dialog .fh-share-copy-row{display:flex;gap:7px;margin-bottom:13px;align-items:stretch}.fh-share-dialog .fh-share-link{min-width:0;width:100%;flex:1;border:1px solid #c6d6c5;border-radius:10px;background:#f5f6e9;padding:11px 10px;font-family:inherit;font-size:12px;line-height:1.5;color:#214b47;-webkit-user-select:text;user-select:all;box-shadow:none}.fh-share-dialog .fh-share-copy{flex-shrink:0;min-height:43px;padding:9px 12px;font-size:12px;font-weight:800;color:#214b47;background:#f3cb63;border:1px solid #c5a74e;border-radius:10px;box-shadow:none;white-space:nowrap}
  .fh-share-dialog .fh-share-native{width:100%;display:flex;justify-content:center;align-items:center;gap:9px;border:1px solid #165e56;border-radius:12px;background:#165e56;color:#fffef7;padding:12px;margin:0 0 18px;font-size:13px;font-weight:900;min-height:45px;box-shadow:none}.fh-share-dialog .fh-share-native svg{width:18px;height:18px;flex-shrink:0}.fh-share-dialog .fh-share-native:hover{background:#114c45}
  .fh-share-dialog .fh-share-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:11px}.fh-share-dialog .fh-share-option{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:78px;padding:10px 5px;border:1px solid #ccdbcb;border-radius:12px;background:#f7f8ed;text-decoration:none;color:#214b47;font-size:11px;font-weight:800;line-height:1.2;box-shadow:none;text-align:center}.fh-share-dialog .fh-share-option:hover,.fh-share-dialog .fh-share-option[aria-expanded=true]{background:#e1efdc;border-color:#8bb19b}.fh-share-dialog .fh-share-monogram{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:#fffef7;color:#214b47;font-size:18px;font-weight:900;font-family:Arial,sans-serif;line-height:1}.fh-share-dialog .fh-share-monogram svg{width:23px;height:23px}
  .fh-share-dialog .fh-share-qr-panel{border:1px solid #bbd5bf;border-radius:15px;background:#edf5e9;padding:16px;margin-top:14px;text-align:center}.fh-share-dialog .fh-share-qr-panel[hidden]{display:none}.fh-share-dialog .fh-share-qr-panel h3{font-size:16px;line-height:1.4;margin:0 0 12px}.fh-share-dialog .fh-share-qr{display:block;width:205px;height:205px;max-width:100%;margin:0 auto 12px;background:white;border-radius:8px;box-shadow:0 2px 0 #214b4714}.fh-share-dialog .fh-share-qr-text{font-size:12px;line-height:1.6;color:#466b5c;margin-top:9px}.fh-share-dialog .fh-share-qr-note{font-size:10px;line-height:1.6;color:#58716b;margin-top:10px}.fh-share-dialog .fh-share-status{font-size:11px;line-height:1.5;min-height:17px;color:#436958;margin:11px 0 0}.fh-share-dialog .fh-share-tip{font-size:10px;line-height:1.45;color:#6a7d70;margin-top:7px}
  @media(max-width:370px){.fh-share-dialog .fh-share-body{padding:23px 17px}.fh-share-dialog h2{font-size:25px}.fh-share-dialog .fh-share-grid{gap:6px}.fh-share-dialog .fh-share-option{font-size:10px;min-height:75px}.fh-share-dialog .fh-share-copy{font-size:11px;padding:9px}.fh-share-dialog .fh-share-link{font-size:11px;padding:10px 8px}.fh-share-dialog .fh-share-qr-panel{padding:12px}}
  `;
  const ICONS = {
    native:'<path d="M12 16V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
    wechat:'<path d="M14.3 14.8c-1.7 1.3-4.3 1.7-6.4 1l-3.2 1 .8-2.7C1 9.8 4.6 4 10.5 4c4.3 0 7.6 2.8 7.4 6.2"/><path d="M20 18.4l.7 2.2-2.5-.8c-5.6 1.6-9.8-3.6-5.9-7 3.8-3.3 10.4-.2 9.1 3.8-.3.7-.7 1.3-1.4 1.8Z"/><path d="M7.7 8.8h.1m4.3 0h.1m2.8 6.2h.1m3.2 0h.1"/>',
    whatsapp:'<path d="M5 19.5l-2.1 1.1.7-4C-.1 8.3 7.4.8 15.3 4.3c7.9 3.6 6.9 14.7-1.8 16.3-2.9.5-5.7.1-8.5-1.1Z"/><path d="M8 7c-3 4 5 12 9 8l-2.5-2-1.4 1c-2-1-3-2-4-4L10 9Z"/>',
    telegram:'<path d="m3 11 18-7-4 16-6-5-3 3 1-6 8-5-11 7Z"/>'
  };
  let dialog=null, language='en', returnFocus=null, nativeBusy=false, epoch=0;
  const lang = value => value === 'zh' || value === 'zh-CN' ? 'zh' : 'en';
  const text = () => COPY[language];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svgIcon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||''}</svg>`;
  function getShareData(locale='en') {const c=COPY[lang(locale)];return {title:c.shareTitle,text:c.shareText,url:CANONICAL_URL};}
  function getLinks(locale='en') {
    const c=COPY[lang(locale)],url=encodeURIComponent(CANONICAL_URL),message=encodeURIComponent(c.shareText);
    return {
      facebook:`https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x:`https://x.com/intent/tweet?url=${url}&text=${message}`,
      whatsapp:`https://wa.me/?text=${encodeURIComponent(c.shareText+' '+CANONICAL_URL)}`,
      telegram:`https://t.me/share/url?url=${url}&text=${message}`,
      linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };
  }
  function qrSvg(locale='en') {
    const c=COPY[lang(locale)];let d='';
    QR_ROWS.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='1')d+=`M${x+4} ${y+4}h1v1h-1z`;});
    return `<svg class="fh-share-qr" viewBox="0 0 41 41" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(c.qrAlt)}" shape-rendering="crispEdges"><title>${esc(c.qrAlt)}</title><rect width="41" height="41" fill="#fff"/><path d="${d}" fill="#173e35"/></svg>`;
  }
  function canNativeShare() {
    if(typeof navigator==='undefined'||typeof navigator.share!=='function'||(typeof window!=='undefined'&&window.isSecureContext===false))return false;
    try{return typeof navigator.canShare!=='function'||navigator.canShare(getShareData(language));}catch(e){return false;}
  }
  function status(message) {const node=dialog?.querySelector('#fhShareStatus');if(node)node.textContent=message;}
  function markup() {
    const c=text(),links=getLinks(language);
    const option=(key,label,mark)=>`<a class="fh-share-option" href="${esc(links[key])}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-fh-share-external="${key}" aria-label="${esc(label+' · '+c.newTab)}"><span class="fh-share-monogram" aria-hidden="true">${mark}</span><span>${label}</span></a>`;
    return `<div class="fh-share-body"><button type="button" class="fh-share-close" data-fh-share-action="close" aria-label="${c.close}">×</button><div class="fh-share-eyebrow">FLUSH HOUR</div><h2 id="fhShareTitle">${c.title}</h2><p class="fh-share-intro" id="fhShareIntro">${c.intro}</p><label class="fh-share-link-label" for="fhShareLink">${c.gameLink}</label><div class="fh-share-copy-row"><input class="fh-share-link" id="fhShareLink" type="url" readonly spellcheck="false" autocapitalize="off" value="${CANONICAL_URL}"/><button type="button" class="fh-share-copy" data-fh-share-action="copy">${c.copy}</button></div>${canNativeShare()?`<button type="button" class="fh-share-native" data-fh-share-action="native" title="${c.nativeNote}">${svgIcon('native')}${c.native}</button>`:''}<div class="fh-share-section-title">${c.socialTitle}</div><div class="fh-share-grid"><button type="button" class="fh-share-option" data-fh-share-action="wechat" aria-controls="fhShareWechat" aria-expanded="false" aria-label="${c.showQR}"><span class="fh-share-monogram" aria-hidden="true">${svgIcon('wechat')}</span><span>${c.wechat}</span></button>${option('facebook','Facebook','f')}${option('x','X / Twitter','𝕏')}${option('whatsapp','WhatsApp',svgIcon('whatsapp'))}${option('telegram','Telegram',svgIcon('telegram'))}${option('linkedin','LinkedIn','in')}</div><p class="fh-share-tip">${c.linkTip}</p><section class="fh-share-qr-panel" id="fhShareWechat" aria-labelledby="fhShareWechatTitle" hidden><h3 id="fhShareWechatTitle">${c.qrTitle}</h3>${qrSvg(language)}<p class="fh-share-qr-text">${c.qrText}</p><p class="fh-share-qr-text">${c.wechatMenu}</p><p class="fh-share-qr-note">${c.wechatNote}</p></section><p class="fh-share-status" id="fhShareStatus" role="status" aria-live="polite" aria-atomic="true"></p></div>`;
  }
  function restoreFocus() {
    const target=returnFocus;returnFocus=null;nativeBusy=false;
    if(target&&target.isConnected!==false&&typeof target.focus==='function')target.focus({preventScroll:true});
  }
  function ensure() {
    if(dialog)return;
    const sheet=document.createElement('style');sheet.id='fh-share-style';sheet.textContent=STYLE;document.head.appendChild(sheet);
    dialog=document.createElement('dialog');dialog.id='fhShareDialog';dialog.className='fh-share-dialog';dialog.setAttribute('aria-labelledby','fhShareTitle');dialog.setAttribute('aria-describedby','fhShareIntro');
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('close',()=>{if(!dialog.open){epoch++;restoreFocus();}});
    dialog.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(event.key==='Escape'){event.preventDefault();close();}
    });
    dialog.addEventListener('click',event=>{
      const target=event.target;
      if(target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();return;}
      if(target?.closest?.('[data-fh-share-external]')){status(text().external);return;}
      if(target?.closest?.('#fhShareLink')){selectLink();return;}
      const button=target?.closest?.('[data-fh-share-action]');if(!button)return;
      const action=button.getAttribute('data-fh-share-action');
      if(action==='close')close();
      else if(action==='copy')copyLink();
      else if(action==='wechat')toggleWechat();
      else if(action==='native')shareNative();
    });
    document.body.appendChild(dialog);
  }
  function open(locale='en') {
    ensure();language=lang(locale);epoch++;nativeBusy=false;
    if(!dialog.open&&!returnFocus)returnFocus=document.activeElement;
    dialog.lang=language==='zh'?'zh-CN':'en';dialog.innerHTML=markup();
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;dialog.querySelector('[data-fh-share-action="close"]')?.focus({preventScroll:true});
  }
  function close() {if(dialog?.open)dialog.close();}
  function isOpen() {return Boolean(dialog?.open);}
  function selectLink() {const input=dialog?.querySelector('#fhShareLink');if(!input)return;input.focus({preventScroll:true});input.select();input.setSelectionRange?.(0,CANONICAL_URL.length);}
  async function copyLink() {
    const token=epoch;
    try {
      if(typeof navigator==='undefined'||!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(CANONICAL_URL);
      if(token===epoch&&isOpen())status(text().copied);
      return true;
    } catch(e) {
      if(token!==epoch||!isOpen())return false;
      selectLink();let copied=false;
      try{copied=typeof document.execCommand==='function'&&document.execCommand('copy')===true;}catch(ignored){}
      status(copied?text().copied:text().manual);
      if(copied)dialog.querySelector('[data-fh-share-action="copy"]')?.focus({preventScroll:true});
      return copied;
    }
  }
  function toggleWechat() {
    const panel=dialog?.querySelector('#fhShareWechat'),button=dialog?.querySelector('[data-fh-share-action="wechat"]');if(!panel||!button)return;
    panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));button.setAttribute('aria-label',panel.hidden?text().showQR:text().hideQR);
    status(panel.hidden?'':text().qrReady);
    if(!panel.hidden)panel.scrollIntoView?.({block:'nearest',behavior:'auto'});
  }
  async function shareNative() {
    if(nativeBusy)return;
    if(!canNativeShare()){status(text().unavailable);return;}
    const token=epoch,button=dialog?.querySelector('[data-fh-share-action="native"]');nativeBusy=true;if(button)button.disabled=true;
    try {
      // Invoke directly within the click event, before any asynchronous work.
      await navigator.share(getShareData(language));
      if(token===epoch&&isOpen())status(text().nativeDone);
    } catch(error) {
      if(token===epoch&&isOpen())status(error?.name==='AbortError'?text().canceled:text().unavailable);
    } finally {if(token===epoch){nativeBusy=false;if(button)button.disabled=false;}}
  }
  return Object.freeze({open,close,isOpen,getLinks,getShareData,qrSvg,canonicalUrl:CANONICAL_URL});
})();
