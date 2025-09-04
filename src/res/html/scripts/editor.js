
function makeEditor(container, initialText, saveCallback, updating_id) {
  if (!container) return;

  container.classList.add('editor');

  let source = initialText || '';
  let mode = 'render';

  // init md renderer
  const md = markdownit({
    html: false,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      const esc = markdownit().utils.escapeHtml(str);
      try {
        if (lang && hljs.getLanguage(lang)) {
          return '<pre><code class="hljs language-' + md.utils.escapeHtml(lang) + '" data-highlighted="yes">' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
        }
        return '<pre><code class="hljs" data-highlighted="yes">' + hljs.highlightAuto(str).value + '</code></pre>';
      } catch {
        return '<pre><code class="hljs">' + esc + '</code></pre>';
      }
    }
  });

  function sanitizeHtml(html) {
    if (window.DOMPurify) return DOMPurify.sanitize(html);
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
               .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
               .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
               .replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  }

  // render text
  async function safeRender(text) {
    mode = 'render';

    container.setAttribute('contenteditable', 'false');
    container.classList.remove('active-editor');

    const html = sanitizeHtml(md.render(text || ''));
    container.innerHTML = html || '<div>(empty)</div>';

    container.querySelectorAll('pre code').forEach(cb => {
      if ('highlighted' in cb.dataset) delete cb.dataset.highlighted;
      cb.textContent = cb.textContent;
      hljs.highlightElement(cb);
    });

    if (MathJax?.typesetPromise) await MathJax.typesetPromise([container]);
  }

  // show editor
  function showEditor() {
    mode = 'source';
    container.setAttribute('contenteditable', 'true');
    container.classList.add('active-editor');
    container.innerText = source;

    setTimeout(() => container.focus(), 0);
  }

  // debounce logic
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedSave = debounce((val) => {
    saveCallback && saveCallback(val, updating_id);
  }, 500);

  // finishing editing
  function commitEdits() {
    source = container.innerText;

    if (saveCallback)
      debouncedSave(source);

    safeRender(source);
  }

  function cancelEdits() {
    safeRender(source);
  }

  // saving during edit
  container.addEventListener('input', () => {
    if (mode !== 'source') return;

    source = container.innerText;
    debouncedSave(source);
  });

  // editor mode hotkeys
  container.addEventListener('keydown', (e) => {
    if (mode !== 'source') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); commitEdits(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdits(); }
  });

  // losing focus in editor mode
  container.addEventListener('blur', () => { 
    setTimeout(() => {
      // still doesnt have focus - qt overelay guard
      if (mode === 'source' && document.activeElement !== container) {  
        commitEdits();
      }
    }, 50);
  });

  // double click on editor
  container.addEventListener('dblclick', () => {
    if (mode !== 'render') return;

    showEditor();
  });

  // initial render
  safeRender(source);

  // TODO: api to interact with editor
  return {
    getSource: () => source,
    setSource: (s) => { source = String(s || ''); safeRender(source); },
    edit: () => { showEditor(); },
    render: () => safeRender(source),
    setId: (id) => updating_id = id
  };
}
