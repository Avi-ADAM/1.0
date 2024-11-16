<script>
import { generateJSON } from '@tiptap/html'; // הוספת ייבוא של generateJSON
  import TextAlign from '@tiptap/extension-text-align';
  import Highlight from '@tiptap/extension-highlight';

  import Link from '@tiptap/extension-link';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import { Editor } from '@tiptap/core';
  function diffText(oldText, newText) {
  const oldWords = oldText.split(' ');
  const newWords = newText.split(' ');

  const diff = [];
  let i = 0, j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (oldWords[i] !== newWords[j]) {
      if (oldWords[i] && (!newWords[j] || oldWords[i] !== newWords[j])) {
        // מילה הוסרה
        diff.push({ text: oldWords[i], color: 'pink' });
        i++;
      } else if (newWords[j] && (!oldWords[i] || oldWords[i] !== newWords[j])) {
        // מילה נוספה
        diff.push({ text: newWords[j], color: 'green' });
        j++;
      } else {
        // מילה שונה
        diff.push({ text: oldWords[i], color: 'pink' });
        diff.push({ text: newWords[j], color: 'green' });
        i++;
        j++;
      }
    } else {
      // מילה זהה
      diff.push({ text: oldWords[i], color: null });
      i++;
      j++;
    }
  }

  return diff.map(({ text, color }) =>
    color
      ? { type: 'text', text: text + ' ', marks: [{ type: 'highlight', attrs: { color } }] }
      : { type: 'text', text: text + ' ' }
  );
}

  function diffTiptapAndHighlight(oldtext, newtext) {
    console.log(oldtext,newtext)
    const oldJSON = generateJSON(oldtext, [
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
        Underline
      ]);
    console.log(oldJSON)
    const newJSON = generateJSON(newtext, [
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
        Underline
      ]);
      function wrapInMark(text, color) {
    return {
      type: 'text',
      text: text,
      marks: [{ type: 'highlight', attrs: { color } }],
    };
  }
  
  function compareNodes(oldNodes = [], newNodes = []) {
  const maxLength = Math.max(oldNodes.length, newNodes.length);
  const result = [];

  for (let i = 0; i < maxLength; i++) {
    const oldNode = oldNodes[i];
    const newNode = newNodes[i];

    if (!oldNode && newNode) {
      // צומת חדש
      result.push({
        ...newNode,
        marks: [...(newNode.marks || []), { type: 'highlight', attrs: { color: '#a7f2a4' } }],
      });
    } else if (!newNode && oldNode) {
      // צומת שהוסר
      result.push({
        ...oldNode,
        marks: [...(oldNode.marks || []), { type: 'highlight', attrs: { color: 'pink' } }],
      });
    } else if (oldNode.type !== newNode.type) {
      // שינוי סוג תגית - נציג את הטקסט הישן והחדש
      result.push({
        ...oldNode,
        marks: [...(oldNode.marks || []), { type: 'highlight', attrs: { color: 'pink' } }],
      });
      result.push({
        ...newNode,
        marks: [...(newNode.marks || []), { type: 'highlight', attrs: { color: '#a7f2a4' } }],
      });
    } else if (oldNode.text !== newNode.text) {
      // שינוי טקסט חלקי
      result.push(...diffText(oldNode.text || '', newNode.text || ''));
    } else if (oldNode.content || newNode.content) {
      // השוואת תוכן פנימי
      result.push({
        ...newNode,
        content: compareNodes(oldNode.content || [], newNode.content || []),
      });
    } else {
      // אין שינוי
      result.push(newNode);
    }
  }

  return result;
}


const result = {
  ...newJSON,
  content: compareNodes(oldJSON.content || [], newJSON.content || []),
};
  console.log(result)

    return result;
  }
 
  let outjsonb = []
  export let state = 2; // original and edit, 3 is original second and edit
  export let text;
  export let lebel = { he: 'עריכה', en: 'edit' };
  import tr from '$lib/translations/tr.json';
  import Close from '$lib/celim/close.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { onMount, onDestroy } from 'svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  let edit = false;
  let show2 = false;
  export let textb = text;
  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
  let editor
  $: showJson = false;
  $: htmlon = ``;
  let outjson = []
  onMount(() => {
    editor = new Editor({     
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
      ],
    });

    if (text == textb) {
      htmlon = text;
      htmlon = htmlon
      showJson = false;
      console.log("==",text, textb,outjson,showJson);

    } else {
        showJson = true;
        console.log("!==",text, textb,outjson,showJson);
      const oldJSON = generateJSON(text);
      const newJSON = generateJSON(textb);
      const result = diffTiptapAndHighlight(oldJSON, newJSON);
      outjson = result;
      console.log("!==",text, textb,outjson);
    }
  });
$: console.log(text,textb,outjson,showJson,htmlon);
 
</script>

<div
  class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2"
>
  {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
      <h2 class="underline decoration-mturk">{lebel[$lang]}:</h2>
      {#key htmlon}
        <RichText outpot={htmlon} {outjson} {showJson} editable={false} sml={true} />
      {/key}
        <button on:click={() => (edit = true)}>
        {#if text == textb}🖍️{:else}✏️{/if}</button
      >
      {#if text != textb && show2 != true}
        <button on:click={() => (show2 = true)}>📑</button>
      {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center">
          <button on:click={() => (show2 = false)}><Close /></button>
          <small class:text-right={$lang == 'he'}
            >{tr?.nego.original[$lang]}:</small
          >
          <RichText outpot={text} editable={false} sml={true} />
          <small class:text-right={$lang == 'he'} class="text-gold"
            >{tr?.nego.sugestion[$lang]}:</small
          >
          <RichText outpot={textb} editable={false} sml={true} />
        </div>
      {/if}
    </div>
  {:else}
  
        <label for="des" class="label">{lebel[$lang]}</label>

        <RichText bind:outpot={textb}  editable={true} sml={true} />
    <button
      on:click={() => {
        edit = false;
        showJson = true;
        outjson = diffTiptapAndHighlight(text, textb);
      }}>✅</button
    >
  {/if}
</div>

