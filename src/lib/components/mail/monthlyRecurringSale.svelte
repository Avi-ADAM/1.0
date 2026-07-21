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
   * Monthly recurring-sale cycle email (PLAN_RECURRING_SALES).
   * Sent by /api/monthi when a new monthly cycle opens on a standing order.
   *
   * role 'holder'   → the money-holder: "report how much came in this month"
   *                   (CTA → sales-center).
   * role 'customer' → the paying customer: "report how much you transferred"
   *                   (CTA → deals).
   *
   * @typedef {Object} Props
   * @property {string} [username]
   * @property {string} [productName]   - e.g. "ריטיינר חודשי"
   * @property {string} [projectName]
   * @property {number} [expectedAmount]
   * @property {string} [monthLabel]    - e.g. "07/2026"
   * @property {'holder' | 'customer'} [role]
   * @property {string} [lang]
   * @property {string} [previewText]
   */

  /** @type {Props} */
  let {
    username = '',
    productName = '',
    projectName = '',
    expectedAmount = 0,
    monthLabel = '',
    role = 'holder',
    lang = 'he',
    previewText = ''
  }: {
    username?: string;
    productName?: string;
    projectName?: string;
    expectedAmount?: number;
    monthLabel?: string;
    role?: 'holder' | 'customer';
    lang?: string;
    previewText?: string;
  } = $props();

  const dir = $derived(lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr');

  const holderTexts = $derived({
    he: {
      title: 'מכירה מתחדשת — דיווח חודשי 🔁',
      greeting: `שלום ${username},`,
      intro: `הגיע הזמן לדווח כמה נכנס החודש (${monthLabel}) מ"${productName}"${projectName ? ` בריקמה "${projectName}"` : ''}.`,
      amountLabel: 'הסכום הצפוי',
      ask: 'היכנסו למרכז המכירות, אשרו או עדכנו את הסכום שנכנס בפועל החודש — גם 0 הוא דיווח (הוראת קבע שבוטלה אפשר לסגור באותו מקום).',
      cta: 'דיווח במרכז המכירות',
      link: 'https://www.1lev1.com/deals/sales-center',
      footer: '1💗1 - קשה לבד? קל ביחד!'
    },
    en: {
      title: 'Recurring sale — monthly report 🔁',
      greeting: `Hello ${username},`,
      intro: `Time to report how much came in this month (${monthLabel}) from "${productName}"${projectName ? ` in "${projectName}"` : ''}.`,
      amountLabel: 'Expected amount',
      ask: 'Go to the sales center and confirm or update what actually came in this month — 0 is a valid report (a cancelled standing order can be closed right there).',
      cta: 'Report in the sales center',
      link: 'https://www.1lev1.com/deals/sales-center',
      footer: '1💗1 - We can together'
    },
    ar: {
      title: 'بيع متكرر — تقرير شهري 🔁',
      greeting: `مرحبا ${username}،`,
      intro: `حان الوقت للإبلاغ عن المبلغ الذي دخل هذا الشهر (${monthLabel}) من "${productName}"${projectName ? ` في "${projectName}"` : ''}.`,
      amountLabel: 'المبلغ المتوقع',
      ask: 'ادخل إلى مركز المبيعات وأكّد أو حدّث المبلغ الفعلي لهذا الشهر — 0 هو تقرير صالح أيضاً.',
      cta: 'الإبلاغ في مركز المبيعات',
      link: 'https://www.1lev1.com/deals/sales-center',
      footer: '1💗1'
    },
    ru: {
      title: 'Повторяющаяся продажа — месячный отчёт 🔁',
      greeting: `Здравствуйте, ${username},`,
      intro: `Пора сообщить, сколько поступило в этом месяце (${monthLabel}) от «${productName}»${projectName ? ` в плетении «${projectName}»` : ''}.`,
      amountLabel: 'Ожидаемая сумма',
      ask: 'Зайдите в центр продаж и подтвердите или обновите фактическую сумму за месяц — 0 тоже считается отчётом.',
      cta: 'Отчёт в центре продаж',
      link: 'https://www.1lev1.com/deals/sales-center',
      footer: '1💗1 - Вместе проще!'
    }
  });

  const customerTexts = $derived({
    he: {
      title: 'הוראת קבע — עדכון חודשי 💳',
      greeting: `שלום ${username},`,
      intro: `נפתח חלון הדיווח החודשי (${monthLabel}) עבור "${productName}"${projectName ? ` של הריקמה "${projectName}"` : ''}.`,
      amountLabel: 'הסכום הצפוי',
      ask: 'היכנסו לעמוד העסקאות ועדכנו כמה העברתם החודש — כך המוכר יוכל לאשרר שהתקבל. גם 0 הוא עדכון לגיטימי.',
      cta: 'עדכון בעמוד העסקאות',
      link: 'https://www.1lev1.com/deals',
      footer: '1💗1 - קשה לבד? קל ביחד!'
    },
    en: {
      title: 'Standing order — monthly update 💳',
      greeting: `Hello ${username},`,
      intro: `The monthly reporting window (${monthLabel}) opened for "${productName}"${projectName ? ` of "${projectName}"` : ''}.`,
      amountLabel: 'Expected amount',
      ask: 'Go to your deals page and report how much you transferred this month, so the seller can confirm receipt. 0 is a valid update too.',
      cta: 'Update on the deals page',
      link: 'https://www.1lev1.com/deals',
      footer: '1💗1 - We can together'
    },
    ar: {
      title: 'أمر دفع دائم — تحديث شهري 💳',
      greeting: `مرحبا ${username}،`,
      intro: `فُتحت نافذة التقرير الشهري (${monthLabel}) لـ "${productName}"${projectName ? ` لدى "${projectName}"` : ''}.`,
      amountLabel: 'المبلغ المتوقع',
      ask: 'ادخل إلى صفحة الصفقات وحدّث المبلغ الذي حوّلته هذا الشهر ليتمكن البائع من تأكيد الاستلام.',
      cta: 'تحديث في صفحة الصفقات',
      link: 'https://www.1lev1.com/deals',
      footer: '1💗1'
    },
    ru: {
      title: 'Постоянное поручение — месячное обновление 💳',
      greeting: `Здравствуйте, ${username},`,
      intro: `Открылось окно месячного отчёта (${monthLabel}) для «${productName}»${projectName ? ` у «${projectName}»` : ''}.`,
      amountLabel: 'Ожидаемая сумма',
      ask: 'Зайдите на страницу сделок и сообщите, сколько вы перевели в этом месяце, чтобы продавец подтвердил получение.',
      cta: 'Обновить на странице сделок',
      link: 'https://www.1lev1.com/deals',
      footer: '1💗1 - Вместе проще!'
    }
  });

  const texts = $derived(role === 'customer' ? customerTexts : holderTexts);
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

      {#if expectedAmount}
        <Section style={amountBox}>
          <Text style={amountLabel}>{t.amountLabel}</Text>
          <Heading style={amountText}>{expectedAmount} ₪</Heading>
        </Section>
      {/if}

      <Text style={ask}>{t.ask}</Text>

      <Section style={{ padding: '20px 0', textAlign: 'center' }}>
        <Button href={t.link} style={buttonStyle}>{t.cta}</Button>
      </Section>

      <Hr style={hr} />
      <Text style={footer}>{t.footer}</Text>
      <Text style={{ ...footer, fontSize: '12px', marginTop: '10px' }}>
        <a href="https://www.1lev1.com" style="color: #FF0092; text-decoration: none;">www.1lev1.com</a>
      </Text>
    </Container>
  </Section>
</Html>
