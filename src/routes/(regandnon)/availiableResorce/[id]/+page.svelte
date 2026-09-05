<script>
    import { toast } from 'svelte-sonner';
    import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
    import SucssesConf from '$lib/celim/sucssesConf.svelte';
    import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';
    import Share from '$lib/components/share/ShareLink.svelte';
    import { page } from '$app/state';
    import { lang } from '$lib/stores/lang.js';
    import { t } from '$lib/translations';
    import { RingLoader } from 'svelte-loading-spinners';
    import { goto } from '$app/navigation';
    import { sendToSer } from '$lib/send/sendToSer.js';
    import { executeAction } from '$lib/client/actionClient';
    import Nego from '$lib/components/prPr/negoPend.svelte';
    import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
    import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { fly } from 'svelte/transition';
    import { Head } from 'svead';
    import { montsi } from '$lib/func/montsi.svelte';
    import { MultiSelect } from 'svelte-multiselect';
    import { find_skill_id } from '$lib/func/findSkillId.svelte';

    let selected = $state([])
    let mash = $state([])
    let easychoose = $state(false)
    let error1 = null;
    let success = $state(false);
    let alrr = $state(false) 
    let tochoose = $state(false)
    let loading = $state(true)
    // The value the resource is offered at. Set from the rikma's asking price;
    // changing it is the counter-proposal (nego) dialog's job, not this page's.
    let offerValue = $state(0)
    let hovered = $state(false);
    let wid = $state();

    function project(x) {
        goto('/project/' + x);
    }

    function second (){
        alr = true
    }

    function hover(a) {}

    function reg() {
        if ($lang == 'he') {
            goto('/');
        } else if ($lang == 'en') {
            goto('/en');
        } else if ($lang == 'ar') {
            goto('/ar');
        } else {
            goto('/');
        }
    }
    
    function login() {
        // Use page.params.id instead of data.mId since data might not be available yet
        // The route is spelled `availiableResorce` — anything else 404s after login.
        goto(`/login?from=/availiableResorce/${page.params.id}`);
    }

    // "I'll create a new resource for this": there is nothing to choose here —
    // the offer is simply made at the value the rikma asked for. Changing that
    // value is what the counter-proposal (nego) dialog is for, so this path
    // only states the amount and asks for confirmation.
    function torange(){
        if (data && data.alld) {
            offerValue = Number(data.alld.price) || 0
            easychoose = true
        }
    }

    async function tochoos(){
        tochoose = true
        loading = true
        const inD = data.alld;
        // A need without a `mashaabim` template (a stipend funding request has
        // none) cannot be filtered by one — offer the whole list instead.
        const mashaabimId = inD?.mashaabim?.data?.id;
        try {
            const d1 = await sendToSer(
                mashaabimId ? { idL: '0', mashaabimId: String(mashaabimId) } : { idL: '0' },
                mashaabimId ? 'getUserSpByMashaabim' : 'getUserSpsAvailable',
                0,
                0,
                false,
                fetch
            );
            mash = d1?.data?.usersPermissionsUser?.data?.attributes?.sps?.data ?? [];
        } catch (e) {
            console.error('[availiableResorce] failed to load my resources', e);
            mash = [];
        }
        loading = false
    }

    function afterChoose (){
        let id = find_skill_id(selected,mash,"name")
        console.log(id)
        ask(id)
    }

    // Same SP resolution as afterChoose, but opens the custom-terms (nego) flow.
    function afterChooseNego (){
        let id = find_skill_id(selected,mash,"name")
        openNego(id)
    }

    // Resolve the SP to invest: an existing one (spId != 0) or a freshly created
    // resource matching the need (spId == 0). Returns the real SP id, or null
    // when the creation failed — the callers must not proceed on a null.
    async function ensureSpId(spId) {
        if (spId != 0) return spId;
        const inD = data.alld;
        const result = await executeAction('createResourceRequest', {
            // A need with no `mashaabim` template (a stipend funding request has
            // none) still creates a resource — the relation is simply omitted.
            mashaabimId: inD.mashaabim?.data?.id ? String(inD.mashaabim.data.id) : undefined,
            name: inD.name,
            descrip: inD.descrip ?? undefined,
            kindOf: inD.kindOf ?? undefined,
            hm: Number(inD.hm) || 1,
            spnot: inD.spnot ?? undefined,
            price: Number(inD.price) || 0,
            myp: Number(offerValue) || 0,
            linkto: inD.linkto ?? undefined,
            // `!= null` and not `!== undefined`: Strapi answers with `null` for
            // an unset date, and `new Date(null)` is 1970 — an open-ended
            // resource used to be created with a 1970 end date.
            sdate: inD.sqadualed != null ? new Date(inD.sqadualed).toISOString() : undefined,
            fdate: inD.sqadualedf != null ? new Date(inD.sqadualedf).toISOString() : undefined
        });
        if (!result.success || !result.data?.id) {
            toast.error(result.error?.message ?? $t('pages.availResource.askFailed'));
            return null;
        }
        return String(result.data.id);
    }

    // Offer the resource on the rikma's own terms. `createMashaabimRequest`
    // owns the whole flow server-side (Askm, the requester's own vote when they
    // are a member, the declined mark, the restime timegrama, and the
    // solo-member auto-approval) — the page only reports the outcome.
    async function ask(spId) {
        alrr = true;
        const inD = data.alld;
        const real = await ensureSpId(spId);
        if (!real) { alrr = false; return; }
        try {
            const result = await executeAction('createMashaabimRequest', {
                openMashaabimId: String(data.mId),
                projectId: String(inD.project.data.id),
                spId: String(real),
                missionName: inD.name != null ? String(inD.name) : undefined
            });
            if (!result.success) {
                toast.error(result.error?.message ?? $t('pages.availResource.askFailed'));
                alrr = false;
                return;
            }
            success = true;
            setTimeout(function () {
                success = false;
            }, 15000);
            toast.success(`${$t('pages.availResource.fnnn')}`);
        } catch (e) {
            console.error('[availiableResorce] askm failed', e);
            toast.error($t('pages.availResource.askFailed'));
            alrr = false;
        }
    }

    // Propose custom terms (Path B/D). After resolving the SP (existing or new),
    // open the Nego dialog and submit via proposeOnOpenMashaabim — the server
    // checks membership and routes (member → Path D; non-member → Path B).
    let negoOpen = $state(false);
    let negoLoading = $state(false);
    let negoSpId = $state(null);
    const closeNego = () => { negoOpen = false; negoLoading = false; };

    async function openNego(spId) {
        alrr = true;
        const real = await ensureSpId(spId);
        if (real) { negoSpId = String(real); negoOpen = true; }
        else alrr = false;
    }

    async function negoSubmit({ newValues }) {
        const inD = data.alld;
        try {
            const result = await executeAction('proposeOnOpenMashaabim', {
                openMashaabimId: String(data.mId),
                projectId: String(inD.project.data.id),
                spId: String(negoSpId),
                missionName: inD.name != null ? String(inD.name) : undefined,
                newValues
            });
            if (!result.success) {
                toast.error(result.error?.message ?? 'שגיאה בשליחת ההצעה');
                negoLoading = false;
                return;
            }
            closeNego();
            success = true;
            setTimeout(() => { success = false; }, 15000);
            toast.success(`${$t('pages.availResource.fnnn')}`);
        } catch (e) {
            console.error(e);
            toast.error('אירעה שגיאה');
            negoLoading = false;
        }
    }


    let { askedarr = [], alr = $bindable(false), data } = $props();
    console.log(data);

    let title = 'This is Svead a Svelte Head Component';
    let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;
    let description = page?.data.alld?.descrip || $t('pages.availResource.om');
    let url = page.url.toString();

    const FALLBACK_LOGO = 'https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png';

    // Source identity: rikma (project) / demand pool (maagad) / wish (concierge).
    let hasProject = $derived(!!data.alld?.project?.data);
    let maagadInfo = $derived(data.alld?.maagadInfo ?? null);
    let isMaagadSrc = $derived(!!maagadInfo || data.alld?.source === 'maagad');
    let ratsonId = $derived(data.alld?.ratson?.data?.id ?? null);
    let ratsonName = $derived(data.alld?.ratson?.data?.attributes?.name ?? '');
    let sourceName = $derived(
        data.alld?.project?.data?.attributes?.projectName ??
            (isMaagadSrc
                ? `${$lang === 'he' ? 'מאגד ביקוש' : 'demand pool'}${maagadInfo?.name ? ` · ${maagadInfo.name}` : ''}`
                : `${$lang === 'he' ? "קונסיירז'" : 'concierge'}${ratsonName ? ` · ${ratsonName}` : ''}`)
    );

    // ── שווי צפוי בריקמה ─────────────────────────────────────────────────
    // אותו חישוב שמוצג בשורת הכסף למעלה: השווי המבוקש × כמות × מספר המחזורים.
    // משאב מתחדש בלי תאריך סיום מתומחר במחזור אחד, ושורות ה-1/2/5 שנים הן שנותנות
    // את התמונה הארוכה.
    let isOpenEnded = $derived(!!data.alld?.recurring && !data.alld?.sqadualedf);
    let perCycleValue = $derived(
        Number(data.alld?.easy) > 0 ? Number(data.alld.easy) : Number(data.alld?.price) || 0
    );
    // hm הוא מונה *יחידות למחזור* — לא משך. המשך מגיע תמיד מהתאריכים דרך montsi,
    // ולכן שורת הכסף למטה משתמשת באותו `units` ולא ב-hm הגולמי: רשומה ישנה עם
    // hm ריק הציגה "סה"כ 0", ורשומה שכתבה לתוכו חודשים הכפילה את המשך פעמיים.
    let units = $derived(Math.max(1, Number(data.alld?.hm) || 1));
    let cycles = $derived(
        Number(montsi(data.alld?.kindOf, data.alld?.sqadualed, data.alld?.sqadualedf, true)) || 1
    );
    let equityValue = $derived(perCycleValue * units * (isOpenEnded ? 1 : cycles));
    // ₪ לחודש — רק למשאב מתחדש בלי תאריך סיום, שממשיך לחייב ללא הגבלה.
    let equityMonthlyValue = $derived(
        isOpenEnded && perCycleValue > 0
            ? (perCycleValue * units) /
                  (Math.max(1, Number(data.alld?.cycleSize) || 1) *
                      (data.alld?.kindOf === 'yearly' ? 12 : 1))
            : null
    );
    // מה שהמשאב שווה בסך הכל בהצעה — אותו חישוב של שורת הכסף, על השווי המוצע.
    // משאב מתחדש בלי תאריך סיום נספר במחזור אחד, כמו למעלה.
    let offerTotal = $derived(offerValue * units * (isOpenEnded ? 1 : cycles));
