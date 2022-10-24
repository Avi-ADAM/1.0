<script>
export let user;
export let projectName = "1💗1";
export let missionName = "create something nice";
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
const msgk = { "he": "המשימה שלך אושרה פה אחד והנך עכשיו חלק מריקמת:", "en": "your mission was appruved Unanimously, you are now part of the FreeMates:" }
const msg2 = { "he": "לחיצה כדי להתחיל את המשימה: ", "en": "start your new mission: " }
export let lang = "he"
const hallo = {"he":"!","en":"Hello, "}
const shalom = {"he":"שלום","en":"!"}

</script>

<style>
strong { 
    color: red ; 
    text-align: center; 
}
h2{
    text-align: center;
}
 #top{ 
    height: 25px; 
    width: 25px; 
    margin: 0 auto;
    }
    a{
        padding: 20px 10px;
        background-color: #EEE8AA;
        border-radius: 10px;
        color: #FF0092;
        font-weight: bold;
    }
     a:hover{
        padding: 20px 10px;
        background-color: #FF0092;
        border-radius: 10px;
        color: #EEE8AA;
        font-weight: bold;       
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
    }
    </style>
    <div>
<img id="top" alt="logo"  src={projectSrc}>
<strong>{hallo[lang]}{user}{shalom[lang]}</strong>
<h2>{msgk[lang]}</h2>
<h2 id="pn">{projectName}</h2>
<img id="buttom" alt="logo"  src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png">
<br>
<a href="https://www.1lev1.world/lev" alt="todo">{msg2[lang]}{missionName}</a>

</div>