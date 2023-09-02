<script>
  import { goto } from "$app/navigation";
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import Lowding from "$lib/celim/lowding.svelte";
  import Tile from "$lib/celim/tile.svelte";
	import { Canvas } from '@threlte/core'
  import Scene from '$lib/components/main/1lev1.svelte'
  import { useProgress } from '@threlte/extras'
  import CircleProgresBar from "$lib/celim/ui/circleProgresBar.svelte";

	const { progress } = useProgress()
	const url = 'https://1lev1.vercel.app/';
	const title = '1️💗1️';
	const setitle = "טעם לחיים!"
	const desc = 'ליצור צוות מנצח להגשמת כל חלום, להתנהל ו';
	const desc2 = "ליצור יחד בהסכמה"
	const word1 = "מערכת ייחודית לקבלת החלטות פה-אחד"
	const word2 = "לייסד ריקמה (פרויקט) בקליק ולאתר את מרכיביה האנושיים והחומריים בקלות"
	const word3 = "למצוא ולהתחבר לריקמה שמתאימה בדיוק לערכים, הכישורים ודרך העבודה שלך"
	const word4 = "פנקס דיגיטלי מבוזר לניהול החשבונות בריקמה לפי ההסכמות"
	const word5 = "מערכת הצבעות, אישרורים ומשא ומתן לניהול משותף על בסיס הסכמה פה-אחד"
	const word6 = "חישוב וחלוקת כספים לפי סך ההשקעה ולפי ההסכמות"
	const word7 = "גרפים, גאנט, לוח משימות ועוד כלים שמתווספים כל הזמן במסך ניהול הריקמה המשותף"
	const word8 = "לשתף את החפצים המיותרים שלך עם רקמות שמתאימות לערכים שלך ולהרוויח"
	const word9 = "הכנסה פאסיבית  - הופכת למציאות! בריקמה לא מקבלים תשלום מוגדר אלא אחוז דינמי מהרווחים לכל אורך חיי הריקמה"
	const word10 = "רקמות הן קבוצות המורכבות מכישורים ומשאבים שונים אשר יוצרות יחד מוצר או נותנות שירות ומתחלקות בהכנסות לפי ההשקעה היחסית ובהסכמה"
	const regesh1 = "רוצה להביא משמעות ושמחה לחיים שלך?"
	const regesh2 = "רוצה לפתוח דלת אל מציאות חדשה?"
	const login = "להתחברות"
	const reg = "להסכמה והרשמה"
	const loadingTitle = "טעינת אלמנט עיצובי תלת מימדי "
	$: btna = false
	$: btnb = false
	$: scrolli = false
	let loading = false, loadinga = false,w,h,fi = false

</script>
<div dir="rtl" class="h-screen w-screen  flex flex-col-reverse sm:flex-row button-whitegold overflow-hidden">
	<div id="text" class="flex flex-col text-center align-middle justify-center items-center sm:w-1/2 h-1/2  sm:h-screen ">
		<h1 class="font-bold sm:text-9xl text-4xl text-barbi shadow-lg shadow-fuchsia-300 rounded " 
		style="text-shadow(1px 1px --mturk)">{title}</h1>
	<div class="overflow-auto d  h-2/5"  on:scroll={()=>{ scrolli = true
	setTimeout(()=>scrolli = false,1500)
	}} >
		<h2 class="font-bold mt-2 sm:text-5xl text-barbi decoration-mturk underline text-xl">{setitle}</h2>
		<p class="text-xl sm:text-2xl p-2 px-24 text-barbi">{desc}<span class="underline decoration-lturk">{desc2}</span></p>
		<div>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word1} />
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word2}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word3}/>				
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word4}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word5}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word6}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word7}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word8}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word9}/>
				<Tile bg={"wow"} big={true} sm={true} word={word10}/>
			</div>
		<span>
		<h2 class="text-bold text-2xl text-barbi mt-5 border-4 border-spacing-2 mx-6 border-mturk bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre  rounded-lg px-3 py-4 ">{regesh1}<br>{regesh2}</h2>
		</span>
	</div>
		<div style="font-family:Gan, Power;" class="flex flex-row">
			<button class="flex flex-row text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl" on:click={()=>{goto("/login") 
				loadinga = true
				fi = true}} class:button-perl={btna ==  false} class:button-gold={btna == true} on:focus={()=> btna = true} on:mouseover={()=>btna = true} 
					on:mouseleave={()=> btna = false }>{login}
			{#if btna == true && loadinga == false}
			<span class="mx-2 mb-0.5"><Arrow height="32" color={"var(--gold)"} fill="var(--barbi-pink)"/></span>
			{/if}
			{#if loadinga == true}
			<Lowding width="24px" height="24px"/>
			{/if}
			</button>
			<button class="text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl flex flex-row"on:click={()=>{goto("/hascama") 
			loading = true
			fi = true
		}}  class:button-perl={btnb ==  false} class:button-gold={btnb == true} on:focus={()=> btnb = true} on:mouseover={()=>btnb = true} on:mouseleave={()=> btnb = false }>{reg}
			{#if btnb == true && loading == false}
			<span class="mx-2 mb-0.5"><Arrow height="32" color={"var(--gold)"} fill="var(--barbi-pink)"/></span>
			{/if}
			{#if loading == true}
			<Lowding width="24px" height="24px"/>
			{/if}
			</button>
		</div>
	</div>
	<div id="levi" bind:clientHeight={h} bind:clientWidth={w} class="sm:w-1/2 h-1/2 sm:h-screen ">
		{#if $progress < 1}
		<div class="w-full h-1/2 sm:h-screen  flex items-center justify-center" title="{loadingTitle}">
		<CircleProgresBar progress={$progress}/>
		</div>
		{/if}
	<Canvas  size={{width:w, height: w*1.8 < h ? w : h > 639 ? w*0.8 : h}}>
        <Scene {fi} hover={btna == true || btnb == true ? true:false} {scrolli}/>
      </Canvas>
	</div>
</div>