<script>
    import {
		Button,
		Container,
		Head,
		Heading,
		Hr,
		Html,
		Img,
		Preview,
		Section,
		Text
	} from 'svelte-email';
export let user;
export let projectName = "1💗1";
export let missionName = "create something nice";
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
const logo = "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
const msgk = { "he": `המשימה שלך אושרה פה אחד והנך עכשיו חלק מריקמת ${projectName}`, "en": "your mission was appruved Unanimously, you are now part of the FreeMates:" }
const msg2 = { "he": "לחיצה כדי להתחיל את המשימה: ", "en": "start your new mission: " }
export let lang = "he"
const hallo = {"he":"!","en":"Hello, "}
const shalom = {"he":" שלום","en":"!"}
const mt = {"he":"!מזל טוב", "en": "Congratulations!" }
const fontFamily =
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

	const main = {
		backgroundColor: '#EEE8AA'
	};

	const container = {
		margin: '0 auto',
		padding: '20px 0 48px',
		width: '580px'
	};

	const userImage = {
		margin: '0 auto',
		marginBottom: '16px',
		borderRadius: '50%'
	};

	const heading = {
		fontFamily,
		fontSize: '32px',
		lineHeight: '1.3',
		fontWeight: '700',
		color: '#484848'
	};

    const noted = {
        fontFamily,
		fontSize: '22px',
		lineHeight: '1.1',
		fontWeight: '700',
		color: '#484848'
    }

	const paragraph = {
		fontFamily,
		fontSize: '18px',
		lineHeight: '1.4',
		color: '#484848'
	};

	const review = {
		...paragraph,
		padding: '24px',
		backgroundColor: '#f2f3f3',
		borderRadius: '4px'
	};

	const button = {
		fontFamily,
		backgroundColor: '#FF0092',
		borderRadius: '3px',
		color: '#EEE8AA',
		fontSize: '18px',
		textDecoration: 'none',
		textAlign: 'center' ,
		display: 'block',
		width: '100%'
	};

	const link = {
		...paragraph,
		color: '#ff5a5f',
		display: 'block'
	};

	const reportLink = {
		fontFamily,
		fontSize: '14px',
		color: '#9ca299',
		textDecoration: 'underline'
	};

	const hr = {
		borderColor: '#cccccc',
		margin: '20px 0'
	};

	const footer = {
		fontFamily,
		color: '#9ca299',
		fontSize: '14px',
		marginBottom: '10px'
	};
</script>

<Html lang={lang}>
	<Head />
	<Preview preview={previewText[lang]} />
	<Section style={main} dir={lang == "he" ? "rtl":"ltr"}>
		<Container style={container}>
			<Img src={logo} width="30" height="30" alt="1💗1Logo" />
			<Section>
				<Img src={projectSrc} width="96" height="96" alt={projectName} style={userImage} />
			</Section>
			<Heading style={heading}>{headr[lang]}</Heading>
			<Text style={review}>{mainText[lang]}</Text>
            {#if kind == "pendAsk"}
			<Text style={noted}>{note[lang]}</Text>
            {/if}
			<Text style={paragraph}>
				{instruction[lang]}
			</Text>
			<Section style={{ padding: '16px 0 20px' }}>
				<Button pY={19} style={button} href="https://1lev1.vercel.app/lev">{tovo[lang]}</Button>
			</Section>		
			<Hr style={hr} />
			<Text style={footer}>{slogen[lang]}</Text>
		</Container>
	</Section>
</Html>


<style>

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
<img id="top" alt="logo"  >
<strong>{hallo[lang]}{user}{shalom[lang]}</strong>
<h1  id="cong">{mt[lang]}</h1>
<h2>{msgk[lang]}</h2>
{#if lang == "en"}
<h2 id="pn">{projectName}</h2>
{/if}
<img id="buttom" alt="logo" src="{projectSrc}">
<br>
<a dir={lang == "he" ? "rtl" : "ltr"} href="https://1lev1.vercel.app/lev" alt="todo">{msg2[lang]}{missionName}</a>

</div>