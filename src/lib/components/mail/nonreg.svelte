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
    export let previewText = {}
export let user;
export let projectSrc ="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png";
 const msgk = {"he":"שמחנו מאוד לקבל את הסכמתך לפעול רק בהסכמה הדדית, נשמח מאוד לראותך באתר 1💗1 בו ניתן לשתף פעולה וליצור ולהגשים יחד בהסכמה",
                "en":"we glad to get your consetion for engagment only with mutual agreement, we want to see you creating your dreams in a consesus way on our special platform"}//
 const msg2 = {"he":"להרשמה!","en":"register now!"}//link des 
export let lang = "he"
export let link = "https://www.1lev1.com"
const hallo = {"he":"!","en":"Hello, "}
const shalom = {"he":"שלום","en":"!"}

const strong = { 
    color: "red",
    textAlign: "center"
}
const h2 = {
    textAlign: "center"
}
 const top ={ 
    height: "25px",
    width: "25px",
    margin: "0 auto"
    }
    const a ={
        padding: "20px 10px",
        backgroundColor: "#EEE8AA",
        borderRadius: "10px",
        color: "#FF0092",
        fontWeight: "bold"
    }

   const div = {
        display: "grid",
        alignItems: "center",
        justifyContent: "center"
    }
    const buttom ={
        height: "50px",
        width: "50px",
            margin:" 0 auto"
    }
    const slogen = {
            "he":"1💗1 - קשה לבד? קל ביחד!",
            "en":"1💗1 we can together"
        }
	const fontFamily =
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

	const main = {
		backgroundColor: '#ffffff'
	};

	const container = {
		margin: '0 auto',
		padding: '20px 0 48px',
		width: '580px'
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
			<Img src={projectSrc} width="25" style={top} height="25" alt="1💗1Logo" />
			<Heading style={strong}>{hallo[lang]}{user}{shalom[lang]}</Heading>
			<Text style={h2}>{msgk[lang]}</Text>
			<Img src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png" style={buttom}  alt="1💗1Logo" />
            <Section style={{ padding: '16px 0 20px' }}>
				<Button pY={19} style={a} href={link}>{msg2[lang]}</Button>
			</Section>	
            <Hr style={hr} />
			<Text style={footer}>{slogen[lang]}</Text>
</Container>
</Section>
</Html>