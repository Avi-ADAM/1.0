<script>
  import { isRtl, t } from '$lib/translations';
  import { onMount, onDestroy, tick } from 'svelte';
  import List from '$lib/celim/icons/list.svelte';
  import { Editor } from '@tiptap/core';
  import TextAlign from '@tiptap/extension-text-align';
  import Link from '@tiptap/extension-link';
  import Highlight from '@tiptap/extension-highlight';
  import { BubbleMenu } from '@tiptap/extension-bubble-menu';
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
  let bubbleMenuEl = $state();
  let editorHtml = '';
  /* The bubble menu is a plain element that tiptap yanks out of the flow when
     it builds its tooltip — before that it is a stray row of buttons sitting
     above the editor in the SSR'd HTML. Rendering it only after mount (and
     only when editable) removes the flash and keeps the formatting bubble out
     of read-only views entirely. */
  let mounted = $state(false);

  let activeStates = $state({
    bold: false,
    strike: false,
    italic: false,
    underline: false,
    link: false,
    alignCenter: false,
    alignLeft: false,
    alignRight: false,
    alignJustify: false,
    heading1: false,
    heading3: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
    blockquote: false
  });

  function updateActiveStates() {
    if (!editor) return;
    activeStates.bold = editor.isActive('bold');
    activeStates.strike = editor.isActive('strike');
    activeStates.italic = editor.isActive('italic');
    activeStates.underline = editor.isActive('underline');
    activeStates.link = editor.isActive('link');
    activeStates.alignCenter = editor.isActive({ textAlign: 'center' });
    activeStates.alignLeft = editor.isActive({ textAlign: 'left' });
    activeStates.alignRight = editor.isActive({ textAlign: 'right' });
    activeStates.alignJustify = editor.isActive({ textAlign: 'justify' });
    activeStates.heading1 = editor.isActive('heading', { level: 1 });
    activeStates.heading3 = editor.isActive('heading', { level: 3 });
    activeStates.paragraph = editor.isActive('paragraph');
    activeStates.bulletList = editor.isActive('bulletList');
    activeStates.orderedList = editor.isActive('orderedList');
    activeStates.blockquote = editor.isActive('blockquote');

    // The alignment trigger used to change only when *clicked*, so it kept
    // announcing the last button pressed instead of the alignment the caret is
    // actually in. Derive it from the state like every other button.
    if (activeStates.alignCenter) actives = centersvg;
    else if (activeStates.alignJustify) actives = justifysvg;
    else if (activeStates.alignLeft) actives = leftsvg;
    else if (activeStates.alignRight) actives = rightsvg;
    else actives = $isRtl ? rightsvg : leftsvg;
  }

  // --- פונקציית המרה מסטראפי ל-HTML ---
  function parseStrapiToHtml(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';

    return blocks
      .map((block) => {
        // 1. פסקאות (Paragraphs)
        if (block.type === 'paragraph') {
          const childrenHtml = block.children
            ? block.children.map(parseChild).join('')
            : '';
          return childrenHtml ? `<p>${childrenHtml}</p>` : '<p><br></p>';
        }

        // 2. כותרות (Headings)
        if (block.type === 'heading') {
          const level = block.level || 1;
          const childrenHtml = block.children
            ? block.children.map(parseChild).join('')
            : '';
          return `<h${level}>${childrenHtml}</h${level}>`;
        }

        // 3. רשימות (Lists)
        if (block.type === 'list') {
          const tag = block.format === 'ordered' ? 'ol' : 'ul';
          const items = block.children
            ? block.children
                .map((item) => {
                  const itemContent = item.children.map(parseChild).join('');
                  return `<li>${itemContent}</li>`;
                })
                .join('')
            : '';
          return `<${tag}>${items}</${tag}>`;
        }

        return '';
      })
      .join('');
  }

  // פונקציית עזר לפרסור הילדים (Text nodes, Links)
  function parseChild(child) {
    if (!child) return '';

    // טיפול בלינקים (Link node)
    if (child.type === 'link') {
      const linkText = child.children
        ? child.children.map((c) => c.text).join('')
        : '';
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
    if (
      typeof outpot === 'string' &&
      outpot.trim().startsWith('[') &&
      outpot.trim().endsWith(']')
    ) {
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

  onMount(async () => {
    // חישוב התוכן ההתחלתי בצורה חכמה
    const initialContent = showJson ? outjson : resolveInitialContent();

    // אם קיבלנו מערך ב-outpot, נעדכן אותו ל-HTML מיד כדי למנוע בעיות סנכרון בהמשך
    if (Array.isArray(outpot)) {
      outpot = initialContent;
    }

    // Let the bubble-menu element render before tiptap asks for it.
    mounted = true;
    await tick();

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
            class: 'text-barbi underline decoration-gold'
          }
        }),
        Highlight.configure({
          multicolor: true
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'right', 'center', 'justify'],
          defaultAlignment: $isRtl ? 'right' : 'left'
        }),
        Underline,
        // Read-only views got the formatting bubble too: `shouldShow` looked
        // only at the selection, so highlighting a word in a published
        // description popped up B/I/H1 buttons that edit nothing.
        ...(editable && bubbleMenuEl
          ? [
              BubbleMenu.configure({
                element: bubbleMenuEl,
                shouldShow: ({ editor: ed }) => {
                  const { from, to } = ed.state.selection;
                  return ed.isEditable && ed.view.hasFocus() && from !== to;
                }
              })
            ]
          : [])
      ],
      onTransaction: () => {
        editor = editor;
        updateActiveStates();
        const html = editor.getHTML();
        const jsonc = editor.getJSON();
        outjson = jsonc;
        editorHtml = html;
        outpot = html; // תמיד מחזיר HTML החוצה
      }
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  $effect(() => {
    const newVal = outpot;
    if (!editor) return;
    if (newVal !== editorHtml) {
      editor.commands.setContent(newVal || '');
    }
  });

  // --- תפריטים נפתחים ---
  /** the alignment dropdown */
  let hides = $state(true);
  /** the block-type menu behind the “+” */
  let show = $state(false);
  let alignWrap = $state();
  let blockWrap = $state();

  /* Neither menu had a way to close: clicking elsewhere left it hanging over
     the text, and both could be open at once. pointerdown (not click) so the
     trigger's own click handler still runs afterwards and toggles normally. */
  function closeMenus(event) {
    if (!hides && alignWrap && !alignWrap.contains(event.target)) hides = true;
    if (show && blockWrap && !blockWrap.contains(event.target)) show = false;
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    if (hides && !show) return;
    hides = true;
    show = false;
  }

  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt($t('ui.richText.linkPrompt'), previousUrl);
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

  let actives = $state($isRtl ? rightsvg : leftsvg);
