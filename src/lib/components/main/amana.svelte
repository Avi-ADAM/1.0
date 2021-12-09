
<script>
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { email } from '../registration/email.js'
    import { regHelper } from '../../stores/regHelper.js';

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
                    { value: 127 , label: 'Israel', heb: 'ישראל'},
                    { value: 188 , label: 'Palestine jehuda & sumeria', heb: 'הרשות הפלסטינית יו"ש'},
                    { value: 269 , label: 'Palestine gaza strip', heb: 'רצועת עזה'},
                    { value: 253 , label: 'United States', heb: 'ארצות הברית של אמריקה'},
                    { value: 17, label: 'Åland Islands', heb: 'אולנד' },
                    { value: 18, label: 'Afghanistan'  ,heb: 'אפגניסטן' },
                    { value: 19, label: 'Albania' ,heb: 'אלבניה' },
                    { value: 20, label: 'Algeria' ,heb: 'אלג\'יריה' },
                    { value: 21, label: 'American Samoa' ,heb: 'סמואה האמריקנית'},
                    { value: 22, label: 'Andorra' ,heb: 'אנדורה'},
                    { value: 23, label: 'Angola' ,heb: 'אנגולה'},
                    { value: 24, label: 'Anguilla' ,heb: 'אנגווילה'},
                    { value: 25, label: 'Antarctica' ,heb: 'אנטרטיקה'},
                    { value: 26, label: 'Antigua and Barbuda', heb: 'אנטיגואה וברבודה'},
                    { value: 27, label: 'Argentina', heb: 'ארגנטינה'},
                    { value: 28, label: 'Armenia', heb: 'ארמניה'},
                    { value: 29, label: 'Aruba', heb: 'ארובה'},
                    { value: 30, label: 'Australia', heb: 'אוסטרליה'},
                    { value: 31, label: 'Austria', heb: 'אוסטריה'},
                    { value: 32, label: 'Azerbaijan' , heb: 'אזרבייג\'ן'},
                    { value: 33, label: 'Bahamas' , heb: 'איי בהאמה'},
                    { value: 34, label: 'Bahrain' , heb: 'בחריין'},
                    { value: 35, label: 'Bangladesh', heb: 'בנגלדש'},
                    { value: 36, label: 'Barbados', heb: 'ברבדוס'},
                    { value: 37, label: 'Belarus', heb: 'בלרוס'},
                    { value: 38, label: 'Belgium', heb: 'בלגיה'},
                    { value: 40, label: 'Belize', heb: 'בליז'},
                    { value: 41, label: 'Benin', heb: 'בנין'},
                    { value: 42, label: 'Bermuda', heb: 'ברמודה'},
                    { value: 43, label: 'Bhutan', heb: 'בהוטאן'},
                    { value: 44, label: 'Bolivia', heb: 'בוליביה'},
                    { value: 45, label: 'Bonaire, Sint Eustatius and Saba', heb: 'האיים הקריביים ההולנדיים'},
                    { value: 46, label: 'Bosnia and Herzegovina', heb: 'בוסניה והרצגובינה'},
                    { value: 47, label: 'Botswana', heb: 'בוטסואנה'},
                    { value: 48, label: 'Bouvet Island', heb: 'בובה'},
                    { value: 49, label: 'Brazil', heb: 'ברזיל'},
                    { value: 50, label: 'British Indian Ocean Territory', heb: 'הטריטוריה הבריטית באוקיינוס ההודי'},
                    { value: 51, label: 'Brunei Darussalam', heb: 'ברוניי דארוסלאם'},
                    { value: 52, label: 'Bulgaria', heb: 'בולגריה'},
                    { value: 53, label: 'Burkina Faso',  heb: 'בורקינה פאסו'}, 
                    { value: 54, label: 'Burundi',  heb: 'בורונדי'}, 
                    { value: 55, label: 'Cambodia',  heb: 'קמבודיה'}, 
                    { value: 56, label: 'Cameroon',  heb: 'קמרון'}, 
                    { value: 57, label: 'Canada',  heb: 'קנדה'}, 
                    { value: 58, label: 'Cape Verde',  heb: 'כף ורדה'}, 
                    { value: 59, label: 'Cayman Islands', heb: 'איי קיימן'}, 
                    { value: 60, label: 'Central African Republic', heb: ' הרפובליקה המרכז אפריקאית '},
                    { value: 61, label: 'Chad', heb: 'צ\'אד'},
                    { value: 62, label: 'Chile', heb: 'צ\'ילה'},
                    { value: 63, label: 'China', heb: 'סין'},
                    { value: 64, label: 'Christmas Island', heb: 'איי חג המולד'},
                    { value: 65, label: 'Cocos (Keeling) Islands', heb: 'איי קוקוס'},
                    { value: 66, label: 'Colombia', heb: 'קולומביה'},
                    { value: 67, label: 'Comoros', heb: 'איי קומורו'},
                    { value: 68, label: 'Congo', heb: 'קונגו'},
                    { value: 69, label: 'Congo, The Democratic Republic of The', heb: 'הרפובליקה העממית של קונגו'},
                    { value: 70, label: 'Cook Islands', heb: 'איי קוק'},
                    { value: 71, label: 'Costa Rica', heb: 'קוסטה ריקה'},
                    { value: 72, label: 'Cote D\'ivoire', heb: 'חוף השנהב'},
                    { value: 73, label: 'Croatia', heb: 'קרואטיה'},
                    { value: 74, label: 'Cuba', heb: 'קובה'},
                    { value: 75, label: 'Curaçao', heb: 'קוראסאו'},
                    { value: 76, label: 'Cyprus', heb: 'קפריסין'},
                    { value: 77, label: 'Czech Republic', heb: 'צ\'כיה'},
                    { value: 78, label: 'Denmark', heb: 'דנמרק'},
                    { value: 79, label: 'Djibouti', heb: 'ג\'יבוטי'},
                    { value: 80, label: 'Dominica', heb: 'דומיניקה'},
                    { value: 81, label: 'Dominican Republic', heb: 'הרפובליקה הדומיניקנית'},
                    { value: 82, label: 'Ecuador', heb: 'אקוודור'},
                    { value: 83, label: 'Egypt', heb: 'מצריים'},
                    { value: 84, label: 'El Salvador', heb: 'אל סלבדור'},
                    { value: 85, label: 'Equatorial Guinea', heb: 'גינאה המשוונית'},
                    { value: 86, label: 'Eritrea', heb: 'אריתראה'},
                    { value: 87, label: 'Estonia', heb: 'אסטוניה'},
                    { value: 88, label: 'Eswatini', heb: 'אסוואטיני'},
                    { value: 89, label: 'Ethiopia', heb: 'אתיופיה'},
                    { value: 90, label: 'Falkland Islands (Malvinas)', heb: 'איי מאלבינס (איי פוקלנד)'},
                    { value: 91, label: 'Faroe Islands', heb: 'איי פארו'},
                    { value: 92, label: 'Fiji', heb: 'פיג\'י'},
                    { value: 93, label: 'Finland', heb: 'פינלנד'},
                    { value: 94, label: 'France', heb: 'צרפת'},
                    { value: 95, label: 'French Guiana', heb: 'גויאנה הצרפתית'},
                    { value: 96, label: 'French Polynesia', heb: 'פולינזיה הצרפתית'},
                    { value: 97, label: 'French Southern Territories', heb: 'הארצות הדרומיות והאנטרקטיות של צרפת'},
                    { value: 98, label: 'Gabon', heb: 'גאבון'},
                    { value: 99, label: 'Gambia', heb: 'גמביה'},
                    { value: 100 , label: 'Georgia', heb: 'גאורגיה'},
                    { value: 101 , label: 'Germany', heb: 'גרמניה'},
                    { value: 102 , label: 'Ghana', heb: 'גאנה'},
                    { value: 103 , label: 'Gibraltar', heb: 'גיברלטר'},
                    { value: 104 , label: 'Greece', heb: 'יוון'},
                    { value: 105 , label: 'Greenland', heb: 'גרינלנד'},
                    { value: 106 , label: 'Grenada', heb: 'גרנדה'},
                    { value: 107 , label: 'Guadeloupe', heb: 'גוואדלופ'},
                    { value: 108 , label: 'Guam', heb: 'גואם'},
                    { value: 109 , label: 'Guatemala', heb: 'גואטמלה'},
                    { value: 110 , label: 'Guernsey', heb: 'גרנזי'},
                    { value: 111 , label: 'Guinea', heb: 'גינאה'},
                    { value: 112 , label: 'Guinea-bissau', heb: 'גינאה-ביסאו'},
                    { value: 113 , label: 'Guyana', heb: 'גויאנה'},
                    { value: 114 , label: 'Haiti', heb: 'האיטי'},
                    { value: 115 , label: 'Heard Island and Mcdonald Islands', heb: 'האי הרד ואיי מקדונלד'},
                    { value: 116 , label: 'Holy See (Vatican City State)', heb: 'וותיקן'},
                    { value: 117 , label: 'Honduras', heb: 'הונדורס'},
                    { value: 118 , label: 'Hong Kong', heb: 'הונג קונג'},
                    { value: 119 , label: 'Hungary', heb: 'הונגריה'},
                    { value: 120 , label: 'Iceland', heb: 'איסלנד'},
                    { value: 121 , label: 'India', heb: 'הודו'},
                    { value: 122 , label: 'Indonesia', heb: 'אינדונזיה'},
                    { value: 123 , label: 'Iran, Islamic Republic of', heb: 'איראן'},
                    { value: 124 , label: 'Iraq', heb: 'עירק'},
                    { value: 125 , label: 'Ireland', heb: 'אירלנד'},
                    { value: 126 , label: 'Isle of Man', heb: 'האי מאן'},
                    { value: 128 , label: 'Italy', heb: 'איטליה'},
                    { value: 129 , label: 'Jamaica', heb: 'ג\'מייקה'},
                    { value: 130 , label: 'Japan', heb: 'יפן'},
                    { value: 131 , label: 'Jersey', heb: 'ג\'רזי'},
                    { value: 132 , label: 'Jordan', heb: 'ירדן'},
                    { value: 133 , label: 'Kazakhstan', heb: 'קזחסטן'},
                    { value: 134 , label: 'Kenya', heb: 'קניה'},
                    { value: 135 , label: 'Kiribati', heb: 'קיריבאטי'},
                    { value: 136 , label: 'Korea, Democratic People\'s Republic of', heb: 'קוריאה הצפונית'},
                    { value: 137 , label: 'Korea, Republic of', heb: 'קוריאה הדרומית'},
                    { value: 138 , label: 'Kuwait', heb: 'כווית'},
                    { value: 271 , label: 'Kurdistan', heb: 'כורדיסטאן'},
                    { value: 139 , label: 'Kyrgyzstan', heb: 'קירג\'יסטן'},
                    { value: 140 , label: 'Lao People\'s Democratic Republic', heb: 'לאוס'},
                    { value: 141 , label: 'Latvia', heb: 'לטביה'},
                    { value: 142 , label: 'Lebanon', heb: 'לבנון'},
                    { value: 143 , label: 'Lesotho', heb: 'לסוטו'},
                    { value: 144 , label: 'Liberia', heb: 'ליבריה'},
                    { value: 145 , label: 'Libyan Arab Jamahiriya', heb: 'לוב'},
                    { value: 146 , label: 'Liechtenstein', heb: 'ליכטנשטיין'},
                    { value: 147 , label: 'Lithuania', heb: 'ליטא'},
                    { value: 148 , label: 'Luxembourg', heb: 'לוקסמבורג'},
                    { value: 149 , label: 'Macao', heb: 'מקאו'},
                    { value: 150 , label: 'Madagascar', heb: 'מדגסקר'},
                    { value: 151 , label: 'Malawi', heb: 'מלאווי'},
                    { value: 152 , label: 'Malaysia', heb: 'מלזיה'},
                    { value: 153 , label: 'Maldives', heb: 'איי המלדיביים'},
                    { value: 154 , label: 'Mali', heb: 'מאלי'},
                    { value: 155 , label: 'Malta', heb: 'מלטה'},
                    { value: 156 , label: 'Marshall Islands', heb: 'איי מרשל'},
                    { value: 157 , label: 'Martinique', heb: 'מרטיניק'},
                    { value: 158 , label: 'Mauritania', heb: 'מאוריטניה'},
                    { value: 159 , label: 'Mauritius', heb: 'מאוריציוס'},
                    { value: 160 , label: 'Mayotte', heb: 'מאיוט'},
                    { value: 161 , label: 'Mexico', heb: 'מכסיקו'},
                    { value: 162 , label: 'Micronesia, Federated States of', heb: 'מיקרונזיה'},
                    { value: 163 , label: 'Moldova, Republic of', heb: 'מולדובה'},
                    { value: 164 , label: 'Monaco', heb: 'מונקו'},
                    { value: 165 , label: 'Mongolia', heb: 'מונגוליה'},
                    { value: 166 , label: 'Montenegro', heb: 'מונטנגרו'},
                    { value: 167 , label: 'Montserrat', heb: 'מונסראט'},
                    { value: 168 , label: 'Morocco', heb: 'מרוקו'},
                    { value: 169 , label: 'Mozambique', heb: 'מוזמביק'},
                    { value: 170 , label: 'Myanmar', heb: 'מיאנמר (בורמה)'},
                    { value: 171 , label: 'Namibia', heb: 'נמיביה'},
                    { value: 172 , label: 'Nauru', heb: 'נאורו'},
                    { value: 173 , label: 'Nepal', heb: 'נפאל'},
                    { value: 174 , label: 'Netherlands', heb: 'הולנד'},
                    { value: 268 , label: 'Netherlands Antilles', heb: 'האנטילים ההולנדיים'},
                    { value: 175 , label: 'New Caledonia', heb: 'קלדוניה החדשה'},
                    { value: 176 , label: 'New Zealand', heb: 'ניו זינלנד'},
                    { value: 177 , label: 'Nicaragua', heb: 'ניקרגואה'},
                    { value: 178 , label: 'Niger', heb: 'ניז\'ר'},
                    { value: 179 , label: 'Nigeria', heb: 'ניגריה'},
                    { value: 180 , label: 'Niue', heb: 'ניואה'},
                    { value: 181 , label: 'Norfolk Island', heb: 'האי נורפולק'},
                    { value: 182 , label: 'North Macedonia', heb: 'מקדוניה (FYROM)'},
                    { value: 183 , label: 'Northern Mariana Islands', heb: 'איי מריאנה הצפוניים'},
                    { value: 184 , label: 'Norway', heb: 'נורווגיה'},
                    { value: 185 , label: 'Oman', heb: 'עומאן'},
                    { value: 186 , label: 'Pakistan', heb: 'פקיסטאן'},
                    { value: 187 , label: 'Palau', heb: 'פלאו'},
                    { value: 189 , label: 'Panama', heb: 'פנמה'},
                    { value: 190 , label: 'Papua New Guinea', heb: 'פפואה ניו גינאה'},
                    { value: 191 , label: 'Paraguay', heb: 'פרגוואי'},
                    { value: 192 , label: 'Peru', heb: 'פרו'},
                    { value: 193 , label: 'Philippines', heb: 'פיליפינים'},
                    { value: 194 , label: 'Pitcairn', heb: 'איי פיטקיירן'},
                    { value: 195 , label: 'Poland', heb: 'פולין'},
                    { value: 196 , label: 'Portugal', heb: 'פורטוגל'},
                    { value: 197 , label: 'Puerto Rico', heb: 'פורטו ריקו'},
                    { value: 198 , label: 'Qatar', heb: 'קטאר'},
                    { value: 199 , label: 'Reunion', heb: 'ראוניון'},
                    { value: 200 , label: 'Romania', heb: 'רומניה'},
                    { value: 201 , label: 'Russian Federation', heb: 'רוסיה'},
                    { value: 202 , label: 'Rwandan', heb: 'רוואנדה'},
                    { value: 203 , label: 'Saint Barthélemyn', heb: 'סן ברתלמי'},
                    { value: 204 , label: 'Saint Helenan', heb: 'סנט הלנה'},
                    { value: 205 , label: 'Saint Kitts and Nevis', heb: 'סנט קיטס ונוויס'},
                    { value: 206 , label: 'Saint Lucia', heb: 'סנט לוסיה'},
                    { value: 207 , label: 'Saint Martin (French part)', heb: 'סן מרטן'},
                    { value: 208 , label: 'Saint Pierre and Miquelon', heb: 'סנט פייר ומיקלון'},
                    { value: 209 , label: 'Saint Vincent and The Grenadines', heb: 'סנט וינסנט והגרנדינים'},
                    { value: 210 , label: 'Samoa', heb: 'סמואה'},
                    { value: 211 , label: 'San Marino', heb: ''},
                    { value: 212 , label: 'Sao Tome and Principe', heb: 'סאו טומה ופרינסיפה'},
                    { value: 213 , label: 'Saudi Arabia', heb: 'ערב הסעודית'},
                    { value: 214 , label: 'Senegal', heb: 'סנגל'},
                    { value: 215 , label: 'Serbia', heb: 'סרביה'},
                    { value: 216 , label: 'Seychelles', heb: 'סיישל'},
                    { value: 217 , label: 'Sierra Leone', heb: 'סיירה לאון'},
                    { value: 218 , label: 'Singapore', heb: 'סינגפור '},
                    { value: 219 , label: 'Sint Maarten (Dutch part)', heb: 'סנט מארטן'},
                    { value: 220 , label: 'Slovakia', heb: 'סלובקיה'},
                    { value: 221 , label: 'Slovenia', heb: 'סלובניה'},
                    { value: 222 , label: 'Solomon Islands', heb: 'איי שלמה'},
                    { value: 223 , label: 'Somalia', heb: 'סומליה'},
                    { value: 224 , label: 'South Africa', heb: 'דרום אפריקה'},
                    { value: 225 , label: 'South Georgia and The South Sandwich Islands', heb: 'איי ג\'ורג\'יה הדרומית ואיי סנדוויץ\' הדרומיים'},
                    { value: 226 , label: 'South Sudan', heb: 'דרום סודן'},
                    { value: 227 , label: 'Spain', heb: 'ספרד'},
                    { value: 228 , label: 'Sri Lanka', heb: 'סרי לנקה'},
                    { value: 229 , label: 'Sudan', heb: 'סודן'},
                    { value: 230 , label: 'Suriname', heb: 'סורינאם'},
                    { value: 231 , label: 'Svalbard and Jan Mayen', heb: 'סבאלברד ויאן מאיין'},
                    { value: 270 , label: 'Swaziland', heb: 'אסוואטיני'},
                    { value: 232 , label: 'Sweden', heb: 'שוודיה'},
                    { value: 233 , label: 'Switzerland', heb: 'שוויץ'},
                    { value: 234 , label: 'Syrian Arab Republic', heb: 'סוריה'},
                    { value: 235 , label: 'Taiwan', heb: 'טייוואן'},
                    { value: 236 , label: 'Tajikistan', heb: 'טג\'יקיסטן'},
                    { value: 237 , label: 'Tanzania, United Republic of', heb: 'טנזניה'},
                    { value: 238 , label: 'Thailand', heb: 'תאילנד'},
                    { value: 239 , label: 'Timor-leste', heb: 'מזרח טימור'},
                    { value: 240 , label: 'Togo', heb: 'טוגו'},
                    { value: 241 , label: 'Tokelau', heb: 'טוקלאו'},
                    { value: 242 , label: 'Tonga', heb: 'טונגה'},
                    { value: 243 , label: 'Trinidad and Tobago', heb: 'טרינידד וטובגו'},
                    { value: 244 , label: 'Tunisia', heb: 'תוניסיה'},
                    { value: 245 , label: 'Turkey', heb: 'טורקיה'},
                    { value: 246 , label: 'Turkmenistan', heb: 'טורקמניסטן'},
                    { value: 247 , label: 'Turks and Caicos Islands', heb: 'איי טורקס וקאיקוס'},
                    { value: 248 , label: 'Tuvalu', heb: 'טובאלו'},
                    { value: 249 , label: 'Uganda', heb: 'אוגנדה'},
                    { value: 250 , label: 'Ukraine', heb: 'אוקראינה'},
                    { value: 251 , label: 'United Arab Emirates', heb: 'איחוד האמירויות הערביות'},
                    { value: 252 , label: 'United Kingdom', heb: 'אנגליה'},
                    { value: 254 , label: 'United States Minor Outlying Islands', heb: 'האיים המרוחקים הקטנים של ארה״ב'},
                    { value: 255 , label: 'Uruguay', heb: 'אורוגוואי'},
                    { value: 256 , label: 'Uzbekistan', heb: 'אוזבקיסטן'},
                    { value: 257 , label: 'Vanuatu', heb: 'ונואטו'},
                    { value: 258 , label: 'Venezuela', heb: 'ונצואלה'},
                    { value: 259 , label: 'Viet Nam', heb: 'ויטנאם'},
                    { value: 260 , label: 'Virgin Islands, British', heb: 'איי הבתולה הבריטיים'},
                    { value: 261 , label: 'Virgin Islands, U.S.', heb: 'איי הבתולה של ארצות הברית'},
                    { value: 262 , label: 'Wallis and Futuna', heb: 'ואליס ופוטונה'},
                    { value: 263 , label: 'Western Sahara', heb: 'סהרה המערבית'},
                    { value: 264 , label: 'Yemen', heb: 'תימן'},
                    { value: 265 , label: 'Zambia', heb: 'זמביה'},
                    { value: 266 , label: 'Zimbabwe', heb: 'זימבבואה'}
                  ];
    const nameC = `country`;
    const placeholder = `המקום שלי`;
    const required = true;
    
    let selected;
       


    import { createForm } from "svelte-forms-lib";
    
