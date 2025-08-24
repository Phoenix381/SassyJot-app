
function makeEditor(container, initialText, saveCallback, updating_id) {
  if (!container) return;

  container.classList.add('editor');

  let source = initialText || '';
  let mode = 'render';
  let editingPartial = false;
  let selectedFragment = '';
  let partialIndex = -1;
  let saveTimer = null;

  const ta = document.createElement('textarea');
  ta.classList.add('editor-textarea');

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

  async function safeRender(text) {
    mode = 'render';
    editingPartial = false;
    selectedFragment = '';
    partialIndex = -1;

    container.classList.remove('active-editor');

    const html = sanitizeHtml(md.render(text || ''));
    container.innerHTML = html || '<div class="text-muted">(empty)</div>';

    container.querySelectorAll('pre code').forEach(cb => {
      if ('highlighted' in cb.dataset) delete cb.dataset.highlighted;
      cb.textContent = cb.textContent;
      hljs.highlightElement(cb);
    });

    if (MathJax?.typesetPromise) await MathJax.typesetPromise([container]);
  }

  function selectionInsideContainer() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return false;
    return container.contains(sel.anchorNode) && container.contains(sel.focusNode);
  }

  function showEditor() {
    mode = 'source';
    container.innerHTML = '';
    container.classList.add('active-editor');
    container.appendChild(ta);
    ta.value = source;

    if (editingPartial && selectedFragment) {
      let idx = partialIndex >= 0 ? partialIndex : ta.value.indexOf(selectedFragment);
      if (idx >= 0) {
        ta.selectionStart = idx;
        ta.selectionEnd = idx + selectedFragment.length;
      }
    }
    setTimeout(() => ta.focus(), 0);
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
    source = ta.value;
    if (saveCallback)
      debouncedSave(source);

    safeRender(source);
  }

  function cancelEdits() {
    safeRender(source);
  }

  // saving during edit
  ta.addEventListener('input', () => {
    source = ta.value;
    debouncedSave(source);
  });

  // editor mode hotkeys
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); commitEdits(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdits(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, epos = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '\t' + ta.value.slice(epos);
      ta.selectionStart = ta.selectionEnd = s + 1;
    }
  });

  // losing focus in editor mode
  ta.addEventListener('blur', () => { 
    setTimeout(() => {
      // still doesnt have focus - qt overelay guard
      if (mode === 'source' && document.activeElement !== ta) {  
        commitEdits();
      }
    }, 50);
  });

  // double click on editor
  container.addEventListener('dblclick', () => {
    if (mode !== 'render') return;
    const sel = window.getSelection();
    const text = (sel && !sel.isCollapsed && selectionInsideContainer()) ? sel.toString() : '';
    if (text) {
      editingPartial = true;
      selectedFragment = text;
      partialIndex = source.indexOf(selectedFragment);
    }
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
