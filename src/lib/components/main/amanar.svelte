<!-- @migration-task Error while migrating Svelte code: can't migrate `let selected = [];` to `$state` because there's a variable named state.
     Rename the variable and try again or migrate by hand. -->
﻿
<script>
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { email } from '../registration/email.js'
    import { regHelper } from '../../stores/regHelper.js';
        import { goto } from '$app/navigation';
        import * as yup from "yup";
            import { liUN } from '$lib/stores/liUN.js';

                    import { onMount } from 'svelte';
   import { RingLoader
} from 'svelte-loading-spinners';
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
      import Tikun from './tikunar.svelte';
            import TRan from './tranarb.svelte';
      import {  doesLang, langUs, lang } from '$lib/stores/lang.js'
const baseUrl = import.meta.env.VITE_URL
import { Head } from 'svead'
  let title = ' 1💗1 | التوافق العالمي من أجل الحرية'
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`
  let description = "يمثل التوافق العالمي من أجل الحرية اتفاقًا جماعيًا للالتزام بعدم العنف واحترام الآخرين والخير الأصيل الكامن في الإنسانية. من خلال المشاركة في هذا التوافق، يلتزم الأفراد بخلق عالم حيث لا تعرِّف الإكراه والنزاع والعدوانية التواصل الإنساني بعد الآن |.يمكن لأولئك الذين يوافقون على هذه المبادئ الانضمام والتسجيل على منصة 1💗1، حيث يمكنهم إنشاء وإدارة شراكات بطريقة تعتمد على التوافق. دعونا نبني عالمًا حيث تسود الحرية وتجد الخلافات حلاً من خلال الموافقة المشتركة."
  let url = "https://1lev1.com/aitifaqia"
function find_contry_id(contry_name_arr){
     var  arr = [];
      for (let j = 0; j< contry_name_arr.length; j++ ){
      for (let i = 0; i< country.length; i++){
        if(country[i].ar === contry_name_arr[j]){
          arr.push(country[i].value)  ;
        }
      }
      }
      return arr;
     };
     let fpp = [];
  let fppp = [];
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

    const country =  [
                    { value: 104 , label: 'Israel', heb: 'ישראל', ar: "إسرائيل	"},
                    { value: 167 , label: 'Palestine jehuda & sumeria', heb: 'הרשות הפלסטינית יו"ש', ar: "دولة فلسطين	"},
                    { value: 246 , label: 'Palestine gaza strip', heb: 'רצועת עזה', ar: "قطاع غزّة"},
                    { value: 230 , label: 'United States', heb: 'ארצות הברית של אמריקה', ar: "الولايات المتحدة"},
                    { value: 245, label: 'Åland Islands', heb: 'אולנד', ar: "جزر أولاند" },
                    { value: 11, label: 'Afghanistan'  ,heb: 'אפגניסטן', ar: "أفغانستان" },
                    { value: 1, label: 'Albania' ,heb: 'אלבניה', ar: "ألبانيا" },
                    { value: 13, label: 'Algeria' ,heb: 'אלג\'יריה' , ar: "الجزائر	"},
                    { value: 2, label: 'American Samoa' ,heb: 'סמואה האמריקנית', ar: "ساموا-الأمريكي"},
                    { value: 7, label: 'Andorra' ,heb: 'אנדורה', ar: "أندورا"},
                    { value: 3, label: 'Angola' ,heb: 'אנגולה', ar: "أنجولا	"},
                    { value: 4, label: 'Anguilla' ,heb: 'אנגווילה', ar: "أنجويلا"},
                    { value: 5, label: 'Antarctica' ,heb: 'אנטרטיקה', ar: "المنطقة القطبية الجنوبية"},
                    { value: 6, label: 'Antigua and Barbuda', heb: 'אנטיגואה וברבודה', ar: "أنتيغوا وباربودا	"},
                    { value: 8, label: 'Argentina', heb: 'ארגנטינה', ar: "الأرجنتين"},
                    { value: 14, label: 'Armenia', heb: 'ארמניה', ar: "أرمينيا"},
                    { value: 9, label: 'Aruba', heb: 'ארובה', ar: "أروبا"},
                    { value: 10, label: 'Australia', heb: 'אוסטרליה', ar: "أستراليا"},
                    { value: 12, label: 'Austria', heb: 'אוסטריה', ar: "النمسا"},
                    { value: 15, label: 'Azerbaijan' , heb: 'אזרבייג\'ן', ar: "أذربيجان"},
                    { value: 16, label: 'Bahamas' , heb: 'איי בהאמה', ar: "باهاماس"},
                    { value: 17, label: 'Bahrain' , heb: 'בחריין', ar: "البحرين"},
                    { value: 18, label: 'Bangladesh', heb: 'בנגלדש', ar: "بنجلاديش"},
                    { value: 19, label: 'Barbados', heb: 'ברבדוס', ar: "باربادوس"},
                    { value: 20, label: 'Belarus', heb: 'בלרוס', ar: "بيلاروس"},
                    { value: 21, label: 'Belgium', heb: 'בלגיה', ar: "بلجيكا"},
                    { value: 22, label: 'Belize', heb: 'בליז', ar: "بيليز"},
                    { value: 26, label: 'Benin', heb: 'בנין', ar: "بنين"},
                    { value: 24, label: 'Bermuda', heb: 'ברמודה', ar: "برمودا"},
                    { value: 27, label: 'Bhutan', heb: 'בהוטאן', ar: "بوتان"},
                    { value: 23, label: 'Bolivia', heb: 'בוליביה', ar: "بوليفيا"},
                    { value: 247, label: 'Bonaire, Sint Eustatius and Saba', heb: 'האיים הקריביים ההולנדיים', ar: "الجزر الكاريبية الهولندية"},
                    { value: 25, label: 'Bosnia and Herzegovina', heb: 'בוסניה והרצגובינה', ar: "البوسنة والهرسك	"},
                    { value: 28, label: 'Botswana', heb: 'בוטסואנה', ar: "بوتسوانا"},
                    { value: 29, label: 'Bouvet Island', heb: 'בובה', ar: "جزيرة بوفيه"},
                    { value: 30, label: 'Brazil', heb: 'ברזיל', ar: "البرازيل"},
                    { value: 31, label: 'British Indian Ocean Territory', heb: 'הטריטוריה הבריטית באוקיינוס ההודי', ar: "إقليم المحيط الهندي البريطاني"},
                    { value: 32, label: 'Brunei Darussalam', heb: 'ברוניי דארוסלאם', ar: "بروناي"},
                    { value: 34, label: 'Bulgaria', heb: 'בולגריה', ar: "بلغاريا"},
                    { value: 33, label: 'Burkina Faso',  heb: 'בורקינה פאסו', ar: "بوركينا فاسو"}, 
                    { value: 36, label: 'Burundi',  heb: 'בורונדי', ar: "بوروندي"}, 
                    { value: 35, label: 'Cambodia',  heb: 'קמבודיה', ar: "كمبوديا"}, 
                    { value: 37, label: 'Cameroon',  heb: 'קמרון', ar: "كاميرون"}, 
                    { value: 39, label: 'Canada',  heb: 'קנדה', ar: "كندا"}, 
                    { value: 38, label: 'Cape Verde',  heb: 'כף ורדה', ar: "الرأس الأخضر"}, 
                    { value: 40, label: 'Cayman Islands', heb: 'איי קיימן', ar: "جزر كايمان"}, 
                    { value: 41, label: 'Central African Republic', heb: ' הרפובליקה המרכז אפריקאית ', ar: "جمهورية أفريقيا الوسطى"},
                    { value: 42, label: 'Chad', heb: 'צ\'אד', ar: "تشاد"},
                    { value: 43, label: 'Chile', heb: 'צ\'ילה', ar: "تشيلي"},
                    { value: 44, label: 'China', heb: 'סין', ar: "الصين"},
                    { value: 45, label: 'Christmas Island', heb: 'איי חג המולד', ar: "جزيرة كريسماس"},
                    { value: 49, label: 'Cocos (Keeling) Islands', heb: 'איי קוקוס', ar: "جزر كوكوس"},
                    { value: 47, label: 'Colombia', heb: 'קולומביה', ar: "كولومبيا"},
                    { value: 48, label: 'Comoros', heb: 'איי קומורו', ar: "جزر القمر"},
                    { value: 46, label: 'Congo', heb: 'קונגו', ar: "جمهورية الكونغو"},
                    { value: 216, label: 'Congo, The Democratic Republic of The', heb: 'הרפובליקה העממית של קונגו', ar: "جمهورية الكونغو الديمقراطية"},
                    { value: 50, label: 'Cook Islands', heb: 'איי קוק', ar: "جزر كوك"},
                    { value: 51, label: 'Costa Rica', heb: 'קוסטה ריקה', ar: "كوستاريكا"},
                    { value: 248, label: 'Cote D\'ivoire', heb: 'חוף השנהב', ar: "ساحل العاج"},
                    { value: 52, label: 'Croatia', heb: 'קרואטיה', ar: "كرواتيا"},
                    { value: 53, label: 'Cuba', heb: 'קובה', ar: "كوبا"},
                    { value: 249, label: 'Curaçao', heb: 'קוראסאו', ar: "كوراساو"},
                    { value: 54, label: 'Cyprus', heb: 'קפריסין', ar: "قبرص"},
                    { value: 57, label: 'Czech Republic', heb: 'צ\'כיה', ar: "التشيك"},
                    { value: 55, label: 'Denmark', heb: 'דנמרק', ar: "الدنمارك"},
                    { value: 58, label: 'Djibouti', heb: 'ג\'יבוטי', ar: "جيبوتي"},
                    { value: 56, label: 'Dominica', heb: 'דומיניקה', ar: "دومينيكا"},
                    { value: 59, label: 'Dominican Republic', heb: 'הרפובליקה הדומיניקנית', ar: "جمهورية الدومينيكان	"},
                    { value: 61, label: 'Ecuador', heb: 'אקוודור', ar: "الإكوادور	"},
                    { value: 62, label: 'Egypt', heb: 'מצריים', ar: "مصر"},
                    { value: 63, label: 'El Salvador', heb: 'אל סלבדור', ar: "السلفادور"},
                    { value: 66, label: 'Equatorial Guinea', heb: 'גינאה המשוונית', ar: "غينيا الاستوائية	"},
                    { value: 65, label: 'Eritrea', heb: 'אריתראה', ar: "إريتريا"},
                    { value: 69, label: 'Estonia', heb: 'אסטוניה', ar: "إستونيا"},
                    { value: 250, label: 'Eswatini', heb: 'אסוואטיני', ar: "إسواتيني"},
                    { value: 70, label: 'Ethiopia', heb: 'אתיופיה', ar: "إثيوبيا"},
                    { value: 67, label: 'Falkland Islands (Malvinas)', heb: 'איי מאלבינס (איי פוקלנד)', ar: "جزر فوكلاند"},
                    { value: 68, label: 'Faroe Islands', heb: 'איי פארו', ar: "جزر فارو"},
                    { value: 71, label: 'Fiji', heb: 'פיג\'י', ar: "فيجي"},
                    { value: 72, label: 'Finland', heb: 'פינלנד', ar: "فنلندا"},
                    { value: 73, label: 'France', heb: 'צרפת', ar: "فرنسا	"},
                    { value: 74, label: 'French Guiana', heb: 'גויאנה הצרפתית', ar: "غينيا الفرنسية	"},
                    { value: 75, label: 'French Polynesia', heb: 'פולינזיה הצרפתית', ar: "بولينيزيا الفرنسية	"},
                    { value: 78, label: 'French Southern Territories', heb: 'הארצות הדרומיות והאנטרקטיות של צרפת', ar: "أراض فرنسية جنوبية وأنتارتيكية"},
                    { value: 79, label: 'Gabon', heb: 'גאבון', ar: "الغابون"},
                    { value: 76, label: 'Gambia', heb: 'גמביה', ar: "غامبيا"},
                    { value: 77 , label: 'Georgia', heb: 'גאורגיה', ar: "جورجيا"},
                    { value: 80 , label: 'Germany', heb: 'גרמניה', ar: "ألمانيا"},
                    { value: 81 , label: 'Ghana', heb: 'גאנה', ar: "غانا"},
                    { value: 82 , label: 'Gibraltar', heb: 'גיברלטר', ar: "جبل طارق"},
                    { value: 84 , label: 'Greece', heb: 'יוון', ar: "اليونان"},
                    { value: 83 , label: 'Greenland', heb: 'גרינלנד', ar: "جرينلاند"},
                    { value: 85 , label: 'Grenada', heb: 'גרנדה', ar: "غرينادا"},
                    { value: 86 , label: 'Guadeloupe', heb: 'גוואדלופ', ar: "غوادلوب"},
                    { value: 87 , label: 'Guam', heb: 'גואם', ar: "غوام"},
                    { value: 88 , label: 'Guatemala', heb: 'גואטמלה', ar: "غواتيمال"},
                    { value: 251 , label: 'Guernsey', heb: 'גרנזי', ar: "غيرنزي"},
                    { value: 90 , label: 'Guinea', heb: 'גינאה', ar: "غينيا"},
                    { value: 89 , label: 'Guinea-bissau', heb: 'גינאה-ביסאו', ar: "غينيا بيساو	"},
                    { value: 91 , label: 'Guyana', heb: 'גויאנה', ar: "غيانا"},
                    { value: 92 , label: 'Haiti', heb: 'האיטי', ar: "هايتي"},
                    { value: 93 , label: 'Heard Island and Mcdonald Islands', heb: 'האי הרד ואיי מקדונלד', ar:"جزيرة هيرد وجزر ماكدونالد"},
                    { value: 94 , label: 'Holy See (Vatican City State)', heb: 'וותיקן', ar: "الفاتيكان"},
                    { value: 98 , label: 'Honduras', heb: 'הונדורס', ar: "هندوراس"},
                    { value: 96 , label: 'Hong Kong', heb: 'הונג קונג', ar: "هونغ كونغ	"},
                    { value: 95 , label: 'Hungary', heb: 'הונגריה', ar: "المجر"},
                    { value: 97 , label: 'Iceland', heb: 'איסלנד', ar: "أيسلندا"},
                    { value: 99 , label: 'India', heb: 'הודו', ar: "الهند"},
                    { value: 100 , label: 'Indonesia', heb: 'אינדונזיה', ar: "إندونيسيا"},
                    { value: 101 , label: 'Iran, Islamic Republic of', heb: 'איראן', ar: "إيران"},
                    { value: 102 , label: 'Iraq', heb: 'עירק', ar: "العراق"},
                    { value: 103 , label: 'Ireland', heb: 'אירלנד', ar: "جمهورية أيرلندا	"},
                    { value: 252 , label: 'Isle of Man', heb: 'האי מאן', ar: "جزيرة مان"},
                    { value: 105 , label: 'Italy', heb: 'איטליה', ar: "إيطاليا"},
                    { value: 107 , label: 'Jamaica', heb: 'ג\'מייקה', ar: "جامايكا"},
                    { value: 109 , label: 'Japan', heb: 'יפן', ar: "اليابان"},
                    { value: 253 , label: 'Jersey', heb: 'ג\'רזי', ar: "جيرزي"},
                    { value: 108 , label: 'Jordan', heb: 'ירדן', ar: "الأردن"},
                    { value: 110 , label: 'Kazakhstan', heb: 'קזחסטן', ar: "كازاخستان"},
                    { value: 111 , label: 'Kenya', heb: 'קניה', ar: "كينيا" },
                    { value: 112 , label: 'Kiribati', heb: 'קיריבאטי', ar: "كيريباتي" },
                    { value: 160 , label: 'Korea, Democratic People\'s Republic of', heb: 'קוריאה הצפונית', ar: "كوريا الشمالية"},
                    { value: 201 , label: 'Korea, Republic of', heb: 'קוריאה הדרומית', ar: "كوريا الجنوبية"},
                    { value: 113 , label: 'Kuwait', heb: 'כווית', ar: "الكويت"},
                    { value: 254 , label: 'Kurdistan', heb: 'כורדיסטאן', ar: "كردستان"},
                    { value: 114 , label: 'Kyrgyzstan', heb: 'קירג\'יסטן', ar: "قيرغيزستان"},
                    { value: 115 , label: 'Lao People\'s Democratic Republic, laos', heb: 'לאוס', ar: "لاوس"},
                    { value: 116 , label: 'Latvia', heb: 'לטביה', ar: "لاتفيا"},
                    { value: 117 , label: 'Lebanon', heb: 'לבנון' , ar: "لبنان"},
                    { value: 118 , label: 'Lesotho', heb: 'לסוטו', ar: "ليسوتو"},
                    { value: 119 , label: 'Liberia', heb: 'ליבריה', ar: "ليبيريا"},
                    { value: 121 , label: 'Libyan Arab Jamahiriya', heb: 'לוב', ar:"ليبيا"},
                    { value: 120 , label: 'Liechtenstein', heb: 'ליכטנשטיין', ar: "ليختنشتاين"},
                    { value: 122 , label: 'Lithuania', heb: 'ליטא', ar: "ليتوانيا"},
                    { value: 125 , label: 'Luxembourg', heb: 'לוקסמבורג', ar: "لوكسمبورغ"},
                    { value: 123 , label: 'Macao', heb: 'מקאו', ar: "ماكاو"},
                    { value: 126 , label: 'Madagascar', heb: 'מדגסקר', ar: "مدغشقر"},
                    { value: 127 , label: 'Malawi', heb: 'מלאווי', ar: "مالاوي"},
                    { value: 128 , label: 'Malaysia', heb: 'מלזיה', ar: "ماليزيا"},
                    { value: 129 , label: 'Maldives', heb: 'איי המלדיביים', ar: "المالديف"},
                    { value: 130 , label: 'Mali', heb: 'מאלי', ar: "مالي"},
                    { value: 132 , label: 'Malta', heb: 'מלטה', ar: "مالطا"},
                    { value: 131 , label: 'Marshall Islands', heb: 'איי מרשל', ar: "جزر مارشال	"},
                    { value: 135 , label: 'Martinique', heb: 'מרטיניק', ar: "مارتينيك"},
                    { value: 134 , label: 'Mauritania', heb: 'מאוריטניה', ar: "موريتانيا"},
                    { value: 133 , label: 'Mauritius', heb: 'מאוריציוס', ar: "موريشيوس"},
                    { value: 136 , label: 'Mayotte', heb: 'מאיוט', ar: "مايوت"},
                    { value: 138 , label: 'Mexico', heb: 'מכסיקו', ar: "المكسيك"},
                    { value: 137 , label: 'Micronesia, Federated States of', heb: 'מיקרונזיה', ar: "ولايات ميكرونيسيا المتحدة	"},
                    { value: 139 , label: 'Moldova, Republic of', heb: 'מולדובה', ar: "مولدوفا"},
                    { value: 140 , label: 'Monaco', heb: 'מונקו', ar: "موناكو"},
                    { value: 142 , label: 'Mongolia', heb: 'מונגוליה', ar: "منغوليا"},
                    { value: 141 , label: 'Montenegro', heb: 'מונטנגרו', ar: "الجبل الأسو"},
                    { value: 143 , label: 'Montserrat', heb: 'מונסראט', ar: "مونتسرات"},
                    { value: 145 , label: 'Morocco', heb: 'מרוקו', ar: "المغرب"},
                    { value: 144 , label: 'Mozambique', heb: 'מוזמביק', ar: "موزمبيق"},
                    { value: 149 , label: 'Myanmar', heb: 'מיאנמר (בורמה)', ar: "(بورما) ميانمار	"},
                    { value: 146 , label: 'Namibia', heb: 'נמיביה', ar: "ناميبيا"},
                    { value: 147 , label: 'Nauru', heb: 'נאורו', ar: "ناورو"},
                    { value: 150 , label: 'Nepal', heb: 'נפאל', ar: "نيبال"},
                    { value: 152 , label: 'Netherlands', heb: 'הולנד', ar: "هولندا"},
                    { value: 148 , label: 'Netherlands Antilles', heb: 'האנטילים ההולנדיים', ar: "جزر الأنتيل الهولندية"},
                    { value: 151 , label: 'New Caledonia', heb: 'קלדוניה החדשה', ar: "كاليدونيا الجديدة	"},
                    { value: 153 , label: 'New Zealand', heb: 'ניו זינלנד', ar: "نيوزيلندا	"},
                    { value: 155 , label: 'Nicaragua', heb: 'ניקרגואה', ar: "نيكاراجوا	"},
                    { value: 154 , label: 'Niger', heb: 'ניז\'ר', ar: "النيجر"},
                    { value: 156 , label: 'Nigeria', heb: 'ניגריה', ar: "نيجيريا"},
                    { value: 157 , label: 'Niue', heb: 'ניואה', ar: "نييوي"},
                    { value: 158 , label: 'Norfolk Island', heb: 'האי נורפוק', ar: "جزيرة نورفولك"},
                    { value: 124 , label: 'North Macedonia', heb: 'מקדוניה (FYROM)', ar: "مقدونيا الشمالية"},
                    { value: 161 , label: 'Northern Mariana Islands', heb: 'איי מריאנה הצפוניים', ar: "جزر ماريانا الشمالية	"},
                    { value: 162 , label: 'Norway', heb: 'נורווגיה', ar: "النرويج"},
                    { value: 164 , label: 'Oman', heb: 'עומאן', ar: "عُمان"},
                    { value: 163 , label: 'Pakistan', heb: 'פקיסטאן', ar: "باكستان"},
                    { value: 165 , label: 'Palau', heb: 'פלאו', ar: "بالاو"},
                    { value: 166 , label: 'Panama', heb: 'פנמה', ar: "بنما"},
                    { value: 168 , label: 'Papua New Guinea', heb: 'פפואה ניו גינאה', ar: "بابوا غينيا الجديدة"},
                    { value: 169 , label: 'Paraguay', heb: 'פרגוואי', ar: "باراغواي"},
                    { value: 170 , label: 'Peru', heb: 'פרו', ar: "بيرو"},
                    { value: 171 , label: 'Philippines', heb: 'פיליפינים', ar: "الفلبين"},
                    { value: 172 , label: 'Pitcairn', heb: 'איי פיטקיירן', ar: "جزر بيتكيرن"},
                    { value: 174 , label: 'Poland', heb: 'פולין', ar: "بولندا"},
                    { value: 173 , label: 'Portugal', heb: 'פורטוגל', ar: "البرتغال"},
                    { value: 175 , label: 'Puerto Rico', heb: 'פורטו ריקו', ar: "بورتوريكو	"},
                    { value: 176 , label: 'Qatar', heb: 'קטאר', ar: "قطر"},
                    { value: 177 , label: 'Reunion', heb: 'ראוניון', ar: "ريونيون"},
                    { value: 178 , label: 'Romania', heb: 'רומניה', ar: "رومانيا"},
                    { value: 179 , label: 'Russian Federation', heb: 'רוסיה', ar: "روسيا"},
                    { value: 180 , label: 'Rwanda', heb: 'רוואנדה', ar: "رواندا"},
                    { value: 255 , label: 'Saint Barthélemyn', heb: 'סן ברתלמי', ar: "سان بارتيلمي"},
                    { value: 181 , label: 'Saint Helenan', heb: 'סנט הלנה', ar: "سانت هيلينا"},
                    { value: 182 , label: 'Saint Kitts and Nevis', heb: 'סנט קיטס ונוויס', ar: "سانت كيتس ونيفيس	"},
                    { value: 183 , label: 'Saint Lucia', heb: 'סנט לוסיה', ar: "سانت لوسيا"},
                    { value: 256 , label: 'Saint Martin (French part)', heb: 'סן מרטן', ar: "تجمع سان مارتين"},
                    { value: 184 , label: 'Saint Pierre and Miquelon', heb: 'סנט פייר ומיקלון', ar: "سان بيير وميكلون"},
                    { value: 185 , label: 'Saint Vincent and The Grenadines', heb: 'סנט וינסנט והגרנדינים', ar: "سانت فينسنت والغرينادين"},
                    { value: 186 , label: 'Samoa', heb: 'סמואה', ar: "ساموا	"},
                    { value: 187 , label: 'San Marino', heb: 'סן מרינו', ar: "سان مارينو"},
                    { value: 188 , label: 'Sao Tome and Principe', heb: 'סאו טומה ופרינסיפה', ar: "ساو تومي وبرينسيب"},
                    { value: 189 , label: 'Saudi Arabia', heb: 'ערב הסעודית', ar: "السعودية"},
                    { value: 191 , label: 'Senegal', heb: 'סנגל', ar: "السنغال"},
                    { value: 192 , label: 'Serbia', heb: 'סרביה', ar: "صربيا"},
                    { value: 194 , label: 'Seychelles', heb: 'סיישל', ar: "سيشل"},
                    { value: 193 , label: 'Sierra Leone', heb: 'סיירה לאון', ar: "سيراليون"},
                    { value: 195 , label: 'Singapore', heb: 'סינגפור ', ar: "سنغافورة"},
                    { value: 257 , label: 'Sint Maarten (Dutch part)', heb: 'סנט מארטן', ar: "سينت مارتن"},
                    { value: 196 , label: 'Slovakia', heb: 'סלובקיה', ar: "سلوفاكيا"},
                    { value: 199 , label: 'Slovenia', heb: 'סלובניה', ar: "سلوفينيا"},
                    { value: 198 , label: 'Solomon Islands', heb: 'איי שלמה', ar: "جزر سليمان"},
                    { value: 211 , label: 'Somalia', heb: 'סומליה', ar: "الصومال"},
                    { value: 197 , label: 'South Africa', heb: 'דרום אפריקה', ar: "جنوب أفريقيا"},
                    { value: 200 , label: 'South Georgia and The South Sandwich Islands', heb: 'איי ג\'ורג\'יה הדרומית ואיי סנדוויץ\' הדרומיים', ar: "جورجيا الجنوبية وجزر ساندويتش الجنوبية"},
                    { value: 202 , label: 'South Sudan', heb: 'דרום סודן', ar: "جنوب السودان"},
                    { value: 203 , label: 'Spain', heb: 'ספרד', ar: "إسبانيا"},
                    { value: 204 , label: 'Sri Lanka', heb: 'סרי לנקה', ar: "سريلانكا"},
                    { value: 205 , label: 'Sudan', heb: 'סודן', ar: "السودان"},
                    { value: 206 , label: 'Suriname', heb: 'סורינאם', ar: "سورينام"},
                    { value: 209 , label: 'Svalbard and Jan Mayen', heb: 'סבאלברד ויאן מאיין', ar: "سفالبارد"},
                    { value: 207 , label: 'Swaziland', heb: 'אסוואטיני', ar: "سوازيلند (إسواتيني)"},
                    { value: 208 , label: 'Sweden', heb: 'שוודיה', ar: "السويد"},
                    { value: 210 , label: 'Switzerland', heb: 'שוויץ', ar:"سويسرا"},
                    { value: 212 , label: 'Syrian Arab Republic', heb: 'סוריה', ar: "سوريا"},
                    { value: 258 , label: 'Taiwan', heb: 'טייוואן', ar:"تايوان"},
                    { value: 213 , label: 'Tajikistan', heb: 'טג\'יקיסטן', ar: "طاجيكستان"},
                    { value: 215 , label: 'Tanzania, United Republic of', heb: 'טנזניה', ar: "تنزانيا"},
                    { value: 214 , label: 'Thailand', heb: 'תאילנד', ar: "تايلاند"},
                    { value: 60 , label: 'Timor-east', heb: 'מזרח טימור', ar: "تيمور الشرقية"},
                    { value: 218 , label: 'Togo', heb: 'טוגו', ar: "توغو"},
                    { value: 217 , label: 'Tokelau', heb: 'טוקלאו', ar: "توكيلاو"},
                    { value: 219 , label: 'Tonga', heb: 'טונגה', ar: "تونغا"},
                    { value: 220 , label: 'Trinidad and Tobago', heb: 'טרינידד וטובגו', ar: "ترينيداد وتوباغو	"},
                    { value: 221 , label: 'Tunisia', heb: 'תוניסיה', ar: "تونس"},
                    { value: 224 , label: 'Turkey', heb: 'טורקיה', ar: "تركيا"},
                    { value: 222 , label: 'Turkmenistan', heb: 'טורקמניסטן', ar:"تركمانستان"},
                    { value: 223 , label: 'Turks and Caicos Islands', heb: 'איי טרקס וקייקוס', ar: "جزر توركس وكايكوس"},
                    { value: 225 , label: 'Tuvalu', heb: 'טובאלו', ar: "توفالو"},
                    { value: 226 , label: 'Uganda', heb: 'אוגנדה', ar: "أوغندا"},
                    { value: 227 , label: 'Ukraine', heb: 'אוקראינה', ar: "أوكرانيا"},
                    { value: 228 , label: 'United Arab Emirates', heb: 'איחוד האמירויות הערביות', ar: "الإمارات العربية المتحدة	"},
                    { value: 229 , label: 'United Kingdom', heb: 'אנגליה', ar:"المملكة المتحدة	"},
                    { value: 233 , label: 'United States Minor Outlying Islands', heb: 'האיים המרוחקים הקטנים של ארה״ב', ar: "جزر الولايات المتحدة الصغيرة النائية"},
                    { value: 231 , label: 'Uruguay', heb: 'אורוגוואי', ar: "أوروغواي"},
                    { value: 232 , label: 'Uzbekistan', heb: 'אוזבקיסטן', ar: "أوزبكستان"},
                    { value: 234 , label: 'Vanuatu', heb: 'ונואטו', ar: "فانواتو"},
                    { value: 235 , label: 'Venezuela', heb: 'ונצואלה', ar: "فنزويلا	"},
                    { value: 236 , label: 'Viet Nam', heb: 'ויטנאם', ar: "فيتنام"},
                    { value: 237 , label: 'Virgin Islands, British', heb: 'איי הבתולה הבריטיים', ar: "جزر العذراء البريطانية	"},
                    { value: 239 , label: 'Virgin Islands, U.S.', heb: 'איי הבתולה של ארצות הברית', ar: "جزر العذراء الأمريكية	"},
                    { value: 240 , label: 'Wallis and Futuna', heb: 'ואליס ופוטונה', ar: "واليس وفوتونا	"},
                    { value: 241 , label: 'Western Sahara', heb: 'סהרה המערבית', ar: "الصحراء الغربية	"},
                    { value: 242 , label: 'Yemen', heb: 'תימן', ar: "اليمن"},
                    { value: 244 , label: 'Zambia', heb: 'זמביה', ar: "زامبيا	"},
                    { value: 243 , label: 'Zimbabwe', heb: 'זימבבואה', ar: "زيمبابوي"},
                    { value: 259, label: "tibet", heb: "טיבט", ar: "التبت"}
                  ];
    const nameC = `country`;
    const placeholder = `الدول التي أنت مواطنها`;
    const required = true;
    
    let selected = [];
       let already = false;
   let datar;
   let idx = 1;
   let data;
    import { createForm } from "svelte-forms-lib";
  import Text1lev1 from '$lib/celim/ui/text1lev1.svelte';
    
const { form, errors, state, handleChange, handleSubmit } = createForm({
          initialValues: {
            name: "",
            email: "",
            countries: []
          },
      validationSchema: yup.object().shape({
        name: yup.string().required(),
        email: yup
          .string()
          .email()
          .required()
      }),
onSubmit: values => {
            fetch(baseUrl+'/api/chezins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      "data": {
        name: $form.name,
        email: $form.email,
        countries: find_contry_id(selected)
      }}),
    }) 
      .then(response => response.json())
      .then(data => 
       datar);
            userName.set($form.name);
            email.set($form.email);
            regHelper.set(1);
            datar = data;
            already = true;
            liUN.set($form.name);
            setTimeout(function() { doesLang.set(true)
                                    langUs.set("en")
                                    lang.set("en")
                                   goto("/en")}, 2500)
          }
        });

function show (){
  const amana = document.getElementById("amana-show")
  const lines = document.getElementById("lines")
  
}let trans = false;
function tran (){
trans = !trans;
}
let error;
function change(la){
  if (la == "he"){
    doesLang.set(true)
    langUs.set("he")
    lang.set("he")
    console.log("change", $lang)
    goto("/hascama")
    
  }else if(la == "en"){
    doesLang.set(true)
    langUs.set("en")
    lang.set("en")
    console.log("change", $lang)
    goto("/en")
  }
}
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
            const res = await fetch(baseUrl+"/api/chezins/count", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
 idx = res + 2
        } catch (e) {
            error = e
        }
    });
      let dow;
    function scrollTo() {
		dow.scrollIntoView({ behavior: 'smooth' });
	}
     
 let isOpen = false;
let a = 0;

function sell(){
isOpen = true;
a = 0;
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
</script>
   <Head {title} {description} {image} {url} />
  
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content" aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>الغاء</button>
          {#if a == 0}
 <Tikun  on:done={done} on:erore={erore}/>
         
                    {:else if a == 4}
 <TRan on:done={done} on:erore={erorer}/>
         
                    {:else if a == 1}
          <div class="sp bg-gold">
            <h3 class="text-barbi">تم الإرسال بنجاح ، شكرًا جزيلاً سنتواصل معك</h3>
          </div>
                    {:else if a == 2}

          <div class="flex text-center items-center justify-center bg-gold">
            <h3 class="text-barbi">لحظة من فضلك</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
         {:else if a == 3}
         <h1>حدث خطأ</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" on:click={()=> a = 0}>أعد المحاولة</button>
         {:else if a == 5}
         <h1>حدث خطأ</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" on:click={()=> a = 4}>أعد المحاولة</button>
        
         {/if}
  </DialogContent>
  </div>
</DialogOverlay>

   
      <div class="all">
          <div style="position:absolute ; left: 1%; top: 1%; display: flex; flex-direction: column ; z-index: 699;">
              {#if trans === false}
          <button on:click={tran}><img alt="translation" src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"></button>
          {:else}
          <button on:click={tran} class=" text-barbi hover:text-lturk "
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
<!--todo: to home-->
          <button style="border-bottom-width: 4px; border-color: var(--gold);" class="text-barbi  text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 "   on:click={()=>change("en")} >English</button>
          <button class="text-barbi text-bold hover:text-lturk text-center bg-lturk hover:bg-barbi px-1 py-0.5 "  on:click={()=>change("he")}>עברית</button>
                        <button on:click={sell} title=" اطلب تغيير النص" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " >اطلب تغيير النص</button>
                  <button on:click={tr} title="الترجمة إلى لغات أخرى" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " >ترجم</button>
                  <button on:click={()=>goto('/ar')} title="1💗1" class="text-barbi border-2 border-gold text-bold hover:text-lturk bg-lturk text-center hover:bg-barbi px-1 py-0.5 " ><Text1lev1/></button>
  
                  {/if}
          </div>
      <div class="mobile">
        

<section class="container" dir="rtl" id="lines"> 
    
<div class="flexi">
  <h3
       class="amanat" 
       style="white-space: nowrap; font-family: StamSefarad, serif; font-size: 1em; line-height: normal;" 
       dir="rtl">
     البيان من: 
      </h3>
  <input 
          id="name"
          name="name"
          placeholder="اسم"
          required
                on:blur={handleChange}

          on:change={handleChange}
          bind:value={$form.name}
        /> 
     {#if $errors.name}
      <small>{$errors.name}</small>
    {/if}
</div>
<div class="flexi1">
  <h3        class="amanat " id="m" 
 style="font-family: StamSefarad, serif; font-size: 1em;" dir="rtl">من: </h3> 
      <MultiSelect
      bind:selected
      {nameC} 
      {placeholder}
      options={country.map(c => c.ar)}
       {required}
       />  </div>    
<div class="flexi2">
  <h3        class="amanat" 
 style="    white-space: nowrap; font-family: 'StamSefarad', serif; font-size: 1em; line-height:normal;" dir="rtl">البريد الإلكتروني</h3>
  <input
 
    placeholder="البريد الإلكتروني"
    id="email"
    name="email"
    required
          on:blur={handleChange}
    on:change={handleChange}
    bind:value={$form.email}
    />
 {#if $errors.email}
      <small>{$errors.email}</small>
    {/if}
</div>
    </section>
     <div class="onlym"> <button alt="click-to-scroll-down" class="ca3-scroll-down-link ca3-scroll-down-arrow" data-ca3_iconfont="ETmodules" on:click={scrollTo}  data-ca3_icon=""></button></div>    
    </div> 
    <div class="aab" bind:this={dow}>
<div dir="rtl" class="amana" id="amana-show">
   <div class="card  bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]">
  <div class="card-overlay "></div>
  <div class="card-inner d overflow-y-auto ">
<h1 dir="rtl" style="color:#cc0066; text-shadow: 1px 1px black ; ">
     إعلان استقلال
        <span style=" text-shadow: 1px 1px var(--mturk); font-family: 'Gan';">{$form.name ? $form.name : "__"}</span>
        :
    </h1>
          <span style="font-family:David;" class="text-bold text-transparent bg-clip-text  bg-[linear-gradient(to_bottom_right,theme(colors.gra),theme(colors.grc),theme(colors.gre),theme(colors.grc),theme(colors.gra))]">
              <span  style="font-family:David;">
                أنا <span style="color:black; font-family:StamSefarad;   text-shadow: 1px 1px var(--mturk);">{$form.name ? $form.name : "__"}</span>  لا أريد أن أؤذي أي شخص ولن أؤذي أي شخص أبدًا.
                   <br>
           لأنني أعتقد أنه ليس هناك سلطة أو قيمة أو هدف أو إيمان أو مال أو مصلحة يمكن أن يبرر الإيذاء البشري أو العنف أو القوة.
              <br>
   أنا أؤمن بالخير الأساسي في الإنسان، وأتمنى وأتوقع أنه عندما يوافق جميع البشر على عدم العنف والحروب واستخدام القوة، سيتوقفون عن أن يكونوا وسيلة للتواصل البشري.
              <br>
              عندما يوافق جميع سكان  <span style="color: black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join( " وجميع سكان " )}`  : "__"}</span>  ويعيشون وفقًا لهذا الإيمان، سأتخلى عن سلاحي وعن الشرطيين المسلحين من دولة <span style="color:black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join(" ومن دولة ")}` : "__"}</span>  {selected.length > 1 ? "بأسمي" : "باسمها" } وسنعيش بحرية وبموافقة متبادلة. 
              <br>
               عندما يوافق جميع البشرية وتعيش وفقًا لهذا الإيمان، سأتخلى عن أسلحتي الخاصة بجيش <span style="color: black; font-family:StamSefarad;  text-shadow: 1px 1px var(--barbi-pink);">{selected.length > 0 ? `${selected.length < 2 ? selected : selected.join(" وجيش ") }`+ "." : "__."}</span> عندما تتخلى جميع جيوش العالم عن أسلحتها وتصبح البشرية ضعيفة وحرة
        <br>
         سأظل دائمًا أحل النزاعات وأديرها وأحلها في "رقميات" التي تجري على موقع 1💗1 فقط بموافقة متبادلة.
            </span>
    </div>
     </div>
     </div>


