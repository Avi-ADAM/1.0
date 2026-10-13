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
	} from 'svelty-email';

	/**
	 * @typedef {Object} Props
	 * @property {string} [head]
	 * @property {string} [body]
	 * @property {string} [username]
	 * @property {any} [previewText]
	 * @property {string} [lang]
	 * @property {{ label: string, href: string }[]} [links] every place to answer it — one button each, the first the main one
	 */

	/** @type {Props} */
	let {
		head = '',
		body = '',
		username = "x",
		previewText = {},
		lang = "he",
		links = []
	} = $props();
  
    const headr = {"he":` שלום ${username}!`,"en":`hallo ${username}!`,"ar":`مرحبًا ${username}!`}
    const tovo = {"he":"לצפיה באתר!","en":"see now!","ar":"للمشاهدة في الموقع"}
    const src1 = "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
	
        const slogen = {
            "he":"1💗1 - קשה לבד? קל ביחד!",
            "en":"1💗1 we can together",
            "ar":"1💗1 — صعب وحدك؟ سهل معًا!"
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
		textAlign: /** @type {'center'} */ ('center'),
		display: 'block',
		width: '100%'
	};

	// The second way in, beside the main button — same width, outlined.
	const buttonAlt = {
		...button,
		backgroundColor: '#ffffff',
		color: '#FF0092',
		border: '2px solid #FF0092',
		marginTop: '12px'
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
	<Section style={main} dir={lang == "he" || lang == "ar" ? "rtl":"ltr"}>
		<Container style={container}>
			<Img src={src1} width="30" height="30" alt="1💗1Logo" />
		
			<Heading style={heading}>{headr[lang] ?? headr.en}</Heading>
			<Text style={review}>{head[lang]}</Text>
            <Text style={{ ...paragraph, whiteSpace: 'pre-line' }}>{body[lang]}</Text>

			<Section style={{ padding: '16px 0 20px' }}>
				{#if links.length}
					{#each links as l, i}
						<Button pY={19} style={i === 0 ? button : buttonAlt} href={l.href}>{l.label}</Button>
					{/each}
				{:else}
					<Button pY={19} style={button} href="https://www.1lev1.com/lev">{tovo[lang] ?? tovo.en}</Button>
				{/if}
			</Section>		
			<Hr style={hr} />
			<Text style={footer}>{slogen[lang] ?? slogen.en}</Text>
		</Container>
	</Section>
</Html>
