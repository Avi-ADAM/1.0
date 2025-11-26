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

  // ✅ Svelte 5 syntax - using $props()
  /**
   * @typedef {Object} Props
   * @property {string} [username]
   * @property {number} [amount]
   * @property {boolean} [isReceiving]
   * @property {string} [lang]
   * @property {string} [previewText]
   */

  /** @type {Props} */
  let { 
    username = '', 
    amount = 0, 
    isReceiving = true, 
    lang = 'he', 
    previewText = '' 
  } = $props();
  
  // ✅ Svelte 5 - using $derived for computed values
  const dir = $derived(lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr');
  
  const texts = {
    he: {
      greeting: `שלום ${username},`,
      receivingTitle: 'מזל טוב! 🎉',
      receivingBody: `החלוקה אושרה והסכום של ${amount} ש"ח נוסף ליתרה שלך! 💰`,
      nextStep: 'כעת עליך להיכנס לעמוד הלב כדי לתאם את פרטי קבלת הכסף ולאשר שקיבלת אותו.',
      givingTitle: 'חלוקה אושרה',
      givingBody: `החלוקה אושרה. עליך להעביר ${amount} ש"ח. תודה על שיתוף הפעולה 🤝`,
      givingNextStep: 'כעת עליך להיכנס לעמוד הלב כדי לתאם את פרטי ההעברה ולאשר שהעברת את הכסף.',
      thanks: 'תודה על שיתוף הפעולה',
      viewDetails: 'כניסה לעמוד הלב',
      footer: '1💗1 - קשה לבד? קל ביחד!'
    },
    en: {
      greeting: `Hello ${username},`,
      receivingTitle: 'Congratulations! 🎉',
      receivingBody: `The division has been approved and ${amount} ILS has been added to your balance! 💰`,
      nextStep: 'Now you need to go to the Lev page to coordinate the details of receiving the money and confirm that you received it.',
      givingTitle: 'Division Approved',
      givingBody: `The division has been approved. You need to transfer ${amount} ILS. Thank you for your cooperation 🤝`,
      givingNextStep: 'Now you need to go to the Lev page to coordinate the transfer details and confirm that you sent the money.',
      thanks: 'Thank you for your cooperation',
      viewDetails: 'Go to Lev Page',
      footer: '1💗1 - We can together'
    },
    ar: {
      greeting: `مرحبا ${username}،`,
      receivingTitle: 'تهانينا! 🎉',
      receivingBody: `تمت الموافقة على التقسيم وتمت إضافة ${amount} شيكل إلى رصيدك! 💰`,
      nextStep: 'الآن تحتاج إلى الذهاب إلى صفحة ليف لتنسيق تفاصيل استلام المال وتأكيد أنك استلمته.',
      givingTitle: 'تمت الموافقة على التقسيم',
      givingBody: `تمت الموافقة على التقسيم. يجب عليك تحويل ${amount} شيكل. شكرا لتعاونك 🤝`,
      givingNextStep: 'الآن تحتاج إلى الذهاب إلى صفحة ليف لتنسيق تفاصيل التحويل وتأكيد أنك أرسلت المال.',
      thanks: 'شكرا لتعاونك',
      viewDetails: 'الذهاب إلى صفحة ليف',
      footer: '1💗1'
    }
  };
  
  const t = $derived(texts[lang as keyof typeof texts] || texts.he);

  // Styles
  const fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const main = {
    backgroundColor: '#ffffff',
    fontFamily
  };

  const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px'
  };

  const logo = {
    height: '40px',
    width: '40px',
    margin: '0 auto 20px'
  };

  const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '20px 0',
    color: isReceiving ? '#667eea' : '#4facfe'
  };

  const greeting = {
    fontSize: '18px',
    color: '#333333',
    marginBottom: '20px'
  };

  const amountBox = {
    background: isReceiving 
      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
      : '#f8f9fa',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center' as const,
    margin: '30px 0',
    borderRight: isReceiving ? 'none' : '4px solid #4facfe'
  };

  const amountText = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: isReceiving ? '#ffffff' : '#333333',
    marginBottom: '10px'
  };

  const bodyText = {
    fontSize: isReceiving ? '18px' : '16px',
    color: isReceiving ? '#ffffff' : '#666666',
    margin: '0'
  };

  const thanksText = {
    fontSize: '16px',
    color: '#666666',
    margin: '30px 0'
  };

  const buttonStyle = {
    background: isReceiving 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#ffffff',
    padding: '15px 40px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'none'
  };

  const hr = {
    borderColor: '#e9ecef',
    margin: '40px 0 20px'
  };

  const footer = {
    color: '#999999',
    fontSize: '14px',
    textAlign: 'center' as const,
    margin: '10px 0'
  };

</script>

<Html lang={lang}>
  <Head />
  <Preview preview={previewText || t.receivingTitle} />
  <Section style={main} dir={dir}>
    <Container style={container}>
      <!-- Logo -->
      <Img 
        src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png" 
        width="40" 
        height="40"
        style={logo}
        alt="1💗1 Logo" 
      />

      <!-- Title -->
      <Heading style={heading}>
        {isReceiving ? t.receivingTitle : t.givingTitle}
      </Heading>

      <!-- Greeting -->
      <Text style={greeting}>
        {t.greeting}
      </Text>

      <!-- Amount Box -->
      <Section style={amountBox}>
        <Heading style={amountText}>
          {amount} ₪
        </Heading>
        <Text style={bodyText}>
          {t.receivingBody}
        </Text>
      </Section>

      <!-- Next Step -->
      <Text style={thanksText}>
        {isReceiving ? t.nextStep : t.givingNextStep}
      </Text>

      <!-- Thanks -->
      <Text style={{ ...thanksText, fontSize: '14px', marginTop: '10px' }}>
        {t.thanks}
      </Text>

      <!-- CTA Button -->
      <Section style={{ padding: '20px 0', textAlign: 'center' }}>
        <Button 
          href="https://www.1lev1.com/lev" 
          style={buttonStyle}
        >
          {t.viewDetails}
        </Button>
      </Section>

      <!-- Footer -->
      <Hr style={hr} />
      <Text style={footer}>
        {t.footer}
      </Text>
      <Text style={{ ...footer, fontSize: '12px', marginTop: '10px' }}>
        <a href="https://www.1lev1.com" style="color: #667eea; text-decoration: none;">
          www.1lev1.com
        </a>
      </Text>
    </Container>
  </Section>
</Html>
