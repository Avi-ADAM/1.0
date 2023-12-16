<script>
  import { goto } from "$app/navigation";
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import Lowding from "$lib/celim/lowding.svelte";
  import Tile from "$lib/celim/tile.svelte";
	import { Canvas } from '@threlte/core'
  import Scene from '$lib/components/main/1lev1.svelte'
  import { useProgress } from '@threlte/extras'
  import CircleProgresBar from "$lib/celim/ui/circleProgresBar.svelte";
	import {lang,langUs,doesLang} from '$lib/stores/lang'
	const { progress } = useProgress()
	const url = 'https://1lev1.vercel.app/';
	const title = '1️💗1️';
	const setitle = {
  "he": "ליצור יחד בהסכמה",
  "en": "create together harmoniously",
  "ar": "الإبداع معًا بتناغم"
};//"טעם לחיים!"
function change(lan){
  if (lan == "en"){
    doesLang.set(true)
    langUs.set("en")
    lang.set("en")
    document.cookie = `lang=${$lang}; expires=` + new Date(2026, 0, 1).toUTCString();    
  }else if (lan == "he"){
     doesLang.set(true)
    langUs.set("he")
    lang.set("he")
    document.cookie = `lang=${$lang}; expires=` + new Date(2026, 0, 1).toUTCString();
  }else if (lan == "ar"){
     doesLang.set(true)
    langUs.set("ar")
    lang.set("ar")
    document.cookie = `lang=${$lang}; expires=` + new Date(2026, 0, 1).toUTCString();
  }
}
const changel = {
  "en": "English",
  "he": "עברית",
  "ar": "العربية"
};

const desc = {
  "he": 'ליצור צוות מנצח להגשמת כל חלום, להתנהל ו',
  "en": 'Creating a winning team to fulfill every dream, to manage and',
  "ar": 'إنشاء فريق رابح لتحقيق كل حلم ، لإدارة و'
};

const desc2 = {
  "he": "ליצור יחד בהסכמה",
  "en": "to create together in harmony",
  "ar": "للإبداع معًا بانسجام"
};
const word1 = {
  "he": "מערכת ייחודית לקבלת החלטות פה-אחד",
  "en": "Unanimous Decision Making: Our unique system facilitates unanimous decision-making among project collaborators.",
  "ar": "اتخاذ قرارات بالإجماع: نظامنا الفريد يسهل اتخاذ القرارات بالإجماع بين المشاركين في المشروع."
};

const word2 = {
  "he": "לייסד ריקמה (פרויקט) בקליק ולאתר את מרכיביה האנושיים והחומריים בקלות",
  "en": "Founding a FreeMates project with a click and easily identifying its human and material components",
  "ar": "تأسيس مشروع FreeMates بنقرة واحدة وتحديد مكوناته البشرية والمادية بسهولة."
};
const word3 = {
  "he": "למצוא ולהתחבר לריקמה שמתאימה בדיוק לערכים, הכישורים ודרך העבודה שלך",
  "en": "Finding and connecting to a FreeMate that aligns precisely with your values, skills, and work style",
  "ar": "العثور والاتصال بـ FreeMate الذي يتوافق تمامًا مع قيمك ومهاراتك ونمط عملك"
};

const word4 = {
  "he": "פנקס דיגיטלי מבוזר לניהול החשבונות בריקמה לפי ההסכמות",
  "en": "Distributed digital ledger for accounting management in the FreeMates based on agreements",
  "ar": "دفتر الأستاذ الرقمي الموزع لإدارة المحاسبة في FreeMates بناءً على الاتفاقات"
};

const word5 = {
  "he": "מערכת הצבעות, אישרורים ומשא ומתן לניהול משותף על בסיס הסכמה פה-אחד",
  "en": "Voting system, approvals, and negotiation for collaborative management based on unanimous agreement",
  "ar": "نظام التصويت والموافقات والمفاوضات لإدارة تعاونية بناءً على اتفاق بالإجماع"
};
const word6 = {
  "he": "חישוב וחלוקת כספים לפי סך ההשקעה ולפי ההסכמות",
  "en": "Calculation and distribution of funds based on investment and agreements",
  "ar": "حساب وتوزيع الأموال استنادًا إلى الاستثمار والاتفاقات"
};

