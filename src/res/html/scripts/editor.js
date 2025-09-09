
// params: 
// editor container
// initial text
// save callback
// element id for callback
// file controller for images
// TODO controller for links
function makeEditor(container, initialText, saveCallback, updating_id, file_controller) {
  if (!container) return;

  container.classList.add('editor');

  let source = initialText || '';
  container.innerHTML = source;
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

  // ======================================================================
  // CONVERSIONS
  // ======================================================================

  // TODO keep whitespaces

  // async img loading
  async function initialImgLoad() {
    const matches = [...source.matchAll(/\[\[([0-9]*)\]\]/g)];
    const replacements = await Promise.all(
      matches.map(async (match) => {
        const img_id = match[1];
        try {
          const data = await file_controller.load_image(img_id);
          return { match: match[0], replacement: data };
        } catch (error) {
          console.error(`Error loading image ${img_id}:`, error);
          return { match: match[0], replacement: match[0] }; // Return original if error
        }
      })
    );

    let converted = source;
    replacements.forEach(({ match, replacement }) => {
      converted = converted.replace(match, replacement);
    });

    return converted;
  }

  // loaded text to md
  async function initContent() {
    const converted = await initialImgLoad();

    container.innerHTML = converted;
  }

  // editor to markdown
  async function convertToMarkdown() {
    const images = container.querySelectorAll('img');

    images.forEach(img => {
      let alt = img.alt;
      let src = img.src;

      let md_img = ` ![${alt}](${src}) `;

      // replace image
      const parent = img.parentElement;
      if (parent) parent.replaceChild(document.createTextNode(md_img), img);
    });
  }

  // markdown to editor
  async function convertToHTML() {
    // convert images
    let converted = container.innerHTML.replace( /!\[([^\]]*)\]\(([^)\s]+)\)/g, 
      (match, alt, src) => {
        return `<img src="${src}" alt="${alt}" />`;
      }
    );

    container.innerHTML = converted;
  }

  // editor to source for saving
  function convertToText() {
    if (mode !== 'source') return source;
    let result = '';
    
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG') {
                // Add image as link format
                result += ` [[${node.alt}]] `;
            } else {
                // Process all child nodes
                Array.from(node.childNodes).forEach(processNode);
                
                // Add line breaks for block elements
                if (['DIV', 'P', 'BR', 'LI'].includes(node.tagName)) {
                    result += '\n';
                }
            }
        }
    }
    
    Array.from(container.childNodes).forEach(processNode);
    return result.trim();
  }

  // ======================================================================
  // CHANGING STATES
  // ======================================================================

  // render text
  async function safeRender() {
    mode = 'render';

    container.setAttribute('contenteditable', 'false');
    container.classList.remove('active-editor');
    source = convertToText();

    convertToMarkdown().then(() => {
      const rendered = md.render(container.innerText || '');
      const html = sanitizeHtml(rendered);
      container.innerHTML = html || '<div>(empty)</div>';

      container.querySelectorAll('pre code').forEach(cb => {
        if ('highlighted' in cb.dataset) delete cb.dataset.highlighted;
        cb.textContent = cb.textContent;
        hljs.highlightElement(cb);
      });

      if (MathJax?.typesetPromise) MathJax.typesetPromise([container]);
    });
  }

  // show editor
  // TODO keep empty spaces
  function showEditor() {
    mode = 'source';
    convertToHTML();

    container.setAttribute('contenteditable', 'true');
    container.classList.add('active-editor');

    setTimeout(() => {
      container.focus();
      sel = window.getSelection();
      range = sel.getRangeAt(0);
      range.collapse(false);
    }, 0);
  }

  // ======================================================================
  // SAVING
  // ======================================================================

  // debounce logic
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedSave = debounce((val) => {
    if(mode == 'source') val = convertToText();

    saveCallback && saveCallback(val, updating_id);
  }, 500);

  // finishing editing
  function commitEdits() {
    source = convertToText();

    if (saveCallback)
      debouncedSave(source);

    safeRender();
  }

  function cancelEdits() {
    safeRender();
  }

  // saving during edit
  container.addEventListener('input', () => {
    if (mode !== 'source') return;

    source = convertToText();
    debouncedSave(source);
  });

  // editor mode hotkeys
  container.addEventListener('keydown', (e) => {
    if (mode !== 'source') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { 
      e.preventDefault(); 
      commitEdits(); 
    } else if (e.key === 'Escape') { 
      e.preventDefault(); 
      cancelEdits(); 
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // deprecated or something
      document.execCommand('insertText', false, '    ');
    }
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

  // ======================================================================
  // PASTING
  // ======================================================================

  // image pasting
  container.addEventListener('paste', (e) => {
    // Get pasted items
    const items = event.clipboardData?.items;
    if (!items) return;

    // Find image in pasted items
    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        imageItem = items[i];
        break;
      }
    }

    if (!imageItem) return;

    // now process image
    event.preventDefault();

    // Get the image file
    const file = imageItem.getAsFile();
    if (!file) return;

    // convert to 75% q webp
    var result = null;
    processImage(file).then(res => {
      result = res;
      // we got converted file here, saving on backend
      file_controller.save_image(result.base64).then(saved_img => {
        let image = JSON.parse(saved_img);
        if (image.error) {
          console.error(image.error);
          return;
        }

        // make img element
        const img = document.createElement('img');
        img.src = image.base64;
        img.alt = image.id;

        // insert at cursor
        const selection = window.getSelection();
        if(selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);

          // move cursor after element
          const newRange = document.createRange();
          newRange.setStartAfter(img);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          container.appendChild(img);
        }
      });

    }).catch(err => {
      console.error(err);
      return;
    });
  });

  // ======================================================================
  // INIT
  // ======================================================================

  // initial render
  initContent().then(() => {
    safeRender();
  });

  // ======================================================================
  // API
  // ======================================================================

  return {
    getSource: () => source,
    setSource: (s) => { source = String(s || ''); safeRender(); },
    edit: () => { showEditor(); },
    render: () => safeRender(),
    setId: (id) => updating_id = id
  };
}

// ==========================
// actually process image
// ==========================
function processImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Maintain aspect ratio but limit size
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP with 75% quality
        canvas.toBlob(
          (blob) => {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result;
              resolve({
                base64,
                blob,
                width,
                height,
                format: 'webp'
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          'image/webp',
          0.75 // 75% quality
        );
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
