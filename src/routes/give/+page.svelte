<script>
  let fpval, selected, liUN, email;
      import MultiSelect from 'svelte-multiselect';
  import { userName } from '$lib/stores/store.js';

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
    function submitFormb() {

      let linko = `${liUN}&em=${email}`
      console.log(`https://1lev1.world?ref=true&id=${fpval}&con=${find_contry_id(selected)}&un=${encodeURIComponent(liUN)}&em=${email}`)
    }

  function submitForm() {
    let data = {user:"זוכמיר בן סירה",projectName:"וילה לשותפים",projectSrc:"https://res.cloudinary.com/onelove1/image/upload/v1645805401/thumbnail_pngegg_2_8aeb98b032.png",missionName:"פרסום ברשתות החברתיות",email:"aviadam.segel@gmail.com",lang:"en",kind:"exeptedMission"}
    fetch("/api/sma", {
            method: 'POST',  
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
            .then((response) => response)
            .then((data) => {
              console.log('Success:', data);            
            })
            .catch((error) => {
              console.error('Error:', error);
            });
          }
  async function onSubmiti (){
   
}

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
    let uid = 5679070

    function rrrr (){
       let userName_value = $userName
       let newN = "vrvr"
         let datau = {name:"userName_value", action: "create", det:"newN"}
   fetch("https://www.1lev1.world/api/ste", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(datau),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data,datau);

  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
                  
    }
    function tverya (){
      let i = 36
      while (i < 313) {
                 let datau = {data:{name:`userName_value${i}`,email: `ggg${i}@kkk.hh`, countries: [104] }}

        fetch("https://beoni.onrender.com/api/chezins", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(datau),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data,datau);

  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
  i++
      }
    }
</script>
<!--
<button on:click={tverya}>tverya</button>
-->
<button on:click={onSubmiti}>tttt</button>
<form on:submit|preventDefault={submitForm}>
  <button type="submit">Submit</button>
</form>
<form on:submit|preventDefault={submitFormb}>
  <input type="text" bind:value={fpval} placeholder="id">
    <input type="text" bind:value={liUN} placeholder="username">
    <input type="text" bind:value={email} placeholder="email">

   <MultiSelect
      bind:selected
      options={country.map(c => c.heb)}
       /> 
  <button type="submit">Submit</button>
</form>
<a href="{`https://telegram.me/onelevone_bot?start=${uid}`}" alt="telegramjoin">tele</a>
<button on:click={rrrr}>cervrvr</button>