<script>
  import { run } from 'svelte/legacy';

      import { liUN } from '$lib/stores/liUN.js';
      import { Canvas } from '@threlte/core'
  import Scene from './globu.svelte'
      import {  doesLang, langUs } from '$lib/stores/lang.js'
  import { goto } from '$app/navigation';
  import Maze from './maze.svelte'
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { email } from '../registration/email.js';
        import { contriesi } from '../registration/contries.js';
    import {fpval} from '../registration/fpval.js';
    import { regHelper } from '../../stores/regHelper.js';
    import * as yup from "yup";
        import axios from 'axios';
          import { RingLoader
} from 'svelte-loading-spinners';
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
      import Tikun from './tikunolam.svelte';
            import TRan from './translatehe.svelte';
  import { onMount } from 'svelte'
  import { linkos } from '$lib/stores/linkos.js';
	import { useProgress } from '@threlte/extras'
	const { progress } = useProgress()
  import { Head } from 'svead'
  import { track } from '@vercel/analytics';
 

  let title = ' 1💗1 | הסכמה עולמית על חירות'
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`
  let description ="הסכמה העולמית על חירות היא חלק מרכזי ב- 1💗1. על ידי הסכמה להצהרה זו, ניתן להירשם לפלטפורמה השיתופית 1💗1 ומשתתפים ביצירת עולם יותר בטוח. על ידי ההתחייבות ההדדית לאי-אלימות, לפתרון סכסוכים בהסכמה ולכבוד הדדי, אנו ניצור עולם בו כוח ואלימות מפסיקים להיות צורות של תקשורת אנושית. הצטרפו אלינו לקידום שלום, הסכמות וחופש. ביחד, אנחנו יכולים ליצור עולם שבו הטוב הבסיסי מנצח ובו חילוקי דעות נפתרים בהסכמה משותפת."
  let url = "https://1lev1.com/hascama"
  run(() => {
    userName.set($form.name)
  });
  run(() => {
    email.set($form.email)
  });

// onMount(async () => {
//
//
//
//      var chatbox = document.getElementById('fb-customer-chat');
//      chatbox.setAttribute("page_id", "684861488632219");
//      chatbox.setAttribute("attribution", "biz_inbox");
//
//      window.fbAsyncInit = function() {
//        FB.init({
//          xfbml            : true,
//          version          : 'v12.0'
//        });
//      };
//
//      (function(d, s, id) {
//        var js, fjs = d.getElementsByTagName(s)[0];
//        if (d.getElementById(id)) return;
//        js = d.createElement(s); js.id = id;
//        js.src = 'https://connect.facebook.net/he_IL/sdk/xfbml.customerchat.js';
//        fjs.parentNode.insertBefore(js, fjs);
//      }(document, 'script', 'facebook-jssdk'));
// })
  let fpp = [];
  let fppp = [];
  const baseUrl = import.meta.env.VITE_URL

    let error1 = null;
    onMount(async () => {
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json',
      };

        try {
            const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
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
              `})
            }).then(checkStatus)
          .then(parseJSON);
            fppp = res.data.chezins
            fpp = fppp.data.map(c => c.attributes.name)
        } catch (e) {
            error1 = e
        }

    });

let g = $state(false);

