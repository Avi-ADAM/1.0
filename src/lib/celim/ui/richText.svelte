<script>
  import { lang } from '$lib/stores/lang';
  import { onMount, onDestroy } from 'svelte';
  import List from '$lib/celim/icons/list.svelte'
  import { Editor } from '@tiptap/core';
  import TextAlign from '@tiptap/extension-text-align';
  import Link from '@tiptap/extension-link';
  import Highlight from '@tiptap/extension-highlight';
  import FloatingMenu from '@tiptap/extension-floating-menu';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import LinkIcon from '../icons/linkIcon.svelte';
  import Separator from './separator.svelte';
  export let outpot = ``;
  export let showJson = false;
  export let outjson = [];
  export let trans = false
  export let editable = true;
  export let sml = false
  export let minw = false
  let element;
  let editor;
  let menu;
  $: console.log(outjson,showJson,outpot);
  onMount(() => {
    editor = new Editor({
      element: element,
      editable: editable,
      content: showJson ? outjson : outpot,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none'
        }
      },
      parseOptions: {
        preserveWhitespace: 'full'
      },
      extensions: [
        StarterKit,
        Link,
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
        // force re-render so `editor.isActive` works as expected
        editor = editor;
        const html = editor.getHTML();
        const jsonc = editor.getJSON();
        outjson = jsonc;
        outjson = outjson;
        outpot = html;
        outpot = outpot;
      }
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
  const spaceLeb = { he: 'רווח', en: 'space' };
  const lineLeb = { he: 'קו מפריד', en: 'line' };
  const quoteLeb = { he: 'ציטוט', en: 'qoute' };
  const listNLeb = { he: '1. רשימה', en: 'List 1.' };
  const listLeb = {
    he: ` רשימה`,
    en: `List`
  };
  const linkPro = { he: 'כתובת קישור', en: 'Enter URL' };
  const parLeb = { he: `<p>פסקה</p>`, en: `<p>paragaph</p>` };
  const h1Leb = { he: `<h1>כותרת</h1>`, en: `<h1>header</h1>` };
  const h3Leb = { he: `<h3>כותרת משנית</h3>`, en: `<h3>secondery header</h3>` };
  const linkLeb = { he: 'לינק', en: 'link' };
  const bet = { he: 'ב', en: 'B' };
  let hide = true;
  let active = parLeb[$lang];
  let hides = true;
  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt(linkPro[$lang], previousUrl);
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }
  let leftsvg = `<svg height="30" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" fill-rule="evenodd" d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm-8 4a1 1 0 100-2H2a1 1 0 100 2h8zm9 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-9 5a1 1 0 100-2H2a1 1 0 100 2h8z"></path> </g></svg>`;
  let rightsvg = `<svg height="30" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" fill-rule="evenodd" d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm0 4a1 1 0 100-2h-8a1 1 0 100 2h8zm1 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 5a1 1 0 100-2h-8a1 1 0 100 2h8z"></path> </g></svg>`;
  let actives = $lang == 'he' ? rightsvg : leftsvg;
  $: show = false
</script>

<div
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  class="bg-{trans == false ? "mturk bg-opacity-25" : 'bg-transparent'} {minw ? 'min-w-[50vw]' : ''} " 
>
  {#if editor && editable}
    <div
      class="max-w-screen flex flex-wrap items-top justify-right mx-auto pb-0 pr-2 p-4 "
    >
      <button
        on:click={() => editor.chain().focus().toggleBold().run()}
        class:active={editor.isActive('bold')}
      >
        <p><strong>{bet[$lang]}</strong></p>
      </button>
      <button
        on:click={() => editor.chain().focus().toggleStrike().run()}
        class:active={editor.isActive('strike')}
      >
        <p><s>{bet[$lang]}</s></p>
      </button>
      <button
        on:click={() => editor.chain().focus().toggleItalic().run()}
        class:active={editor.isActive('italic')}
      >
        <p><em>{bet[$lang]}</em></p>
      </button>
      <button
        on:click={() => editor.chain().focus().toggleUnderline().run()}
        class:active={editor.isActive('underline')}
      >
        <p><u>{bet[$lang]}</u></p>
      </button>
      <button
        on:click={!editor.isActive('link')
          ? setLink()
          : () => editor.chain().focus().unsetLink().run()}
        class={editor.isActive('link') ? 'active' : ''}
        ><LinkIcon/>
      </button>
      <div class="flex" class:flex-col={!hides}>
      <button
        id="dropdownNavbarLink"
        on:click={() => (hides = !hides)}
        class=" text-gold rounded bg-barbi"
        ><div
          class="flex flex-row justify-center items-center text-gold rounded bg-barbi"
        >{@html actives}<svg
            class="w-2.5 h-2.5 ms-2.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 4 4 4-4"
            />
          </svg>
        </div>
      </button>
      <div
        id="dropdownNavbar"
        class:hidden={hides == true}
        class="z-10 font-normal bg-gold divide-x divide-gray-100 rounded-lg shadow flex-row flex"
      >
        <button
          on:click={() => {
            editor.chain().focus().setTextAlign('center').run();
            console.log('edito', editor.chain().focus().setTextAlign('center'));
            actives = `<svg height="30" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" fill-rule="evenodd" d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm-4 4a1 1 0 100-2H6a1 1 0 100 2h8zm5 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-5 5a1 1 0 100-2H6a1 1 0 100 2h8z"></path> </g></svg>`;
            hide = true;
          }}
          class:active={editor.isActive({ textAlign: 'center' })}
          class="bg-gold text-barbi"
          ><svg
            height="30"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g><g id="SVGRepo_iconCarrier">
              <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm-4 4a1 1 0 100-2H6a1 1 0 100 2h8zm5 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-5 5a1 1 0 100-2H6a1 1 0 100 2h8z"
              ></path>
            </g></svg
          ></button
        >
        <button
          on:click={() => {
            editor.chain().focus().setTextAlign('left').run();
            actives = leftsvg;
            hide = true;
          }}
          class:active={editor.isActive({ textAlign: 'left' })}
          >{@html leftsvg}</button
        >

        <button
          on:click={() => {
            editor.chain().focus().setTextAlign('right').run();
            actives = rightsvg;
            hide = true;
          }}
          class:active={editor.isActive({ textAlign: 'right' })}
          >{@html rightsvg}</button
        >

        <button
          on:click={() => {
            editor.chain().focus().setTextAlign('justify').run();
            actives = `<svg height="30" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" fill-rule="evenodd" d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm0 4a1 1 0 100-2H2a1 1 0 100 2h16zm1 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 5a1 1 0 100-2H2a1 1 0 100 2h16z"></path> </g></svg>`;
            hide = true;
          }}
          class={editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}
          ><svg
            height="30"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g><g id="SVGRepo_iconCarrier">
              <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M18 5a1 1 0 100-2H2a1 1 0 000 2h16zm0 4a1 1 0 100-2H2a1 1 0 100 2h16zm1 3a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 5a1 1 0 100-2H2a1 1 0 100 2h16z"
              ></path>
            </g></svg
          ></button
        >
      </div>
      </div>

      <button
        on:click={() => editor.chain().focus().undo().run()}
        class:disabled={!editor.can().chain().focus().undo().run()}
        ><svg
          height="30"
          viewBox="0 0 21 21"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g><g id="SVGRepo_iconCarrier">
            <g fill="none" fill-rule="evenodd" transform="matrix(0 1 1 0 0 2)">
              <path
                d="m8.54949429 2.5c-2.77910025-.01404818-5.48733216 1.42226095-6.97636172 4.0013358-2.209139 3.826341-.89813776 8.7190642 2.92820323 10.9282032s8.7190642.8981378 10.9282032-2.9282032.8981378-8.71906423-2.9282032-10.92820323"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m11.5 2.5-3 2.5v-5z"
                fill="currentColor"
                fill-rule="nonzero"
              ></path>
              <path
                d="m4.5 10.5h5v3"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </g>
          </g></svg
        ></button
      >
      <button
        on:click={() => editor.chain().focus().redo().run()}
        class:disabled={!editor.can().chain().focus().redo().run()}
        ><svg
          height="30"
          viewBox="0 0 21 21"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          transform="matrix(-1, 0, 0, 1, 0, 0)"
          ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g><g id="SVGRepo_iconCarrier">
            <g fill="none" fill-rule="evenodd" transform="matrix(0 1 1 0 0 2)">
              <path
                d="m8.54949429 2.5c-2.77910025-.01404818-5.48733216 1.42226095-6.97636172 4.0013358-2.209139 3.826341-.89813776 8.7190642 2.92820323 10.9282032s8.7190642.8981378 10.9282032-2.9282032.8981378-8.71906423-2.9282032-10.92820323"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m11.5 2.5-3 2.5v-5z"
                fill="currentColor"
                fill-rule="nonzero"
              ></path>
              <path
                d="m4.5 10.5h5v3"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </g>
          </g></svg
        ></button
      >
    </div>
  {/if}

  <div
    class="border-gold border rounded {sml ? "" : "m-2 p-8"} text-barbi bg-{trans == false ? "gold" : "transparent"}"
    bind:this={element}
  />
  {#if editor && editable}
  <Separator gradient={true}>
    <div slot="label" class="border px-2 py-2 rounded-full">
      <svg
        on:click={()=> show = !show}
        on:keypress={()=> show = !show}
        role="button"
        tabindex="0"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-plus focus:border-none focus:ring-0"
        ><path d="M5 12h14" />{#if show != true}<path d="M12 5v14" />{/if}</svg
      >
    </div>
  </Separator>
  {/if}
  {#if editor && editable && show}
    <div bind:this={menu} class="menu">
      <div
        class="max-w-screen flex flex-wrap items-top justify-center mx-auto pt-0 pr-2 p-4"
        style="align-items: flex-start;"
      >
        <div>
          <button
            id="dropdownNavbarLink2"
            on:click={() => (hide = !hide)}
            class="  w-full py-2 px-3 text-gold rounded bg-barbi"
            ><div
              class="flex flex-row justify-center items-center text-gold rounded bg-barbi"
            >
              <span>{@html active}</span><svg
                class="w-2.5 h-2.5 ms-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </div>
          </button>
          <div
            id="dropdownNavbar2"
            class:hidden={hide == true}
            class="z-10 bg-gold divide-y divide-gray-100 rounded-lg shadow flex-row flex"
          >
            <button
              on:click={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                active = h1Leb[$lang];
                hide = true;
              }}
              class:active={editor.isActive('heading', { level: 1 })}
              class="bg-gold text-barbi">{@html h1Leb[$lang]}</button
            >

            <button
              on:click={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                active = h3Leb[$lang];
                hide = true;
              }}
              class:active={editor.isActive('heading', { level: 3 })}
            >
              {@html h3Leb[$lang]}
            </button>

            <button
              on:click={() => {
                editor.chain().focus().setParagraph().run();
                active = parLeb[$lang];
                hide = true;
              }}
              class:active={editor.isActive('paragraph')}
            >
              {@html parLeb[$lang]}
            </button>

            <button
              on:click={() => {
                editor.chain().focus().toggleBulletList().run();
                active = listLeb[$lang];
                hide = true;
              }}
              class={editor.isActive('bulletList') ? 'active' : ''}
              ><div class="flex flex-row flex-wrap align-middle items-center justify-center"><List/>{@html listLeb[$lang]}</div></button
            >

            <button
              on:click={() => {
                editor.chain().focus().toggleOrderedList().run();
                active = listNLeb[$lang];
                hide = true;
              }}
              class={editor.isActive('orderedList') ? 'active' : ''}
              >{listNLeb[$lang]}</button
            >
            <button
              on:click={() => {
                editor.chain().focus().toggleBlockquote().run();
                active = quoteLeb[$lang];
                hide = true;
              }}
              class={editor.isActive('blockquote') ? 'active' : ''}
            >
              {quoteLeb[$lang]}
            </button>
          </div>
        </div>
        <button
          on:click={() => editor.chain().focus().setHorizontalRule().run()}
          >{lineLeb[$lang]}</button
        >
        <button on:click={() => editor.chain().focus().setHardBreak().run()}
          >{spaceLeb[$lang]}</button
        >
        <div></div>
      </div>
    </div>
  {/if}
</div>

<style>
 .tiptap p, h1, h2, li, ul {
    background-color: inherit;
  }
svg:focus { outline: none; }
  #dropdownNavbarLink, #dropdownNavbarLink2 {
    background: var(--barbi-pink);
  }
  .disabled {
    background: lightcyan;
    color: var(--barbi-pink);
  }
  button {
    background: var(--gold);
    color: var(--barbi-pink);
    padding: 0 0.75rem;
    font-size: 0.8rem;
    border-radius: 0.25rem;
    border: 1px dotted var(--barbi-pink);
  }
  button.active,
  button:hover,
  button:focus {
    background: var(--barbi-pink);
    color: var(--gold);
  }
  .menu button {
    border-width: 2px;
  }
  @media (min-width: 450px) {
    button {
      font-size: 1.2rem;
    }
  }
  @media (min-width: 850px) {
    button {
      font-size: 2rem;
    }
  }


</style>