const { form, handleChange, handleSubmit } = createForm({
          initialValues: {
            name: "",
            email: "",
            countries: []
          },
onSubmit: values => {
            fetch('http://localhost:5000/chezins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: $form.name,
        email: $form.email,
        countries: find_contry_id(selected)
      }),
    }) 
      .then(response => response.json())
      .then(data => console.log(data));
            userName.set($form.name);
            email.set($form.email);
            regHelper.set(1);
          }
        });

function show (){
  const amana = document.getElementById("amana-show")
  const lines = document.getElementById("lines")
  
}
      </script>
   
      <div class="all">
      <div class="mobile">
        

<section class="container" dir="rtl" id="lines"> 
    
<div class="flexi">
  <h3
       class="amanat" 
       style="white-space: nowrap; font-family: StamSefarad, serif; font-size: 1.5em; line-height: normal;" 
       dir="rtl">
     ההצהרה של: 
      </h3>
  <input 
          id="name"
          name="name"
          placeholder="שמי"
          required
          on:change={handleChange}
          bind:value={$form.name}
        /> </div>
<div class="flexi1">
  <h3        class="amanat " id="m" 
 style="font-family: StamSefarad, serif; font-size: 1.5em;" dir="rtl">מ: </h3> 
      <MultiSelect
      bind:selected
      {nameC} 
      {placeholder}
      options={country.map(c => c.heb)}
       {required}
       />  </div>    