function find_contry_id(contry_name_arr){
     var  arr = [];
      for (let j = 0; j< contry_name_arr.length; j++ ){
      for (let i = 0; i< country.length; i++){
        if(country[i].heb === contry_name_arr[j]){
          arr.push(country[i].value)  ;
        }
      }
      }
      return arr;
     };

    const country =  [
                    { value: 104 , label: 'Israel', heb: 'ישראל'},
                    { value: 167 , label: 'Palestine jehuda & sumeria', heb: 'הרשות הפלסטינית יו"ש'},
                    { value: 246 , label: 'Palestine gaza strip', heb: 'רצועת עזה'},
                    { value: 230 , label: 'United States', heb: 'ארצות הברית של אמריקה'},
                    { value: 245, label: 'Åland Islands', heb: 'אולנד' },
                    { value: 11, label: 'Afghanistan'  ,heb: 'אפגניסטן' },
                    { value: 1, label: 'Albania' ,heb: 'אלבניה' },
                    { value: 13, label: 'Algeria' ,heb: 'אלג\'יריה' },
                    { value: 2, label: 'American Samoa' ,heb: 'סמואה האמריקנית'},
                    { value: 7, label: 'Andorra' ,heb: 'אנדורה'},
                    { value: 3, label: 'Angola' ,heb: 'אנגולה'},
                    { value: 4, label: 'Anguilla' ,heb: 'אנגווילה'},
                    { value: 5, label: 'Antarctica' ,heb: 'אנטרטיקה'},
                    { value: 6, label: 'Antigua and Barbuda', heb: 'אנטיגואה וברבודה'},
                    { value: 8, label: 'Argentina', heb: 'ארגנטינה'},
                    { value: 14, label: 'Armenia', heb: 'ארמניה'},
                    { value: 9, label: 'Aruba', heb: 'ארובה'},
                    { value: 10, label: 'Australia', heb: 'אוסטרליה'},
                    { value: 12, label: 'Austria', heb: 'אוסטריה'},
                    { value: 15, label: 'Azerbaijan' , heb: 'אזרבייג\'ן'},
                    { value: 16, label: 'Bahamas' , heb: 'איי בהאמה'},
                    { value: 17, label: 'Bahrain' , heb: 'בחריין'},
                    { value: 18, label: 'Bangladesh', heb: 'בנגלדש'},
                    { value: 19, label: 'Barbados', heb: 'ברבדוס'},
                    { value: 20, label: 'Belarus', heb: 'בלרוס'},
                    { value: 21, label: 'Belgium', heb: 'בלגיה'},
                    { value: 22, label: 'Belize', heb: 'בליז'},
                    { value: 26, label: 'Benin', heb: 'בנין'},
                    { value: 24, label: 'Bermuda', heb: 'ברמודה'},
                    { value: 27, label: 'Bhutan', heb: 'בהוטאן'},
                    { value: 23, label: 'Bolivia', heb: 'בוליביה'},
                    { value: 247, label: 'Bonaire, Sint Eustatius and Saba', heb: 'האיים הקריביים ההולנדיים'},
                    { value: 25, label: 'Bosnia and Herzegovina', heb: 'בוסניה והרצגובינה'},
                    { value: 28, label: 'Botswana', heb: 'בוטסואנה'},
                    { value: 29, label: 'Bouvet Island', heb: 'בובה'},
                    { value: 30, label: 'Brazil', heb: 'ברזיל'},
                    { value: 31, label: 'British Indian Ocean Territory', heb: 'הטריטוריה הבריטית באוקיינוס ההודי'},
                    { value: 32, label: 'Brunei Darussalam', heb: 'ברוניי דארוסלאם'},
                    { value: 34, label: 'Bulgaria', heb: 'בולגריה'},
                    { value: 33, label: 'Burkina Faso',  heb: 'בורקינה פאסו'},
                    { value: 36, label: 'Burundi',  heb: 'בורונדי'},
                    { value: 35, label: 'Cambodia',  heb: 'קמבודיה'},
                    { value: 37, label: 'Cameroon',  heb: 'קמרון'},
                    { value: 39, label: 'Canada',  heb: 'קנדה'},
                    { value: 38, label: 'Cape Verde',  heb: 'כף ורדה'},
                    { value: 40, label: 'Cayman Islands', heb: 'איי קיימן'},
                    { value: 41, label: 'Central African Republic', heb: ' הרפובליקה המרכז אפריקאית '},
                    { value: 42, label: 'Chad', heb: 'צ\'אד'},
                    { value: 43, label: 'Chile', heb: 'צ\'ילה'},
                    { value: 44, label: 'China', heb: 'סין'},
                    { value: 45, label: 'Christmas Island', heb: 'איי חג המולד'},
                    { value: 49, label: 'Cocos (Keeling) Islands', heb: 'איי קוקוס'},
                    { value: 47, label: 'Colombia', heb: 'קולומביה'},
                    { value: 48, label: 'Comoros', heb: 'איי קומורו'},
                    { value: 46, label: 'Congo', heb: 'קונגו'},
                    { value: 216, label: 'Congo, The Democratic Republic of The', heb: 'הרפובליקה העממית של קונגו'},
                    { value: 50, label: 'Cook Islands', heb: 'איי קוק'},
                    { value: 51, label: 'Costa Rica', heb: 'קוסטה ריקה'},
                    { value: 248, label: 'Cote D\'ivoire', heb: 'חוף השנהב'},
                    { value: 52, label: 'Croatia', heb: 'קרואטיה'},
                    { value: 53, label: 'Cuba', heb: 'קובה'},
                    { value: 249, label: 'Curaçao', heb: 'קוראסאו'},
                    { value: 54, label: 'Cyprus', heb: 'קפריסין'},
                    { value: 57, label: 'Czech Republic', heb: 'צ\'כיה'},
                    { value: 55, label: 'Denmark', heb: 'דנמרק'},
                    { value: 58, label: 'Djibouti', heb: 'ג\'יבוטי'},
                    { value: 56, label: 'Dominica', heb: 'דומיניקה'},
                    { value: 59, label: 'Dominican Republic', heb: 'הרפובליקה הדומיניקנית'},
                    { value: 61, label: 'Ecuador', heb: 'אקוודור'},
                    { value: 62, label: 'Egypt', heb: 'מצריים'},
                    { value: 63, label: 'El Salvador', heb: 'אל סלבדור'},
                    { value: 66, label: 'Equatorial Guinea', heb: 'גינאה המשוונית'},
                    { value: 65, label: 'Eritrea', heb: 'אריתראה'},
                    { value: 69, label: 'Estonia', heb: 'אסטוניה'},
                    { value: 250, label: 'Eswatini', heb: 'אסוואטיני'},
                    { value: 70, label: 'Ethiopia', heb: 'אתיופיה'},
                    { value: 67, label: 'Falkland Islands (Malvinas)', heb: 'איי מאלבינס (איי פוקלנד)'},
                    { value: 68, label: 'Faroe Islands', heb: 'איי פארו'},
                    { value: 71, label: 'Fiji', heb: 'פיג\'י'},
                    { value: 72, label: 'Finland', heb: 'פינלנד'},
                    { value: 73, label: 'France', heb: 'צרפת'},
                    { value: 74, label: 'French Guiana', heb: 'גויאנה הצרפתית'},
                    { value: 75, label: 'French Polynesia', heb: 'פולינזיה הצרפתית'},
                    { value: 78, label: 'French Southern Territories', heb: 'הארצות הדרומיות והאנטרקטיות של צרפת'},
                    { value: 79, label: 'Gabon', heb: 'גאבון'},
                    { value: 76, label: 'Gambia', heb: 'גמביה'},
                    { value: 77 , label: 'Georgia', heb: 'גאורגיה'},
                    { value: 80 , label: 'Germany', heb: 'גרמניה'},
                    { value: 81 , label: 'Ghana', heb: 'גאנה'},
                    { value: 82 , label: 'Gibraltar', heb: 'גיברלטר'},
                    { value: 84 , label: 'Greece', heb: 'יוון'},
                    { value: 83 , label: 'Greenland', heb: 'גרינלנד'},
                    { value: 85 , label: 'Grenada', heb: 'גרנדה'},
                    { value: 86 , label: 'Guadeloupe', heb: 'גוואדלופ'},
                    { value: 87 , label: 'Guam', heb: 'גואם'},
                    { value: 88 , label: 'Guatemala', heb: 'גואטמלה'},
                    { value: 251 , label: 'Guernsey', heb: 'גרנזי'},
                    { value: 90 , label: 'Guinea', heb: 'גינאה'},
                    { value: 89 , label: 'Guinea-bissau', heb: 'גינאה-ביסאו'},
                    { value: 91 , label: 'Guyana', heb: 'גויאנה'},
                    { value: 92 , label: 'Haiti', heb: 'האיטי'},
                    { value: 93 , label: 'Heard Island and Mcdonald Islands', heb: 'האי הרד ואיי מקדונלד'},
                    { value: 94 , label: 'Holy See (Vatican City State)', heb: 'וותיקן'},
                    { value: 98 , label: 'Honduras', heb: 'הונדורס'},
                    { value: 96 , label: 'Hong Kong', heb: 'הונג קונג'},
                    { value: 95 , label: 'Hungary', heb: 'הונגריה'},
                    { value: 97 , label: 'Iceland', heb: 'איסלנד'},
                    { value: 99 , label: 'India', heb: 'הודו'},
                    { value: 100 , label: 'Indonesia', heb: 'אינדונזיה'},
                    { value: 101 , label: 'Iran, Islamic Republic of', heb: 'איראן'},
                    { value: 102 , label: 'Iraq', heb: 'עירק'},
                    { value: 103 , label: 'Ireland', heb: 'אירלנד'},
                    { value: 252 , label: 'Isle of Man', heb: 'האי מאן'},
                    { value: 105 , label: 'Italy', heb: 'איטליה'},
                    { value: 107 , label: 'Jamaica', heb: 'ג\'מייקה'},
                    { value: 109 , label: 'Japan', heb: 'יפן'},
                    { value: 253 , label: 'Jersey', heb: 'ג\'רזי'},
                    { value: 108 , label: 'Jordan', heb: 'ירדן'},
                    { value: 110 , label: 'Kazakhstan', heb: 'קזחסטן'},
                    { value: 111 , label: 'Kenya', heb: 'קניה'},
                    { value: 112 , label: 'Kiribati', heb: 'קיריבאטי'},
                    { value: 160 , label: 'Korea, Democratic People\'s Republic of', heb: 'קוריאה הצפונית'},
                    { value: 201 , label: 'Korea, Republic of', heb: 'קוריאה הדרומית'},
                    { value: 113 , label: 'Kuwait', heb: 'כווית'},
                    { value: 254 , label: 'Kurdistan', heb: 'כורדיסטאן'},
                    { value: 114 , label: 'Kyrgyzstan', heb: 'קירג\'יסטן'},
                    { value: 115 , label: 'Lao People\'s Democratic Republic, laos', heb: 'לאוס'},
                    { value: 116 , label: 'Latvia', heb: 'לטביה'},
                    { value: 117 , label: 'Lebanon', heb: 'לבנון'},
                    { value: 118 , label: 'Lesotho', heb: 'לסוטו'},
                    { value: 119 , label: 'Liberia', heb: 'ליבריה'},
                    { value: 121 , label: 'Libyan Arab Jamahiriya', heb: 'לוב'},
                    { value: 120 , label: 'Liechtenstein', heb: 'ליכטנשטיין'},
                    { value: 122 , label: 'Lithuania', heb: 'ליטא'},
                    { value: 125 , label: 'Luxembourg', heb: 'לוקסמבורג'},
                    { value: 123 , label: 'Macao', heb: 'מקאו'},
                    { value: 126 , label: 'Madagascar', heb: 'מדגסקר'},
                    { value: 127 , label: 'Malawi', heb: 'מלאווי'},
                    { value: 128 , label: 'Malaysia', heb: 'מלזיה'},
                    { value: 129 , label: 'Maldives', heb: 'איי המלדיביים'},
                    { value: 130 , label: 'Mali', heb: 'מאלי'},
                    { value: 132 , label: 'Malta', heb: 'מלטה'},
                    { value: 131 , label: 'Marshall Islands', heb: 'איי מרשל'},
                    { value: 135 , label: 'Martinique', heb: 'מרטיניק'},
                    { value: 134 , label: 'Mauritania', heb: 'מאוריטניה'},
                    { value: 133 , label: 'Mauritius', heb: 'מאוריציוס'},
                    { value: 136 , label: 'Mayotte', heb: 'מאיוט'},
                    { value: 138 , label: 'Mexico', heb: 'מכסיקו'},
                    { value: 137 , label: 'Micronesia, Federated States of', heb: 'מיקרונזיה'},
                    { value: 139 , label: 'Moldova, Republic of', heb: 'מולדובה'},
                    { value: 140 , label: 'Monaco', heb: 'מונקו'},
                    { value: 142 , label: 'Mongolia', heb: 'מונגוליה'},
                    { value: 141 , label: 'Montenegro', heb: 'מונטנגרו'},
                    { value: 143 , label: 'Montserrat', heb: 'מונסראט'},
                    { value: 145 , label: 'Morocco', heb: 'מרוקו'},
                    { value: 144 , label: 'Mozambique', heb: 'מוזמביק'},
                    { value: 149 , label: 'Myanmar', heb: 'מיאנמר (בורמה)'},
                    { value: 146 , label: 'Namibia', heb: 'נמיביה'},
                    { value: 147 , label: 'Nauru', heb: 'נאורו'},
                    { value: 150 , label: 'Nepal', heb: 'נפאל'},
                    { value: 152 , label: 'Netherlands', heb: 'הולנד'},
                    { value: 148 , label: 'Netherlands Antilles', heb: 'האנטילים ההולנדיים'},
                    { value: 151 , label: 'New Caledonia', heb: 'קלדוניה החדשה'},
                    { value: 153 , label: 'New Zealand', heb: 'ניו זינלנד'},
                    { value: 155 , label: 'Nicaragua', heb: 'ניקרגואה'},
                    { value: 154 , label: 'Niger', heb: 'ניז\'ר'},
                    { value: 156 , label: 'Nigeria', heb: 'ניגריה'},
                    { value: 157 , label: 'Niue', heb: 'ניואה'},
                    { value: 158 , label: 'Norfolk Island', heb: 'האי נורפולק'},
                    { value: 124 , label: 'North Macedonia', heb: 'מקדוניה (FYROM)'},
                    { value: 161 , label: 'Northern Mariana Islands', heb: 'איי מריאנה הצפוניים'},
                    { value: 162 , label: 'Norway', heb: 'נורווגיה'},
                    { value: 164 , label: 'Oman', heb: 'עומאן'},
                    { value: 163 , label: 'Pakistan', heb: 'פקיסטאן'},
                    { value: 165 , label: 'Palau', heb: 'פלאו'},
                    { value: 166 , label: 'Panama', heb: 'פנמה'},
                    { value: 168 , label: 'Papua New Guinea', heb: 'פפואה ניו גינאה'},
                    { value: 169 , label: 'Paraguay', heb: 'פרגוואי'},
                    { value: 170 , label: 'Peru', heb: 'פרו'},
                    { value: 171 , label: 'Philippines', heb: 'פיליפינים'},
                    { value: 172 , label: 'Pitcairn', heb: 'איי פיטקיירן'},
                    { value: 174 , label: 'Poland', heb: 'פולין'},
                    { value: 173 , label: 'Portugal', heb: 'פורטוגל'},
                    { value: 175 , label: 'Puerto Rico', heb: 'פורטו ריקו'},
                    { value: 176 , label: 'Qatar', heb: 'קטאר'},
                    { value: 177 , label: 'Reunion', heb: 'ראוניון'},
                    { value: 178 , label: 'Romania', heb: 'רומניה'},
                    { value: 179 , label: 'Russian Federation', heb: 'רוסיה'},
                    { value: 180 , label: 'Rwanda', heb: 'רוואנדה'},
                    { value: 255 , label: 'Saint Barthélemyn', heb: 'סן ברתלמי'},
                    { value: 181 , label: 'Saint Helenan', heb: 'סנט הלנה'},
                    { value: 182 , label: 'Saint Kitts and Nevis', heb: 'סנט קיטס ונוויס'},
                    { value: 183 , label: 'Saint Lucia', heb: 'סנט לוסיה'},
                    { value: 256 , label: 'Saint Martin (French part)', heb: 'סן מרטן'},
                    { value: 184 , label: 'Saint Pierre and Miquelon', heb: 'סנט פייר ומיקלון'},
                    { value: 185 , label: 'Saint Vincent and The Grenadines', heb: 'סנט וינסנט והגרנדינים'},
                    { value: 186 , label: 'Samoa', heb: 'סמואה'},
                    { value: 187 , label: 'San Marino', heb: 'סן מרינו'},
                    { value: 259, label: "tibet", heb: "טיבט", ar: "التبت"},
                    { value: 188 , label: 'Sao Tome and Principe', heb: 'סאו טומה ופרינסיפה'},
                    { value: 189 , label: 'Saudi Arabia', heb: 'ערב הסעודית'},
                    { value: 191 , label: 'Senegal', heb: 'סנגל'},
                    { value: 192 , label: 'Serbia', heb: 'סרביה'},
                    { value: 194 , label: 'Seychelles', heb: 'סיישל'},
                    { value: 193 , label: 'Sierra Leone', heb: 'סיירה לאון'},
                    { value: 195 , label: 'Singapore', heb: 'סינגפור '},
                    { value: 257 , label: 'Sint Maarten (Dutch part)', heb: 'סנט מארטן'},
                    { value: 196 , label: 'Slovakia', heb: 'סלובקיה'},
                    { value: 199 , label: 'Slovenia', heb: 'סלובניה'},
                    { value: 198 , label: 'Solomon Islands', heb: 'איי שלמה'},
                    { value: 211 , label: 'Somalia', heb: 'סומליה'},
                    { value: 197 , label: 'South Africa', heb: 'דרום אפריקה'},
                    { value: 200 , label: 'South Georgia and The South Sandwich Islands', heb: 'איי ג\'ורג\'יה הדרומית ואיי סנדוויץ\' הדרומיים'},
                    { value: 202 , label: 'South Sudan', heb: 'דרום סודן'},
                    { value: 203 , label: 'Spain', heb: 'ספרד'},
                    { value: 204 , label: 'Sri Lanka', heb: 'סרי לנקה'},
                    { value: 205 , label: 'Sudan', heb: 'סודן'},
                    { value: 206 , label: 'Suriname', heb: 'סורינאם'},
                    { value: 209 , label: 'Svalbard and Jan Mayen', heb: 'סבאלברד ויאן מאיין'},
                    { value: 207 , label: 'Swaziland', heb: 'אסוואטיני'},
                    { value: 208 , label: 'Sweden', heb: 'שוודיה'},
                    { value: 210 , label: 'Switzerland', heb: 'שוויץ'},
                    { value: 212 , label: 'Syrian Arab Republic', heb: 'סוריה'},
                    { value: 258 , label: 'Taiwan', heb: 'טייוואן'},
                    { value: 213 , label: 'Tajikistan', heb: 'טג\'יקיסטן'},
                    { value: 215 , label: 'Tanzania, United Republic of', heb: 'טנזניה'},
                    { value: 214 , label: 'Thailand', heb: 'תאילנד'},
                    { value: 60 , label: 'Timor-leste', heb: 'מזרח טימור'},
                    { value: 218 , label: 'Togo', heb: 'טוגו'},
                    { value: 217 , label: 'Tokelau', heb: 'טוקלאו'},
                    { value: 219 , label: 'Tonga', heb: 'טונגה'},
                    { value: 220 , label: 'Trinidad and Tobago', heb: 'טרינידד וטובגו'},
                    { value: 221 , label: 'Tunisia', heb: 'תוניסיה'},
                    { value: 224 , label: 'Turkey', heb: 'טורקיה'},
                    { value: 222 , label: 'Turkmenistan', heb: 'טורקמניסטן'},
                    { value: 223 , label: 'Turks and Caicos Islands', heb: 'איי טורקס וקאיקוס'},
                    { value: 225 , label: 'Tuvalu', heb: 'טובאלו'},
                    { value: 226 , label: 'Uganda', heb: 'אוגנדה'},
                    { value: 227 , label: 'Ukraine', heb: 'אוקראינה'},
                    { value: 228 , label: 'United Arab Emirates', heb: 'איחוד האמירויות הערביות'},
                    { value: 229 , label: 'United Kingdom', heb: 'אנגליה'},
                    { value: 233 , label: 'United States Minor Outlying Islands', heb: 'האיים המרוחקים הקטנים של ארה״ב'},
                    { value: 231 , label: 'Uruguay', heb: 'אורוגוואי'},
                    { value: 232 , label: 'Uzbekistan', heb: 'אוזבקיסטן'},
                    { value: 234 , label: 'Vanuatu', heb: 'ונואטו'},
                    { value: 235 , label: 'Venezuela', heb: 'ונצואלה'},
                    { value: 236 , label: 'Viet Nam', heb: 'ויטנאם'},
                    { value: 237 , label: 'Virgin Islands, British', heb: 'איי הבתולה הבריטיים'},
                    { value: 239 , label: 'Virgin Islands, U.S.', heb: 'איי הבתולה של ארצות הברית'},
                    { value: 240 , label: 'Wallis and Futuna', heb: 'ואליס ופוטונה'},
                    { value: 241 , label: 'Western Sahara', heb: 'סהרה המערבית'},
                    { value: 242 , label: 'Yemen', heb: 'תימן'},
                    { value: 244 , label: 'Zambia', heb: 'זמביה'},
                    { value: 243 , label: 'Zimbabwe', heb: 'זימבבואה'}
                  ];
    const name = `countries`;
        let lang ="he";