const word7 = {
  "he": "גרפים, גאנט, לוח משימות ועוד כלים שמתווספים כל הזמן במסך ניהול הריקמה המשותף",
  "en": "Graphs, Gantt charts, task boards, and other tools that are constantly added to the shared FreeMates management screen",
  "ar": "رسوم بيانية، جداول Gantt، لوحات المهام، وأدوات أخرى يتم إضافتها باستمرار إلى شاشة إدارة FreeMates المشتركة"
};

const word8 = {
  "he": "לשתף את החפצים המיותרים שלך עם רקמות שמתאימות לערכים שלך ולהרוויח",
  "en": "Sharing your unnecessary items with FreeMates that align with your values and earning",
  "ar": "مشاركة العناصر الزائدة الخاصة بك مع FreeMates التي تتوافق مع قيمك وكسب المال"
};

const word9 = {
  "he": "הכנסה פאסיבית  - הופכת למציאות! בריקמה לא מקבלים תשלום מוגדר אלא אחוז דינמי מהרווחים לכל אורך חיי הריקמה",
  "en": "Passive income - becomes a reality! In FreeMates, you don't receive a fixed payment but a dynamic percentage of profits throughout the lifespan of the FreeMate",
  "ar": "الدخل السلبي - يصبح واقعًا! في FreeMates ، لا تتلقى دفعة محددة ولكن نسبة ديناميكية من الأرباح طوال فترة حياة FreeMate"
};

const word10 = {
  "he": "רקמות הן קבוצות המורכבות מכישורים ומשאבים שונים אשר יוצרות יחד מוצר או נותנות שירות ומתחלקות בהכנסות לפי ההשקעה היחסית ובהסכמה",
  "en": "FreeMates are groups composed of different skills and resources that come together to create a product or provide a service and share income based on relative investment and agreement",
  "ar": "FreeMates هي مجموعات مكونة من مهارات وموارد مختلفة تجتمع معًا لإنشاء منتج أو تقديم خدمة وتقاسم الدخل استنادًا إلى الاستثمار النسبي والاتفاق"
};

const regesh1 = {
  "he": "רוצה להביא משמעות ושמחה לחיים שלך?",
  "en": "Want to bring meaning and joy to your life?",
  "ar": "هل تريد إضفاء الدلالة والفرح على حياتك؟"
};

const regesh2 = {
  "he": "רוצה לפתוח דלת אל מציאות חדשה?",
  "en": "Want to open the door to a new reality?",
  "ar": "هل تريد فتح الباب أمام واقع جديد؟"
};

const login = {
  "he": "להתחברות",
  "en": "Login",
  "ar": "تسجيل الدخول"
};

const reg = {
  "he": "להסכמה והרשמה",
  "en": "Agreement and Registration",
  "ar": "الموافقة والتسجيل"
};
const loadingTitle = {
  "he": "טעינת אלמנט עיצובי תלת מימדי",
  "en": "Loading a three-dimensional design element",
  "ar": "تحميل عنصر تصميم ثلاثي الأبعاد"
};
const agree = {
  "he": ' כדי להירשם ולהינות מ-1️💗1️ יש להוסיף את ההסכמה שלך ל"אמנת החירות העולמית" שבעמוד הבא, כך נוודא את המחויבות שלך להתנהלות בהסכמה עם השאר. בנוסף הסכמתך תתווסף ל',
  "ar": 'للتسجيل والاستمتاع ب-1️💗1️ ، يجب إضافة موافقتك على "الميثاق العالمي للحريات" في الصفحة التالية ، وبهذا سنضمن التزامك بالتعامل بموافقة مع الآخرين. بالإضافة إلى ذلك ، سيتم إضافة موافقتك إلى ',
  "en": "To register and benefit from 1️💗1️, you need to add your agreement to the 'Global Freedom Charter' on the next page, ensuring your commitment to engaging in agreement with others. Additionally, your agreement will be added to"
};

