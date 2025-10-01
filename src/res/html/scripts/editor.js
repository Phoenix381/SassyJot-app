
// params: 
// editor container
// initial text
// save callback
// element id for callback
// file controller for images
// TODO controller for links
// TODO pass qt channel instead of conrollers
function makeEditor(container, initialText, saveCallback, updating_id, file_controller, note_controller) {
  if (!container) return;

  container.classList.add('editor');
  container.innerHTML = initialText || '<div>(empty)</div>';
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

    // TODO scripting support and styling?
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
               .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
               .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
               .replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  }

  // ======================================================================
  // CONVERSIONS
  // ======================================================================
  // TODO keep whitespaces
  let note_links = [];
  let images = [];

  //             loaded
  //               ||
  //               \/
  //  render <==> edit
  //               ||
  //               \/
  //              save

  // initially loaded from db to edit (+loading resources)
  async function loaded2edit() {
    // load images
    await loadImages();
    // TODO load note links
    // await loadLinks();
  }

  // converting elements to md for render
  let saved_text = '';
  async function edit2render() {
    // save source text
    saved_text = container.innerHTML;

    // converting html images to md
    const images = container.querySelectorAll('img');

    images.forEach(img => {
      let alt = img.alt;
      let src = img.src;

      let md_img = ` ![${alt}](${src}) `;

      // replace image
      const parent = img.parentElement;
      if (parent) parent.replaceChild(document.createTextNode(md_img), img);
    });

    // TODO converting html note links to md
    // const links = Array.from(container.querySelectorAll('a')).filter(a => a.hasAttribute('note-id'));
    // links.forEach(link => {
    //   let note_id = link.getAttribute('note-id');
    //   let md_link = ` [${link.innerText}](${note_id}) `;

    //   // replace link
    //   const parent = link.parentElement;
    //   if (parent) parent.replaceChild(document.createTextNode(md_link), link);
    // });
  }

  // converting md to elements for edit 
  async function render2edit() {
    container.innerHTML = saved_text;
  }

  // converting elements to links for saving (not showing result)
  async function edit2save() {
    if (mode !== 'source') return;

    let result = '';
    
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'IMG') {
          // converting IMG to special format
          result += ` [[${node.alt}]] `;
        } else if (node.tagName === 'A') {
          // TODO converting A note link to special format
          note_id = node.getAttribute('href');
          result += ` {{${note_id}}} `;
        } else {
          // Process all child nodes
          Array.from(node.childNodes).forEach(processNode);
          
          // Add line breaks for block elements
          if (['P', 'BR', 'LI'].includes(node.tagName)) {
              result += '\n';
          }
        }
      }
    }
    
    Array.from(container.childNodes).forEach(processNode);
    return result.trim();
  }

  // ======================================================================
  // LOADING RELATED RESOURCES
  // ======================================================================

  // init img loading
  async function loadImages() {
    let source = container.innerHTML;

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

    replacements.forEach(({ match, replacement }) => {
      source = source.replace(match, replacement);
    });

    container.innerHTML = source;
  }

  // init note link loading
  async function loadLinks() {
    let source = container.innerHTML;

    const matches = [...source.matchAll(/\{\{([0-9]*)\}\}/g)];
    const replacements = await Promise.all(
      matches.map(async (match) => {
        const note_id = match[1];
        try {
          let data = await note_controller.get_note(note_id);
          data = await JSON.parse(data);
          return { match: match[0], replacement: data };
        } catch (error) {
          console.error(`Error loading note ${note_id}:`, error);
          return { match: match[0], replacement: match[0] }; // Return original if error
        }
      })
    );

    replacements.forEach(({ match, replacement }) => {
      replacement = ` [${replacement.name}](${replacement.id}) `;
      source = source.replace(match, replacement);
    });

    container.innerHTML = source;
  }

  // ======================================================================
  // CHANGING STATES
  // ======================================================================

  // render md
  async function render() {
    mode = 'render';

    container.setAttribute('contenteditable', 'false');
    container.classList.remove('active-editor');

    edit2render().then(() => {
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
    render2edit().then(() => {
      container.setAttribute('contenteditable', 'true');
      // TODO check css selection inside
      container.classList.add('active-editor');
    });

    // ???
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
    if(mode !== 'source') return;

    saveCallback && saveCallback(val, updating_id);
  }, 500);

  // finishing editing
  function commitEdits() {
    if (!saveCallback) return;

    edit2save().then((text) => {
      debouncedSave(text);
      render();
    });
  }

  function cancelEdits() {
    render();
  }

  // saving during edit
  container.addEventListener('input', () => {
    if (mode !== 'source') return;

    edit2save().then((text) => {
      debouncedSave(text);
    });
  });

  // TODO temp link to keep current note search?
  let temp_link = null;

  // editor mode input processing
  container.addEventListener('keydown', (e) => {
    if (mode !== 'source') return;

    // hotkeys
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { 
      e.preventDefault();
      commitEdits();
      return;
    } else if (e.key === 'Escape') { 
      e.preventDefault();
      cancelEdits();
      return;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // deprecated or something
      document.execCommand('insertText', false, '    ');
      return;
    }

    // input
    // adding link to another note
    // TODO add div with tooltip and temporarily keep ref to change content on selection
    // TODO add temp search result box then delete it
    if (e.key === '{') {
      let prevChar = container.innerText[container.innerText.length - 1];
      if (prevChar === '{') {
        // remove instead of adding
        e.preventDefault();
        container.innerText = container.innerText.slice(0, -1);

        temp_link = document.createElement('a');
        temp_link.classList.add('note-link');
        temp_link.setAttribute('href', '1');
        temp_link.setAttribute('target', '_blank');
        // TODO remove test content
        temp_link.setAttribute('note-id', '1');
        temp_link.innerHTML = `temp link<div class="tooltiptext">tooltip content</div>`;
        // let displayed = document.createElement('div');
        // let tooltip = document.createElement('div');
        // tooltip.classList.add('tooltiptext');

        // displayed.innerHTML = '{{displayed content}}';
        // tooltip.innerHTML = 'tooltip content';
        
        // temp_link.appendChild(displayed);
        // temp_link.appendChild(tooltip);

        container.appendChild(temp_link);

        // move cursor after element
        const selection = window.getSelection()
        const newRange = document.createRange();
        newRange.setStartAfter(temp_link);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
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
        
        // save after pasting
        edit2save().then((text) => {
          debouncedSave(text);
        });
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
  loaded2edit().then(() => {
    render();
  });

  // ======================================================================
  // API
  // ======================================================================

  return {
    getSource: () => source,
    setSource: (s) => { source = String(s || ''); render(); },
    edit: () => { showEditor(); },
    render: () => render(),
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
