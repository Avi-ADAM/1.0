<script >
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

	export let un = 'Alex';
    export let username = "x"
	export let pl,pn;
    export let kind = "";
    export let rishon = "";
    export let name="";
    export let lang = "he";
    export let restime = "feh"
    const houhe = {"feh":"עומדים יומיים","sth":"עומדים שלושה ימים","nsh":"עומדים ארבעה ימים","sevend":"עומד שבוע אחד"}
    const houen = {"feh":"48 hours","sth":"72 hours","nsh":"96 hours","sevend":"one week"}
    const hoza = {"pendAsk":"הוצעה משימה חדשה בשם","pend":"הוצעה משימה חדשה בשם","pendmash":"הוצע משאב חדש בשם"}
    const headr = {"he":` שלום ${username}!`,"en":`hallo ${username}!`}
	const mainText = {"he":`בריקמה ${pn} ${hoza[kind]} "${name}" על ידי ${un} ${kind == "pend" || kind == "pendAsk" ? "והיא עומדת להצבעה!" : "והוא עומד להצבעה!"}`,
                    "en":`in the freeMates ${pn} ${kind == "pend" || kind == "pendAsk" ? "a new mission named" : "a new resorce named"} "${name}" hes suggested by ${un} and the appruval vote just started!`}
    const note = {"he":`לפי ההצעה כאשר ${kind == "pend" || kind == "pendAsk" ? "המשימה תאושר היא תתבצע":" המשאב יאושר הוא יושקע"} על ${rishon == username ? "ידך" : `${rishon} ידי`}  `,
                    "en":`he offered that if the suggestion appruved the ${kind == "pend" || kind == "pendAsk" ? `mission will be assigned to`:`resorce will be invested by`} ${rishon == username ? "you" : rishon}`} 
    const instruction = {"he":`לרשותך ${houhe[restime]} בכדי להגיב על ההצעה ולנהל משא ומתן על פרטיה, לאחר מכן אם לא יהיו התנגדויות ההצעה תאושר אוטומטית `,
                         "en":`you have ${houen[restime]} to response and to negotiat the deatail's, after that if no obligation it will be aotomaticlly appruved`}
    const tovo = {"he":"להצבעה!","en":"vote now!"}
    const src1 = "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
	const previewText = {
        "he": `${pn} בריקמה ${un} הצבעה על ההצעה של`,
        "en":`Vote for ${un}'s suggestion on freeMates ${pn}`};
        const slogen = {
            "he":"1💗1 - יש מה לעשות! ליצור יחד בהסכמה.",
            "en":"1💗1 Create together harmoniously"
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
			<Img src={src1} width="30" height="30" alt="1💗1Logo" />
			<Section>
				<Img src={pl} width="96" height="96" alt={pn} style={userImage} />
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