<form on:submit={handleSubmit}>

<div class="flexid">
   {#if already == false}

    <button
     class="button hover:scale-150"
      on:submit="{handleSubmit}"
      type="submit"
      ></button> 
      {:else if already == true}
  <h1 class="alredy" dir="rtl">{$form.name}
 تم استلام توقيعك ، لقد وصلت إلى الرقم {idx} ، سيتم إرسال بريد إلكتروني للتحديث عندما نتوسع ، قريبًا </h1>
<h2>The site other sections are not yet in arabic, you been transformed to the english site</h2>
 <!-- <button class="p-4 rounded-full bg-lturk hover:bg-barbi text-barbi hover:text-lturk" on:click={()=> goto("/about", )}>אודותינו</button>-->

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
     :global([data-svelte-dialog-content].content) {
  background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);

      width: 80vw;
  }
  @media (min-width: 568px){
  
        :global([data-svelte-dialog-content].content) {
 background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);

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
  bottom: 0px;
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
   .alredy{
           text-align: center;
           margin: 4vh  4vw 2vh 4vw;
          background-color: var(--gold);
          padding: 4vh 4vw;
          font-family: 'StamSefarad', serif;
          color: var(--barbi-pink);
          border: 1px var(--lturk);
   }

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
  padding: 0 1rem;
    text-shadow: 1px 1px var(--barbi-pink) ;
   background-color: var(--gold);
          opacity: 0.8;

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
    text-shadow: 1px 1px 4px var(--gold) ;
       background-color: transparent;
          opacity: 1;

 }

  .mobile{
             background-color: var(--gold);

    width: 100vw;
    height:100vh;
    margin:0px auto;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1648338694/Gold-German-Imperial-Crown-No-Background_4_cpunhj.svg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size:  130vw 100vh;
}

  .aab{
             background-color: var(--gold);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .flexid{
    display: flex;
    flex-direction: colomn;
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162205/anglit-removebg-preview_dcb8nd.png);  
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
    font-size:1.8;
  }
  .amanat{
  margin: 0 auto;
  padding: 0;
    text-shadow: 1px 1px 4px var(--gold) ;
    background-color: transparent;
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
             background-color: var(--gold);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
   .mobile{
              background-color: var(--gold);

    width: 100vw;
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162205/anglit-removebg-preview_dcb8nd.png);  
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
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
@media(min-width:942px) and (max-width:1099px) {
  .amanat{
padding: 0 1rem;
    text-shadow: 1px 1px var(--barbi-pink) ;
        background-color: var(--gold);
          opacity: 0.8;

}
 .mobile{
            background-color: var(--gold);

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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162205/anglit-removebg-preview_dcb8nd.png);  
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
    justify-content: center;
    align-items: center;
    order: 1;
  }
}

@media(min-width:1100px) {
      .card-inner {
  width: 84vw;
    height: calc(66vh - 180px);
    font-size: 1.9em;
  }
     .onlym{
  display: none;
}
  .flexid{
    display: flex;
    flex-direction: column;
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
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1641162205/anglit-removebg-preview_dcb8nd.png);  
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
@media(min-width:1200px) {

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
 :global(.multiselect) {
    max-width: 250px;
   
  }
  </style> 