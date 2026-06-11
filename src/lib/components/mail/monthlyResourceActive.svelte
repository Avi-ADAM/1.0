<script lang="ts">
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
   * Monthly recurring-resource activation email.
   * Sent by /api/monthi when a new cycle opens, asking the responsible user to
   * confirm how much was actually spent this month.
   *
   * @typedef {Object} Props
   * @property {string} [username]
   * @property {string} [resourceName]  - e.g. "שכירות שרת"
   * @property {string} [projectName]
   * @property {number} [plannedAmount]
   * @property {string} [monthLabel]    - e.g. "06/2026"
   * @property {string} [lang]
   * @property {string} [previewText]
   */

  /** @type {Props} */
  let {
    username = '',
    resourceName = '',
    projectName = '',
    plannedAmount = 0,
    monthLabel = '',
    lang = 'he',
    previewText = ''
  } = $props();

  const dir = $derived(lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr');

  const texts = {
    he: {
      title: 'משאב חודשי פעיל 🔁',
      greeting: `שלום ${username},`,
      intro: `הגיע הזמן לעדכן את ההוצאה החודשית עבור "${resourceName}"${projectName ? ` בריקמה "${projectName}"` : ''} לחודש ${monthLabel}.`,
      plannedLabel: 'הסכום המתוכנן',
      ask: 'כנסו לעמוד הלב, אשרו או עדכנו את הסכום שהוצאתם בפועל החודש, וזה יעבור לאישור הריקמה ויירשם בארכיון.',
      cta: 'עדכון ההוצאה בעמוד הלב',
      footer: '1💗1 - קשה לבד? קל ביחד!'
    },
    en: {
      title: 'Recurring resource is active 🔁',
      greeting: `Hello ${username},`,
      intro: `Time to log this month's expense for "${resourceName}"${projectName ? ` in "${projectName}"` : ''} for ${monthLabel}.`,
      plannedLabel: 'Planned amount',
      ask: 'Go to the Lev page, confirm or update what you actually spent this month, and it will go to the weave for approval and be recorded in the archive.',
      cta: 'Update the expense on Lev',
      footer: '1💗1 - We can together'
    },
    ar: {
      title: 'المورد المتكرر نشط 🔁',
      greeting: `مرحبا ${username}،`,
      intro: `حان وقت تسجيل مصروف هذا الشهر لـ "${resourceName}"${projectName ? ` في "${projectName}"` : ''} لشهر ${monthLabel}.`,
      plannedLabel: 'المبلغ المخطط',
      ask: 'ادخل إلى صفحة ليف، أكّد أو حدّث ما أنفقته فعلاً هذا الشهر، وسينتقل للموافقة ويُسجّل في الأرشيف.',
      cta: 'تحديث المصروف في ليف',
      footer: '1💗1'
    }
  };

  const t = $derived(texts[lang as keyof typeof texts] || texts.he);

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';
  const main = { backgroundColor: '#ffffff', fontFamily };
  const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
  const logo = { height: '40px', width: '40px', margin: '0 auto 20px' };
  const heading = {
    fontSize: '26px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '20px 0',
    color: '#FF0092'
  };
  const greeting = { fontSize: '18px', color: '#333333', marginBottom: '12px' };
  const intro = { fontSize: '16px', color: '#555555', margin: '0 0 20px' };
  const amountBox = {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0'
  };
  const amountLabel = { fontSize: '14px', color: '#ffffff', margin: '0 0 6px', opacity: '0.9' };
  const amountText = { fontSize: '40px', fontWeight: 'bold', color: '#ffffff', margin: '0' };
  const ask = { fontSize: '15px', color: '#666666', margin: '20px 0' };
  const buttonStyle = {
    background: 'linear-gradient(135deg, #FF0092 0%, #764ba2 100%)',
    color: '#ffffff',
    padding: '15px 40px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'none'
  };
  const hr = { borderColor: '#e9ecef', margin: '40px 0 20px' };
  const footer = { color: '#999999', fontSize: '14px', textAlign: 'center' as const, margin: '10px 0' };
</script>

<Html lang={lang}>
  <Head />
  <Preview preview={previewText || t.title} />
  <Section style={main} dir={dir}>
    <Container style={container}>
      <Img
        src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
        width="40"
        height="40"
        style={logo}
        alt="1💗1 Logo"
      />

      <Heading style={heading}>{t.title}</Heading>

      <Text style={greeting}>{t.greeting}</Text>
      <Text style={intro}>{t.intro}</Text>

      <Section style={amountBox}>
        <Text style={amountLabel}>{t.plannedLabel}</Text>
        <Heading style={amountText}>{plannedAmount} ₪</Heading>
      </Section>

      <Text style={ask}>{t.ask}</Text>

      <Section style={{ padding: '20px 0', textAlign: 'center' }}>
        <Button href="https://www.1lev1.com/lev" style={buttonStyle}>{t.cta}</Button>
      </Section>

      <Hr style={hr} />
      <Text style={footer}>{t.footer}</Text>
      <Text style={{ ...footer, fontSize: '12px', marginTop: '10px' }}>
        <a href="https://www.1lev1.com" style="color: #FF0092; text-decoration: none;">www.1lev1.com</a>
      </Text>
    </Container>
  </Section>
</Html>
