<script>
 const msgk = {"he":"שמחנו מאוד לקבל את הסכמתך להתתנהלות בהסכמה הדדית, נשמח מאוד לראותך נהנה ליצור בהסכמה באתר 1💗1",
                "en":""}//
 const msg2 = {"he":"להרשמה!","en":"register now!"}//link des 
    /**
     * @typedef {Object} Props
     * @property {any} user
     * @property {string} [projectSrc]
     * @property {string} [lang]
     * @property {string} [link]
     */

    /** @type {Props} */
    let {
        user,
        projectSrc = "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png",
        lang = "he",
        link = "https://1lev1.com"
    } = $props();
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