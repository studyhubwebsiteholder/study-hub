(function(){
// Minimal runtime: handles navigation, proxy framing, settings, keyboard shortcuts.
    (function(){
      const engines = {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        brave: 'https://search.brave.com/search?q='
      };
      const urlInput = document.getElementById('urlInput');
      const status = document.getElementById('status');
      const proxyContainer = document.getElementById('proxyContainer');
      const proxyFrame = document.getElementById('proxyFrame');
      const quickLinks = document.getElementById('quickLinks');
      const themeSelect = document.getElementById('themeSelect');
      let currentEngine = 'google';
      let panicEnabled = true;
      let cloakEnabled = false;
      let currentUrl = '';

      function showStatus(msg, type='') {
        status.textContent = msg;
        status.className = 'status show ' + type;
        if (type !== 'loading') setTimeout(()=> status.classList.remove('show'), 4000);
      }

      document.querySelectorAll('.engine-btn').forEach(b=>{
        b.addEventListener('click', ()=>{
          document.querySelectorAll('.engine-btn').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          currentEngine = b.dataset.engine;
        });
      });

      function resolveInput(input) {
        input = input.trim();
        if (!input) return '';
        if (/^https?:\/\//i.test(input)) return input;
        if (input.includes('.') && !input.includes(' ')) return 'https://' + input;
        return engines[currentEngine] + encodeURIComponent(input);
      }

      function loadProxy(url) {
        if (!url) return;
        showStatus('🔄 Loading...', 'loading');
        // Use internal worker proxy: /proxy?url=ENCODED (deployed separately if you choose)
        const workerProxy = '/cdn-cgi/rum?url=' + encodeURIComponent(url); // fallback non-proxy path to avoid 3rd-party dependence
        // Prefer deploying worker-proxy.js to support /proxy?url=...
        proxyFrame.src = '/proxy?url=' + encodeURIComponent(url);
        proxyContainer.classList.add('active');
        quickLinks.style.display = 'none';
        proxyContainer.setAttribute('aria-hidden','false');
      }

      document.getElementById('goBtn').addEventListener('click', ()=>{
        const value = urlInput.value;
        const url = resolveInput(value);
        currentUrl = url;
        loadProxy(url);
      });

      urlInput.addEventListener('keypress', e=> {
        if (e.key === 'Enter') document.getElementById('goBtn').click();
      });

      document.getElementById('backBtn').addEventListener('click', ()=> {
        try { proxyFrame.contentWindow.history.back(); } catch(e){ showStatus('⚠️ Cannot go back in iframe','error'); }
      });
      document.getElementById('forwardBtn').addEventListener('click', ()=> {
        try { proxyFrame.contentWindow.history.forward(); } catch(e){ showStatus('⚠️ Cannot go forward in iframe','error'); }
      });
      document.getElementById('reloadBtn').addEventListener('click', ()=> {
        showStatus('🔄 Reloading...','loading'); proxyFrame.src = proxyFrame.src;
      });
      document.getElementById('homeBtn').addEventListener('click', ()=> {
        proxyContainer.classList.remove('active'); quickLinks.style.display = 'grid'; proxyContainer.setAttribute('aria-hidden','true'); urlInput.value=''; status.classList.remove('show');
      });
      document.getElementById('fullscreenBtn').addEventListener('click', ()=> {
        if (proxyFrame.requestFullscreen) proxyFrame.requestFullscreen();
      });

      quickLinks.querySelectorAll('.quick-link').forEach(el=>{
        el.addEventListener('click', ()=> {
          urlInput.value = el.dataset.url;
          document.getElementById('goBtn').click();
        });
      });

      // Cloak toggle
      document.getElementById('cloakToggle').addEventListener('click', ()=> {
        cloakEnabled = !cloakEnabled;
        if (cloakEnabled) { document.title='Classes'; showStatus('🎭 Tab cloaking enabled','success'); }
        else { document.title='Study Hub — Learning Portal'; showStatus('🎭 Tab cloaking disabled','success'); }
      });

      // Panic toggle
      const panicBtn = document.getElementById('panicToggle');
      panicBtn.addEventListener('click', ()=> {
        panicEnabled = !panicEnabled;
        panicBtn.textContent = panicEnabled ? 'Enabled' : 'Disabled';
        panicBtn.setAttribute('aria-pressed', String(panicEnabled));
        showStatus(panicEnabled ? '🔒 Panic key enabled' : '🔒 Panic key disabled','success');
      });

      document.addEventListener('keydown', (e)=> {
        if (e.key === 'Escape' && panicEnabled) {
          window.location.href = 'https://classroom.google.com';
        }
      });

      // Theme handling
      themeSelect.addEventListener('change', ()=> {
        document.documentElement.setAttribute('data-theme', themeSelect.value);
        localStorage.setItem('studyhub-theme', themeSelect.value);
      });
      const savedTheme = localStorage.getItem('studyhub-theme');
      if (savedTheme) { themeSelect.value = savedTheme; document.documentElement.setAttribute('data-theme', savedTheme); }

      // Service worker registration (safer registration with versioning)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw-cache.js?v=1.0.0').then(()=>{
          console.log('Service worker registered (enhanced)');
        }).catch(err=>{
          console.warn('SW registration failed', err);
        });
      }

      // Restore last visited
      window.addEventListener('load', ()=>{
        const last = localStorage.getItem('studyhub-lastUrl');
        if (last) urlInput.value = last;
      });
      window.addEventListener('beforeunload', ()=>{ if (currentUrl) localStorage.setItem('studyhub-lastUrl', currentUrl); });
    })();
})();