<div class="flexi2">
  <h3        class="amanat" 
 style="    white-space: nowrap; font-family: 'StamSefarad', serif; font-size: 1.5em; line-height:normal;" dir="rtl">דואר L.</h3>
  <input
    placeholder="המייל שלי"
    id="email"
    name="email"
    required
    on:change={handleChange}
    bind:value={$form.email}
    /></div>
    </section>     
    </div> 
    <div class="aab">
<div dir="rtl" class="amana" id="amana-show">
          <span>
              <span>
                אני {$form.name}      לעולם לא אנהג באלימות ולא אפגע באף אדם         
                   <br>
                    כי אני {$form.name} לא רוצה להיות קרבן של אלימות ומפני שאין שום סמכות, ערך, מטרה, אמונה, ממון או אינטרס שמצדיק פגיעה בחייו של אדם, אלימות וכפיה בכוח .
              <br>	
   אני {$form.name} אתן את אמוני בטוב ובכך שכאשר כל האנושות תחתום אלימות, קרבות ומשטור יפסיקו להיות צורה של תקשורת אנושית
              <br>
              כאשר כל  {selected} תהיה חתומה על אמנה זו אני {$form.name} אוותר על כלי הנשק שלי ועל השוטרים החמושים שמדינת {selected} ממנה בשמי
              <br>
              אני {$form.name} אוותר על כלי הנשק של צבא {selected} כאשר כל האנושות תהיה חתומה על האמנה הזו
          </span>
          </span>
    </div>
     


