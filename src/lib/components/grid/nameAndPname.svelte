<script>
 import Tile from "$lib/celim/tile.svelte";
  import Button from "$lib/celim/ui/button.svelte";
  import { sendToSer } from "$lib/send/sendToSer.js";
  import {lang} from '$lib/stores/lang';
  import { toast } from 'svelte-sonner';
  const pending = { he: 'ממתין לאישור', en: 'Pending Approval' };
  const pendingVal = { he: 'ממתין לאישרור', en: 'Pending Validation' };
  const completed = { he: 'הושלם בהצלחה', en: 'Completed Successfully' };
  const approve = { he: 'אישור', en: 'Approve' };
  const validate = { he: 'אישור ביצוע', en: 'Validate Completion' };
  const availableRoles = { he: 'תפקידים זמינים:', en: 'Available Roles:' };
  /**
   * @typedef {Object} Props
   * @property {string} [src]
   * @property {string} [pname]
   * @property {string} [mname]
   * @property {string} [type]
   * @property {boolean} [isOpen]
   * @property {boolean} [isPend]
   * @property {boolean} [isPending]
   * @property {boolean} [isCurrentUser]
   * @property {boolean} [isValidator]
   * @property {boolean} [isAssigned]
   * @property {any} [roles]
   * @property {any} [onApprove]
   * @property {any} [onValidate]
   * @property {number} [progress]
   * @property {boolean} [isApproved]
   * @property {boolean} [naasa]
   * @property {boolean} [pendingValidation]
   * @property {boolean} [isCompleted]
   * @property {any} id
   * @property {any} [text]
   * @property {any} [onClick]
   */

  /** @type {Props} */
  let {
    src = '',
    pname = '',
    mname = '',
    type = '',
    isOpen = false,
    isPend = false,
    isPending = $bindable(false),
    isCurrentUser = false,
    isValidator = false,
    isAssigned = false,
    roles = [],
    onApprove = () => {},
    onValidate = () => {},
    progress = 0,
    isApproved = false,
    naasa = false,
    pendingValidation = $bindable(false),
    isCompleted = false,
    id,
    text = {"he":"אני אבצע", "en":"assign to me"},
    onClick = () => {}
  } = $props();
  let loading = $state(false), success = $state(false), error = $state(false);
  const suc = { he: 'בוצע בהצלחה', en: 'Success' };

 async function handleApprove() {
    loading = true;
    await sendToSer(
      {
        id,
        myIshur: true
      },
      '31updateTask',
      null,
      null,
      false,
      fetch
    )
      .then((data) => {
        if(data.data != null) {
            success = true;
            isPending = false;
        loading = false;
        //toast

        toast.success(suc[$lang]);
        onApprove();
        
        }else{
        loading = false;
        error = true;
        }
      })
      .catch((err) => {
        error = true;
        loading = false;
      });
  }

  async function handleValidate() {
    loading = true;
    await sendToSer(
      {
        id,
        valiIshur: true
      },
      '31updateTask',
      null,
      null,
      false,
      fetch
    )
      .then((data) => {
        if(data.data != null) {
            success = true;
            pendingValidation = false;
        loading = false;
        //toast
        toast.success(suc[$lang]);
        onValidate();
        }else{
        loading = false;
        error = true;
        }
    }).catch((err) => {
        error = true;
        loading = false;
    });
    onValidate();
  }

  let strokeDasharray = $derived(2 * Math.PI * 12); // circumference of circle with r=12
  let strokeDashoffset = $derived(strokeDasharray * (1 - progress / 100));
</script>

{#if type !== "button"}
<div class="flex items-center gap-2">
    {#if src}
        <img src={src} alt={pname} class="w-8 h-8 rounded-full" loading="lazy" />
    {/if}
    <div class="flex flex-col text-start">
        <div class="flex items-center gap-2">
            {#if pname}
                <span>{pname}</span>
                {#if isCompleted}
                    <div class="relative inline-flex items-center justify-center h-6">
                        <svg class="w-6 h-6 transform -rotate-90">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#e5e7eb"
                                stroke-width="2"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#22c55e"
                                stroke-width="2"
                                stroke-dasharray={strokeDasharray}
                                stroke-dashoffset={0}
                                stroke-linecap="round"
                            />
                        </svg>
                        <span class="absolute text-[10px] font-medium">✓</span>
                    </div>
                {/if}
                {#if pendingValidation}
                    <div class="relative inline-flex items-center justify-center h-6">
                        <svg class="w-6 h-6 transform -rotate-90">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#e5e7eb"
                                stroke-width="2"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#22c55e"
                                stroke-width="2"
                                stroke-dasharray={strokeDasharray}
                                stroke-dashoffset={0}
                                stroke-linecap="round"
                            />
                        </svg>
                        <span class="absolute text-[10px] font-medium">100%</span>
                    </div>
                {:else if isApproved && !naasa}
                    <div class="relative inline-flex items-center justify-center h-6">
                        <svg class="w-6 h-6 transform -rotate-90">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#e5e7eb"
                                stroke-width="2"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#3b82f6"
                                stroke-width="2"
                                stroke-dasharray={strokeDasharray}
                                stroke-dashoffset={strokeDashoffset}
                                stroke-linecap="round"
                            />
                        </svg>
                        <span class="absolute text-[10px] font-medium">{progress}%</span>
                    </div>
                {/if}
            {/if}
        </div>
        {#if isPending}
            <span class="text-yellow-500 text-sm">{pending[$lang]}</span>
        {/if}
        {#if pendingValidation}
            <span class="text-green-500 text-sm">{pendingVal[$lang]}</span>
            {#if isValidator}
                <Button  {success} {error} {loading} size="sm" onClick={handleValidate} text={validate} />
         
            {/if}
        {/if}
        {#if isCompleted}
            <span class="text-green-600 text-sm font-medium">{completed[$lang]}</span>
        {/if}
        {#if isCurrentUser && isPending}
            <Button {success} {error} {loading} size="sm" onClick={handleApprove} text={approve} />
              
        {/if}
        {#if mname}
            <span 
                class="text-blue-500 cursor-pointer hover:underline" 
                role="button"
                tabindex=0
                onclick={onClick}
            >
                {mname}
            </span>
        {/if}
    </div>
</div>
    {#if !pname && !mname}
        {#if isOpen}
        <button onclick={onClick} >
        <Tile bg="pink" word={isOpen.name}/>
        </button>
        {:else if isPend}
        <button onclick={onClick} >
        <Tile bg="gold" word={isPend.name}/>
        </button>
        {/if}
        {/if}
{:else if type === "button"}
{#if !isAssigned && roles.length == 0}

    <Button variant="primary" size="sm" onClick {text} />
       
{:else if !isAssigned && roles.length > 0}
    <div class="flex flex-col gap-1">
        <div class="flex flex-wrap gap-2">
            {#each roles as role}
                <span class="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{role}</span>
            {/each}
        </div>
        <Button variant="primary" size="sm" onClick={onClick} text={text} />
    </div>
    {/if}
{/if}
