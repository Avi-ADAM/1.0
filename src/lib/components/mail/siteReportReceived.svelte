<script>
	// Confirmation to somebody who reported a bug, an idea or a message to the
	// team (PLAN_EXTERNAL_TASKS_API §4). Sent only when they chose to leave an
	// email, and its job is to close the loop honestly: their report is now a
	// task in the platform's own rikma, with a person's consent attached — not a
	// message in a void.
	//
	// The multi-locale objects here are the allowed kind: they are indexed by the
	// RECIPIENT's language, which $t() cannot express from the server. They are
	// kept free of prop interpolation so the tables stay static and the copy that
	// depends on props is derived in one place below.
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
	 * @property {string} [type]      bug | feature | partnership | contact
	 * @property {string} [description]
	 * @property {string} [username]
	 * @property {boolean} [isGuest]  no account yet → invite them in
	 * @property {string} [link]      where the button goes
	 * @property {any} [previewText]
	 * @property {string} [lang]
	 */

	/** @type {Props} */
	let {
		type = 'contact',
		description = '',
		username = '',
		isGuest = false,
		link = 'https://www.1lev1.com',
		previewText = '',
		lang = 'he'
	} = $props();

	const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];
	const src1 =
		'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';

	const THANKS = { he: 'תודה', en: 'Thank you', ar: 'شكراً', ru: 'Спасибо', es: 'Gracias' };

	/** What they sent, named in a way the body sentence can absorb. */
	const KINDS = {
		bug: {
			he: 'התקלה שדיווחת עליה',
			en: 'the bug you reported',
			ar: 'العطل الذي أبلغت عنه',
			ru: 'об ошибке, о которой вы сообщили',
			es: 'el error que reportaste'
		},
		feature: {
			he: 'הרעיון ששלחת',
			en: 'the idea you sent',
			ar: 'الفكرة التي أرسلتها',
			ru: 'об идее, которую вы прислали',
			es: 'la idea que enviaste'
		},
		partnership: {
			he: 'פניית השותפות שלך',
			en: 'your partnership enquiry',
			ar: 'استفسار الشراكة الخاص بك',
			ru: 'о вашем предложении о партнёрстве',
			es: 'tu consulta de colaboración'
		},
		contact: {
			he: 'הפנייה ששלחת',
			en: 'the message you sent',
			ar: 'الرسالة التي أرسلتها',
			ru: 'о вашем сообщении',
			es: 'el mensaje que enviaste'
		}
	};

	// The real content of this email: not "we received it" but "it is now
	// somebody's actual work, and here is how that works here".
	const BODY = {
		he: (/** @type {string} */ k) =>
			`קיבלנו ${k}. אצלנו זה לא נעלם בתיבת דואר: הפנייה נפתחה כמטלה בריקמה שמפתחת את האתר, וחבר/ה בריקמה לוקח/ת אותה על עצמו/ה. כשמישהו לוקח את המטלה, וכשהיא נסגרת — הסטטוס של הפנייה שלך מתעדכן בהתאם.`,
		en: (/** @type {string} */ k) =>
			`We received ${k}. It does not vanish into an inbox here: it was opened as a task in the rikma that builds this site, and a member there takes it on. When somebody picks it up, and when it is closed, your report's status follows.`,
		ar: (/** @type {string} */ k) =>
			`لقد استلمنا ${k}. لا يختفي هنا في صندوق بريد: فقد فُتح كمهمّة في النسيج الذي يبني هذا الموقع، ويتولّاه أحد الأعضاء. وعندما يأخذه أحدهم، وعندما يُغلق، تتبع حالة بلاغك ذلك.`,
		ru: (/** @type {string} */ k) =>
			`Мы получили ваше сообщение ${k}. Здесь оно не пропадает в почтовом ящике: оно открыто как задача в рикме, которая развивает этот сайт, и участник берёт её на себя. Когда кто-то её принимает и когда она закрывается, статус вашего обращения меняется вслед.`,
		es: (/** @type {string} */ k) =>
			`Hemos recibido ${k}. Aquí no desaparece en una bandeja de entrada: se abrió como una tarea en la rikma que construye este sitio, y un miembro la toma. Cuando alguien la asume, y cuando se cierra, el estado de tu reporte lo sigue.`
	};

	const GUEST_NOTE = {
		he: 'אם תירשמו, תוכלו לעקוב אחרי מה שקורה כאן ואפילו לקחת חלק בעשייה עצמה.',
		en: 'If you sign up, you can follow what happens here — and even take part in the work itself.',
		ar: 'إذا سجّلت، يمكنك متابعة ما يجري هنا، بل والمشاركة في العمل نفسه.',
		ru: 'Если вы зарегистрируетесь, то сможете следить за происходящим — и даже участвовать в самой работе.',
		es: 'Si te registras, podrás seguir lo que ocurre aquí — e incluso participar en el trabajo.'
	};

	const CTA_GUEST = {
		he: 'להרשמה',
		en: 'Sign up',
		ar: 'التسجيل',
		ru: 'Зарегистрироваться',
		es: 'Registrarse'
	};
	const CTA_USER = {
		he: 'לאתר',
		en: 'Go to the site',
		ar: 'إلى الموقع',
		ru: 'На сайт',
		es: 'Ir al sitio'
	};

	const YOUR_WORDS = {
		he: 'מה שכתבת:',
		en: 'What you wrote:',
		ar: 'ما كتبته:',
		ru: 'Что вы написали:',
		es: 'Lo que escribiste:'
	};

	const SLOGAN = {
		he: '1💗1 — קשה לבד? קל ביחד!',
		en: '1💗1 — we can, together',
		ar: '1💗1 — معاً نستطيع',
		ru: '1💗1 — вместе мы можем',
		es: '1💗1 — juntos podemos'
	};

	// ── Everything that depends on a prop, resolved once ──────────────────────
	const L = $derived(LOCALES.includes(lang) ? lang : 'he');
	const isRtl = $derived(L === 'he' || L === 'ar');
	const kind = $derived((KINDS[type] ?? KINDS.contact)[L]);
	const hello = $derived(username ? `${THANKS[L]}, ${username}!` : `${THANKS[L]}!`);
	const bodyText = $derived(BODY[L](kind));
	const cta = $derived(isGuest ? CTA_GUEST[L] : CTA_USER[L]);

	const fontFamily =
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

	const main = { backgroundColor: '#ffffff' };
	const container = $derived({
		margin: '0 auto',
		padding: '20px 0 48px',
		width: '580px',
		maxWidth: '100%',
		direction: /** @type {'rtl' | 'ltr'} */ (isRtl ? 'rtl' : 'ltr'),
		textAlign: /** @type {'right' | 'left'} */ (isRtl ? 'right' : 'left')
	});
	const heading = { fontFamily, fontSize: '28px', fontWeight: '700', margin: '24px 0 8px' };
	const paragraph = { fontFamily, fontSize: '16px', lineHeight: '26px', color: '#3c4149' };
	const quote = {
		fontFamily,
		fontSize: '15px',
		lineHeight: '24px',
		color: '#525f7f',
		backgroundColor: '#f6f9fc',
		borderInlineStart: '3px solid #d4af37',
		padding: '10px 14px',
		borderRadius: '4px',
		whiteSpace: /** @type {'pre-wrap'} */ ('pre-wrap')
	};
	const button = {
		backgroundColor: '#e91e8c',
		borderRadius: '6px',
		color: '#fff',
		fontFamily,
		fontSize: '15px',
		fontWeight: '700',
		textDecoration: 'none',
		textAlign: /** @type {'center'} */ ('center'),
		display: 'block'
	};
	const ctaSection = { padding: '16px 0' };
	const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
	const footer = { fontFamily, color: '#8898aa', fontSize: '12px', lineHeight: '16px' };
</script>

<Html lang={L} dir={isRtl ? 'rtl' : 'ltr'}>
	<Head />
	<Preview preview={previewText || hello} />
	<Section style={main}>
		<Container style={container}>
			<Img src={src1} width="48" height="48" alt="1lev1" />
			<Heading style={heading}>{hello}</Heading>
			<Text style={paragraph}>{bodyText}</Text>

			{#if description}
				<Text style={paragraph}>{YOUR_WORDS[L]}</Text>
				<Text style={quote}>{description}</Text>
			{/if}

			{#if isGuest}
				<Text style={paragraph}>{GUEST_NOTE[L]}</Text>
			{/if}

			<Section style={ctaSection}>
				<Button pY={14} style={button} href={link}>{cta}</Button>
			</Section>

			<Hr style={hr} />
			<Text style={footer}>{SLOGAN[L]}</Text>
		</Container>
	</Section>
</Html>