let nameuse = $state(false);
    const placeholdr = {he: "", ar: "", en: ""};
    const pl = `${placeholdr}.${lang}`;
    const placeholder =`המקום שלי`;
    const required = true;
    let erorim = $state({st: false, msg: "", msg2: "אם הבעיה נמשכת ניתן לפנות ל", msg1: "baruch@1lev1.com"  })
    let selected = $state([]);
       let already = $state(false);
       let erorims = $state(false);
   let datar;
   let data;
    import { createForm } from "svelte-forms-lib";
  import Close from '$lib/celim/close.svelte';
  import { scrollToTop } from 'svelte-scrollto-element';
  import Text1lev1 from '$lib/celim/ui/text1lev1.svelte';
  import { sendError } from '$lib/func/send/senError.svelte';
  /**
   * @typedef {Object} Props
   * @property {number} [idx]
   */

  /** @type {Props} */
  let { idx = 1 } = $props();
    let meData =[]
const { form, errors, stepState, handleChange, handleSubmit } = createForm({
          initialValues: {
            name: "",
            email: "",
            countries: selected
          },
      validationSchema: yup.object().shape({
        name: yup.string().required(),
        email: yup
          .string()
          .email()
          .required()
      }),
onSubmit: values => {
  track('tryToSign', {}, { flags: ['tryToSign'] });
  nameuse = false;
  const jjj = $form.name
if (fpp.includes(jjj)){
  console.log("sssss")
  nameuse = true;
    scrollToTop()
} else {
 if (selected.length < 1) {
 console.log("uuuu")
  erorims = true
  scrollToTop()
 } else {
   console.log("kkkk")

  g = true;
 erorims = false
 const mail = $form.email.toLowerCase().trim()
  axios
  .post(baseUrl+'/api/chezins', {
      "data": {
     name: $form.name,
        email: mail,
        countries: find_contry_id(selected)
              }
            },
  {
  headers: {
        'Content-Type': 'application/json',
            }})
  .then(response => {
    g = false;
   already = true;
   document.cookie = `email=${mail}; expires=` + new Date(2026, 0, 1).toUTCString();
   document.cookie = `un=${encodeURIComponent($form.name)}; expires=` + new Date(2026, 0, 1).toUTCString();
   userName.set($form.name);
           liUN.set($form.name);
            email.set(mail);
            contriesi.set(find_contry_id(selected))
            regHelper.set(1);
                    meData = response.data;
                fpval.set(meData.data.id)
            datar = data;
            let linko = `ref=true&id=${$fpval}&con=${find_contry_id(selected)}&un=${$liUN}&em=${$email}`
      console.log(`https://www.1lev1.com?${encodeURIComponent(linko)}`)
      linkos.set(linko)           //id con un em ref
              })
  .catch(error => {
    g = false;
    erorim.st = true
    if (error.response === undefined){
        erorim.msg = "השרת נרדם 😴, הערנו אותו, אנו מנסים שוב";
      // handleSubmit();
      sendError(JSON.stringify(error) ?? null,"/amana.svelte 467", fetch)
    } else {
        erorim.msg =  ` ${error.response.data.message}  ${error.response.data.statusCode} :טעות לעולם חוזרת, הנה הפרטים היבשים `
        sendError(erorim.msg ,"/amana.svelte 470", fetch)
      }
          });

          }}
        }
        });
