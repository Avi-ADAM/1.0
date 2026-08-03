<script>
    import { toast } from 'svelte-sonner';
    import SucssesConf from '$lib/celim/sucssesConf.svelte';
    import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';
    import Share from '$lib/components/share/shareButtons/index.svelte';
    import { page } from '$app/state';
    import { lang } from '$lib/stores/lang.js';
    import { t } from '$lib/translations';
    import { RingLoader } from 'svelte-loading-spinners';
    import { goto } from '$app/navigation';
    import { SendTo } from '$lib/send/sendTo.svelte';
    import { executeAction } from '$lib/client/actionClient';
    import Nego from '$lib/components/prPr/negoPend.svelte';
    import EquityPreview from '$lib/components/equity/EquityPreview.svelte';
    import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
    import { fly } from 'svelte/transition';
    import RangeSlider from "svelte-range-slider-pips";
    import { Head } from 'svead';
    import { calcX } from '$lib/func/calcX.svelte';
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
    let easyy = $state(0)
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

    function torange(){
        console.log("i am")   
        // Check if data and data.alld are available before accessing
        if (data && data.alld) {
            easyy = [Number(data.alld.price)]
            easychoose = true
            console.log("i am",easyy,data.alld.easy ,"kk", data.alld.price)
        }
    }

    async function tochoos(){
        tochoose = true
        loading = true
        const cookieValueId = document.cookie
            .split('; ')
            .find((row) => row.startsWith('id='))
            .split('=')[1];
        const uId = cookieValueId;
        const inD = data.alld;

        let id = inD.mashaabim.data.id
        const que1 = `query { usersPermissionsUser (id: ${uId}){
        data {
            id attributes{
                sps (filters: { mashaabim:{id : {eq:${id}}}}){data{id attributes{ name}}}
            }
        }}}`
        const d1 = await SendTo(que1).then();
        console.log(d1)
        mash = d1.data.usersPermissionsUser.data.attributes.sps.data;
        mash = mash
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

    function getUid() {
        return document.cookie
            .split('; ')
            .find((row) => row.startsWith('id='))
            .split('=')[1];
    }

    // Resolve the SP to invest: an existing one (spId != 0) or a freshly created
    // resource of the requested type (spId == 0). Returns the real SP id.
    async function ensureSpId(spId) {
        if (spId != 0) return spId;
        const inD = data.alld;
        let d = new Date();
        const uId = getUid();
        const easy = (easyy > 0) ? easyy : 0;
        const sdate = (inD.sqadualed !== undefined) ? `sdate: "${new Date(inD.sqadualed).toISOString()}",` : ``;
        const fdate = (inD.sqadualedf !== undefined) ? `fdate: "${new Date(inD.sqadualedf).toISOString()}" ,` : ``;
        let que0 =  `mutation { createSp(
            data: {
                name: "${inD.name}",
                descrip: "${inD.descrip}",
                kindOf: ${inD.kindOf},
                unit: ${inD.hm},
                spnot: "${inD.spnot}",
                price: ${inD.price},
                myp: ${easy},
                linkto: "${inD.linkto}",
                users_permissions_user: "${uId}",
                mashaabim: "${inD.mashaabim.data.id}",
                publishedAt: "${d.toISOString()}",
                ${sdate}
                ${fdate}
            }
        )  {data{id }}
        } `
        const d0 = await SendTo(que0).then();
        return d0.data.createSp.data.id;
    }

    async function ask(spId) {
        alrr = true;
        const real = await ensureSpId(spId);
        if (real) create(real);

        async function create(spIdd){
            const inD = data.alld;
            let d = new Date();
            const uId = getUid();
            let myvote = ``;
            let pid = inD.project.data.attributes.user_1s.data.map((t) => t.id);
            if (pid.includes(uId)) {
                myvote = `vots: [{
                    what: true
                    users_permissions_user: "${uId}"
                    ide:${uId}
                    zman:"${d.toISOString()}"
                }]`;
            }

            let quet =  `mutation { 
                createAskm(
                    data:{ 
                        publishedAt: "${d.toISOString()}",
                        open_mashaabim: ${data.mId},
                        project: ${inD.project.data.id},
                        sp: ${spIdd},
                        users_permissions_user: ${uId},
                        ${myvote}
                    }
                ){
                    data {id}
                }
                updateSp(
                    id: "${spIdd}" 
                    data: {declinedm: "${data.mId}" }
                ){
                    data {
                        attributes{
                            declinedm{
                                data{
                                    id
                                }
                            }
                        }
                    }
                }
            }`
            const d2 = await SendTo(quet).then();
            const r2 = d2.data;
            console.log(r2);
            if (r2 != null) {
                let restime = inD.project.data.attributes.restime;
                let x = calcX(restime);
                let fd = new Date(Date.now() + x);
                let hiluzId = r2.createAskm.data.id;
                let quee = `mutation 
                    {createTimegrama(
                        data:{
                            date: "${fd.toISOString()}",
                            whatami: "askm",
                            askm: ${hiluzId},
                        }
                    ){
                        data {id}
                    }
                }`;
                const d3 = await SendTo(quee).then();
                const r3 = d3.data;
                console.log(r3);
                if (r3 != null) {
                    success = true;
                    setTimeout(function () {
                        success = false;
                    }, 15000);
                    toast.success(`${$t('pages.availResource.fnnn')}`);
                }
            }
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
                ? `🤝 ${$lang === 'he' ? 'מאגד ביקוש' : 'demand pool'}${maagadInfo?.name ? ` · ${maagadInfo.name}` : ''}`
                : `🌟 ${$lang === 'he' ? "קונסיירז'" : 'concierge'}${ratsonName ? ` · ${ratsonName}` : ''}`)
    );

    // ── שווי צפוי בריקמה ─────────────────────────────────────────────────
    // אותו חישוב שמוצג בשורת הכסף למעלה: השווי המבוקש × כמות × מספר המחזורים.
    // משאב מתחדש בלי תאריך סיום מתומחר במחזור אחד, ושורות ה-1/2/5 שנים הן שנותנות
    // את התמונה הארוכה.
    let isOpenEnded = $derived(!!data.alld?.recurring && !data.alld?.sqadualedf);
    let perCycleValue = $derived(
        Number(data.alld?.easy) > 0 ? Number(data.alld.easy) : Number(data.alld?.price) || 0
    );
    let equityValue = $derived(
        perCycleValue *
            Math.max(1, Number(data.alld?.hm) || 1) *
            (isOpenEnded
                ? 1
                : Number(montsi(data.alld?.kindOf, data.alld?.sqadualed, data.alld?.sqadualedf, true)) || 1)
    );
    // ₪ לחודש — רק למשאב מתחדש בלי תאריך סיום, שממשיך לחייב ללא הגבלה.
    let equityMonthlyValue = $derived(
        isOpenEnded && perCycleValue > 0
            ? (perCycleValue * Math.max(1, Number(data.alld?.hm) || 1)) /
                  (Math.max(1, Number(data.alld?.cycleSize) || 1) *
                      (data.alld?.kindOf === 'yearly' ? 12 : 1))
            : null
    );
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
                                            <span class="text-gold font-bold text-sm lg:text-xl">🔁 {$t('pages.availResource.recurH')}</span>
                                            {#if Number(data.alld.cycleSize) > 1}
                                                <span class="text-gray-100 text-xs lg:text-lg">· {$t('pages.availResource.everyH')} {data.alld.cycleSize} {data.alld.kindOf == "yearly" ? $t('pages.availResource.years') : $t('pages.availResource.monts')}</span>
                                            {/if}
                                            {#if !data.alld.sqadualedf}
                                                <span class="text-gray-100 text-xs lg:text-lg">· ♾️ {$t('pages.availResource.noEndH')}</span>
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
                                        {#if data.alld.kindOf != "total" && data.alld.hm > 1}
                                            <span> ✖️ {data.alld.hm} {$t('pages.availResource.units')}</span>
                                        {/if}
                                        {#if (data.alld.kindOf == "monthly" || data.alld.kindOf == "years" || data.alld.kindOf == "yearly" || data.alld.kindOf == "rent") && !(data.alld.recurring && !data.alld.sqadualedf)}
                                            <span> ✖️ {montsi(data.alld.kindOf,data.alld.sqadualed,data.alld.sqadualedf,true)}
                                                {#if data.alld.kindOf == "monthly" || data.alld.kindOf == "rent"}
                                                    <span>{$t('pages.availResource.monts')}</span>
                                                {:else if data.alld.kindOf == "years" || data.alld.kindOf == "yearly"}
                                                    <span>{$t('pages.availResource.years')}</span>
                                                {/if}
                                            </span>
                                        {/if}
                                        {#if data.alld.kindOf != "total" && !(data.alld.recurring && !data.alld.sqadualedf)}
                                            <span>  =  {data.alld.price * data.alld.hm * montsi(data.alld.kindOf, data.alld.sqadualed, data.alld.sqadualedf,true)}
                                                {#if data.alld.price != data.alld.easy}
                                                    <span> ↔️ {data.alld.easy * data.alld.hm * montsi(data.alld.kindOf, data.alld.sqadualed, data.alld.sqadualedf,true)}</span>
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
                                        <div class="flex justify-center">
                                            {#if easychoose != true}
                                                <button onclick={torange} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full">{$t('pages.availResource.creatnew')}</button>
                                            {:else}
                                                <h3 class="text-barbi">{$t('pages.availResource.rangehead')}</h3>
                                                <div class="w-full">
                                                    <RangeSlider float={true} onstop={(e) => { console.log(e) }} bind:values={easyy} min=0 max={Number(data.alld.easy) ?? Number(data.alld.price)} />
                                                </div>
                                                <button onclick={()=>ask(0)} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full">{$t('pages.availResource.okk')}</button>
                                                <button onclick={()=>openNego(0)} class="border border-gold rounded-full text-gold hover:text-barbi hover:border-barbi font-bold py-2 px-4 m-4">{$t('lev.cards.proposeOther')}</button>
                                            {/if}
                                            
                                            {#if tochoose != true && alrr == false}
                                                <button onclick={tochoos} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full">{$t('pages.availResource.choosee')}</button>
                                            {:else if alrr == false}
                                                {#if loading == true || loading !=true && mash.length >0}
                                                    <div class="m-4 mt-6">
                                                        <MultiSelect {loading} --sms-open-z-index=4 --sms-options-max-height="10vh" --sms-text-color="var(--barbi-pink)" --sms-max-width="100%" bind:selected maxSelect={1} placeholder={$t('pages.availResource.plh')} noMatchingOptionsMsg={$t('pages.availResource.nom')} options={mash.map(c => c.attributes.name)} />
                                                    </div>
                                                {:else}
                                                    <div class="m-4 mt-6">
                                                        <p class="text-barbi">{$t('pages.availResource.nomash')}</p>
                                                    </div>
                                                {/if}
                                                {#if selected.length>0}
                                                    <button onclick={afterChoose} class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 m-4 rounded-full">{$t('pages.availResource.ok')}</button>
                                                    <button onclick={afterChooseNego} class="border border-gold rounded-full text-gold hover:text-barbi hover:border-barbi font-bold py-2 px-4 m-4">{$t('lev.cards.proposeOther')}</button>
                                                {/if}
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <div class="">
                                    <Share slug={'availiableResorce/' + page.data?.mId} title={data.alld?.titleKey ? $t(data.alld.titleKey, data.alld.titleParams) : ''} desc="it's new thing" hashtags={['1💗1', 'consensus']} quote={data.alld?.titleKey ? $t(data.alld.titleKey, data.alld.titleParams) : ''} related={[]} via={''} />
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