</script>

<svelte:window onpointerdown={closeMenus} onkeydown={onKeydown} />

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="editor-wrapper rounded-lg transition-all duration-300 {minw
    ? 'max-w-[50vw]'
    : ''} {trans ? 'rt-trans' : ''} {!editable ? 'rt-view' : ''}"
>
  {#if editor && editable}
    <!-- Toolbar -->
    <div class="rt-toolbar flex flex-wrap gap-2 p-3 items-center">
      <!-- Basic Formatting -->
      <button
        onclick={() => editor.chain().focus().toggleBold().run()}
        class:active={activeStates.bold}
      >
        <strong>{$t('ui.richText.boldLetter')}</strong>
      </button>
      <button
        onclick={() => editor.chain().focus().toggleStrike().run()}
        class:active={activeStates.strike}
      >
        <s>{$t('ui.richText.boldLetter')}</s>
      </button>
      <button
        onclick={() => editor.chain().focus().toggleItalic().run()}
        class:active={activeStates.italic}
      >
        <em>{$t('ui.richText.boldLetter')}</em>
      </button>
      <button
        onclick={() => editor.chain().focus().toggleUnderline().run()}
        class:active={activeStates.underline}
      >
        <u>{$t('ui.richText.boldLetter')}</u>
      </button>

      <div class="rt-sep w-px h-6 mx-1"></div>

      <!-- Link -->
      <button
        onclick={() =>
          !activeStates.link
            ? setLink()
            : editor.chain().focus().unsetLink().run()}
        class:active={activeStates.link}
      >
        <LinkIcon />
      </button>

      <!-- Alignment Dropdown -->
      <div class="relative" bind:this={alignWrap}>
        <button
          onclick={() => (hides = !hides)}
          class="flex items-center gap-1 min-w-[3rem] justify-center"
        >
          {@html actives}
          <svg
            class="w-2.5 h-2.5 opacity-70"
            fill="none"
            viewBox="0 0 10 6"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </button>

        <div
          class:hidden={hides}
          class="rt-pop absolute top-full mt-1 z-20 flex flex-col p-1 min-w-[3rem]"
        >
          <button
            onclick={() => {
              editor.chain().focus().setTextAlign('center').run();
              actives = centersvg;
              hides = true;
            }}
            class:active={activeStates.alignCenter}
          >
            {@html centersvg}
          </button>
          <button
            onclick={() => {
              editor.chain().focus().setTextAlign('left').run();
              actives = leftsvg;
              hides = true;
            }}
            class:active={activeStates.alignLeft}
          >
            {@html leftsvg}
          </button>
          <button
            onclick={() => {
              editor.chain().focus().setTextAlign('right').run();
              actives = rightsvg;
              hides = true;
            }}
            class:active={activeStates.alignRight}
          >
            {@html rightsvg}
          </button>
          <button
            onclick={() => {
              editor.chain().focus().setTextAlign('justify').run();
              actives = justifysvg;
              hides = true;
            }}
            class:active={activeStates.alignJustify}
          >
            {@html justifysvg}
          </button>
        </div>
      </div>

      <div class="flex-grow"></div>

      <!-- Undo/Redo -->
      <div class="flex gap-1">
        <button
          onclick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          class="opacity-80 hover:opacity-100 disabled:opacity-30"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M3 7v6h6" /><path
              d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"
            /></svg
          >
        </button>
        <button
          onclick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          class="opacity-80 hover:opacity-100 disabled:opacity-30"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M21 7v6h-6" /><path
              d="M3 17a9 9 0 019-9 9 0 016 2.3l3 2.7"
            /></svg
          >
        </button>
      </div>
    </div>
  {/if}

  <!-- Bubble Menu (on text selection) -->
  {#if mounted && editable}
    <div bind:this={bubbleMenuEl} class="bubble-menu">
      <button
        onclick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        class:active={activeStates.heading1}
        class="bubble-btn"
      >
        H1
      </button>
      <button
        onclick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        class:active={activeStates.heading3}
        class="bubble-btn"
      >
        H3
      </button>
      <button
        onclick={() => editor.chain().focus().setParagraph().run()}
        class:active={activeStates.paragraph}
        class="bubble-btn"
      >
        P
      </button>
      <div class="bubble-sep"></div>
      <button
        onclick={() => editor.chain().focus().toggleBold().run()}
        class:active={activeStates.bold}
        class="bubble-btn"
      >
        <strong>B</strong>
      </button>
      <button
        onclick={() => editor.chain().focus().toggleItalic().run()}
        class:active={activeStates.italic}
        class="bubble-btn"
      >
        <em>I</em>
      </button>
    </div>
  {/if}

  <!-- Editor Content -->
  <div
    class="tiptap-content text-barbi min-h-[150px] outline-none {sml
      ? ''
      : 'p-6'}"
    bind:this={element}
  ></div>

  <!-- Floating Menu / Add Button -->
  {#if editor && editable}
    <Separator gradient={true}>
      {#snippet label()}
        <div class="relative group" bind:this={blockWrap}>
          <button
            onclick={() => (show = !show)}
            class="rt-plus rounded-full p-1.5 transition-colors focus:outline-none"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-transform duration-200 {show
                ? 'rotate-45'
                : ''}"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <!-- Context Menu for Block Types -->
          {#if show}
            <div
              class="rt-pop absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 p-2 flex flex-col gap-1 min-w-[160px]"
            >
              <button
                onclick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  show = false;
                }}
                class:active={activeStates.heading1}
                class="menu-item"
              >
                {@html $t('ui.richText.h1')}
              </button>
              <button
                onclick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  show = false;
                }}
                class:active={activeStates.heading3}
                class="menu-item"
              >
                {@html $t('ui.richText.h3')}
              </button>
              <button
                onclick={() => {
                  editor.chain().focus().setParagraph().run();
                  show = false;
                }}
                class:active={activeStates.paragraph}
                class="menu-item"
              >
                {@html $t('ui.richText.paragraph')}
              </button>
              <div class="rt-menu-line h-px my-1"></div>
              <button
                onclick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  show = false;
                }}
                class:active={activeStates.bulletList}
                class="menu-item flex items-center gap-2"
              >
                <List class="w-4 h-4" />
                {@html $t('ui.richText.list')}
              </button>
              <button
                onclick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  show = false;
                }}
                class:active={activeStates.orderedList}
                class="menu-item"
              >
                {$t('ui.richText.numberedList')}
              </button>
              <button
                onclick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  show = false;
                }}
                class:active={activeStates.blockquote}
                class="menu-item"
              >
                {$t('ui.richText.quote')}
              </button>
              <div class="rt-menu-line h-px my-1"></div>
              <button
                onclick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  show = false;
                }}
                class="menu-item text-xs"
              >
                {$t('ui.richText.line')}
              </button>
            </div>
          {/if}
        </div>
      {/snippet}
    </Separator>
  {/if}
