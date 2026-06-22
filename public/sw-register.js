if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

  const showOfflineBanner = () => {
    let b = document.getElementById('ff-offline-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'ff-offline-banner';
      b.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:11px 22px;border-radius:10px;font-size:.8rem;font-weight:500;z-index:9999;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:opacity .3s';
      b.innerHTML = '<i class="fas fa-wifi" style="color:#F59E0B;font-size:.9rem"></i> Sin conexión — mostrando datos guardados';
      document.body.appendChild(b);
    }
    b.style.display = 'flex';
  };

  window.addEventListener('offline', showOfflineBanner);
  window.addEventListener('online', () => {
    const b = document.getElementById('ff-offline-banner');
    if (b) b.style.display = 'none';
  });

  if (!navigator.onLine) showOfflineBanner();
}
