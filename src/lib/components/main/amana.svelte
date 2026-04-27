<script>
  import { liUN } from '$lib/stores/liUN.js';
  import { Canvas } from '@threlte/core';
  import Scene from './globu.svelte';
  import { doesLang, langUs, lang } from '$lib/stores/lang.js';
  import { locale, t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import Maze from './maze.svelte';
  import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
  import { email } from '../registration/email.js';
  import { contriesi } from '../registration/contries.js';
  import { fpval } from '../registration/fpval.js';
  import { regHelper } from '../../stores/regHelper.js';
  import { show } from '../registration/store-show.js';

  import { RingLoader } from 'svelte-loading-spinners';
  import { fly, fade } from 'svelte/transition';
  import Tikun from './tikunolam.svelte';
  import TRan from './translatehe.svelte';
  import { onMount } from 'svelte';
  import { linkos } from '$lib/stores/linkos.js';
  import { useProgress } from '@threlte/extras';
  const { progress } = useProgress();
  import { Head } from 'svead';
  import { track } from '@vercel/analytics';
  import { page } from '$app/stores';

  $effect(() => {
    console.log('amana', $progress);
  });

  let title = $derived($t('home.amana.title'));
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;
  let description = $derived($t('home.amana.description'));
  let url = 'https://1lev1.com/hascama';

  let fpp = [];
  let fppp = [];
  const baseUrl = import.meta.env.VITE_URL;

  let error1 = null;

  // Check if user came back from agreement site
  let agreedToFullAgreement = $state(false);

  onMount(async () => {
    // Check URL parameters for agreement confirmation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('agreed') === 'true') {
      agreedToFullAgreement = true;
    }

    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };

    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
chezins {
 data {
  attributes {
    name
  }
  }
meta {
  pagination {
    total
  }
}
}
}
          `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
      fppp = res.data.chezins;
      fpp = fppp.data.map((c) => c.attributes.name);
    } catch (e) {
      error1 = e;
    }
  });

  function find_contry_id(contry_name_arr) {
    var arr = [];
    for (let j = 0; j < contry_name_arr.length; j++) {
      for (let i = 0; i < country.length; i++) {
        if (
          country[i].heb === contry_name_arr[j] ||
          country[i].label === contry_name_arr[j]
        ) {
          arr.push(country[i].value);
        }
      }
    }
    return arr;
  }

  const country = [
    { value: 104, label: 'Israel', heb: 'ישראל' },
    {
      value: 167,
      label: 'Palestine jehuda & sumeria',
      heb: 'הרשות הפלסטינית יו"ש'
    },
    { value: 246, label: 'Palestine gaza strip', heb: 'רצועת עזה' },
    { value: 230, label: 'United States', heb: 'ארצות הברית של אמריקה' },
    { value: 245, label: 'Åland Islands', heb: 'אולנד' },
    { value: 11, label: 'Afghanistan', heb: 'אפגניסטן' },
    { value: 1, label: 'Albania', heb: 'אלבניה' },
    { value: 13, label: 'Algeria', heb: "אלג'יריה" },
    { value: 2, label: 'American Samoa', heb: 'סמואה האמריקנית' },
    { value: 7, label: 'Andorra', heb: 'אנדורה' },
    { value: 3, label: 'Angola', heb: 'אנגולה' },
    { value: 4, label: 'Anguilla', heb: 'אנגווילה' },
    { value: 5, label: 'Antarctica', heb: 'אנטרטיקה' },
    { value: 6, label: 'Antigua and Barbuda', heb: 'אנטיגואה וברבודה' },
    { value: 8, label: 'Argentina', heb: 'ארגנטינה' },
    { value: 14, label: 'Armenia', heb: 'ארמניה' },
    { value: 9, label: 'Aruba', heb: 'ארובה' },
    { value: 10, label: 'Australia', heb: 'אוסטרליה' },
    { value: 12, label: 'Austria', heb: 'אוסטריה' },
    { value: 15, label: 'Azerbaijan', heb: "אזרבייג'ן" },
    { value: 16, label: 'Bahamas', heb: 'איי בהאמה' },
    { value: 17, label: 'Bahrain', heb: 'בחריין' },
    { value: 18, label: 'Bangladesh', heb: 'בנגלדש' },
    { value: 19, label: 'Barbados', heb: 'ברבדוס' },
    { value: 20, label: 'Belarus', heb: 'בלרוס' },
    { value: 21, label: 'Belgium', heb: 'בלגיה' },
    { value: 22, label: 'Belize', heb: 'בליז' },
    { value: 26, label: 'Benin', heb: 'בנין' },
    { value: 24, label: 'Bermuda', heb: 'ברמודה' },
    { value: 27, label: 'Bhutan', heb: 'בהוטאן' },
    { value: 23, label: 'Bolivia', heb: 'בוליביה' },
    {
      value: 247,
      label: 'Bonaire, Sint Eustatius and Saba',
      heb: 'האיים הקריביים ההולנדיים'
    },
    { value: 25, label: 'Bosnia and Herzegovina', heb: 'בוסניה והרצגובינה' },
    { value: 28, label: 'Botswana', heb: 'בוטסואנה' },
    { value: 29, label: 'Bouvet Island', heb: 'בובה' },
    { value: 30, label: 'Brazil', heb: 'ברזיל' },
    {
      value: 31,
      label: 'British Indian Ocean Territory',
      heb: 'הטריטוריה הבריטית באוקיינוס ההודי'
    },
    { value: 32, label: 'Brunei Darussalam', heb: 'ברוניי דארוסלאם' },
    { value: 34, label: 'Bulgaria', heb: 'בולגריה' },
    { value: 33, label: 'Burkina Faso', heb: 'בורקינה פאסו' },
    { value: 36, label: 'Burundi', heb: 'בורונדי' },
    { value: 35, label: 'Cambodia', heb: 'קמבודיה' },
    { value: 37, label: 'Cameroon', heb: 'קמרון' },
    { value: 39, label: 'Canada', heb: 'קנדה' },
    { value: 38, label: 'Cape Verde', heb: 'כף ורדה' },
    { value: 40, label: 'Cayman Islands', heb: 'איי קיימן' },
    {
      value: 41,
      label: 'Central African Republic',
      heb: ' הרפובליקה המרכז אפריקאית '
    },
    { value: 42, label: 'Chad', heb: "צ'אד" },
    { value: 43, label: 'Chile', heb: "צ'ילה" },
    { value: 44, label: 'China', heb: 'סין' },
    { value: 45, label: 'Christmas Island', heb: 'איי חג המולד' },
    { value: 49, label: 'Cocos (Keeling) Islands', heb: 'איי קוקוס' },
    { value: 47, label: 'Colombia', heb: 'קולומביה' },
    { value: 48, label: 'Comoros', heb: 'איי קומורו' },
    { value: 46, label: 'Congo', heb: 'קונגו' },
    {
      value: 216,
      label: 'Congo, The Democratic Republic of The',
      heb: 'הרפובליקה העממית של קונגו'
    },
    { value: 50, label: 'Cook Islands', heb: 'איי קוק' },
    { value: 51, label: 'Costa Rica', heb: 'קוסטה ריקה' },
    { value: 248, label: "Cote D'ivoire", heb: 'חוף השנהב' },
    { value: 52, label: 'Croatia', heb: 'קרואטיה' },
    { value: 53, label: 'Cuba', heb: 'קובה' },
    { value: 249, label: 'Curaçao', heb: 'קוראסאו' },
    { value: 54, label: 'Cyprus', heb: 'קפריסין' },
    { value: 57, label: 'Czech Republic', heb: "צ'כיה" },
    { value: 55, label: 'Denmark', heb: 'דנמרק' },
    { value: 58, label: 'Djibouti', heb: "ג'יבוטי" },
    { value: 56, label: 'Dominica', heb: 'דומיניקה' },
    { value: 59, label: 'Dominican Republic', heb: 'הרפובליקה הדומיניקנית' },
    { value: 61, label: 'Ecuador', heb: 'אקוודור' },
    { value: 62, label: 'Egypt', heb: 'מצריים' },
    { value: 63, label: 'El Salvador', heb: 'אל סלבדור' },
    { value: 66, label: 'Equatorial Guinea', heb: 'גינאה המשוונית' },
    { value: 65, label: 'Eritrea', heb: 'אריתראה' },
    { value: 69, label: 'Estonia', heb: 'אסטוניה' },
    { value: 250, label: 'Eswatini, Swaziland', heb: 'אסוואטיני' },
    { value: 70, label: 'Ethiopia', heb: 'אתיופיה' },
    {
      value: 67,
      label: 'Falkland Islands (Malvinas)',
      heb: 'איי מאלבינס (איי פוקלנד)'
    },
    { value: 68, label: 'Faroe Islands', heb: 'איי פארו' },
    { value: 71, label: 'Fiji', heb: "פיג'י" },
    { value: 72, label: 'Finland', heb: 'פינלנד' },
    { value: 73, label: 'France', heb: 'צרפת' },
    { value: 74, label: 'French Guiana', heb: 'גויאנה הצרפתית' },
    { value: 75, label: 'French Polynesia', heb: 'פולינזיה הצרפתית' },
    {
      value: 78,
      label: 'French Southern Territories',
      heb: 'הארצות הדרומיות והאנטרקטיות של צרפת'
    },
    { value: 79, label: 'Gabon', heb: 'גאבון' },
    { value: 76, label: 'Gambia', heb: 'גמביה' },
    { value: 77, label: 'Georgia', heb: 'גאורגיה' },
    { value: 80, label: 'Germany', heb: 'גרמניה' },
    { value: 81, label: 'Ghana', heb: 'גאנה' },
    { value: 82, label: 'Gibraltar', heb: 'גיברלטר' },
    { value: 84, label: 'Greece', heb: 'יוון' },
    { value: 83, label: 'Greenland', heb: 'גרינלנד' },
    { value: 85, label: 'Grenada', heb: 'גרנדה' },
    { value: 86, label: 'Guadeloupe', heb: 'גוואדלופ' },
    { value: 87, label: 'Guam', heb: 'גואם' },
    { value: 88, label: 'Guatemala', heb: 'גואטמלה' },
    { value: 251, label: 'Guernsey', heb: 'גרנזי' },
    { value: 90, label: 'Guinea', heb: 'גינאה' },
    { value: 89, label: 'Guinea-bissau', heb: 'גינאה-ביסאו' },
    { value: 91, label: 'Guyana', heb: 'גויאנה' },
    { value: 92, label: 'Haiti', heb: 'האיטי' },
    {
      value: 93,
      label: 'Heard Island and Mcdonald Islands',
      heb: 'האי הרד ואיי מקדונלד'
    },
    { value: 94, label: 'Holy See (Vatican City State)', heb: 'וותיקן' },
    { value: 98, label: 'Honduras', heb: 'הונדורס' },
    { value: 96, label: 'Hong Kong', heb: 'הונג קונג' },
    { value: 95, label: 'Hungary', heb: 'הונגריה' },
    { value: 97, label: 'Iceland', heb: 'איסלנד' },
    { value: 99, label: 'India', heb: 'הודו' },
    { value: 100, label: 'Indonesia', heb: 'אינדונזיה' },
    { value: 101, label: 'Iran, Islamic Republic of', heb: 'איראן' },
    { value: 102, label: 'Iraq', heb: 'עירק' },
    { value: 103, label: 'Ireland', heb: 'אירלנד' },
    { value: 252, label: 'Isle of Man', heb: 'האי מאן' },
    { value: 105, label: 'Italy', heb: 'איטליה' },
    { value: 107, label: 'Jamaica', heb: "ג'מייקה" },
    { value: 109, label: 'Japan', heb: 'יפן' },
    { value: 253, label: 'Jersey', heb: "ג'רזי" },
    { value: 108, label: 'Jordan', heb: 'ירדן' },
    { value: 110, label: 'Kazakhstan', heb: 'קזחסטן' },
    { value: 111, label: 'Kenya', heb: 'קניה' },
    { value: 112, label: 'Kiribati', heb: 'קיריבאטי' },
    {
      value: 160,
      label: "Korea, Democratic People's Republic of",
      heb: 'קוריאה הצפונית'
    },
    { value: 201, label: 'Korea, Republic of', heb: 'קוריאה הדרומית' },
    { value: 113, label: 'Kuwait', heb: 'כווית' },
    { value: 254, label: 'Kurdistan', heb: 'כורדיסטאן' },
    { value: 114, label: 'Kyrgyzstan', heb: "קירג'יסטן" },
    {
      value: 115,
      label: "Lao People's Democratic Republic, laos",
      heb: 'לאוס'
    },
    { value: 116, label: 'Latvia', heb: 'לטביה' },
    { value: 117, label: 'Lebanon', heb: 'לבנון' },
    { value: 118, label: 'Lesotho', heb: 'לסוטו' },
    { value: 119, label: 'Liberia', heb: 'ליבריה' },
    { value: 121, label: 'Libyan Arab Jamahiriya', heb: 'לוב' },
    { value: 120, label: 'Liechtenstein', heb: 'ליכטנשטיין' },
    { value: 122, label: 'Lithuania', heb: 'ליטא' },
    { value: 125, label: 'Luxembourg', heb: 'לוקסמבורג' },
    { value: 123, label: 'Macao', heb: 'מקאו' },
    { value: 126, label: 'Madagascar', heb: 'מדגסקר' },
    { value: 127, label: 'Malawi', heb: 'מלאווי' },
    { value: 128, label: 'Malaysia', heb: 'מלזיה' },
    { value: 129, label: 'Maldives', heb: 'איי המלדיביים' },
    { value: 130, label: 'Mali', heb: 'מאלי' },
    { value: 132, label: 'Malta', heb: 'מלטה' },
    { value: 131, label: 'Marshall Islands', heb: 'איי מרשל' },
    { value: 135, label: 'Martinique', heb: 'מרטיניק' },
    { value: 134, label: 'Mauritania', heb: 'מאוריטניה' },
    { value: 133, label: 'Mauritius', heb: 'מאוריציוס' },
    { value: 136, label: 'Mayotte', heb: 'מאיוט' },
    { value: 138, label: 'Mexico', heb: 'מכסיקו' },
    { value: 137, label: 'Micronesia, Federated States of', heb: 'מיקרונזיה' },
    { value: 139, label: 'Moldova, Republic of', heb: 'מולדובה' },
    { value: 140, label: 'Monaco', heb: 'מונקו' },
    { value: 142, label: 'Mongolia', heb: 'מונגוליה' },
    { value: 141, label: 'Montenegro', heb: 'מונטנגרו' },
    { value: 143, label: 'Montserrat', heb: 'מונסראט' },
    { value: 145, label: 'Morocco', heb: 'מרוקו' },
    { value: 144, label: 'Mozambique', heb: 'מוזמביק' },
    { value: 149, label: 'Myanmar', heb: 'מיאנמר (בורמה)' },
    { value: 146, label: 'Namibia', heb: 'נמיביה' },
    { value: 147, label: 'Nauru', heb: 'נאורו' },
    { value: 150, label: 'Nepal', heb: 'נפאל' },
    { value: 152, label: 'Netherlands', heb: 'הולנד' },
    { value: 148, label: 'Netherlands Antilles', heb: 'האנטילים ההולנדיים' },
    { value: 151, label: 'New Caledonia', heb: 'קלדוניה החדשה' },
    { value: 153, label: 'New Zealand', heb: 'ניו זינלנד' },
    { value: 155, label: 'Nicaragua', heb: 'ניקרגואה' },
    { value: 154, label: 'Niger', heb: "ניז'ר" },
    { value: 156, label: 'Nigeria', heb: 'ניגריה' },
    { value: 157, label: 'Niue', heb: 'ניואה' },
    { value: 158, label: 'Norfolk Island', heb: 'האי נורפולק' },
    { value: 124, label: 'North Macedonia', heb: 'מקדוניה (FYROM)' },
    {
      value: 161,
      label: 'Northern Mariana Islands',
      heb: 'איי מריאנה הצפוניים'
    },
    { value: 162, label: 'Norway', heb: 'נורווגיה' },
    { value: 164, label: 'Oman', heb: 'עומאן' },
    { value: 163, label: 'Pakistan', heb: 'פקיסטאן' },
    { value: 165, label: 'Palau', heb: 'פלאו' },
    { value: 166, label: 'Panama', heb: 'פנמה' },
    { value: 168, label: 'Papua New Guinea', heb: 'פפואה ניו גינאה' },
    { value: 169, label: 'Paraguay', heb: 'פרגוואי' },
    { value: 170, label: 'Peru', heb: 'פרו' },
    { value: 171, label: 'Philippines', heb: 'פיליפינים' },
    { value: 172, label: 'Pitcairn', heb: 'איי פיטקיירן' },
    { value: 174, label: 'Poland', heb: 'פולין' },
    { value: 173, label: 'Portugal', heb: 'פורטוגל' },
    { value: 175, label: 'Puerto Rico', heb: 'פורטו ריקו' },
    { value: 176, label: 'Qatar', heb: 'קטאר' },
    { value: 177, label: 'Reunion', heb: 'ראוניון' },
    { value: 178, label: 'Romania', heb: 'רומניה' },
    { value: 179, label: 'Russian Federation', heb: 'רוסיה' },
    { value: 180, label: 'Rwanda', heb: 'רוואנדה' },
    { value: 255, label: 'Saint Barthélemyn', heb: 'סן ברתלמי' },
    { value: 181, label: 'Saint Helenan', heb: 'סנט הלנה' },
    { value: 182, label: 'Saint Kitts and Nevis', heb: 'סנט קיטס ונוויס' },
    { value: 183, label: 'Saint Lucia', heb: 'סנט לוסיה' },
    { value: 256, label: 'Saint Martin (French part)', heb: 'סן מרטן' },
    { value: 184, label: 'Saint Pierre and Miquelon', heb: 'סנט פייר ומיקלון' },
    {
      value: 185,
      label: 'Saint Vincent and The Grenadines',
      heb: 'סנט וינסנט והגרנדינים'
    },
    { value: 186, label: 'Samoa', heb: 'סמואה' },
    { value: 187, label: 'San Marino', heb: 'סן מרינו' },
    { value: 259, label: 'tibet', heb: 'טיבט', ar: 'التبت' },
    { value: 188, label: 'Sao Tome and Principe', heb: 'סאו טומה ופרינסיפה' },
    { value: 189, label: 'Saudi Arabia', heb: 'ערב הסעודית' },
    { value: 191, label: 'Senegal', heb: 'סנגל' },
    { value: 192, label: 'Serbia', heb: 'סרביה' },
    { value: 194, label: 'Seychelles', heb: 'סיישל' },
    { value: 193, label: 'Sierra Leone', heb: 'סיירה לאון' },
    { value: 195, label: 'Singapore', heb: 'סינגפור ' },
    { value: 257, label: 'Sint Maarten (Dutch part)', heb: 'סנט מארטן' },
    { value: 196, label: 'Slovakia', heb: 'סלובקיה' },
    { value: 199, label: 'Slovenia', heb: 'סלובניה' },
    { value: 198, label: 'Solomon Islands', heb: 'איי שלמה' },
    { value: 211, label: 'Somalia', heb: 'סומליה' },
    { value: 197, label: 'South Africa', heb: 'דרום אפריקה' },
    {
      value: 200,
      label: 'South Georgia and The South Sandwich Islands',
      heb: "איי ג'ורג'יה הדרומית ואיי סנדוויץ' הדרומיים"
    },
    { value: 202, label: 'South Sudan', heb: 'דרום סודן' },
    { value: 203, label: 'Spain', heb: 'ספרד' },
    { value: 204, label: 'Sri Lanka', heb: 'סרי לנקה' },
    { value: 205, label: 'Sudan', heb: 'סודן' },
    { value: 206, label: 'Suriname', heb: 'סורינאם' },
    { value: 209, label: 'Svalbard and Jan Mayen', heb: 'סבאלברד ויאן מאיין' },
    { value: 208, label: 'Sweden', heb: 'שוודיה' },
    { value: 210, label: 'Switzerland', heb: 'שוויץ' },
    { value: 212, label: 'Syrian Arab Republic', heb: 'סוריה' },
    { value: 258, label: 'Taiwan', heb: 'טייוואן' },
    { value: 213, label: 'Tajikistan', heb: "טג'יקיסטן" },
    { value: 215, label: 'Tanzania, United Republic of', heb: 'טנזניה' },
    { value: 214, label: 'Thailand', heb: 'תאילנד' },
    { value: 60, label: 'Timor-leste', heb: 'מזרח טימור' },
    { value: 218, label: 'Togo', heb: 'טוגו' },
    { value: 217, label: 'Tokelau', heb: 'טוקלאו' },
    { value: 219, label: 'Tonga', heb: 'טונגה' },
    { value: 220, label: 'Trinidad and Tobago', heb: 'טרינידד וטובגו' },
    { value: 221, label: 'Tunisia', heb: 'תוניסיה' },
    { value: 224, label: 'Turkey', heb: 'טורקיה' },
    { value: 222, label: 'Turkmenistan', heb: 'טורקמניסטן' },
    { value: 223, label: 'Turks and Caicos Islands', heb: 'איי טורקס וקאיקוס' },
    { value: 225, label: 'Tuvalu', heb: 'טובאלו' },
    { value: 226, label: 'Uganda', heb: 'אוגנדה' },
    { value: 227, label: 'Ukraine', heb: 'אוקראינה' },
    {
      value: 228,
      label: 'United Arab Emirates',
      heb: 'איחוד האמירויות הערביות'
    },
    { value: 229, label: 'United Kingdom', heb: 'אנגליה' },
    {
      value: 233,
      label: 'United States Minor Outlying Islands',
      heb: 'האיים המרוחקים הקטנים של ארה״ב'
    },
    { value: 231, label: 'Uruguay', heb: 'אורוגוואי' },
    { value: 232, label: 'Uzbekistan', heb: 'אוזבקיסטן' },
    { value: 234, label: 'Vanuatu', heb: 'ונואטו' },
    { value: 235, label: 'Venezuela', heb: 'ונצואלה' },
    { value: 236, label: 'Viet Nam', heb: 'ויטנאם' },
    {
      value: 237,
      label: 'Virgin Islands, British',
      heb: 'איי הבתולה הבריטיים'
    },
    {
      value: 239,
      label: 'Virgin Islands, U.S.',
      heb: 'איי הבתולה של ארצות הברית'
    },
    { value: 240, label: 'Wallis and Futuna', heb: 'ואליס ופוטונה' },
    { value: 241, label: 'Western Sahara', heb: 'סהרה המערבית' },
    { value: 242, label: 'Yemen', heb: 'תימן' },
    { value: 244, label: 'Zambia', heb: 'זמביה' },
    { value: 243, label: 'Zimbabwe', heb: 'זימבבואה' }
  ];

  let nameuse = $state(false);
  // placeholder removed, used inline
  let erorim = $state({
    st: false,
    msg: '',
    msg2: '',
    msg1: 'baruch@1lev1.com'
  });
  let selected = $state([]);
  let already = $state(false);
  let erorims = $state(false);
  let agreeToBasicTerms = $state(false);

  // Form state variables
  let formName = $state('');
  let formEmail = $state('');
  let formErrors = $state({ name: '', email: '', agreement: '' });
  let g = $state(false);
  let { idx = 1 } = $props();
  import Close from '$lib/celim/close.svelte';
  import { animateScroll } from 'svelte-scrollto-element';
  import Text1lev1 from '$lib/celim/ui/text1lev1.svelte';
  import { sendError } from '$lib/func/send/senError.svelte';
  let meData = [];

  // Manual validation function
  function validate() {
    let valid = true;
    formErrors = { name: '', email: '', agreement: '' };

    if (!formName) {
      formErrors.name = $t('home.amana.errors.nameRequired');
      valid = false;
    }

    if (!formEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(formEmail)) {
      formErrors.email = $t('home.amana.errors.emailInvalid');
      valid = false;
    }

    if (selected.length < 1) {
      erorims = true;
      valid = false;
    } else {
      erorims = false;
    }

    if (!agreeToBasicTerms && !agreedToFullAgreement) {
      formErrors.agreement = $t('home.amana.errors.agreementRequired');
      valid = false;
    }

    return valid;
  }

  // Function to navigate to agreement site
  function goToAgreementSite() {
    if (formName) sessionStorage.setItem('pendingName', formName);
    if (formEmail) sessionStorage.setItem('pendingEmail', formEmail);
    if (selected.length > 0)
      sessionStorage.setItem('pendingLocation', JSON.stringify(selected));

    const returnUrl = encodeURIComponent(
      window.location.origin + '/hascama?agreed=true'
    );

    let agreementUrl = `https://agreement.1lev1.com?return=${returnUrl}&lang=${$locale}`;
    if (formName) agreementUrl += `&name=${encodeURIComponent(formName)}`;
    if (formEmail) agreementUrl += `&email=${encodeURIComponent(formEmail)}`;
    if (selected.length > 0)
      agreementUrl += `&location=${encodeURIComponent(JSON.stringify(selected))}`;

    window.location.href = agreementUrl;
  }

  // Form submit handler
  async function handleSubmit() {
    track('tryToSign', {}, { flags: ['tryToSign'] });
    nameuse = false;

    if (!validate()) {
      setTimeout(() => {
        animateScroll.scrollToTop();
      }, 0);
      return;
    }

    const jjj = formName;
    if (fpp.includes(jjj)) {
      nameuse = true;
      animateScroll.scrollToTop();
      return;
    }

    g = true;
    erorim.st = false;
    const mail = formEmail.toLowerCase().trim();

    try {
      const response = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
      mutation CreateChezin($name: String!, $email: String!, $countries: [ID]!, $publishedAt: DateTime) {
        createChezin(data: { name: $name, email: $email, countries: $countries,publishedAt: $publishedAt }) {
          data { 
            id 
            attributes {
              name
              publishedAt
              email
            }
          }
        }
      }
    `,
          variables: {
            name: formName,
            email: mail,
            countries: find_contry_id(selected),
            publishedAt: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      g = false;
      already = true;
      document.cookie =
        `email=${mail}; expires=` + new Date(2027, 0, 1).toUTCString();
      document.cookie =
        `un=${formName}; expires=` + new Date(2027, 0, 1).toUTCString();
      document.cookie =
        `country=${find_contry_id(selected)}; expires=` +
        new Date(2027, 0, 1).toUTCString();
      userName.set(formName);
      liUN.set(formName);
      email.set(mail);
      contriesi.set(find_contry_id(selected));
      regHelper.set(1);
      meData = result.data.createChezin;
      fpval.set(meData.data.id);
      if (agreeToBasicTerms && !agreedToFullAgreement) {
        show.set(5);
      }
      let linko = `ref=true&id=${$fpval}&con=${find_contry_id(selected)}&un=${$liUN}&em=${$email}`;
      linkos.set(linko);
    } catch (error) {
      g = false;
      erorim.st = true;
      if (!error.response) {
        erorim.msg = $t('home.amana.errors.serverSleep');
        sendError(JSON.stringify(error) ?? null, '/amana.svelte', fetch);
      } else {
        erorim.msg = ` ${error.response.data.message}  ${error.response.data.statusCode} :טעות`;
        sendError(erorim.msg, '/amana.svelte', fetch);
      }
    }
  }

  let trans = $state(false);
  function tran() {
    trans = !trans;
  }

  let isOpen = $state(false);
  let isMazeOpen = $state(false);
  let a = $state(0);

  function sell() {
    isOpen = true;
    a = 0;
  }
  function info() {
    isMazeOpen = true;
  }
  function tr() {
    isOpen = true;
    a = 4;
  }
  const closer = () => {
    isOpen = false;
    isMazeOpen = false;
    a = 0;
  };
  function done() {
    a = 1;
  }
  function erore() {
    a = 3;
  }
  function erorer() {
    a = 5;
  }

  function change(la) {
    if (la == 'en') {
      lang.set('en');
      locale.set('en');
      langUs.set('en');
      doesLang.set(true);
      document.cookie =
        `lang=en; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (la == 'ar') {
      lang.set('ar');
      locale.set('ar');
      langUs.set('ar');
      doesLang.set(true);
      document.cookie =
        `lang=ar; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (la == 'he') {
      lang.set('he');
      locale.set('he');
      langUs.set('he');
      doesLang.set(true);
      document.cookie =
        `lang=he; expires=` + new Date(2027, 0, 1).toUTCString();
    }
  }

  $effect(() => {
    if (formErrors.name || formErrors.email) {
      setTimeout(() => {
        animateScroll.scrollToTop();
      }, 0);
    }
  });

  // Restore form data when returning from agreement site
  onMount(() => {
    if (agreedToFullAgreement) {
      const savedName = sessionStorage.getItem('pendingName');
      const savedEmail = sessionStorage.getItem('pendingEmail');
      const savedLocation = sessionStorage.getItem('pendingLocation');

      if (savedName) formName = savedName;
      if (savedEmail) formEmail = savedEmail;
      if (savedLocation) selected = JSON.parse(savedLocation);

      sessionStorage.removeItem('pendingName');
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('pendingLocation');
    }
  });
</script>

<Head {title} {description} {image} {url} />

{#if isOpen || isMazeOpen}
  <div
    class="premium-modal-overlay"
    onclick={closer}
    onkeydown={(e) => e.key === 'Escape' && closer()}
    role="button"
    tabindex="-1"
    aria-label="סגור מודל"
    transition:fade={{ duration: 300 }}
  >
    <div
      class="premium-modal-card"
      class:maze-wide={isMazeOpen}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="presentation"
      transition:fly={{ y: 50, duration: 600, opacity: 0 }}
    >
      <button class="premium-close-btn" onclick={closer} aria-label="סגור">
        <Close />
      </button>

      <div class="premium-modal-content" dir={$locale === 'en' ? 'ltr' : 'rtl'}>
        {#if isMazeOpen}
          <div class="maze-scroll-area">
            <Maze />
          </div>
        {:else if a == 0}
          <Tikun onDone={done} onErore={erore} />
        {:else if a == 4}
          <TRan onDone={done} onErore={erorer} />
        {:else if a == 1}
          <div class="status-view success">
            <div class="status-icon">✨</div>
            <h3>{$t('home.amana.status.successTitle')}</h3>
            <p>{$t('home.amana.status.successMessage')}</p>
            <button class="action-btn-p" onclick={closer}
              >{$t('home.amana.common.close')}</button
            >
          </div>
        {:else if a == 2}
          <div class="status-view loading">
            <RingLoader size="100" color="#ff00ae" unit="px" duration="2s" />
            <h3>{$t('home.amana.status.loading')}</h3>
          </div>
        {:else if a == 3 || a == 5}
          <div class="status-view error">
            <div class="status-icon">❌</div>
            <h3>{$t('home.amana.status.errorTitle')}</h3>
            <p>{$t('home.amana.status.errorMessage')}</p>
            <button
              class="action-btn-p retry"
              onclick={() => (a = a == 3 ? 0 : 4)}
            >
              {$t('home.amana.common.tryAgain')}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Main Container -->
<div class="page-container" dir={$locale === 'en' ? 'ltr' : 'rtl'}>
  <!-- Background Elements -->
  <div class="bg-gradient"></div>
  <div class="bg-orbs">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>

  <!-- Top Navigation -->
  <div class="top-nav">
    <a href="/login" class="login-link">
      <img
        src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
        alt="התחברות"
        class="login-icon"
      />
      <span>{$t('home.amana.nav.login')}</span>
    </a>

    <div class="menu-buttons">
      {#if trans === false}
        <button onclick={tran} class="menu-btn icon-btn">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
            alt="תרגום"
          />
        </button>
      {:else}
        <button onclick={tran} class="menu-btn">✕</button>
        {#if $locale !== 'en'}
          <button onclick={() => change('en')} class="menu-btn">English</button>
        {/if}
        {#if $locale !== 'ar'}
          <button onclick={() => change('ar')} class="menu-btn">العربية</button>
        {/if}
        {#if $locale !== 'he'}
          <button onclick={() => change('he')} class="menu-btn">עברית</button>
        {/if}
        <a href="/about" class="menu-btn">{$t('home.nav.about')}</a>
        <button onclick={info} class="menu-btn"
          >{$t('home.amana.nav.explanation')}</button
        >
        <button onclick={() => goto('/he')} class="menu-btn"
          ><Text1lev1 /></button
        >
        <button onclick={sell} class="menu-btn"
          >{$t('home.amana.nav.changeRequest')}</button
        >
        <button onclick={tr} class="menu-btn"
          >{$t('home.amana.nav.translation')}</button
        >
        <a href="/love" class="menu-btn">{$t('home.nav.agreementMap')}</a>
      {/if}
    </div>

    <button onclick={() => info()} class="help-btn">?</button>
  </div>

  <!-- Main Content -->
  <div class="content-wrapper">
    {#if already == false}
      <div class="glass-card" in:fly={{ y: 50, duration: 800, delay: 200 }}>
        <!-- Header -->
        <div class="card-header">
          <div class="logo-heart">💗</div>
          <div class="logo-section">
            <h1 class="title">{$t('home.amana.headerTitle')}</h1>
          </div>
          <p class="subtitle">{$t('home.amana.headerSubtitle')}</p>
        </div>

        <!-- Agreement Badge (if came from agreement site) -->
        {#if agreedToFullAgreement}
          <div class="agreement-badge" in:fade={{ duration: 500 }}>
            <div class="badge-icon">✓</div>
            <span>{$t('home.amana.agreedFull')}</span>
          </div>
        {/if}

        <!-- Form -->
        <form class="registration-form" onsubmit={handleSubmit}>
          <!-- Name Field -->
          <div class="form-group">
            <label for="name" class="form-label">
              <span class="label-icon">👤</span>
              {$t('home.amana.form.nameLabel')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              class="form-input"
              placeholder={$t('home.amana.form.namePlaceholder')}
              bind:value={formName}
              class:error={formErrors.name || nameuse}
            />
            {#if formErrors.name}
              <span class="error-msg">{formErrors.name}</span>
            {/if}
            {#if nameuse}
              <span class="error-msg">{$t('home.amana.errors.nameTaken')}</span>
            {/if}
          </div>

          <!-- Location Field -->
          <div class="form-group">
            <label for="location" class="form-label">
              <span class="label-icon">🌍</span>
              {$t('home.amana.form.locationLabel')}
            </label>
            <div class="multiselect-wrapper">
              <MultiSelect
                bind:selected
                outerDivClass="custom-multiselect-outer"
                inputClass="custom-multiselect-input"
                liSelectedClass="custom-multiselect-selected"
                --sms-options-bg={'rgba(153, 100, 136, 1)'}
                placeholder={$t('home.amana.form.locationPlaceholder')}
                options={country.map((c) =>
                  $locale === 'he' ? c.heb : c.label
                )}
              />
            </div>
            {#if erorims}
              <span class="error-msg"
                >{$t('home.amana.errors.locationRequired')}</span
              >
            {/if}
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label for="email" class="form-label">
              <span class="label-icon">✉️</span>
              {$t('home.amana.form.emailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              class="form-input"
              placeholder="example@mail.com"
              bind:value={formEmail}
              class:error={formErrors.email}
            />
            {#if formErrors.email}
              <span class="error-msg">{formErrors.email}</span>
            {/if}
          </div>

          <!-- Agreement Section -->
          <div class="agreement-section">
            <h3 class="agreement-title">{$t('home.amana.agreement.title')}</h3>

            <!-- Full Agreement Button -->
            <button
              type="button"
              onclick={goToAgreementSite}
              class="agreement-btn-full"
            >
              <span class="btn-icon">✨</span>
              <span class="text-2xl"
                >{$t('home.amana.agreement.fullButton')}</span
              >
              <span class="btn-icon">✨</span>
            </button>
            <p class="agreement-note">{$t('home.amana.agreement.note')}</p>

            <!-- Divider -->
            <div class="divider">
              <span>{$t('home.amana.common.or')}</span>
            </div>

            <!-- Basic Agreement -->
            <div class="basic-agreement">
              <p class="agreement-text">
                {@html $t('home.amana.agreement.basicText1', {
                  name: formName || '___'
                })}
                <br />
                {@html $t('home.amana.agreement.basicText2', {
                  name: formName || '___'
                })}
              </p>

              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={agreeToBasicTerms}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text"
                  >{$t('home.amana.agreement.checkboxLabel')}</span
                >
              </label>

              {#if formErrors.agreement}
                <span class="error-msg">{formErrors.agreement}</span>
              {/if}
            </div>

            <!-- Info Box -->
            <div class="info-box">
              <div class="info-icon">💡</div>
              <div class="info-text">
                <strong>{$t('home.amana.agreement.infoTitle')}</strong>
                <ul>
                  <li>
                    {@html $t('home.amana.agreement.basicInfo')}
                  </li>
                  <li>
                    <a
                      href="https://agreement.1lev1.com"
                      onclick={(e) => {
                        e.preventDefault();
                        goToAgreementSite();
                      }}>{@html $t('home.amana.agreement.fullAgreementLink')}</a
                    >{$t('home.amana.agreement.fullAgreementDesc')}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          {#if g == false}
            <button type="submit" class="submit-btn">
              <span class="submit-text">{$t('home.amana.form.submit')}</span>
              <span class="submit-arrow">{$locale === 'en' ? '→' : '←'}</span>
            </button>
          {:else}
            <div class="loading-container">
              <RingLoader size="60" color="#ff00ae" unit="px" duration="1.5s"
              ></RingLoader>
              <p>{$t('home.amana.common.justAMoment')}</p>
            </div>
          {/if}

          <!-- Error Message -->
          {#if erorim.st}
            <div class="error-box">
              <p>{erorim.msg}</p>
              <p class="error-contact">
                {$t('home.amana.errors.contactSupport')}
                {erorim.msg1}
              </p>
            </div>
          {/if}
        </form>
      </div>
    {/if}
  </div>

  <!-- Globe Background (Optional) -->
  <div class="globe-wrapper">
    <Canvas>
      <Scene onClick={() => {}} onSubmit={handleSubmit} />
    </Canvas>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap');

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Rubik', sans-serif;
    overflow-x: hidden;
  }

  /* Page Container */
  .page-container {
    min-height: 100vh;
    position: relative;
    overflow: auto;
  }

  /* Background */
  .bg-gradient {
    position: fixed;
    inset: 0;
    background: linear-gradient(
      135deg,
      #1a0a2e 0%,
      #2d1522 25%,
      #3d2630 50%,
      #2d1522 75%,
      #1a0a2e 100%
    );
    z-index: 0;
  }

  .bg-orbs {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .bg-orbs::before,
  .bg-orbs::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background: #ffd700;
    border-radius: 50%;
    box-shadow:
      100px 200px 0 #ffd700,
      200px 300px 0 #ff00ae,
      300px 100px 0 #ffd700,
      400px 250px 0 #ff00ae,
      500px 150px 0 #ffd700,
      150px 400px 0 #ffd700,
      250px 450px 0 #ff00ae,
      350px 350px 0 #ffd700,
      450px 400px 0 #ff00ae,
      550px 250px 0 #ffd700;
    animation: twinkle 3s ease-in-out infinite;
  }

  .bg-orbs::after {
    animation-delay: 1.5s;
    box-shadow:
      120px 180px 0 #ffd700,
      220px 320px 0 #ff00ae,
      320px 120px 0 #ffd700,
      420px 270px 0 #ff00ae,
      520px 170px 0 #ffd700,
      170px 420px 0 #ffd700,
      270px 470px 0 #ff00ae,
      370px 370px 0 #ffd700,
      470px 420px 0 #ff00ae,
      570px 270px 0 #ffd700;
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.5);
    }
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;
  }

  .orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #ff00ae, transparent);
    top: -250px;
    right: -250px;
    animation-delay: 0s;
    filter: blur(80px) brightness(1.2);
  }

  .orb-2 {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, #ffb800, transparent);
    bottom: -200px;
    left: -200px;
    animation-delay: 7s;
    filter: blur(80px) brightness(1.3);
    animation:
      float 20s ease-in-out infinite,
      shimmer 3s ease-in-out infinite;
  }

  .orb-3 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, #ff00ae, transparent);
    top: 40%;
    left: 50%;
    animation-delay: 14s;
    filter: blur(80px);
  }

  @keyframes float {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.1);
    }
    66% {
      transform: translate(-30px, 30px) scale(0.9);
    }
  }

  @keyframes shimmer {
    0%,
    100% {
      opacity: 0.3;
      filter: blur(80px) brightness(1.3);
    }
    50% {
      opacity: 0.4;
      filter: blur(70px) brightness(1.5);
    }
  }

  /* Premium Custom Modal */
  .premium-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 5, 20, 0.85);
    backdrop-filter: blur(15px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    cursor: default;
  }

  .premium-modal-card {
    width: 100%;
    max-width: 600px;
    background: rgba(26, 10, 46, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 30px;
    box-shadow:
      0 30px 60px -12px rgba(0, 0, 0, 0.6),
      0 0 50px rgba(255, 0, 174, 0.1);
    position: relative;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: premiumGlow 6s ease-in-out infinite;
  }

  .premium-modal-card.maze-wide {
    max-width: 950px;
  }

  @keyframes premiumGlow {
    0%,
    100% {
      box-shadow:
        0 30px 60px -12px rgba(0, 0, 0, 0.6),
        0 0 50px rgba(255, 0, 174, 0.1);
    }
    50% {
      box-shadow:
        0 30px 60px -12px rgba(0, 0, 0, 0.6),
        0 0 70px rgba(255, 184, 0, 0.15);
    }
  }

  .premium-close-btn {
    position: absolute;
    top: 1.25rem;
    left: 1.25rem;
    z-index: 100;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: #ffd700;
    cursor: pointer;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    backdrop-filter: blur(5px);
  }

  .premium-close-btn:hover {
    background: #ff00ae;
    color: white;
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 0 15px rgba(255, 0, 174, 0.5);
  }

  .premium-modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 2.5rem;
    scrollbar-width: thin;
    scrollbar-color: #ff00ae transparent;
  }

  .premium-modal-content::-webkit-scrollbar {
    width: 6px;
  }

  .premium-modal-content::-webkit-scrollbar-thumb {
    background: #ff00ae;
    border-radius: 10px;
  }

  /* Status Views */
  .status-view {
    text-align: center;
    padding: 2rem 1rem;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .status-icon {
    font-size: 5rem;
    line-height: 1;
  }

  .success .status-icon {
    animation: successBounce 1.5s ease infinite;
  }

  @keyframes successBounce {
    0%,
    100% {
      transform: scale(1) translateY(0);
    }
    50% {
      transform: scale(1.1) translateY(-10px);
    }
  }

  .status-view h3 {
    font-size: 1.8rem;
    margin: 0;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .status-view p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    margin: 0;
  }

  .action-btn-p {
    padding: 1rem 2.5rem;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    border: none;
    border-radius: 15px;
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Rubik', sans-serif;
  }

  .action-btn-p:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(255, 0, 174, 0.4);
  }

  .retry {
    background: linear-gradient(135deg, #ff4444, #ff00ae);
  }

  .maze-scroll-area {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 640px) {
    .premium-modal-card {
      border-radius: 20px;
    }
    .premium-modal-content {
      padding: 1.5rem;
    }
    .status-view h3 {
      font-size: 1.4rem;
    }
  }

  /* Top Navigation */
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    background: linear-gradient(
      180deg,
      rgba(26, 10, 46, 0.8) 0%,
      transparent 100%
    );
    backdrop-filter: blur(10px);
  }

  .login-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
  }

  .login-link:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .login-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .menu-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .menu-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-family: 'Rubik', sans-serif;
  }

  .menu-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .icon-btn {
    padding: 0.5rem;
    width: 40px;
    height: 40px;
  }

  .icon-btn img {
    width: 100%;
    height: 100%;
  }

  .help-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    border: none;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow:
      0 4px 15px rgba(255, 0, 174, 0.3),
      0 0 20px rgba(255, 184, 0, 0.2);
  }

  .help-btn:hover {
    transform: scale(1.1);
    box-shadow:
      0 6px 20px rgba(255, 0, 174, 0.5),
      0 0 30px rgba(255, 184, 0, 0.3);
  }

  /* Content Wrapper */
  .content-wrapper {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    padding-top: 6rem;
  }

  /* Glass Card */
  .glass-card {
    width: 100%;
    max-width: 600px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: 3rem;
    animation: cardGlow 4s ease-in-out infinite;
  }

  @keyframes cardGlow {
    0%,
    100% {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 40px rgba(255, 0, 174, 0.15),
        0 0 60px rgba(255, 184, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    50% {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 60px rgba(255, 0, 174, 0.25),
        0 0 80px rgba(255, 184, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
  }

  /* Card Header */
  .card-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .logo-heart {
    font-size: 3rem;
    animation: heartbeat 2s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%,
    100% {
      transform: scale(1);
    }
    10%,
    30% {
      transform: scale(1.1);
    }
    20%,
    40% {
      transform: scale(1);
    }
  }

  .title {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ff00ae, #ffb800, #ffd700, #ff00ae);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    animation: gradientShift 4s ease infinite;
  }

  @keyframes gradientShift {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    margin: 0.5rem 0 0 0;
  }

  /* Agreement Badge */
  .agreement-badge {
    background: linear-gradient(
      135deg,
      rgba(0, 200, 0, 0.2),
      rgba(0, 255, 100, 0.2)
    );
    border: 1px solid rgba(0, 255, 100, 0.3);
    border-radius: 15px;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: badgePulse 2s ease-in-out infinite;
  }

  @keyframes badgePulse {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(0, 255, 100, 0.2);
    }
    50% {
      box-shadow: 0 0 30px rgba(0, 255, 100, 0.4);
    }
  }

  .badge-icon {
    width: 30px;
    height: 30px;
    background: rgba(0, 255, 100, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00ff64;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .agreement-badge span {
    color: #00ff64;
    font-weight: 600;
  }

  /* Form */
  .registration-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .label-icon {
    font-size: 1.2rem;
  }

  .form-input {
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    color: white;
    font-size: 1rem;
    font-family: 'Rubik', sans-serif;
    transition: all 0.3s ease;
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .form-input:focus {
    outline: none;
    border-color: #ff00ae;
    background: rgba(255, 255, 255, 0.08);
    box-shadow:
      0 0 20px rgba(255, 0, 174, 0.3),
      0 0 30px rgba(255, 184, 0, 0.2);
  }

  .form-input.error {
    border-color: #ff4444;
  }

  /* MultiSelect Custom Styling */
  .multiselect-wrapper {
    position: relative;
  }

  :global(.custom-multiselect-outer) {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 2px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 15px !important;
    color: white !important;
  }

  :global(.custom-multiselect-input) {
    background: transparent !important;
    color: rgba(255, 255, 255, 0.4) !important;
    font-family: 'Rubik', sans-serif !important;
  }

  :global(.custom-multiselect-selected) {
    background: rgba(255, 0, 174, 0.3) !important;
    border-radius: 8px !important;
  }

  /* Agreement Section */
  .agreement-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2rem;
    margin-top: 1rem;
  }

  .agreement-title {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .agreement-btn-full {
    width: 100%;
    padding: 1.5rem;
    background: linear-gradient(135deg, #ff00ae 0%, #ffb800 50%, #ffd700 100%);
    background-size: 200% 200%;
    border: none;
    border-radius: 15px;
    color: white;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    box-shadow:
      0 8px 25px rgba(255, 0, 174, 0.3),
      0 0 40px rgba(255, 184, 0, 0.2);
    font-family: 'Rubik', sans-serif;
    animation: buttonShimmer 3s ease-in-out infinite;
    position: relative;
    overflow: hidden;
  }

  .agreement-btn-full::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transform: rotate(45deg);
    animation: sparkle 3s ease-in-out infinite;
  }

  @keyframes buttonShimmer {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes sparkle {
    0% {
      left: -50%;
    }
    100% {
      left: 150%;
    }
  }

  .agreement-btn-full:hover {
    transform: translateY(-3px);
    box-shadow:
      0 12px 35px rgba(255, 0, 174, 0.5),
      0 0 60px rgba(255, 184, 0, 0.4);
  }

  .agreement-btn-full:active {
    transform: translateY(-1px);
  }

  .agreement-note {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.2rem;
    margin: 0.8rem 0 0 0;
  }

  /* Divider */
  .divider {
    position: relative;
    text-align: center;
    margin: 2rem 0;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
  }

  .divider span {
    position: relative;
    background: rgba(45, 27, 71, 0.9);
    padding: 0 1rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }

  /* Basic Agreement */
  .basic-agreement {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .agreement-text {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.8;
    font-size: 1rem;
    margin: 0;
    text-align: right;
  }

  .agreement-text :global(strong) {
    color: #ffb800;
    font-weight: 700;
    text-shadow: 0 0 10px rgba(255, 184, 0, 0.3);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .checkbox-label:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .checkbox-input {
    display: none;
  }

  .checkbox-custom {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    position: relative;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .checkbox-input:checked + .checkbox-custom {
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    border-color: #ff00ae;
    box-shadow:
      0 0 15px rgba(255, 0, 174, 0.3),
      0 0 20px rgba(255, 184, 0, 0.2);
  }

  .checkbox-input:checked + .checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 16px;
  }

  .checkbox-text {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  /* Info Box */
  .info-box {
    background: rgba(0, 168, 255, 0.1);
    border: 1px solid rgba(0, 168, 255, 0.3);
    border-radius: 12px;
    padding: 1.2rem;
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .info-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .info-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .info-text strong {
    color: white;
    display: block;
    margin-bottom: 0.5rem;
  }

  .info-text ul {
    margin: 0.5rem 0 0 0;
    padding-right: 1.2rem;
    list-style-type: disc;
  }

  .info-text li {
    margin: 0.3rem 0;
  }

  /* Submit Button */
  .submit-btn {
    width: 100%;
    padding: 1.2rem;
    background: linear-gradient(135deg, #ff00ae, #ffb800);
    background-size: 200% 200%;
    border: none;
    border-radius: 15px;
    color: white;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    box-shadow:
      0 8px 25px rgba(255, 0, 174, 0.3),
      0 0 30px rgba(255, 184, 0, 0.2);
    margin-top: 1.5rem;
    font-family: 'Rubik', sans-serif;
    animation: buttonShimmer 3s ease-in-out infinite;
  }

  .submit-btn:hover {
    transform: translateY(-3px);
    box-shadow:
      0 12px 35px rgba(255, 0, 174, 0.5),
      0 0 50px rgba(255, 184, 0, 0.3);
  }

  .submit-btn:active {
    transform: translateY(-1px);
  }

  .submit-arrow {
    transition: transform 0.3s ease;
  }

  .submit-btn:hover .submit-arrow {
    transform: translateX(-5px);
  }

  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }

  .loading-container p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
  }

  /* Error Messages */
  .error-msg {
    color: #ff4444;
    font-size: 0.9rem;
    margin-top: 0.3rem;
  }

  .error-box {
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    color: #ff6b6b;
    text-align: center;
  }

  .error-contact {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: rgba(255, 107, 107, 0.8);
  }

  /* Globe Wrapper */
  .globe-wrapper {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 150vw;
    height: 50vw;

    opacity: 0.15;
    pointer-events: none;
    z-index: 5;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .glass-card {
      padding: 2rem 1.5rem;
      margin: 1rem;
    }

    .title {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .logo-heart {
      font-size: 2.5rem;
    }

    .menu-buttons {
      gap: 0.3rem;
    }

    .menu-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .agreement-section {
      padding: 1.5rem;
    }

    .content-wrapper {
      padding: 1rem;
      padding-top: 5rem;
    }

    .globe-wrapper {
      width: 150vw;
      height: 150vw;
    }
  }

  @media (max-width: 480px) {
    .top-nav {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .glass-card {
      padding: 1.5rem 1rem;
    }

    .title {
      font-size: 1.6rem;
    }

    .agreement-btn-full {
      font-size: 1rem;
      padding: 1.2rem;
    }

    .submit-btn {
      font-size: 1rem;
    }
  }
</style>
