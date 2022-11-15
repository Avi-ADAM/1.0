<script>
export let user;
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
 const msgk = {"he":"שמחנו מאוד לקבל את הסכמתך לפעול רק בהסכמה הדדית, נשמח מאוד לראותך באתר 1💗1 בו ניתן לשתף פעולה וליצור ולהגשים יחד בהסכמה",
                "en":"we glad to get your consetion for engagment only with mutual agreement, we want to see you creating your dreams in a consesus way on our special platform"}//
 const msg2 = {"he":"להרשמה!","en":"register now!"}//link des 
export let lang = "he"
export let link = "https://www.1lev1.world"
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
<img id="buttom" alt="logo"  src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png">
<br>
<a href="{link}" alt="todo">{msg2[lang]}</a>
</div>