let dow = $state();
/*function show (){
  const amana = document.getElementById("amana-show")
  const lines = document.getElementById("lines")

}*/
let trans = $state(false);
function tran (){
trans = !trans;
}
function scrollTo() {
		dow.scrollIntoView({ behavior: 'smooth' });
	}

 let isOpen = $state(false);
let a = $state(0), h = $state()

function sell(){
isOpen = true;
a = 0;
}
function info(){
isOpen = true;
a = 6;
}
function tr(){
isOpen = true;
a = 4;
}
const closer = () => {
    isOpen = false;
  a = 0;
};
function done(){
  a = 1;
}

function erore(){
  a = 3;
}

function erorer(){
  a = 5;
}
function change(la){
  if (la == "en"){
    doesLang.set(true)
    langUs.set("en")
    goto("/convention")
  }else if(la == "ar"){
        doesLang.set(true)
    langUs.set("ar")
    goto("aitifaqia")
  }
}
let w = $state(0);
  
let wid = $state(0);
  
run(() => {
    if($errors.name || $errors.email) {scrollToTop()}
  });
</script>
<Head {title} {description} {image} {url} />

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content" aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}><Close/></button>
          {#if a == 0}
 <Tikun  on:done={done} on:erore={erore}/>

                    {:else if a == 4}
 <TRan on:done={done} on:erore={erorer}/>

                    {:else if a == 1}
          <div class="sp bg-gold">
            <h3 class="text-barbi"> נשלח בהצלחה, תודה רבה לך נעמוד בקשר</h3>
          </div>
                    {:else if a == 2}

          <div class="flex text-center items-center justify-center bg-gold">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div>
         {:else if a == 3}
         <h1> אירעה שגיאה</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" onclick={()=> a = 0}>לנסות שוב</button>
          {:else if a == 5}
         <h1> אירעה שגיאה</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" onclick={()=> a = 4}>לנסות שוב</button>
         {:else if a == 6}
         <Maze/>
         {/if}
  </DialogContent>
  </div>
</DialogOverlay>


         <!-- Messenger פלאגין של צ'אט Code
    <div id="fb-root"></div>


    <div id="fb-customer-chat" class="fb-customerchat">
    </div>
     position: absolute;
   top: -36px;
        right: -36px;
         height: 130px;
        width: 130px;
<div style=" position: absolute; top: 1%; left: 87%; color: aqua;" > <button on:click={()=> regHelper.set(1) }>טסט</button> </div>
     -->
     <button style="position: absolute; color: var(--gold); font-weight:bold; height:20px width:20px; z-index:500;" onclick={()=>info()} class="ww" >?</button>
     <div bind:clientWidth={wid} class="all">
       <a   data-sveltekit-prefetch href="/login" ><img title="התחברות ל-1💗1" style="opacity:1; z-index:17;" class=" right overlay  rounded-full p-2 translate-x-11 -translate-y-11 hover:translate-x-9 hover:-translate-y-9 hover:scale-150 " alt="התחברות ל-1💗1" src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"/></a>
          <div  style="position:absolute ; left: 1%; top: 1%; display: flex; flex-direction: column ; z-index: 699;">
              {#if trans === false}
          <button onclick={tran}><img class="shadow-xl	rounded" alt="translat-icon-by-barbi" src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"></button>
          {:else}
          <button onclick={tran} class=" text-barbi hover:text-gold p-0.5 "
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
            <button onclick={() =>change("en")} title="change language to English" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 ">English</button>
          <button onclick={() =>change("ar")} class="text-barbi border-2 border-gold text-bold hover:text-lturk text-center bg-lturk hover:bg-barbi px-1 py-0.5 " >العربية</button>
                  <a class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " title=" 1💗1 אודות "   data-sveltekit-prefetch href="/about" > אודות</a>
                  <button onclick={info} title="הסבר ומידע" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " >הסבר ומידע</button>
                  <button onclick={()=>goto('/he')} title="1💗1" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " ><Text1lev1/></button>                 
                  <button onclick={sell} title="בקשת שינוי" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " >בקשת שינוי לטקסט</button>
                  <button onclick={tr} title="תרגום לשפות נוספות" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " >תרגום לשפות נוספות</button>
                  <a class="text-barbi border-2 border-gold text-bold hover:text-lturk text-center bg-lturk hover:bg-barbi px-1 py-0.5 "  data-sveltekit-prefetch href="/love">מפת ההסכמה</a>
          {/if}
          </div>
      <div class="mobile">


<section class="container" dir="rtl" id="lines">

<div class="flexi">
  <h3
       class="amanat"
       style="font-weight: 900; white-space: nowrap; font-family: StamSefarad, serif; font-size: 1.2em; line-height: normal;"
       dir="rtl">
    שמי:
      </h3>
  <input
          id="name"
          name="name"
          placeholder="השם שלי"
          required
                onblur={handleChange}
          onchange={handleChange}
          bind:value={$form.name}
        />
     {#if $errors.name}
      <small style="color: red;">יש למלא שם</small>
    {/if}
    {#if nameuse}
      <small style="color: red;">השם שנבחר כבר תפוס</small>
    {/if}
</div>
<div class="flexi1" style="white-space:nowrap;">
  <div>
  <h3   class="amanat " id="m"
 style="font-weight: 900; font-family: StamSefarad, serif; font-size: 1em;" dir="rtl">מ: </h3>
 </div>
 <div>
     <MultiSelect
      bind:selected

      {placeholder}
      options={country.map(c => c.heb)}
       />
       </div>
   {#if erorims == true}
      <small style="color: red;">יש לבחור לפחות מקום 1</small>
    {/if}
   </div>
<div class="flexi2">
  <h3 class="amanat"
 style=" font-weight: 900;   white-space: nowrap; font-family: 'StamSefarad', serif; font-size: 1.2em; line-height:normal;"
 dir="rtl">דואר L.</h3>
  <input

    placeholder="המייל שלי"
    id="email"
    name="email"
    required
          onblur={handleChange}
    onchange={handleChange}
    bind:value={$form.email}
    />
 {#if $errors.email}
      <small style="color: red;">{$errors.email}</small>
    {/if}
</div>
    </section>
    <div class="onlym"> <button alt="click-to-scroll-down" class="ca3-scroll-down-link ca3-scroll-down-arrow" data-ca3_iconfont="ETmodules" onclick={scrollTo}  data-ca3_icon=""></button></div>
    </div>
    <div class="aab" bind:this={dow}>
<div dir="rtl" class="amana" id="amana-show">
  <div class="card  bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]">
  <div class="card-overlay "></div>
  <div class="card-inner d overflow-y-auto ">
     <h1 dir="rtl" style="color:#cc0066; text-shadow: 1px 1px black ; ">
     הצהרת העצמאות של
        <span style=" text-shadow: 1px 1px var(--mturk); font-family: 'Gan';">{$form.name ? $form.name : "__"}</span>
        :
    </h1>
          <span style="font-family:David;" class="text-bold text-transparent bg-clip-text  bg-[linear-gradient(to_bottom_right,theme(colors.gra),theme(colors.grc),theme(colors.gre),theme(colors.grc),theme(colors.gra))]">
              <span  style="font-family:StamSefarad,David;">
                אני <span style="color:black; font-family:StamSefarad;   text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span>  לא רוצה לפגוע באף אדם ולעולם לא אפגע באף אדם.<!--חיובי-->
                   <br>
           כי לדעתי אין שום סמכות, ערך, מטרה, אמונה, ממון או אינטרס אשר יוכל להצדיק פגיעה באדם, אלימות וכפיה בכוח.
              <br>
              <div class="text-center justify-center flex items-center text-bold text-transparent bg-clip-text bg-[linear-gradient(to_bottom_right,theme(colors.gra),theme(colors.grc),theme(colors.gre),theme(colors.grc),theme(colors.gra))]" style="flex-wrap: wrap; font-family:StamSefarad,David;">
              אני <span style="color:black; font-family:StamSefarad;  text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span> תמיד אצור, אתנהל ואפתור חילוקי דעות ב<span role="contentinfo" class="hover:text-barbi" onkeypress={()=>info()} onclick={()=>info()}>"רקמות"</span> המתנהלות באתר 		<div dir="ltr" style="text-shadow:none;" class=" font-bold  mx-2 mt-2 text-transparent 
              bg-clip-text bg-[length:auto_200%] animate-gradienty 
              bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] 
              flex-wrap flex flex-row">
              <div class="flip">
                <h1  class="font-bold  text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty 
                bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] " 
          >1</h1></div>
          <div><h1  class="font-bold text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty 
              bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] "
          >💗</h1>
          </div><div>
                <h1  class="font-bold  text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty 
                bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))] " 
          >1</h1></div></div> רק בהסכמה הדדית.
              </div>
             <!----
   אני <span style="color:black; font-family:StamSefarad;  text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span> אתן את אמוני בטוב הבסיסי שבאדם, ולכך מקווה ומצפה שכאשר כל האנושות כולה תסכים אלימות, קרבות וכפיה בכוח יפסיקו להיות צורה של תקשורת אנושית.
              <br> -->
              כאשר כל אוכלוסיית  <span style="color: black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join( " וכל אוכלוסיית " )}`  : "__"}</span>  תסכים ותחיה לפי אמנה זו אני <span style="color:black; font-family:StamSefarad;  text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span> אוותר עם כל השאר על כלי הנשק שלי ועל השוטרים החמושים שמדינת <span style="color:black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join(" ומדינת ")}` : "__"}</span>  {selected.length > 1 ? "ממנות" : "ממנה" } בשמי ונחיה בחופשיות ובהסכמה הדדית. 
              <br>
               כאשר כל האנושות תסכים ותחיה לפי אמנה זו אני <span style="color:black;font-family:StamSefarad;   text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span> אוותר על כלי הנשק של צבא <span style="color: black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join(" ושל צבא ") }`+ "." : "__."}</span> כאשר בו זמנית יוותרו כל צבאות העולם על נשקם ונהפוך לאנושות מפורזת וחופשית
            </span>
          </span>
    </div>
    </div>
</div>


<form onsubmit={handleSubmit}>

<div class="flexid" bind:clientWidth={w} bind:clientHeight={h}>
   {#if already == false}
{#if g == false}
{#if $progress < 1}

    <button
    class="button hover:scale-150 "
    title="לחצת ויצאת לחופשי"
     onsubmit={handleSubmit}
      type="submit"
      >
    </button>
    {/if}
    <div class="cor">
      <Canvas size={{width:w, height:h}}>
        <Scene on:click={()=> console.log("hhuibi")} on:submit="{handleSubmit}"/>
      </Canvas>
    </div>
       {:else if g == true}
          <div class="sp text-center">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="140" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> {/if}
      {#if erorim.st == true}

      <small  style="color:red; text-align: center;">{erorim.msg} <br/><span dir="rtl"> {erorim.msg2} - {erorim.msg1}</span> </small>
      {/if}

  {/if}
  </div>
  </form>

</div> </div>
  <style>
      .card {
  --bg: #e8e8e8;
  --contrast: #e2e0e0;
  --grey: #93a1a1;
  position: relative;
  padding: 9px;
  background-color: var(--bg);
  border-radius: 35px;
  box-shadow: rgba(50, 50, 93, 0) 0px 50px 100px -20px, rgba(0, 0, 0, 0) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
}

.card-overlay {
  position: absolute;
  inset: 0;
    border-radius: 35px;

  pointer-events: none;
  background: repeating-conic-gradient(var(--bg) 0.0000001%, var(--grey) 0.000104%) 60% 60%/600% 600%;
  filter: opacity(10%) contrast(105%);
}

.card-inner {
  display: -webkit-box;
  display: -ms-flexbox;
  padding:0.5em;
  width: 84vw;
  height: 72vh;
  background-color: var(--contrast);
  border-radius: 30px;
  /* Content style */
  font-size: 1.5em;
  font-size-adjust: auto;
  font-weight: 900;
  color: #c7c4c4;
  text-align: center;
}
    .cor{
      cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;

    }
    .ww{
      top: calc(100% - 40px);
      right: calc(100% - 40px);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      	background: rgb(26, 188, 156);
	background: -moz-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: -webkit-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: linear-gradient(135deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);

      box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
	transform: translatey(0px);
	animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
	0% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
	50% {
		box-shadow: 0 25px 15px 0px rgba(0,0,0,0.2);
		transform: translatey(-20px);
	}
	100% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
}
.overlay{
  background-color: #ff1a1a;
  background-image: linear-gradient(315deg, #ff1a1a 0%, #ffff00 74%);
  background-size: 110% 110%;
      -webkit-animation: AnimationName 3s ease infinite;
    -moz-animation: AnimationName 3s ease infinite;
    animation: AnimationName 3s ease infinite;
  /* position, height, width, etc as appropriate. */
  z-index: 17;
  opacity: 0.0;
  animation-delay: 0.5s;
  animation-duration: 15s;
  animation-direction: normal;
  animation-iteration-count: infinite;
  animation-name: fireFlicker;
  animation-timing-function: linear;
}
@keyframes fireFlicker {
  0%, 10% { opacity: 0; }
  15%,20% { opacity: 0.52; }
  22%,23% { opacity: 0.104; }
  25%,35% { opacity: 0.32; }
  39%,42% { opacity: 0.88; }
  44%,47% { opacity: 0.52; }
  49%,50% { opacity: 0.104; }
  52%,54% { opacity: 0.32; }
  57%,58% { opacity: 0.96; }
  60%,63% { opacity: 0.68; }
  65%,72% { opacity: 0.64; }
  77%,85% { opacity: 0.104; }
  90%,95% { opacity: 0.68; }
  100% { opacity: 0; }
}
@-webkit-keyframes AnimationName {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
}
@-moz-keyframes AnimationName {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
}
@keyframes AnimationName {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
}

   :global([data-svelte-dialog-content].content) {
  background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 background-size: 400% 400%;
     /* -webkit-animation: AnimationName 13s ease infinite;
    -moz-animation: AnimationName 13s ease infinite;
    animation: AnimationName 3s ease infinite;*/
      width: 80vw;
  }
  @media (min-width: 568px){

        :global([data-svelte-dialog-content].content) {
 background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 background-size: 400% 400%;
    /*  -webkit-animation: AnimationName 13s ease infinite;
    -moz-animation: AnimationName 13s ease infinite;
    animation: AnimationName 13s ease infinite;*/
width:78vw;
        }
  }
.onlym{
  display: "";
}
[data-ca3_icon]::before {
    font-weight: normal;
    content: attr(data-ca3_icon);
}

.ca3-scroll-down-arrow {
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2hldnJvbl90aGluX2Rvd24iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIwIDIwIiBmaWxsPSJ3aGl0ZSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTE3LjQxOCw2LjEwOWMwLjI3Mi0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwYzAuMjcsMC4yNjgsMC4yNzEsMC43MDEsMCwwLjk2OWwtNy45MDgsNy44M2MtMC4yNywwLjI2OC0wLjcwNywwLjI2OC0wLjk3OSwwbC03LjkwOC03LjgzYy0wLjI3LTAuMjY4LTAuMjctMC43MDEsMC0wLjk2OWMwLjI3MS0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwTDEwLDEzLjI1TDE3LjQxOCw2LjEwOXoiLz48L3N2Zz4=);
  background-size: contain;
  background-repeat: no-repeat;
}

.ca3-scroll-down-link {
  cursor:pointer;
  height: 60px;
  width: 80px;
  margin: 0px 0 0 -40px;
  line-height: 60px;
  position: absolute;
  left: 50%;
  bottom: 50%;
  color: #FFF;
  text-align: center;
  font-size: 70px;
  z-index: 100;
  text-decoration: none;
  text-shadow: 0px 0px 3px rgba(0, 0, 0, 0.4);

  -webkit-animation: ca3_fade_move_down 2s ease-in-out infinite;
  -moz-animation:    ca3_fade_move_down 2s ease-in-out infinite;
  animation:         ca3_fade_move_down 2s ease-in-out infinite;
}


/*animated scroll arrow animation*/
@-webkit-keyframes ca3_fade_move_down {
  0%   { -webkit-transform:translate(0,-20px); opacity: 0;  }
  50%  { opacity: 1;  }
  100% { -webkit-transform:translate(0,20px); opacity: 0; }
}
@-moz-keyframes ca3_fade_move_down {
  0%   { -moz-transform:translate(0,-20px); opacity: 0;  }
  50%  { opacity: 1;  }
  100% { -moz-transform:translate(0,20px); opacity: 0; }
}
@keyframes ca3_fade_move_down {
  0%   { transform:translate(0,-20px); opacity: 0;  }
  50%  { opacity: 1;  }
  100% { transform:translate(0,20px); opacity: 0; }
}
     .midscreen-link{
position: absolute;

  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639687279/Prismatic-Hearts-Vortex-Heart-13_pyb3yh.svg);

background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  color: var(--barbi-pink);
  text-shadow: 1px 1px black;
    text-align: center;
align-self: center;
justify-self: center;
  }
 .rightt {
        position: absolute;
        top: 50px;
        right: 50%;
        height: 50px;
        width: 50px;
        z-index: 14;
                aspect-ratio: 1/1;

    }
        .right {
        position: absolute;
        top: 50px;
        right: 50px;
        height: 50px;
        width: 50px;
        z-index: 14;
                aspect-ratio: 1/1;

    }
   .alredy{
           text-align: center;
           margin: 4vh  4vw 2vh 4vw;
          background-color: var(--gold);
          padding: 4vh 4vw;
          font-family: 'StamSefarad', serif;
          color: var(--barbi-pink);
          border: 1px var(--lturk);
   }

   :global(div.multiselect) {
    background-color: var(--gold) !important ;
  /* top-level wrapper div */
}
  :global(.multiselect:focus){
    border: 1px solid var(--barbi-pink) !important;
  }
  :global(ul.options){
    max-height: 40vh;
  }
  :global(.multiselect span.token) {
  color: #ffffff;
  background: var(--barbi-pink) ;
    /* selected options */
  }
 /* :global(.multiselect span.token button),
  :global(.multiselect .remove-all) {

    /* buttons to remove a single or all selected options at once */
 /* }
  :global(.multiselect ul) {
    /* dropdown options */
 /* }
  :global(.multiselect ul li) {
    /* dropdown options */
 /* } */
 :global(li.selected) {
    border: var(--sms-focus-border, 1pt solid var(--sms-active-color, cornflowerblue));
    color: var(--gold);
    /* selected options in the dropdown list */
  }
  :global(li:not(.selected):hover) {
 color: var(--barbi-pink);
    background-color:var(--lturk);    /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li){
    background-color: var(--barbi-pink);
    color:var(--lturk);
  }
  :global(ul.tokens > li):hover{
    color: var(--barbi-pink);
background-color:var(--lturk);
  }
  /*
  :global(li.selected:hover) {
    /* selected and hovered options in the dropdown list */
    /* probably not necessary to style this state in most cases */
 /* } */
  :global(li.active) {
    color:var(--barbi-pink) !important;
    /* active means element was navigated to with up/down arrow keys */
    /* ready to be selected by pressing enter */
  }
 /* :global(li.selected.active) {
  } */

#lines{
  display: "";

}
#amana-show{
  display: "";
}
.amanat{
padding: 0 1rem;
    text-shadow: 1px 1px var(--barbi-pink) ;
background-color: #bbf0f3;
background-image: linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%);
 background-size: 400% 400%;
      -webkit-animation: AnimationName 3s ease infinite;
    -moz-animation: AnimationName 3s ease infinite;
    animation: AnimationName 3s ease infinite;
opacity: 0.8;

}
small{
    background-color: white ;
}
  input {

    font-family: inherit;
    font-size: inherit;
    max-width: 200px;
    box-sizing: border-box;
    border: 1px solid var(--barbi-pink);
    border-radius: 4px;
    transition: all 150ms ease;
    background: var(--gold);
  }

  input:focus {
    outline: none;
    box-shadow: 0 0 0 4px var(--barbi-pink);
    border-color: var(--barbi-pink);
  }

  input:disabled,

  textarea:disabled {
    color: #ccc;
  }
  @media(max-width:576px) {
      .right {
        position: absolute;
        top: 50px;
        height: 50px;
        width: 50px;
        z-index: 14;
                aspect-ratio: 1/1;

    }
    .midscreen-link{
position: absolute;
      top: 192%;
    left: 82%;
    font-size: 0.8em;
  padding: 1.8em 1.8em;
    }

    :global(.multiselect) {
    max-width: 200px !important;
  }
.amanat{
  margin: 0 auto;
  padding: 0;
    text-shadow: 1px 1px 4px var(--gold) ;
       background-color: transparent;
          opacity: 1;

}
  .mobile{
    width: 100vw;
    height:100vh;
    margin:0px auto;
background-color :var(--gold) ;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1648338694/Gold-German-Imperial-Crown-No-Background_4_cpunhj.svg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size:  130vw 100vh;
}
 .amana{

    text-align: center;
        overflow-y: auto;

  }
  .aab{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
background-color: #bbf0f3;
background-image: linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%);
 background-size: 400% 400%;
      -webkit-animation: AnimationName 30s ease infinite;
    -moz-animation: AnimationName 30s ease infinite;
    animation: AnimationName 30s ease infinite;
}
  .flexid{
    display: flex;
    flex-direction: column;
   align-items: center;
   order: 1;
   max-height: 20vh;
  }

  .flexi1{
    display: flex;
    flex-direction: column;
    justify-content: center;
   align-items: center;
   order: 2;
   line-height: normal;

  }
  .flexi2{
    display: flex;
    flex-direction: column;
    justify-content: center;
   align-items: center;
   order: 3;
   line-height: normal;
  }
  .container{
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    width: 100vw;
  /*  background-size: cover;
        background-image: url(newcoin.svg);
      background-position: center center;
      padding:9vh 0;*/

  }
  /*
  .centeron{
        background-image: url('ceter.png');
 background-repeat: no-repeat;
 background-size: 50px;
 min-height: 50px;
 min-width: 50px;
 margin-top: -10px;
 margin-left: auto;
 margin-right: auto;
position: absolute;
top: 4%;
left: 45.2%;
 }*/


  .button {

    justify-self: center;
          align-self: center;
   background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162947/-1_orig-removebg-k_kwefjh.png);
 background-repeat: no-repeat;
 background-size: 170px;
 margin: auto;
 margin-top: 30px;
 min-height: 170px;
 min-width: 170px;
     cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;
  -webkit-animation:spin 17s linear infinite;
    -moz-animation:spin 17s linear infinite;
    animation:spin 17s linear infinite;
    }

 .flexi {
   padding-top: 2vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
   align-items: center;
    order: 1;
    white-space: nowrap;
  }
}

@media(min-width:577px) and (max-width:1099px) {
    .card-inner {
  width: 84vw;
    height: 60vh;
  }
   .amanat{
  margin: 0 auto;
  padding: 0;
    text-shadow: 1px 1px 4px var(--gold) ;
    background-color: transparent;
}
.flexid{
    display: flex;
    flex-direction: column;
   align-items: center;
   order: 1;
      max-height: 20vh;

  }
  /*.centeron{
    background-image: url('ceter.png');
    background-repeat: no-repeat;
    background-size: 50px;
    align-self: center;
    min-height: 50px;
    min-width: 50px;
 }*/
  .aab{
background-color: #bbf0f3;
background-image: linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
   .mobile{
background-color: var(--gold);
    height:100vh;
    margin:0px auto;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1648335809/Gold-German-Imperial-Crown-No-Background_qs7cri.svg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-position: center;
    padding: 0 1vw;
    background-size:  98vw  100vh;
        background-repeat: no-repeat;

}
  .button {
    justify-self: center;
    align-self: center;
   background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162947/-1_orig-removebg-k_kwefjh.png);
    background-repeat: no-repeat;
    background-size: 170px;
    margin: auto;
    min-height: 170px;
    min-width: 170px;
     cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;
   -webkit-animation:spin 17s linear infinite;
    -moz-animation:spin 17s linear infinite;
    animation:spin 17s linear infinite;
    }

  .container {
    padding-top: 26vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

  }
  .flexi {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 1;
    white-space: nowrap;
  }
  .flexi1 {
        display: flex;

    order: 2;
    flex: 0.5;
   flex-direction: row;
    justify-content: center;
    align-items: center;

  }
  .flexi2 {
        display: flex;

    order: 3;
 flex-direction: row;
    justify-content: center;
    align-items: center;
  }

}

@media(min-width:942px) and (max-width:1099px) {

  .midscreen-link{
position: absolute;
      top: 82%;
    left: 92%;
    font-size: 1em;
  padding: 2em 2em;
  }
 .amanat{
padding: 0 1rem;
    text-shadow: 1px 1px var(--barbi-pink) ;
        background-color: var(--gold);background-color: #bbf0f3;
background-image: linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%);
          opacity: 0.8;

}
 .mobile{
    width: 100vw;
    height:100vh;
    margin:0px auto;
 background-image: url(https://res.cloudinary.com/love1/image/upload/v1639597594/Prismatic-Hearts-World-Map-4_ge7z9u.svg);
background-position: center;
  background-repeat: no-repeat;
  background-size: cover; }
  /*
    .centeron{
   background-image: url('ceter.png');
   background-repeat: no-repeat;
   background-size: 50px;
   align-self: center;
   min-height: 50px;
   min-width: 50px;

   }*/
  .button {
    justify-self: center;
    align-self: center;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162947/-1_orig-removebg-k_kwefjh.png);
    background-repeat: no-repeat;
    background-size: 170px;
    margin: auto;
    min-height: 170px;
    min-width: 170px;
     cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;
  -webkit-animation:spin 17s linear infinite;
    -moz-animation:spin 17s linear infinite;
    animation:spin 17s linear infinite;
  }
  .amana{
 
    opacity: 0.9;
  }
  .container {
    display: flex;
    padding-top: 10em;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639089083/BG_umwddj.png);
    background-size: contain;
    height: 170px;
    background-repeat: no-repeat;
    background-position: center;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    flex: 0.5;
    background-color: transparent;
    max-width: 769px;
  }

  .flexi {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 1;

  }
  .flexi1 {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 2;
  }
  .flexi2 {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 3;
  }
   .flexid{
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 1;
       max-height: 20vh;

  }
}

@media(min-width:1100px) {
     .card-inner {
  width: 84vw;
    height: calc(66vh - 180px);
    font-size: 1.2em;
  }
    .onlym{
  display: none;
}
  .midscreen-link{
position: absolute;
      top: 82%;
    left: 92%;
    font-size: 1em;
  padding: 2em 2em;
  }
  .flexid{
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 1;
       max-height: 33vh;
      height:100%;
  }
  .mobile{
    max-width: 1024px;
    width: 100%;
		margin: 0 auto;
    background: inherit;
    background-size: inherit;
  }
  /*
   .centeron{
    background-image: url('ceter.png');
    background-repeat: no-repeat;
    background-size: 50px;
    align-self: center;
    min-height: 50px;
    min-width: 50px;
    margin-top: 0px;
    margin-left: auto;
    margin-right: auto;
    position: fixed;
    top: 2%;
    left: 47.9%;
 }*/
  .button {
    justify-self: center;
    align-self: center;
   background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162947/-1_orig-removebg-k_kwefjh.png);
    background-repeat: no-repeat;
    background-size: 130px;
    margin: auto;
   min-height: 130px;
    min-width: 130px;
     cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;
    -webkit-animation:spin 17s linear infinite;
    -moz-animation:spin 17s linear infinite;
    animation:spin 17s linear infinite;
}



   .amana{
    display: flex;
    justify-content: center;
  }
  .container {
    display: flex;
    padding-top: 67px;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639089083/BG_umwddj.png);
    background-size: contain;
    height: 170px;
    background-repeat: no-repeat;
    background-position: center;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: center;
    flex: 0.5;
    width: 100%;
     background-color: transparent;
    margin: 0 auto;
    max-width: 1024px;
  }

  .flexi {
    display: flex;
    flex-direction: row;
    justify-content: center;
   align-items: center;
    order: 1;
      padding: 1rem;
    margin-top: 0.2rem;
  }
  .flexi1 {
    order: 2;
    flex-direction: row;
        padding:2rem 1rem;
    margin-top: 0.2rem;
 display: flex;
    justify-content: center;
   align-items: center;
   line-height: normal;
  }
  .flexi2 {
    order: 3;
    flex-direction: row;
    padding: 2rem 1rem;
    margin-top: 0.2rem;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: normal;
  }
  .all{
    height: 100vh;
  }
}
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
@media(min-width:1200px) {
   .amana{
    font-size:1.8em;
  }
   .centeron{
   left: 48%;
  }
}

@media(min-width:1300px) {

   .centeron{
   left: 48%;
  }
}

@media(min-width:1450px) {
  
   .centeron{
   left: 48%;
  }
}
@media(min-width:1700px) {
 
   .centeron{
   left: 48%;
  }
  .button{
    background-size: 170px;
    min-height: 170px;
    min-width: 170px;
  }
}
@media(min-width:2200px) {

   .centeron{
   left: 48%;
  }
  .button{
    background-size: 170px;
    min-height: 170px;
    min-width: 170px;
  }
}
 :global(.multiselect) {
    max-width: 250px;

  }
  </style>
