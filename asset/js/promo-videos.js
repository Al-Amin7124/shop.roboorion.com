/**
 * promo-videos.js — ONE place to control the promotional video shown at the
 * top of the right sidebar on every product page.
 *
 * HOW TO CHANGE THE VIDEOS: edit the PROMO_VIDEOS list below, save, push.
 * Every page that loads this file updates automatically — no page edits.
 *
 *   url   (required) YouTube link (watch / youtu.be / shorts / embed all work)
 *                    or a direct video file (.mp4 / .webm) hosted on your site.
 *   title (optional) One-line title shown next to the thumbnail. If left out
 *                    for a YouTube video, the real YouTube title is used.
 *   thumb (optional) Custom thumbnail image. YouTube videos get one
 *                    automatically; only .mp4/.webm files need this.
 *
 * The heading above the video is PROMO_HEADING below ('' hides it).
 *
 * The FIRST video in the list is the big one shown by default. Visitors can
 * click any row underneath to switch to it. Empty list = nothing is shown.
 */
(function () {
    'use strict';

    /* ============================ EDIT HERE ============================ */
    // Heading shown above the video, styled like "New Products". Set to ''
    // (empty) to show no heading.
    const PROMO_HEADING = 'Watch & Learn';

    const PROMO_VIDEOS = [
        
        { url: 'https://youtu.be/kCN95hfRcTg' },
        { url: 'https://youtu.be/BuHLVx6NgZU' },
        { url: 'https://youtu.be/zdQyE7s17gk' },
        { url: 'https://youtu.be/D7kcrrw0I5I' },
   
    ];
    /* =================================================================== */

    const MOUNT_ID = 'promo-video-widget';
    const FALLBACK_TITLE = 'Promotional video';

    function youtubeId(url) {
        if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
        const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    function parseVideo(raw) {
        const url = String((raw && raw.url) || '').trim();
        if (!url) return null;
        const title = String(raw.title || '').trim();
        const thumb = String(raw.thumb || '').trim();
        const yt = youtubeId(url);
        if (yt) return { kind: 'youtube', id: yt, title, thumb };
        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { kind: 'file', src: url, title, thumb };
        console.warn('promo-videos.js: unsupported video link skipped:', url);
        return null;
    }

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(k => {
            if (k === 'text') node.textContent = attrs[k];
            else node.setAttribute(k, attrs[k]);
        });
        (children || []).forEach(c => node.appendChild(c));
        return node;
    }

    function injectStyles() {
        if (document.getElementById('ro-pv-styles')) return;
        const s = document.createElement('style');
        s.id = 'ro-pv-styles';
        s.textContent = `
.ro-pv-card{border:1px solid rgba(229,231,235,.45);border-radius:.75rem;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);margin-bottom:2.5rem;padding:1.25rem;background:#fff}
.ro-pv-heading{margin:0 0 1.5rem;color:#be185d;font-size:1.5rem;line-height:2rem;font-weight:500;text-decoration:underline;text-decoration-thickness:2px;text-decoration-color:#3b82f6;text-underline-offset:8px}
.ro-pv-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:.5rem;overflow:hidden}
.ro-pv-stage iframe,.ro-pv-stage video,.ro-pv-facade{position:absolute;top:0;left:0;width:100%;height:100%;border:0}
.ro-pv-facade{display:block;padding:0;margin:0;cursor:pointer;background:#000}
.ro-pv-facade img{width:100%;height:100%;object-fit:cover;display:block}
.ro-pv-play{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(220,38,38,.92);box-shadow:0 2px 10px rgba(0,0,0,.35);transition:transform .15s}
.ro-pv-play::after{content:'';position:absolute;left:25px;top:19px;border-style:solid;border-width:13px 0 13px 22px;border-color:transparent transparent transparent #fff}
.ro-pv-facade:hover .ro-pv-play{transform:scale(1.08)}
.ro-pv-list{list-style:none;margin:.75rem 0 0;padding:0;display:flex;flex-direction:column;gap:.25rem}
.ro-pv-item{display:flex;align-items:center;gap:.6rem;width:100%;padding:.3rem;border:0;background:none;border-radius:.4rem;cursor:pointer;text-align:left;font:inherit}
.ro-pv-item:hover{background:#f3f4f6}
.ro-pv-item.is-active{background:#eff6ff}
.ro-pv-thumb{flex:0 0 72px;position:relative;aspect-ratio:16/9;border-radius:.3rem;overflow:hidden;background:#1f2937}
.ro-pv-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.ro-pv-title{flex:1;min-width:0;font-size:.82rem;font-weight:600;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
        document.head.appendChild(s);
    }

    function findMount() {
        let mount = document.getElementById(MOUNT_ID);
        if (mount) return mount;
        // No placeholder on this page? Put the widget above the "New Products"
        // card so pages only need the script tag.
        const anchor = document.getElementById('new-products-sidebar');
        const card = anchor && anchor.closest('.rounded-xl');
        if (card && card.parentNode) {
            mount = el('div', { id: MOUNT_ID });
            card.parentNode.insertBefore(mount, card);
            return mount;
        }
        return null;
    }

    function posterFor(v, big) {
        if (v.thumb) return v.thumb;
        if (v.kind === 'youtube') {
            return `https://i.ytimg.com/vi/${v.id}/${big ? 'maxresdefault' : 'mqdefault'}.jpg`;
        }
        return '';
    }

    function thumbImg(v, big) {
        const img = el('img', { src: posterFor(v, big), alt: '', loading: 'lazy', decoding: 'async' });
        if (v.kind === 'youtube' && !v.thumb) {
            // maxresdefault doesn't exist for every video — fall back once.
            img.addEventListener('error', function onErr() {
                img.removeEventListener('error', onErr);
                img.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
            });
        }
        return img;
    }

    function init() {
        const videos = PROMO_VIDEOS.map(parseVideo).filter(Boolean);
        if (!videos.length) {
            console.info('promo-videos.js: loaded, but PROMO_VIDEOS has no valid video links, so nothing is shown. Add a YouTube link to the list at the top of this file.');
            return;
        }
        const mount = findMount();
        if (!mount) {
            console.warn('promo-videos.js: loaded, but could not find a place to show the video (no #promo-video-widget and no #new-products-sidebar on this page).');
            return;
        }

        injectStyles();

        const stage = el('div', { class: 'ro-pv-stage' });
        const list = el('ul', { class: 'ro-pv-list' });
        const rows = [];
        let current = 0;

        function titleOf(v) { return v.title || FALLBACK_TITLE; }

        function showStage(i, autoplay) {
            current = i;
            const v = videos[i];
            stage.textContent = '';
            rows.forEach((r, idx) => r.classList.toggle('is-active', idx === i));

            if (v.kind === 'file') {
                const attrs = { src: v.src, controls: '', playsinline: '', preload: v.thumb ? 'none' : 'metadata' };
                if (v.thumb) attrs.poster = v.thumb;
                const video = el('video', attrs);
                stage.appendChild(video);
                if (autoplay) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
                return;
            }

            function loadPlayer() {
                stage.textContent = '';
                stage.appendChild(el('iframe', {
                    src: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
                    title: titleOf(v),
                    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
                    allowfullscreen: ''
                }));
            }

            if (autoplay) { loadPlayer(); return; }

            // Lightweight "facade": just the thumbnail + play button. The real
            // YouTube player (heavy) only loads if the visitor presses play.
            const facade = el('button', { type: 'button', class: 'ro-pv-facade', 'aria-label': 'Play video: ' + titleOf(v) },
                [thumbImg(v, true), el('span', { class: 'ro-pv-play' })]);
            facade.addEventListener('click', loadPlayer);
            stage.appendChild(facade);
        }

        videos.forEach((v, i) => {
            const thumb = el('span', { class: 'ro-pv-thumb' });
            const poster = posterFor(v, false);
            if (poster) thumb.appendChild(thumbImg(v, false));
            const title = el('span', { class: 'ro-pv-title', text: titleOf(v) });
            const btn = el('button', { type: 'button', class: 'ro-pv-item', title: titleOf(v) }, [thumb, title]);
            btn.addEventListener('click', () => { if (i !== current || !stage.querySelector('iframe, video')) showStage(i, true); });
            rows.push(btn);
            list.appendChild(el('li', {}, [btn]));

            // No title given for a YouTube video? Use its real title.
            if (!v.title && v.kind === 'youtube' && typeof fetch === 'function') {
                fetch('https://www.youtube.com/oembed?format=json&url=' +
                      encodeURIComponent('https://www.youtube.com/watch?v=' + v.id))
                    .then(r => r.ok ? r.json() : null)
                    .then(d => {
                        if (d && d.title) {
                            v.title = d.title;
                            title.textContent = d.title;
                            btn.title = d.title;
                        }
                    })
                    .catch(() => {});
            }
        });

        mount.textContent = '';
        const card = el('div', { class: 'ro-pv-card' });
        if (PROMO_HEADING) card.appendChild(el('h2', { class: 'ro-pv-heading font-ubuntu', text: PROMO_HEADING }));
        card.appendChild(stage);
        card.appendChild(list);
        mount.appendChild(card);
        showStage(0, false);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();