</script>

{#await data.alld}
    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center">
        <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
    </div>
{:then a} 
    {#if data != null}
        <SucssesConf {success} />

        <DialogOverlay isOpen={negoOpen} onDismiss={closeNego} class="overlay">
            <div transition:fly={{ y: 40, opacity: 0, duration: 250 }}>
                <DialogContent class="nego" aria-label="form">
                    <button onclick={closeNego} style="margin: 0 auto;" class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full" aria-label="סגירה">✕</button>
                    {#if negoLoading}
                        <RingLoader size="200" color="#ff00ae" unit="px" duration="2s" />
                    {:else if negoOpen && data.alld}
                        <Nego
                            onLoad={() => (negoLoading = true)}
                            onClose={closeNego}
                            onSubmit={negoSubmit}
                            masaalr={false}
                            descrip={data.alld.descrip}
                            projectName={data.alld.project.data.attributes.projectName}
                            name1={data.alld.name}
                            spnot={data.alld.spnot}
                            kindOf={data.alld.kindOf}
                            hm={data.alld.hm || 0}
                            projectId={String(data.alld.project.data.id)}
                            total={data.alld.price || 0}
                            noofusers={data.alld.project.data.attributes.user_1s?.data?.length || 1}
                            price={data.alld.price || 0}
                            easy={data.alld.easy || 0}
                            linkto={''}
                            pendId={null}
                            sqadualedf={data.alld.sqadualedf}
                            sqadualed={data.alld.sqadualed}
                            users={[]}
                            ordern={0}
                            restime={data.alld.project.data.attributes.restime}
                        />
                    {/if}
                </DialogContent>
            </div>
        </DialogOverlay>

        {#if data.alld?.archived != true && data.alld != null}
            <Head title={page.data?.alld?.titleKey ? $t(page.data.alld.titleKey, page.data.alld.titleParams) : $t('pages.availResource.headi')} {description} {image} {url} />
            <div bind:clientWidth={wid} dir="rtl" style="overflow-y:auto" class="d mb-4 sm:pt-4 w-full lg:w-1/2 mx-auto">
                <!-- Discovery cross-links: back to the big picture (directories + map) -->
                <div class="mb-3 flex justify-center">
                    <DiscoveryNav current="resources" isLoggedIn={data.tok == true} />
                </div>
                {#if data.authExpired}
                    <!-- The visitor arrived with auth cookies we could not use.
                         The resource is public, so it is shown — signed out,
                         with the way back in, instead of a false "it's gone". -->
                    <div class="mb-3 border border-gold bg-black/70 p-3 text-center" role="status">
                        <p class="text-barbi text-lg">{$t('auth.expired.title')}</p>
                        <p class="text-gold text-sm">{$t('auth.expired.body')}</p>
                        <div class="mt-2 flex flex-wrap justify-center gap-2">
                            <button onclick={login} class="button-perl text-barbi hover:text-black border border-gold px-4 py-1 font-bold">{$t('auth.expired.login')}</button>
                            <button onclick={reg} class="text-gold hover:text-barbi hover:border-barbi border border-gold rounded px-4 py-1">{$t('auth.expired.signup')}</button>
                        </div>
                    </div>
                {/if}
                <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
                    <div class="relative flex items-center space-x-1">
                        <div class="relative">
                            <img src={data.alld.project?.data?.attributes?.profilePic?.data?.attributes?.url ?? FALLBACK_LOGO} alt="" class="w-10 sm:w-16 h-10 sm:h-16 rounded-full" />
                        </div>
                        <div class="flex flex-col leading-tight">
                            <div class="sm:text-sm text-md mt-1 flex items-center">
                                <span class="text-barbi text-center mr-3 sm:text-2xl lg:text-4xl text-xl">{$t('pages.availResource.headi')}</span>
                            </div>
                            <span class="pn ml-1 text-lg sm:text-xl lg:text-2xl text-grey-200">{sourceName}</span>
                        </div>
                    </div>
                    <div>
                        {#if hasProject}
                        <button onclick={() => project(data.alld.project.data.id)} class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4">{$t('pages.availResource.seePr')}</button>
                        {:else if maagadInfo?.id}
                        <a href="/maagad/{maagadInfo.id}" class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4">{$t('pages.availResource.seeMaagad')}</a>
                        {:else if ratsonId}
                        <!-- The public wish page — right referral for any visitor -->
                        <a href="/wish/{ratsonId}" class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4">{$t('pages.availResource.seeWish')}</a>
                        {/if}
                    </div>
                </div>
                <div class="lg:bg-gray-700 bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
                    <div class="mb-8">
                        <div class="mb-2">
                            <div class="flex flex-row justify-between">
                                <div class="px-2">
                                    <h2 class="text-barbi font-bold text-xl lg:text-4xl underline">{data.alld.name}</h2>
                                    {#if data.alld.recurring}
                                        <div class="inline-flex flex-wrap items-center gap-2 my-2 px-3 py-1.5 rounded-xl bg-blue-900/40 border border-gold/40">
                                            <span class="text-gold font-bold text-sm lg:text-xl"><EntityIcon kind="recurring" size={15} /> {$t('pages.availResource.recurH')}</span>
                                            {#if Number(data.alld.cycleSize) > 1}
                                                <span class="text-gray-100 text-xs lg:text-lg">· {$t('pages.availResource.everyH')} {data.alld.cycleSize} {data.alld.kindOf == "yearly" ? $t('pages.availResource.years') : $t('pages.availResource.monts')}</span>
                                            {/if}
                                            {#if !data.alld.sqadualedf}
                                                <span class="text-gray-100 text-xs lg:text-lg">· <EntityIcon kind="endless" size={14} /> {$t('pages.availResource.noEndH')}</span>
                                            {/if}
                                        </div>
                                    {/if}
                                    {#if data.alld.descrip !== null && data.alld.descrip !== 'null' && data.alld.descrip !== 'undefined' && data.alld.descrip !== undefined}
                                        <p class="cd d max-h-16 text-gray-100 text-lg lg-text-2xl overflow-y-auto">{data.alld.descrip}</p>
                                    {/if}
                                    
                                    {#if data.alld.sqadualed || data.alld.sqadualedf}
                                        <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
                                            <img class="w-6 lg:w-12" src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg" alt="howmuch" />
                                            {#if data.alld.sqadualed}
                                                <span> {new Date(data.alld?.sqadualed).toLocaleDateString()}</span>
                                            {/if}
                                            {#if data.alld.sqadualedf}
                                                <span> - {new Date(data.alld?.sqadualedf).toLocaleDateString()}</span>
                                            {/if}
                                        </p>
                                    {/if}  
                                    
                                    <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
                                        <img class="w-6 lg:w-12" src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch" />
                                        <span>
                                            <span>{data.alld.price}</span>
                                            {#if data.alld.price != data.alld.easy}
                                                <span> ↔️ {data.alld.easy}</span>
                                            {/if}
                                            {#if data.alld.recurring}
                                                <span class="text-gold"> ₪ {data.alld.kindOf == "yearly" ? $t('pages.availResource.perY') : $t('pages.availResource.perM')}</span>
                                            {/if}
                                        </span>
                                        {#if data.alld.kindOf != "total" && units > 1}
                                            <span> ✖️ {units} {$t('pages.availResource.units')}</span>
                                        {/if}
                                        {#if (data.alld.kindOf == "monthly" || data.alld.kindOf == "years" || data.alld.kindOf == "yearly" || data.alld.kindOf == "rent") && !(data.alld.recurring && !data.alld.sqadualedf)}
                                            <span> ✖️ {cycles}
                                                {#if data.alld.kindOf == "monthly" || data.alld.kindOf == "rent"}
                                                    <span>{$t('pages.availResource.monts')}</span>
                                                {:else if data.alld.kindOf == "years" || data.alld.kindOf == "yearly"}
                                                    <span>{$t('pages.availResource.years')}</span>
                                                {/if}
                                            </span>
                                        {/if}
                                        {#if data.alld.kindOf != "total" && !(data.alld.recurring && !data.alld.sqadualedf)}
                                            <span>  =  {((Number(data.alld.price) || 0) * units * cycles).toLocaleString('en-US')}
                                                {#if data.alld.price != data.alld.easy}
                                                    <span> ↔️ {((Number(data.alld.easy) || 0) * units * cycles).toLocaleString('en-US')}</span>
                                                {/if}
                                                {$t('pages.availResource.total')}
                                            </span>
                                        {/if}
                                    </p>
                                    
                                    <!-- שווי צפוי בריקמה — עמוד ציבורי, ולכן isSer מושך דרך
                                         טוקן השירות; מסתתר בשקט אם אין הרשאת קריאה. -->
                                    {#if hasProject}
                                        <div class="my-3 mx-5">
                                            <EquityPreview
                                                projectId={data.alld.project.data.id}
                                                missionValue={equityValue}
                                                monthlyValue={equityMonthlyValue}
                                                alreadyCountedIn="pipeline"
                                                subject="resource"
                                                isSer={true}
                                            />
                                        </div>
                                    {/if}

                                    <p onmouseenter={() => hover('הערות')} onmouseleave={() => hover('0')} class="text-gray-100 lg:text-2xl max-h-16 cd text-sm d overflow-y-auto mt-2">
                                        {data.alld.spnot !== undefined && data.alld.spnot !== null && data.alld.spnot !== 'undefined' ? data.alld.spnot : ''}
                                    </p>
                                    
                                    {#if data.tok !== true}
                                        <div role="status" class="space-y-2.5 animate-pulse max-w-lg">
                                            <div class="flex items-center w-full space-x-2">
                                                <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
                                                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
                                                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
                                            </div>
                                            <div class="flex items-center w-full space-x-2 max-w-[480px]">
                                                <small class="text-barbi text-lg leading-3 sm:text-2xl">{$t('pages.availResource.foreg')}</small>
                                                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
                                            </div>
                                            <span class="sr-only">for registered users only...</span>
                                        </div>
                                    {/if}
                                    
                                    {#if alr == true && alrr == false && !data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                                        <!-- A column, not a row: the two paths (a new resource / one of
                                             mine) each need the full width. As a flex row the heading was
                                             squeezed to one letter per line and the value was unreadable. -->
                                        <div class="flex flex-col items-center gap-3 mt-4">
                                            {#if easychoose != true}
                                                <button onclick={torange} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">{$t('pages.availResource.creatnew')}</button>
                                            {:else}
                                                <!-- No slider here: the offer is made at the value the rikma
                                                     asked for, and it is simply stated. Offering a different
                                                     value is what "propose other" (nego) is for. -->
                                                <div class="w-full max-w-md rounded-2xl border border-gold/40 bg-black/30 p-4 text-center">
                                                    <h3 class="text-barbi font-bold text-lg">{$t('pages.availResource.offerValueHead')}</h3>
                                                    <p class="text-gold font-bold text-2xl lg:text-3xl my-2">
                                                        {offerValue.toLocaleString('en-US')} ₪{#if data.alld.recurring}<span class="text-base font-normal">&nbsp;{data.alld.kindOf == "yearly" ? $t('pages.availResource.perY') : $t('pages.availResource.perM')}</span>{/if}
                                                    </p>
                                                    {#if offerTotal !== offerValue}
                                                        <p class="text-gray-100 text-sm">{offerTotal.toLocaleString('en-US')} ₪ {$t('pages.availResource.total')}</p>
                                                    {/if}
                                                    <p class="text-gray-300 text-xs mt-2">{$t('pages.availResource.offerValueHint')}</p>
                                                    <div class="flex flex-wrap justify-center gap-2 mt-3">
                                                        <button onclick={()=>ask(0)} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">{$t('pages.availResource.okk')}</button>
                                                        <button onclick={()=>openNego(0)} class="border border-gold rounded-full text-gold hover:text-barbi hover:border-barbi font-bold py-2 px-4">{$t('lev.cards.proposeOther')}</button>
                                                    </div>
                                                </div>
                                            {/if}

                                            {#if tochoose != true && alrr == false}
                                                <button onclick={tochoos} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">{$t('pages.availResource.choosee')}</button>
                                            {:else if alrr == false}
                                                <div class="w-full max-w-md flex flex-col items-center gap-3">
                                                    {#if loading == true || loading !=true && mash.length >0}
                                                        <div class="w-full">
                                                            <MultiSelect {loading} --sms-open-z-index=4 --sms-options-max-height="10vh" --sms-text-color="var(--barbi-pink)" --sms-max-width="100%" bind:selected maxSelect={1} placeholder={$t('pages.availResource.plh')} noMatchingOptionsMsg={$t('pages.availResource.nom')} options={mash.map(c => c.attributes.name)} />
                                                        </div>
                                                    {:else}
                                                        <p class="text-barbi text-center">{$t('pages.availResource.nomash')}</p>
                                                    {/if}
                                                    {#if selected.length>0}
                                                        <div class="flex flex-wrap justify-center gap-2">
                                                            <button onclick={afterChoose} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full">{$t('pages.availResource.ok')}</button>
                                                            <button onclick={afterChooseNego} class="border border-gold rounded-full text-gold hover:text-barbi hover:border-barbi font-bold py-2 px-4">{$t('lev.cards.proposeOther')}</button>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <div class="">
                                    <Share path={'/availiableResorce/' + page.data?.mId} title={data.alld?.titleKey ? $t(data.alld.titleKey, data.alld.titleParams) : ''} desc={$t('ui.share.resource')} hashtags={['1lev1', 'resource']} quote={data.alld?.titleKey ? $t(data.alld.titleKey, data.alld.titleParams) : ''} />
                                </div>
                            </div>

                            {#if !hasProject}
                                <!-- Wish/maagad-sourced resource: the legacy Askm share flow
                                     needs a rikma — offers go through the source page instead. -->
                                <div class="flex flex-col gap-3 justify-center items-center mt-7">
                                    <p class="text-barbi text-center text-xl">{isMaagadSrc ? $t('pages.availResource.offerViaMaagad') : $t('pages.availResource.offerViaWish')}</p>
                                    {#if maagadInfo?.id}
                                        <a href="/maagad/{maagadInfo.id}" class="button-perl text-barbi text-2xl px-4 py-3 hover:text-black hover:font-bold">{$t('pages.availResource.seeMaagad')}</a>
                                    {:else if ratsonId}
                                        <a href="/wish/{ratsonId}" class="button-perl text-barbi text-2xl px-4 py-3 hover:text-black hover:font-bold">{$t('pages.availResource.seeWish')}</a>
                                    {/if}
                                </div>
                            {:else if page.data.tok != false}
                                <div class="flex justify-center min-h-fit">
                                    {#if alr == false && !data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                                        <button onclick={second} onmouseenter={() => (hovered = true)} onmouseleave={() => (hovered = false)} class:button-perl={hovered == false} class:button-gold={hovered == true} class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold text-barbi">{$t('pages.availResource.iwantto')}</button>
                                    {:else if data.alld.declinedsps.data.map((c) => c.id).includes(data.uid)}
                                        <h3 class="button-perl text-barbi px-4 py-1">{$t('pages.availResource.alri')}</h3>
                                    {/if}
                                </div>
                            {:else}
                                <div class="flex justify-center">
                                    <div role="contentinfo" class="mx-8 mt-7 text-barbi hover:text-black" onmouseenter={() => (hovered = true)} onmouseleave={() => (hovered = false)} class:button-perl={hovered == false} class:button-gold={hovered == true}>
                                        <p class="text-center font-bold text-2xl p-2">{$t('pages.availResource.info')}</p>
                                        <div class="flex flex-row flex-auto justify-between">
                                            <button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={reg}>{$t('pages.availResource.registratio')}</button>
                                            <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={login}>{$t('pages.availResource.logi')}</button>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {:else if data.alld?.archived == true}
            <div class="text-center pt-14">
                <h1 class="text-barbi sm:text-xl my-5">{$t('pages.availResource.mand')}</h1>
                {#if page?.data.tok != false}
                    <a href="/lev" class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl">{$t('pages.availResource.tolev')}</a>
                {:else}
                    <div class="w-screen">
                        <div class="w-1/2 mx-auto border border-barbi button-bronze">
                            <h3 class="font-bold text-2xl p-2">{$t('pages.availResource.info')}</h3>
                            <div class="flex flex-row flex-auto justify-between">
                                <button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={reg}>{$t('pages.availResource.registratio')}</button>
                                <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={login}>{$t('pages.availResource.logi')}</button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="text-center pt-14">
                <h3 class="text-barbi sm:text-xl my-5">error | שגיאה</h3>
                {#if page.data.tok != false}
                    <a href="/lev" class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl">{$t('pages.availResource.tolev')}</a>
                {:else}
                    <div class="w-screen">
                        <div class="w-1/2 mx-auto border border-barbi button-bronze">
                            <h1 class=" font-bold text-2xl p-2">{$t('pages.availResource.info')}</h1>
                            <div class="flex flex-row flex-auto justify-between">
                                <button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={reg}>{$t('pages.availResource.registratio')}</button>
                                <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={login}>{$t('pages.availResource.logi')}</button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    {:else}
        <div class="text-center pt-14">
            <h3 class="text-barbi sm:text-xl my-5">error | שגיאה</h3>
            {#if page.data.tok != false}
                <a href="/lev" class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2 sm:text-xl">{$t('pages.availResource.tolev')}</a>
            {:else}
                <div class="w-screen">
                    <div class="w-1/2 mx-auto border border-barbi button-bronze">
                        <h1 class=" font-bold text-2xl p-2">{$t('pages.availResource.info')}</h1>
                        <div class="flex flex-row flex-auto justify-between">
                            <button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={reg}>{$t('pages.availResource.registratio')}</button>
                            <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={login}>{$t('pages.availResource.logi')}</button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
{/await} 
