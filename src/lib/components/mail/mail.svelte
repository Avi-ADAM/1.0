<script>
export let user;
export let projectName = "1💗1";
export let missionName = "create something nice";
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
const msgk = { "he": `המשימה שלך אושרה פה אחד והנך עכשיו חלק מריקמת ${projectName}`, "en": "your mission was appruved Unanimously, you are now part of the FreeMates:" }
const msg2 = { "he": "לחיצה כדי להתחיל את המשימה: ", "en": "start your new mission: " }
export let lang = "he"
const hallo = {"he":"!","en":"Hello, "}
const shalom = {"he":" שלום","en":"!"}
const mt = {"he":"!מזל טוב", "en": "Congratulations!" }
</script>

<style>
strong { 
    color: red ; 
    text-align: center; 
}
h2{
    text-align: center;
}
#pn{
    
    text-align: center;


}
 #top{ 
    height: 25px; 
    width: 25px; 
    margin: 0 auto;
    }
    a{
        background-color: #EEE8AA;
        color: #FF0092;
        font-weight: bold;
        text-align: center;
        width: 100%;
        padding-top:  10px;
        padding-bottom: 10px;
    }
    div{
        display: grid;
        align-items: center;
        justify-content: center;
    }
    #buttom{
        height: 50px;
        width: 50px;
        margin: 0 auto;
        align-self: center;
    }
    #divi{
        background-color: aquamarine;
    }
  
    #cong{
      
        color: #FF0092;
        text-align: center;
    }
    </style>
    <div id="divi">
<img id="top" alt="logo" src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png" >
<strong>{hallo[lang]}{user}{shalom[lang]}</strong>
<h1  id="cong">{mt[lang]}</h1>
<h2>{msgk[lang]}</h2>
{#if lang == "en"}
<h2 id="pn">{projectName}</h2>
{/if}
<img id="buttom" alt="logo" src="{projectSrc}">
<br>
<a dir={lang == "he" ? "rtl" : "ltr"} href="https://www.1lev1.world/lev" alt="todo">{msg2[lang]}{missionName}</a>

</div>