</div>

<!-- The two brand tokens used to be pinned here as an inline `style`, which
     beat every stylesheet rule — the editor stayed pink-and-gold inside the
     business ("professional") theme. They now live in <style> -->

<style>
  /* ==========================================================================
     PALETTE — one token set, four fills: personal·light (the base rule),
     personal·dark, business·light, business·dark.

     Two rules of the house, both learned the hard way:

     1. The values live in custom properties and NOTHING else is written per
        theme. The rules that consume them keep the low specificity they have
        always had, because callers reach in and restyle this editor from the
        outside — `WishForm` overrides `.editor-wrapper`, its buttons and its
        prose. A per-theme rule written directly on those selectors would
        outrank the caller and repaint their parchment editor slate-blue.

     2. Never `bg-gold/10` on these colours. `gold`/`barbi` are declared in
        tailwind.config.cjs as a bare `var(--gold)`, and Tailwind cannot
        composite an alpha onto a variable it cannot see — it drops the
        utility on the floor. `bg-gold/10`, `border-gold/30` and `bg-gold/50`
        emitted *no CSS at all*: the editor had no background, the toolbar
        rule fell back to Tailwind's default grey, and the toolbar separator
        was invisible (WishForm carries a hand-written patch for exactly that
        div). `color-mix()` does what the modifier was meant to do, with the
        flat colour as the fallback for engines that lack it.
     ========================================================================== */
  .editor-wrapper,
  .bubble-menu {
    /* --- PERSONAL · LIGHT (the look this component has always had) --- */
    --barbi-pink: #e0218a;
    --gold: #d4af37;

    --rt-radius: 0.75rem;
    --rt-shadow: 0 4px 6px -1px rgba(212, 175, 55, 0.18);
    --rt-line: rgba(212, 175, 55, 0.55);
    --rt-line-soft: rgba(212, 175, 55, 0.28);
    /* Opaque, and it has to be: the ink below is dark, and the personal
       theme's page is #070606 in light mode too (only the `dark:` utilities
       move between modes - see the CARD SURFACE note in app.postcss). A 7%
       gold wash let that black through, so every editor NOT sitting inside an
       explicit light card - the description fields in `baci`, `conf/rich`,
       `createNewMeeting` - rendered #43303a on near-black, 1.5:1. This is
       --surface for the fill, so the panel is seamless inside a card and is
       still a readable card when there is none. The gold identity survives in
       the border, the shadow, the toolbar tint and the quote fill, which all
       layer on top of it. */
    --rt-wash: #ffffff;
    --rt-toolbar-bg: rgba(212, 175, 55, 0.06);
    --rt-ring: rgba(224, 33, 138, 0.18);

    --rt-pop-bg: #ffffff;
    --rt-pop-ink: #4a4a4a;
    --rt-btn-ink: #b21a6d; /* 6.4:1 on the wash — #e0218a is 4.0:1 */
    --rt-btn-hover-bg: rgba(212, 175, 55, 0.16);
    --rt-btn-hover-ink: #8d1156;
    --rt-accent: #e0218a;
    --rt-accent-ink: #ffffff;
    --rt-accent-shadow: 0 2px 4px rgba(224, 33, 138, 0.3);

    --rt-body-ink: #43303a; /* warm near-black, 12.3:1 on the wash */
    --rt-head-ink: #c01a74;
    --rt-strong-ink: #43303a;
    --rt-link-ink: #a8195f; /* was --lturk: cyan on white, ~1.4:1 */
    --rt-muted: #7a6a52; /* blockquote ink + list markers; was #8a7a63, 3.9:1 */
    --rt-quote-bg: rgba(212, 175, 55, 0.12);
    --rt-quote-rule: #d4af37;
  }

  /* --- PERSONAL · DARK ---------------------------------------------------
     Every popover in here was a hard-coded `bg-white` with #4a4a4a text, so
     night mode opened a white card over a near-black page.

     --rt-wash is opaque here for the same reason it is opaque in the light
     fill above, mirrored: the ink is light (#ede5d8, the palette's --text),
     and a 5%-alpha wash let whatever the caller painted show straight
     through. Plenty of hosts were a flat light card with no `dark:` variant
     — `bg-white` on the moach main sections and on the lev mission card, the
     pale rows in `betaha` — and there the editor rendered light ink on
     white, 1.25:1. That was the reported bug.

     All four fills are opaque now, which is what the two business fills
     (`var(--s1)`) always did, and why business dark read fine on those same
     white cards while personal dark did not. `trans` callers (WishForm, the
     lev cards that pass trans={true}) opt out of the fill and own their own
     ground, as before. */
  :global(html.personal.dark) .editor-wrapper,
  :global(html.personal.dark) .bubble-menu {
    --rt-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
    --rt-line: rgba(238, 232, 170, 0.28);
    --rt-line-soft: rgba(238, 232, 170, 0.16);
    --rt-wash: #171512; /* = --surface, 14.6:1 under --rt-body-ink */
    --rt-toolbar-bg: rgba(238, 232, 170, 0.04);
    --rt-ring: rgba(255, 77, 158, 0.28);

    --rt-pop-bg: #1f2937;
    --rt-pop-ink: #e5e7eb;
    --rt-btn-ink: #d8cbb4;
    --rt-btn-hover-bg: rgba(238, 232, 170, 0.12);
    --rt-btn-hover-ink: #f0e6cf;
    --rt-accent: #ff4d9e; /* #e0218a on near-black is 3.9:1 */
    --rt-accent-ink: #1a1114;
    --rt-accent-shadow: none;

    --rt-body-ink: #ede5d8;
    --rt-head-ink: #ff4d9e;
    --rt-strong-ink: #f5efe6;
    --rt-link-ink: #ffa3cd;
    --rt-muted: #a89a86;
    --rt-quote-bg: rgba(238, 232, 170, 0.07);
    --rt-quote-rule: #c8a951;
  }

  /* --- BUSINESS ("professional") · LIGHT + DARK --------------------------
     Reads straight from the appearance layer at the end of app.postcss, so
     both modes come out of one block. */
  :global(html.business) .editor-wrapper,
  :global(html.business) .bubble-menu {
    /* the two brand tokens, remapped rather than dropped — `text-barbi` and
       `decoration-gold` are still in the markup and must land somewhere sane */
    --barbi-pink: var(--pink);
    --gold: var(--input);

    --rt-radius: var(--radius-theme);
    --rt-shadow: var(--shadow-theme);
    --rt-line: var(--border);
    --rt-line-soft: var(--border);
    --rt-wash: var(--s1);
    --rt-toolbar-bg: var(--s2);
    --rt-ring: var(--gold-d);

    --rt-pop-bg: var(--popover);
    --rt-pop-ink: var(--text);
    --rt-btn-ink: var(--tm);
    --rt-btn-hover-bg: var(--gold-d);
    --rt-btn-hover-ink: var(--text);
    --rt-accent: var(--pink);
    --rt-accent-ink: #ffffff;
    --rt-accent-shadow: none;

    --rt-body-ink: var(--text);
    --rt-head-ink: var(--text);
    --rt-strong-ink: var(--text);
    --rt-link-ink: var(--goldink);
    --rt-muted: var(--tm);
    --rt-quote-bg: var(--s2);
    --rt-quote-rule: var(--pink);
  }
  :global(html.business.dark) .editor-wrapper,
  :global(html.business.dark) .bubble-menu {
    --rt-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }

  /* ==========================================================================
     THE CHROME
     ========================================================================== */
  .editor-wrapper {
    background: var(--rt-wash);
    border: 1px solid var(--rt-line);
    border-radius: var(--rt-radius);
    box-shadow: var(--rt-shadow);
    color: var(--rt-body-ink);
  }
  /* `trans` asks for a frameless editor inside the caller's own card. */
  .editor-wrapper.rt-trans {
    background: transparent;
  }
  /* Read-only is a document, not an input: no lift, no focus affordance. */
  .editor-wrapper.rt-view {
    box-shadow: none;
  }
  .editor-wrapper:focus-within {
    border-color: var(--rt-accent);
    box-shadow: 0 0 0 3px var(--rt-ring);
  }

  .rt-toolbar {
    background: var(--rt-toolbar-bg);
    border-bottom: 1px solid var(--rt-line-soft);
    border-start-start-radius: var(--rt-radius);
    border-start-end-radius: var(--rt-radius);
  }

  /* Buttons Styling */
  button {
    background: transparent;
    color: var(--rt-btn-ink);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    transition:
      background-color 0.15s,
      color 0.15s,
      border-color 0.15s;
  }

  button:hover {
    background: var(--rt-btn-hover-bg);
    color: var(--rt-btn-hover-ink);
    border-color: var(--rt-line-soft);
  }

  /* `focus:outline-none` all over the markup left keyboard users with no
     visible focus anywhere in the toolbar. */
  button:focus-visible {
    outline: 2px solid var(--rt-accent);
    outline-offset: 1px;
  }

  button.active {
    background: var(--rt-accent) !important;
    color: var(--rt-accent-ink) !important;
    box-shadow: var(--rt-accent-shadow);
    border-color: var(--rt-accent) !important;
  }

  .rt-sep,
  .rt-menu-line,
  .bubble-sep {
    background: var(--rt-line-soft);
  }

  .rt-plus {
    background: var(--rt-pop-bg);
    border: 2px solid var(--rt-line);
    color: var(--rt-btn-ink);
  }
  .rt-plus:hover {
    background: var(--rt-accent);
    border-color: var(--rt-accent);
    color: var(--rt-accent-ink);
  }

  /* Popovers — the alignment dropdown and the block menu */
  .rt-pop {
    background: var(--rt-pop-bg);
    border: 1px solid var(--rt-line);
    border-radius: var(--rt-radius);
    color: var(--rt-pop-ink);
    box-shadow: var(--rt-shadow);
  }

  /* Menu Items specific styling */
  .menu-item {
    text-align: start;
    width: 100%;
    padding: 0.5rem;
    font-size: 0.9rem;
    border: none;
    background: transparent;
    color: var(--rt-pop-ink);
    border-radius: 0.375rem;
  }
  .menu-item:hover {
    background: var(--rt-btn-hover-bg);
    color: var(--rt-btn-hover-ink);
  }
  .menu-item.active {
    background: var(--rt-accent);
    color: var(--rt-accent-ink);
    box-shadow: var(--rt-accent-shadow);
    border-radius: 0.375rem;
    border: 1px solid var(--rt-accent);
  }

  /* Bubble Menu */
  .bubble-menu {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--rt-pop-bg);
    border: 1px solid var(--rt-line);
    border-radius: 0.5rem;
    padding: 3px 6px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.12),
      0 1px 3px var(--rt-line-soft);
  }
  .bubble-btn {
    background: transparent;
    color: var(--rt-pop-ink);
    border: none;
    border-radius: 4px;
    padding: 3px 7px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1.4;
  }
  .bubble-btn:hover {
    background: var(--rt-btn-hover-bg);
    color: var(--rt-btn-hover-ink);
  }
  .bubble-btn.active {
    background: var(--rt-accent) !important;
    color: var(--rt-accent-ink) !important;
    border-color: transparent !important;
    box-shadow: none;
  }
  .bubble-sep {
    width: 1px;
    height: 18px;
    margin: 0 3px;
  }

  /* ==========================================================================
     THE DOCUMENT
     `.tiptap` is styled globally in app.postcss and several of those rules
     only ever worked by accident. Scoped here so the fix reaches every rich
     text on the site without touching the global sheet.
     ========================================================================== */
  :global(.custom-prose) {
    color: var(--rt-body-ink) !important;
  }
  .tiptap-content :global(.tiptap a),
  :global(.custom-prose a) {
    /* `.tiptap a` set --lturk, which is cyan: 1.4:1 on white. It won over the
       `text-barbi` class tiptap puts on new links (same specificity, later in
       the sheet), and links parsed out of Strapi carry no class at all. */
    color: var(--rt-link-ink);
    text-decoration: underline;
    text-decoration-color: var(--rt-line);
    text-underline-offset: 2px;
  }
  .tiptap-content :global(.tiptap h1),
  .tiptap-content :global(.tiptap h2),
  .tiptap-content :global(.tiptap h3),
  :global(.custom-prose h1),
  :global(.custom-prose h2),
  :global(.custom-prose h3) {
    color: var(--rt-head-ink);
  }
  .tiptap-content :global(.tiptap strong),
  :global(.custom-prose strong) {
    color: var(--rt-strong-ink);
  }

  /* The list padding is `0 0 0 28px` globally — a left-only indent, so in
     Hebrew and Arabic the markers hang off the wrong edge of the text. */
  .tiptap-content :global(.tiptap ul),
  .tiptap-content :global(.tiptap ol) {
    padding: 0;
    padding-inline-start: 1.75rem;
  }
  .tiptap-content :global(.tiptap li::marker),
  .tiptap-content :global(.tiptap ol li::before) {
    /* the numbers were --gold: #eee8aa, i.e. invisible on a pale page */
    color: var(--rt-muted);
  }

  .tiptap-content :global(.tiptap blockquote) {
    background: var(--rt-quote-bg);
    border: none;
    border-inline-start: 3px solid var(--rt-quote-rule);
    border-radius: var(--rt-radius);
    box-shadow: none;
    color: var(--rt-muted);
    font-size: 1.05rem;
    padding: 0.75rem 1rem;
    opacity: 1;
  }
  /* a grey circle with an open-quote in it, floated into the first line */
  .tiptap-content :global(.tiptap blockquote::before) {
    content: none;
  }
  .tiptap-content :global(.tiptap hr) {
    border: none;
    border-top: 1px solid var(--rt-line);
    margin: 1rem 0;
  }

  /* --- business typography ------------------------------------------------
     The personal scale is a poster: 1.5rem body text above 670px. That is the
     house style and it stays; the professional theme wants a document. */
  :global(html.business) .tiptap-content :global(.tiptap p),
  :global(html.business) .tiptap-content :global(.tiptap li) {
    font-size: 1rem;
    line-height: 1.65;
  }
  :global(html.business) .tiptap-content :global(.tiptap h1) {
    font-size: 1.5rem;
    line-height: 1.3;
  }
  :global(html.business) .tiptap-content :global(.tiptap h3) {
    font-size: 1.15rem;
    line-height: 1.4;
    font-family: inherit;
  }
  :global(html.business) .tiptap-content :global(.tiptap h1),
  :global(html.business) .tiptap-content :global(.tiptap h2),
  :global(html.business) .tiptap-content :global(.tiptap h3),
  :global(html.business) .tiptap-content :global(.tiptap strong) {
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  :global(html.business) .tiptap-content :global(.tiptap blockquote) {
    font-family: inherit;
    font-size: 1rem;
    border: 1px solid var(--rt-line);
    border-inline-start: 3px solid var(--rt-quote-rule);
  }
</style>
