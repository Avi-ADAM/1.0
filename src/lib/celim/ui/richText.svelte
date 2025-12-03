<script>
  import { lang } from '$lib/stores/lang';
  import { onMount, onDestroy } from 'svelte';
  import List from '$lib/celim/icons/list.svelte';
  import { Editor } from '@tiptap/core';
  import TextAlign from '@tiptap/extension-text-align';
  import Link from '@tiptap/extension-link';
  import Highlight from '@tiptap/extension-highlight';
  import FloatingMenu from '@tiptap/extension-floating-menu';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import LinkIcon from '../icons/linkIcon.svelte';
  import Separator from './separator.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [outpot] - יכול להיות מחרוזת HTML או המערך מסטראפי
   * @property {boolean} [showJson]
   * @property {any} [outjson]
   * @property {any} [strapiJson] - אופציונלי: אם רוצים להעביר את ה-JSON בנפרד
   * @property {boolean} [trans]
   * @property {boolean} [editable]
   * @property {boolean} [sml]
   * @property {boolean} [minw]
   */

  /** @type {Props} */
  let {
    outpot = $bindable(``),
    showJson = false,
    outjson = $bindable([]),
    strapiJson = null, // אופציונלי, למקרה שרוצים להפריד
    trans = false,
    editable = true,
    sml = false,
    minw = false
  } = $props();

  let element = $state();
  let editor = $state();
  let menu = $state();

  // --- פונקציית המרה מסטראפי ל-HTML ---
  function parseStrapiToHtml(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';
    
    return blocks.map(block => {
      // 1. פסקאות (Paragraphs)
      if (block.type === 'paragraph') {
        const childrenHtml = block.children ? block.children.map(parseChild).join('') : '';
        return childrenHtml ? `<p>${childrenHtml}</p>` : '<p><br></p>';
      }
      
      // 2. כותרות (Headings)
      if (block.type === 'heading') {
        const level = block.level || 1;
        const childrenHtml = block.children ? block.children.map(parseChild).join('') : '';
        return `<h${level}>${childrenHtml}</h${level}>`;
      }

      // 3. רשימות (Lists)
      if (block.type === 'list') {
        const tag = block.format === 'ordered' ? 'ol' : 'ul';
        const items = block.children ? block.children.map(item => {
            const itemContent = item.children.map(parseChild).join('');
            return `<li>${itemContent}</li>`;
        }).join('') : '';
        return `<${tag}>${items}</${tag}>`;
      }

      return '';
    }).join('');
  }

  // פונקציית עזר לפרסור הילדים (Text nodes, Links)
  function parseChild(child) {
    if (!child) return '';

    // טיפול בלינקים (Link node)
    if (child.type === 'link') {
        const linkText = child.children ? child.children.map(c => c.text).join('') : '';
        return `<a href="${child.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    }

    // טיפול בטקסט רגיל (Text node)
    let text = child.text || '';
    
    // החלפת ירידות שורה
    text = text.replace(/\n/g, '<br>');

    // עיצובים
    if (child.bold) text = `<strong>${text}</strong>`;
    if (child.italic) text = `<em>${text}</em>`;
    if (child.underline) text = `<u>${text}</u>`;
    if (child.strikethrough) text = `<s>${text}</s>`;
    if (child.code) text = `<code>${text}</code>`;
    
    return text;
  }

  // --- פונקציית הקסם: זיהוי אוטומטי ---
  function resolveInitialContent() {
    // 1. בדיקה אם הוזן JSON במפורש בפרופ הייעודי
    if (strapiJson && Array.isArray(strapiJson) && strapiJson.length > 0) {
        return parseStrapiToHtml(strapiJson);
    }

    // 2. בדיקה אם ה-output עצמו הוא מערך (Strapi Format passed to output)
    if (Array.isArray(outpot)) {
        return parseStrapiToHtml(outpot);
    }

    // 3. בדיקה אם זה מחרוזת שנראית כמו JSON (מקרי קצה)
    if (typeof outpot === 'string' && outpot.trim().startsWith('[') && outpot.trim().endsWith(']')) {
        try {
            const parsed = JSON.parse(outpot);
            if (Array.isArray(parsed)) return parseStrapiToHtml(parsed);
        } catch (e) {
            // לא JSON תקין, נמשיך הלאה
        }
    }

    // 4. ברירת מחדל: זה כנראה HTML רגיל או ריק
    return outpot || '';
  }

  onMount(() => {
    // חישוב התוכן ההתחלתי בצורה חכמה
    const initialContent = showJson ? outjson : resolveInitialContent();

    // אם קיבלנו מערך ב-outpot, נעדכן אותו ל-HTML מיד כדי למנוע בעיות סנכרון בהמשך
    if (Array.isArray(outpot)) {
        outpot = initialContent;
    }

    editor = new Editor({
      element: element,
      editable: editable,
      content: initialContent, // התוכן המעובד
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none custom-prose'
        }
      },
      parseOptions: {
        preserveWhitespace: 'full'
      },
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-barbi underline decoration-gold',
          },
        }),
        Highlight.configure({
          multicolor: true
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'right', 'center', 'justify'],
          defaultAlignment: $lang == 'he' ? 'right' : 'left'
        }),
        Underline,
        FloatingMenu.configure({
          element: menu
        })
      ],
      onTransaction: () => {
        editor = editor;
        const html = editor.getHTML();
        const jsonc = editor.getJSON();
        outjson = jsonc;
        outpot = html; // תמיד מחזיר HTML החוצה
      }
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  // --- הגדרות שפה ואייקונים ---
  const spaceLeb = { he: 'רווח', en: 'Space' };
  const lineLeb = { he: 'קו מפריד', en: 'Line' };
  const quoteLeb = { he: 'ציטוט', en: 'Quote' };
  const listNLeb = { he: '1. רשימה', en: 'List 1.' };
  const listLeb = { he: ` רשימה`, en: `List` };
  const linkPro = { he: 'כתובת קישור', en: 'Enter URL' };
  const parLeb = { he: `<p>פסקה</p>`, en: `<p>Paragraph</p>` };
  const h1Leb = { he: `<h1>כותרת</h1>`, en: `<h1>Header</h1>` };
  const h3Leb = { he: `<h3>כותרת משנית</h3>`, en: `<h3>Sub Header</h3>` };
  const bet = { he: 'ב', en: 'B' };

  let hide = $state(true);
  let active = $state(parLeb[$lang]);
  let hides = $state(true);

  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt(linkPro[$lang], previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  // אייקונים נקיים ב-SVG
  const leftsvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H3a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>`;
  const rightsvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 5a1 1 0 00-1-1H3a1 1 0 000 2h14a1 1 0 001-1zm0 4a1 1 0 00-1-1H3a1 1 0 000 2h14a1 1 0 001-1zm0 4a1 1 0 00-1-1H3a1 1 0 000 2h14a1 1 0 001-1zm0 4a1 1 0 00-1-1H9a1 1 0 000 2h8a1 1 0 001-1z" clip-rule="evenodd"/></svg>`;
  const centersvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>`;
  const justifysvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>`;

  let actives = $state($lang == 'he' ? rightsvg : leftsvg);
  let show = $state(false);
</script>

<div
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  class="editor-wrapper rounded-lg transition-all duration-300 {minw ? 'max-w-[50vw]' : ''} {trans ? 'bg-transparent' : 'bg-gold/10'}"
  style="--barbi-pink: #E0218A; --gold: #D4AF37;"
>
  {#if editor && editable}
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-2 p-3 border-b border-gold/30 items-center">
      
      <!-- Basic Formatting -->
      <button onclick={() => editor.chain().focus().toggleBold().run()} class:active={editor.isActive('bold')}>
        <strong>{bet[$lang]}</strong>
      </button>
      <button onclick={() => editor.chain().focus().toggleStrike().run()} class:active={editor.isActive('strike')}>
        <s>{bet[$lang]}</s>
      </button>
      <button onclick={() => editor.chain().focus().toggleItalic().run()} class:active={editor.isActive('italic')}>
        <em>{bet[$lang]}</em>
      </button>
      <button onclick={() => editor.chain().focus().toggleUnderline().run()} class:active={editor.isActive('underline')}>
        <u>{bet[$lang]}</u>
      </button>
      
      <div class="w-px h-6 bg-gold/50 mx-1"></div>

      <!-- Link -->
      <button
        onclick={!editor.isActive('link') ? setLink() : () => editor.chain().focus().unsetLink().run()}
        class:active={editor.isActive('link')}
      >
        <LinkIcon />
      </button>

      <!-- Alignment Dropdown -->
      <div class="relative">
        <button onclick={() => (hides = !hides)} class="flex items-center gap-1 min-w-[3rem] justify-center">
          {@html actives}
          <svg class="w-2.5 h-2.5 opacity-70" fill="none" viewBox="0 0 10 6" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
          </svg>
        </button>
        
        <div class:hidden={hides} class="absolute top-full mt-1 z-20 bg-white border border-gold rounded shadow-lg flex flex-col p-1 min-w-[3rem]">
          <button onclick={() => { editor.chain().focus().setTextAlign('center').run(); actives = centersvg; hides = true; }} class:active={editor.isActive({ textAlign: 'center' })}>
            {@html centersvg}
          </button>
          <button onclick={() => { editor.chain().focus().setTextAlign('left').run(); actives = leftsvg; hides = true; }} class:active={editor.isActive({ textAlign: 'left' })}>
            {@html leftsvg}
          </button>
          <button onclick={() => { editor.chain().focus().setTextAlign('right').run(); actives = rightsvg; hides = true; }} class:active={editor.isActive({ textAlign: 'right' })}>
            {@html rightsvg}
          </button>
          <button onclick={() => { editor.chain().focus().setTextAlign('justify').run(); actives = justifysvg; hides = true; }} class:active={editor.isActive({ textAlign: 'justify' })}>
            {@html justifysvg}
          </button>
        </div>
      </div>

      <div class="flex-grow"></div>

      <!-- Undo/Redo -->
       <div class="flex gap-1">
        <button onclick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} class="opacity-80 hover:opacity-100 disabled:opacity-30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        </button>
        <button onclick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} class="opacity-80 hover:opacity-100 disabled:opacity-30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>
        </button>
       </div>
    </div>
  {/if}

  <!-- Editor Content -->
  <div
    class="tiptap-content text-barbi min-h-[150px] outline-none {sml ? '' : 'p-6'}"
    bind:this={element}
  ></div>

  <!-- Floating Menu / Add Button -->
  {#if editor && editable}
    <Separator gradient={true}>
      {#snippet label()}
        <div class="relative group">
            <button 
                onclick={() => show = !show}
                class="bg-white border-2 border-gold text-barbi rounded-full p-1.5 hover:bg-gold hover:text-white transition-colors focus:outline-none"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200 {show ? 'rotate-45' : ''}">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
            </button>
            
            <!-- Context Menu for Block Types -->
            {#if show}
                <div bind:this={menu} class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-white border border-gold rounded-lg shadow-xl p-2 flex flex-col gap-1 min-w-[160px]">
                    <button onclick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); show = false; }} class:active={editor.isActive('heading', { level: 1 })} class="menu-item">
                        {@html h1Leb[$lang]}
                    </button>
                    <button onclick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); show = false; }} class:active={editor.isActive('heading', { level: 3 })} class="menu-item">
                        {@html h3Leb[$lang]}
                    </button>
                    <button onclick={() => { editor.chain().focus().setParagraph().run(); show = false; }} class:active={editor.isActive('paragraph')} class="menu-item">
                        {@html parLeb[$lang]}
                    </button>
                    <div class="h-px bg-gray-100 my-1"></div>
                    <button onclick={() => { editor.chain().focus().toggleBulletList().run(); show = false; }} class:active={editor.isActive('bulletList')} class="menu-item flex items-center gap-2">
                         <List class="w-4 h-4"/> {@html listLeb[$lang]}
                    </button>
                    <button onclick={() => { editor.chain().focus().toggleOrderedList().run(); show = false; }} class:active={editor.isActive('orderedList')} class="menu-item">
                         {listNLeb[$lang]}
                    </button>
                     <button onclick={() => { editor.chain().focus().toggleBlockquote().run(); show = false; }} class:active={editor.isActive('blockquote')} class="menu-item">
                        {quoteLeb[$lang]}
                    </button>
                    <div class="h-px bg-gray-100 my-1"></div>
                     <button onclick={() => { editor.chain().focus().setHorizontalRule().run(); show = false; }} class="menu-item text-xs">
                        {lineLeb[$lang]}
                    </button>
                </div>
            {/if}
        </div>
      {/snippet}
    </Separator>
  {/if}
