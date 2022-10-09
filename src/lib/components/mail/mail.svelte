<script>
import { lang } from '$lib/stores/lang.js'    
export let user;
export let projectName = "1💗1";
export let missionName = "create something nice";
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
export let msgk = "text"
export let msg2 = "text"
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
<strong>Hello, {user}</strong>
<h2>{msgk}</h2>
<h2 id="pn">{projectName}</h2>
<img id="buttom" alt="logo"  src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png">
<br>
<a href="https://www.1lev1.world/lev" alt="todo">{msg2}{missionName}</a>

</div>