<form on:submit={handleSubmit}>

<div class="flexid">
 
    <button
     class="button hover:scale-150"
      on:submit="{handleSubmit}"
      type="submit"
      ></button>   
  </div>
  </form>
      </div> </div>
  <style>
   

   :global(.multiselect) {
    background-color: var(--gold) !important ;
  /* top-level wrapper div */
}
  :global(.multiselect:focus){
    border: 1px solid var(--barbi-pink) !important;
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
  padding: 1rem;

}

  input {
   
    font-family: inherit;
    font-size: inherit;
    max-width: 200px;
    box-sizing: border-box;
    border: 1px solid var(--gold);
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
    #m{
      margin-bottom: -20px;
    }
    :global(.multiselect) {
    max-width: 200px !important;
  }
.amanat{
  margin: 0 auto;
  padding: 0;
}
  .mobile{
    width: 100vw;
    height:100vh;
    margin:0px auto;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088864/SHALOM1_awkhot.svg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size:  130vw 100vh;
}
 .amana{   
   
    padding: 1.5em 1em 1em 1em;
    font-size: 129%;
    font-family: 'StamSefarad', serif;
    text-align: center;
    font-weight: 900;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088838/megila1_m6kvgh.png);
    background-size: 180vw 180vh;
    background-repeat: no-repeat;
    background-position: center;
    line-height: normal;
    font-size-adjust: auto;
    height: 80vh;
  }
  .aab{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .flexid{
    display: flex;
    flex-direction: row;
    justify-content: center;
   align-items: center;
   order: 1;
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088797/buHe_vc9zew.png);  
 background-repeat: no-repeat;
 background-size: 170px;
 margin: auto;
 min-height: 170px;
 min-width: 170px;
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
  /*.centeron{
    background-image: url('ceter.png');
    background-repeat: no-repeat;
    background-size: 50px;
    align-self: center;
    min-height: 50px;
    min-width: 50px;
 }*/
  .aab{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
   .mobile{
    width: 100vw;
    height:100vh;
    margin:0px auto;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088888/SHALOM2_nd7evv.svg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-position: center;
    padding: 0 1vw;
    background-size:  98vw  100vh;
}
  .button {
    justify-self: center;
    align-self: center;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088797/buHe_vc9zew.png);
    background-repeat: no-repeat;
    background-size: 170px;
    margin: auto;
    min-height: 170px;
    min-width: 170px;
  }
  .amana{
    padding: 0px 13vw;
    font-size:20px;
    font-family: 'StamSefarad', serif;
    text-align: center;
    font-weight: 900;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088838/megila1_m6kvgh.png);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    align-self: center;
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
 .mobile{
    width: 100vw;
    height:100vh;
    margin:0px auto;
 background-image: url(https://res.cloudinary.com/love1/image/upload/v1639089050/reka2_unoegx.png);
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088797/buHe_vc9zew.png);
    background-repeat: no-repeat;
    background-size: 170px;
    margin: auto;
    min-height: 170px;
    min-width: 170px;
  }
  .amana{
    width: 768px;
    padding: 0px 25px;
    font-size:25px;
    font-family: 'StamSefarad', serif;
    text-align:center;
    font-weight: 900;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088838/megila1_m6kvgh.png);
    background-size: 768px;
    background-repeat: no-repeat;
    background-position: center;
    margin: 0 auto;
    align-self: center;
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
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 1;
  }
}

@media(min-width:1100px) {
  .flexid{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    order: 1;
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088797/buHe_vc9zew.png);
    background-repeat: no-repeat;
    background-size: 130px;
    margin: auto;
    min-height: 130px;
    min-width: 130px;
  }

  .amana{
    width: 100vw;
    padding: 0px 100px;
    font-size:25px;
    font-family: 'StamSefarad', serif;
    text-align:center;
    font-weight: 900;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1639088838/megila1_m6kvgh.png);
    background-size: 1150px  ;
    background-repeat: no-repeat;
    background-position: center;
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
@media(min-width:1200px) {
   .amana{
    padding: 0 110px;
    background-size: 1400px  ;
  }
   .centeron{
   left: 48%;
  }
}
 :global(.multiselect) {
    width: 250px;
   
  }
  </style> 