const agree2 = {
  "he": '"מפת ההסכמה"',
  "ar": '"خريطة الاتفاق"',
  "en": '"Agreement Map"'
};
const mapa = {
  "he": 'מפת ההסכמה',
  "ar": 'خريطة الاتفاق',
  "en": 'Agreement Map'
};
const agree3 = {
  "he": " ויחד ניצור עולם טוב יותר",
  "ar": " ومعًا سنخلق عالمًا أفضل",
  "en": "Together we will create a better world"
};

	$: btna = false
	$: btnb = false
	$: scrolli = false
	let loading = false, loadinga = false,w,h,fi = false, trans = false
//w*1.8 < h ? w : h > 639 ? w*0.8 : h
</script>
 <div  style="position:absolute ; left: 1%; top: 1%; display: flex; flex-direction: column ; z-index: 699;">
              {#if trans === false}
          <button on:click={()=>trans = !trans}><img class="shadow-xl	rounded" alt="translat-icon-by-barbi" src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"></button>
          {:else}
          <button on:click={()=>trans = !trans} class=" text-barbi hover:text-gold p-0.5 "
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if $lang != "en"}
      <button on:click={() =>change("en")} title="change language to English" class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5">{changel["en"]}</button>
{/if} 

{#if $lang != "ar"}
      <button on:click={() =>change("ar")} title="change language to Arabic" class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5">{changel["ar"]}</button>
{/if}
{#if $lang != "he"}
      <button on:click={() =>change("he")} title="change language to Hebrew" class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5">{changel["he"]}</button>
{/if}
{#if $lang == "he"}
      <a class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5 " title=" 1💗1 אודות "   data-sveltekit-prefetch href="/about" > אודות</a>
    {/if}
	  <a class="text-barbi border-2 border-lturk text-bold hover:text-gold text-center bg-gold hover:bg-barbi px-1 py-0.5 "  data-sveltekit-prefetch href="/love">{mapa[$lang]}</a>
          {/if}
          </div>
<div dir={$lang === "he" || $lang == "ar" ? "rtl" : "ltr"} class="h-screen w-screen  flex flex-col-reverse sm:flex-row button-whitegold overflow-hidden bg-[length:200%_auto] animate-gradientx">
	<div id="text" class="z-10 flex flex-col text-center align-middle justify-center items-center sm:w-1/2 h-1/2  sm:h-screen ">
		<div dir="ltr" style="text-shadow:none;" class="pt-2 font-bold sm:text-9xl text-4xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] flex-wrap flex flex-row">
        <div class="flip">
          <h1  class="text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] " 
		>1</h1></div>
    <div><h1 
		>💗1️</h1></div></div>
	<div class="overflow-auto d  h-2/5"  on:scroll={()=>{ scrolli = true
	setTimeout(()=>scrolli = false,1500)
	}} >
		<h2 class="font-bold mt-3 sm:text-5xl text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_left,theme(colors.fuchsia.300),theme(colors.sky.400),theme(colors.barbi),theme(colors.mpink),theme(colors.barbi),theme(colors.sky.400),theme(colors.fuchsia.300))]  decoration-mturk underline text-xl"
    style="text-shadow:none;">{setitle[$lang]}</h2>
		<p class="text-xl sm:text-2xl p-2 px-24 text-barbi">{desc[$lang]}<span class="underline decoration-lturk">{desc2[$lang]}</span></p>
		<div>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word1[$lang]} />
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word2[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word3[$lang]}/>				
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word4[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word5[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word6[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word7[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word8[$lang]}/>
				<Tile bg={"gold"} big={true} sm={true} reverse={true} openi={true} word={word9[$lang]}/>
				<Tile bg={"wow"} big={true} sm={true} word={word10[$lang]}/>
				<Tile bg={"pink"} big={true} sm={true} word={"<div>"+agree[$lang]+`<a style="color:var(--barbi-pink)" href="./love">`+agree2[$lang]+"</a>"+agree3[$lang]+"</div>"}/>
			</div>
		<span>
		<h2 class="text-bold text-2xl text-barbi mt-5 border-4 border-spacing-2 mx-6 border-mturk bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre  rounded-lg px-3 py-4 ">{regesh1[$lang]}<br>{regesh2[$lang]}</h2>
		</span>
	</div>
		<div style="font-family:Gan, Power;" class="flex flex-row">
			<button class="transition-all duration-300 flex flex-row text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl" on:click={()=>{goto("/login") 
				loadinga = true
				fi = true}} class:button-perl={btna ==  false} class:button-gold={btna == true} on:focus={()=> btna = true} on:mouseover={()=>btna = true} 
					on:mouseleave={()=> btna = false }>{login[$lang]}
			{#if btna == true && loadinga == false}
			<span class="mx-2 mb-0.5"><Arrow back={$lang == "he" || $lang == "ar" ? false : true} height="32" color={"var(--gold)"} fill="var(--barbi-pink)"/></span>
			{/if}
			{#if loadinga == true}
			<Lowding width="24px" height="24px"/>
			{/if}
			</button>
			<button class="transition-all duration-300 text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl flex flex-row"on:click={()=>{goto(`${$lang == "he" ? "/hascama" : $lang == "ar" ? "/ar" : "/en"}`) 
			loading = true
			fi = true
		}}  class:button-perl={btnb ==  false} class:button-gold={btnb == true} on:focus={()=> btnb = true} on:mouseover={()=>btnb = true} on:mouseleave={()=> btnb = false }>{reg[$lang]}
			{#if btnb == true && loading == false}
			<span class="mx-2 mb-0.5"><Arrow back={$lang == "he"  || $lang == "ar" ? false : true} height="32" color={"var(--gold)"} fill="var(--barbi-pink)"/></span>
			{/if}
			{#if loading == true}
			<Lowding width="24px" height="24px"/>
			{/if}
			</button>
		</div>
	</div>
	<div id="levi" bind:clientHeight={h} bind:clientWidth={w} class:flex={$progress == 1} class="sm:w-1/2 h-1/2 sm:h-screen z-0 items-center justify-center">
		{#if $progress < 1}
		<div class="w-full h-1/2 sm:h-screen flex flex-col items-center  justify-center" title="{loadingTitle[$lang]}">
			<img class="ani"  src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png" alt="logo">
			<CircleProgresBar progress={$progress}/>
		</div>
		{/if}
		<div class=" z-0 ">
	<Canvas  size={{width:w<640 ? w : h*1.8, height: w*1.8 < h ? w : h > 639 ? w*0.8 : h }}>
        <Scene {fi} hover={btna == true || btnb == true ? true:false} {scrolli}/>
      </Canvas>
	  </div>
	</div>
</div>
<style>
	.flip{
    -moz-transform: scale(-1, 1);
-webkit-transform: scale(-1, 1);
-o-transform: scale(-1, 1);
-ms-transform: scale(-1, 1);
transform: scale(-1, 1);
  }
img {
  animation: wiggle 2s linear infinite;
  max-height: 25vh;
}
@media (min-width: 640px){
	img {
  animation: wiggle 2s linear infinite;
  max-height: 50vh;
}
}

/* Keyframes */
@keyframes wiggle {
  0%, 7% {
    transform: rotateZ(0);
  }
  15% {
    transform: rotateZ(-15deg);
  }
  20% {
    transform: rotateZ(10deg);
  }
  25% {
    transform: rotateZ(-10deg);
  }
  30% {
    transform: rotateZ(6deg);
  }
  35% {
    transform: rotateZ(-4deg);
  }
  40%, 100% {
    transform: rotateZ(0);
  }
}
</style>