</div>

<style>
  /* Base Styling */
  .editor-wrapper {
    border: 1px solid var(--gold);
    box-shadow: 0 4px 6px -1px rgba(212, 175, 55, 0.1);
  }

  /* Buttons Styling */
  button {
    background: transparent;
    color: var(--barbi-pink);
    border-radius: 0.375rem; 
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  button:hover {
    background: rgba(212, 175, 55, 0.1); 
    border-color: var(--gold);
  }

  button.active {
    background: var(--barbi-pink);
    color: white;
    box-shadow: 0 2px 4px rgba(224, 33, 138, 0.3);
  }
  
  /* Menu Items specific styling */
  .menu-item {
    text-align: start;
    width: 100%;
    padding: 0.5rem;
    font-size: 0.9rem;
    border: none;
    background: white;
    color: #4a4a4a;
  }
  .menu-item:hover {
    background: #fff5f9; 
    color: var(--barbi-pink);
  }
  .menu-item.active {
    background: var(--gold);
    color: white;
  }

  /* Prose Overrides */
  :global(.custom-prose) {
    color: var(--barbi-pink) !important;
  }
  :global(.custom-prose a) {
    color: var(--barbi-pink);
    text-decoration-color: var(--gold);
  }
  :global(.custom-prose blockquote) {
    border-color: var(--gold);
    color: var(--barbi-pink);
    opacity: 0.8;
  }
  :global(.custom-prose strong), :global(.custom-prose h1), :global(.custom-prose h2), :global(.custom-prose h3) {
    color: var(--barbi-pink);
  }
</style>