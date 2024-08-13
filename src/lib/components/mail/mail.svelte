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
	} from 'svelty-email';
export let user;
export let projectName = "1💗1";
export let missionName = "create something nice";
export let previewText = {}
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
const msgk = { "he": `המשימה שלך אושרה פה אחד והנך עכשיו חלק מריקמת ${projectName}`, "en": "your mission was appruved Unanimously, you are now part of the FreeMates:" }
const msg2 = { "he": "לחיצה כדי להתחיל את המשימה: ", "en": "start your new mission: " }
export let lang = "he"
const hallo = {"he":"!","en":"Hello, "}
const shalom = {"he":" שלום","en":"!"}
const mt = {"he":"!מזל טוב", "en": "Congratulations!" }
const fontFamily =
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';
        const slogen = {
            "he":"1💗1 - קשה לבד? קל ביחד!",
            "en":"1💗1 we can together"
        }
	

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
const strong = { 
    color: "red" ,
    textAlign: "center",
    fontWeight: "bold"
}
const h2 = {
    textAlign: "center"
}

const pn ={ 
    textAlign: "center"
}
const top = { 
    height: '25px',
    width: '25px',
    margin: "0 auto"
    }
   const  a = {
        backgroundColor: "#EEE8AA",
        color: "#FF0092",
        fontWeight: "bold",
        textAlign: "center",
        width: "100%",
        paddingTop: "10px",
        paddingBottom: "10px"
    }

    const buttom = {
        height: "50px",
        width: "50px",
        margin: "0 auto",
        alignSelf: "center"
    }
    const divi = {
        backgroundColor: "aquamarine",
        display: "grid",
        alignItems: "center",
        justifyContent: "center"
    }
  
    const cong = {
        color: "#FF0092",
        textAlign: "center",
    }
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
        <Section style={divi} dir={lang == "he" ? "rtl":"ltr"}>
			<Img style={top} src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png" width="30" height="30" alt="1💗1Logo" />
			<Heading style={strong}>{hallo[lang]}{user}{shalom[lang]}</Heading>
			<Heading style={cong}>{mt[lang]}</Heading>
			<Text style={h2}>{msgk[lang]}</Text>

{#if lang == "en"}
<Text style={pn}>{projectName}</Text>
{/if}
<Img style={buttom} src={projectSrc} width="30" height="30" alt="projectLogo" />
<Section style={{ padding: '16px 0 20px' }}>
    <Button pY={19} style={button} href="https://www.1lev1.com/lev">{msg2[lang]}{missionName}</Button>
</Section>	
<Hr style={hr} />
<Text style={footer}>{slogen[lang]}</Text>
</Section>
</Html>