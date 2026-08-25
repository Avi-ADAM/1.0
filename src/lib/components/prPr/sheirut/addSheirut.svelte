<script>
  import { isRtl, t } from '$lib/translations';
  import Close from '$lib/celim/close.svelte';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  import { proposeSheirut } from '$lib/client/actionClient';
  import { idPr } from '$lib/stores/idPr';
  import { toast } from 'svelte-sonner';
  /**
   * @typedef {Object} Props
   * @property {string} [restime] - Kept for the caller's sake; the deadline is
   *   now derived server-side from the rikma's own restime.
   * @property {number} [usersNum] - Likewise: the server counts the members.
   * @property {() => void} [onClose] - Callback when the component should close.
   */

  /** @type {Props} */
  let { restime = "feh", usersNum = 1, onClose } = $props();
    let name = $state() , descrip = $state(),oneTime = $state(false),already = $state(false), success = $state(false) , equaliSplited = $state(true)
    let open = $state(false)

    /**
     * One call, replacing three raw GraphQL mutations (PLAN_TIMEGRAMA B6).
     * `proposeSheirut` decides on the server whether the rikma has partners to
     * ask: a solo rikma publishes the service at once, anything larger gets a
     * proposal, the proposer's vote, and the clock that matures it on silence
     * (timegrama/sheirutpend.svelte). The old client did the reverse — it
     * published for multi-member rikmas and left solo ones unapprovable.
     */
    async function create(){
        already = true

        const result = await proposeSheirut({
          projectId: String($idPr),
          name: String(name ?? ''),
          descrip: String(descrip ?? ''),
          oneTime,
          equaliSplited
        });

        if (!result.success) {
          // The action client already surfaced the error; let them try again.
          already = false;
          return;
        }

        success = true
        open = false
        setTimeout(function(){
          success = false
        },15000)
        toast.success(`${$t('project.sheirut.fnnnCreated')}`);
        onClose?.()
    }

</script>
<SucssesConf {success} />

 {#if open === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={()=>open = true}>{$t('project.sheirut.createNew')}
    </button>
  {:else} 
      <div class="flex flex-col items-center justify-center sm:w-1/2 p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
        <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
            onclick={()=>open = false}><Close/>
        </button>
        <h1 class="text-barbi">{$t('project.sheirut.createNew')}</h1>
        <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
              <input name="des" bind:value={name}  
             type='text' class='input'required >
              <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="des" class='label'>{$t('project.sheirut.name')}</label>
              <span class='line'></span>
        </div>

        <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
              <textarea name="es"  bind:value={descrip}    
             type='text' class='input d' required ></textarea>
              <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="es" class='label'>{$t('project.sheirut.description')}</label>
              <span class='line'></span>
        </div>

        <!----<Chooser bind:checked={equaliSplited} tr={$t('project.sheirut.splitEqually')} level={$t('project.sheirut.equaliSplitedLevel')} fl={$t('project.sheirut.subscription')}/>-->
        <Chooser bind:checked={oneTime} tr={$t('project.sheirut.oneTime')} level={$t('project.sheirut.oneTimeLevel')} fl={$t('project.sheirut.monthly')}/>
        <Chooser bind:checked={equaliSplited} tr={$t('project.sheirut.splitEqually')} level={$t('project.sheirut.equaliSplitedLevel')} fl={$t('project.sheirut.subscription')}/>
             {#if already === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={create}>{$t('project.sheirut.createNew')}
    </button>
    {/if}   
    </div>

 {/if}
