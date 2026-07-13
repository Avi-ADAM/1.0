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

	/**
	 * Personal "we thought of you" invitation — sent only to the member a new
	 * mission was assigned to (createMission branch 2). Recruiter-style: warm,
	 * personal, with the full offer details and one clear call to action.
	 *
	 * @typedef {Object} Props
	 * @property {string} [username] - the invited member (recipient)
	 * @property {string} [un] - the inviting member (mission creator)
	 * @property {any} [pl] - project logo url
	 * @property {string} [pn] - project (rikma) name
	 * @property {string} [name] - mission name
	 * @property {string} [descrip] - mission description (rich-text HTML)
	 * @property {number|null} [nhours] - offered hours
	 * @property {number|null} [valph] - offered value per hour
	 * @property {string|null} [dateStart] - ISO start date
	 * @property {string|null} [dateEnd] - ISO end date
	 * @property {string} [restime] - rikma response time key (feh/sth/nsh/sevend)
	 * @property {string|number} [pid] - project id, for the deep link
	 * @property {string|number} [askId] - Ask entity id, for the deep link
	 * @property {string} [lang]
	 */

	/** @type {Props} */
	let {
		username = '',
		un = '',
		pl = 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
		pn = '',
		name = '',
		descrip = '',
		nhours = null,
		valph = null,
		dateStart = null,
		dateEnd = null,
		restime = 'feh',
		pid = '',
		askId = '',
		lang = 'he'
	} = $props();

	const voteHref =
		pid && askId
			? `https://1lev1.com/moach/${pid}/votes/ask/${askId}`
			: 'https://1lev1.com/lev';

	const houhe = {
		feh: 'יומיים (48 שעות)',
		sth: 'שלושה ימים (72 שעות)',
		nsh: 'ארבעה ימים (96 שעות)',
		sevend: 'שבוע'
	};
	const houen = { feh: '48 hours', sth: '72 hours', nsh: '96 hours', sevend: 'one week' };
	const restimeTxt = { he: houhe[restime] ?? houhe.feh, en: houen[restime] ?? houen.feh };

	function fmtDate(iso) {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}

	const previewText = {
		he: `${un} מהריקמה ${pn} חשב/ה בדיוק עליך — "${name}" מחכה לאישורך`,
		en: `${un} from the ${pn} rikma thought of you — "${name}" awaits your consent`
	};
	const headr = {
		he: `${username}, חשבנו בדיוק עליך! ✨`,
		en: `${username}, we thought exactly of you! ✨`
	};
	const opening = {
		he: `בריקמה "${pn}" נולדה משימה חדשה — "${name}" — ו${un} בחר/ה דווקא בך להוביל אותה. הכישורים שלך, הדרך שלך — זה בדיוק מה שההצעה הזו מחפשת.`,
		en: `A new mission was just born in the "${pn}" rikma — "${name}" — and ${un} picked you, specifically, to take it on. Your skills and your way of working are exactly what this offer is looking for.`
	};
	const detailsTitle = { he: 'מה על השולחן', en: "What's on the table" };
	const hoursLabel = { he: 'היקף שעות', en: 'Hours' };
	const valphLabel = { he: 'ערך לשעה', en: 'Value per hour' };
	const startLabel = { he: 'התחלה', en: 'Starts' };
	const endLabel = { he: 'יעד סיום', en: 'Due' };
	const consent = {
		he: `וחשוב מכל: שום דבר לא קורה בלי ההסכמה שלך. המשימה תירשם על שמך רק אם תאשר/י אותה. לרשותך ${restimeTxt.he} לאשר, לדייק את התנאים בהצעה נגדית או לפתוח שיחה — ואם לא תגיב/י עד אז, ההצעה תיפתח לכל חברי הריקמה והיא תחפש מישהו אחר.`,
		en: `Most importantly: nothing happens without your consent. The mission is registered under your name only once you approve it. You have ${restimeTxt.en} to approve, refine the terms with a counter-offer or open a discussion — and if you don't respond in time, the offer opens up to all rikma members and it will look for someone else.`
	};
	const cta = { he: 'לצפייה בהצעה ולהצבעה', en: 'View the offer & vote' };
	const slogen = {
		he: '1💗1 - יש מה לעשות! ליצור יחד בהסכמה.',
		en: '1💗1 Create together harmoniously'
	};

	const fontFamily =
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

	const main = { backgroundColor: '#ffffff' };
	const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
	const userImage = { margin: '0 auto', marginBottom: '16px', borderRadius: '50%' };
	const heading = {
		fontFamily,
		fontSize: '30px',
		lineHeight: '1.3',
		fontWeight: '700',
		color: '#484848'
	};
	const paragraph = { fontFamily, fontSize: '18px', lineHeight: '1.5', color: '#484848' };
	const review = {
		...paragraph,
		padding: '24px',
		backgroundColor: '#fdf2f8',
		border: '1px solid #FF0092',
		borderRadius: '8px'
	};
	const detailsBox = {
		...paragraph,
		padding: '20px 24px',
		backgroundColor: '#f2f3f3',
		borderRadius: '8px'
	};
	const detailsHead = {
		fontFamily,
		fontSize: '20px',
		fontWeight: '700',
		color: '#484848',
		margin: '0 0 8px 0'
	};
	const detailLine = { fontFamily, fontSize: '16px', lineHeight: '1.6', color: '#484848', margin: '2px 0' };
	/** @type {any} */
	const button = {
		fontFamily,
		backgroundColor: '#FF0092',
		borderRadius: '6px',
		color: '#EEE8AA',
		fontSize: '18px',
		fontWeight: '700',
		textDecoration: 'none',
		textAlign: 'center',
		display: 'block',
		width: '100%'
	};
	const hr = { borderColor: '#cccccc', margin: '20px 0' };
	const footer = { fontFamily, color: '#9ca299', fontSize: '14px', marginBottom: '10px' };
</script>

<Html {lang}>
	<Head />
	<Preview preview={previewText[lang]} />
	<Section style={main} dir={lang == 'he' ? 'rtl' : 'ltr'}>
		<Container style={container}>
			<Img
				src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
				width="30"
				height="30"
				alt="1💗1Logo"
			/>
			<Section>
				<Img src={pl} width="96" height="96" alt={pn} style={userImage} />
			</Section>
			<Heading style={heading}>{headr[lang]}</Heading>
			<Text style={review}>{opening[lang]}</Text>
			<Section style={detailsBox}>
				<Text style={detailsHead}>{detailsTitle[lang]} · "{name}"</Text>
				{#if nhours}
					<Text style={detailLine}>⏱️ {hoursLabel[lang]}: {nhours}</Text>
				{/if}
				{#if valph}
					<Text style={detailLine}>💎 {valphLabel[lang]}: {valph}</Text>
				{/if}
				{#if dateStart}
					<Text style={detailLine}>🚀 {startLabel[lang]}: {fmtDate(dateStart)}</Text>
				{/if}
				{#if dateEnd}
					<Text style={detailLine}>🏁 {endLabel[lang]}: {fmtDate(dateEnd)}</Text>
				{/if}
				{#if descrip}
					<Text style={detailLine}>{@html descrip}</Text>
				{/if}
			</Section>
			<Text style={paragraph}>{consent[lang]}</Text>
			<Section style={{ padding: '16px 0 20px' }}>
				<Button pY={19} style={button} href={voteHref}>{cta[lang]}</Button>
			</Section>
			<Hr style={hr} />
			<Text style={footer}>{slogen[lang]}</Text>
		</Container>
	</Section>
</Html>
