<script>
  import { userName } from '../../stores/store.js';
  import { show } from '../registration/store-show.js';
  import  Hello  from '../registration/hello.svelte'
  import  Password from '../registration/password.svelte'
   import { goto } from '$app/navigation';
    import { lang } from '$lib/stores/lang.js'
  import {
    scale,
    fly
} from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
 import  Skills from '../registration/skills.svelte'
 import  VidValDate from '../registration/vidValDate.svelte'
 import Workways from '../registration/workways.svelte'
 import Roles from '../registration/roles.svelte'
  import Vallues from '../registration/vallues.svelte'
 // import Scree from '../registration/scree.svelte'
  import {spring } from 'svelte/motion'
let userName_value;
let show_value = 0;

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});
  export let idx = 1;
let ty = 0;
let w = 1;
let vb = 3322.126 + w;
const txx = spring(600+(w*20),{stiffness: 0.55,damping: 0.99});
function add (event){
  txx.set(event.detail.tx+(w*event.detail.txx));
  console.log(txx)
}
let title = {"he": "הרשמה ל-1❤️1", "en": "1❤️1 registration"};
let tu = { "he": "תודה", "en": "thank you"};
let see = { "he": "ולהתראות בקרוב", "en": "see you soon!"}
const buttn = { "he": "מייל אישור נשלח. לכל בעיה לחצו כדי לשלוח לנו מייל","en": "please check your email, if you did not receive please click here to contact us"}
const gtl = {"he":"לאחר האישור במייל להתחברות","en": "go to login (after confirming your email)"}
</script>
<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" in:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}" class="body" bind:clientWidth={w}>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="background">


{#if show_value == 0}
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="midscreen">

<Hello {idx} on:progres={add}/>
</div>
{:else if show_value == 1}
<div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 in:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}"
 out:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}">
<Vallues on:progres={add}/>
</div>
{:else if show_value == 2}
<div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 transition:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}">
<Skills on:progres={add}/>
</div>
{:else if show_value == 3}
<div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 transition:scale="{{duration: 130, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}">
 <Roles on:progres={add}/>
</div>
  {:else if show_value == 4}
  <div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 transition:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}"> 
  <Workways on:progres={add}/>
  </div>
 <!-- {:else if show_value == 5}  
<VidValDate on:progres={add}/>
 {:else if show_value == 5}
    <div class="midscreen"
 transition:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}"> 
   <Scree on:progres={add}/> 
   </div>  -->
  {:else if show_value == 5}
    <div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 transition:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}"> 
   <Password on:progres={add}/> 
   </div>  
  {:else if show_value == 6}
  <div class="midscreen" dir="{$lang == "en" ? "ltr" : "rtl"}"
 transition:scale="{{duration: 1300, delay: 200, opacity: 0.5, start: 0.5, easing: quintOut}}">
    <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="midscreenText-3"><h1>
      {tu[$lang]}
      <br>
{userName_value}
<br>
{see[$lang]}
</h1>
    <a href="mailto:ehad1one@gmail.com" ><p class="text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  hover:text-barbi px-2 rounded-full">{buttn[$lang]}</p></a>
   <!---- <button class="text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  hover:text-barbi p-2 rounded-full" on:click={() =>goto("./login") }>{gtl[$lang]}</button>-->
  </div>
  </div>
{/if}

<svg style="display:{show_value >= 1 ? '' : 'none'}" class="key"  width="100%" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="{`0 0 ${3322.126 + w*20} 1518.656`}" enable-background="new 0 0 2722.126 1518.656" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient gradientUnits="userSpaceOnUse" cx="1023.699" cy="448.468" r="843.488" id="gradient-1" gradientTransform="matrix(1.964807, -0.050779, 0.025836, 0.999666, -1004.848942, 91.27403)">
      <stop offset="0" style="stop-color: rgb(177, 219, 207);"/>
      <stop offset="0.155" style="stop-color: rgb(221, 221, 221);"/>
      <stop offset="0.385" style="stop-color: rgb(165, 67, 162);"/>
      <stop offset="0.678" style="stop-color: rgb(63, 140, 163);"/>
      <stop offset="0.891" style="stop-color: rgb(160, 42, 154);"/>
      <stop offset="1" style="stop-color: rgb(215, 113, 171);"/>
    </radialGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="917.793" y1="46.51" x2="917.793" y2="1473.928" id="gradient-0" spreadMethod="pad" gradientTransform="matrix(1, 0, 0, 1, -11.741394, 19.346125)">
      <stop offset="0" style="stop-color: rgb(70, 236, 222);"/>
      <stop offset="0.354" style="stop-color: rgb(255, 247, 0);"/>
      <stop offset="0.509" style="stop-color: rgb(245, 168, 35);"/>
      <stop offset="1" style="stop-color: rgb(2, 255, 112);"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="1796.683" y1="46.512" x2="1796.683" y2="800.321" id="gradient-4" gradientTransform="matrix(1, 0, 0, 1, -5.591242, 39.141397)">
      <stop offset="0" style="stop-color: rgb(222, 176, 42);"/>
      <stop offset="0.412" style="stop-color: rgb(124, 211, 73);"/>
      <stop offset="0.836" style="stop-color: rgb(221, 177, 43);"/>
      <stop offset="1" style="stop-color: rgba(204, 204, 204, 1)"/>
    </linearGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="787.841" cy="45.266" r="837.619" id="gradient-2" gradientTransform="matrix(0.999969, 0.007866, -0.009479, 1.204808, 113.071658, 570.651145)">
      <stop offset="0" style="stop-color: rgba(255, 0, 132, 1)"/>
      <stop offset="0.303" style="stop-color: rgb(149, 94, 152);"/>
      <stop offset="0.498" style="stop-color: rgb(211, 216, 208);"/>
      <stop offset="0.633" style="stop-color: rgb(62, 141, 163);"/>
      <stop offset="0.747" style="stop-color: rgb(215, 149, 198);"/>
      <stop offset="0.84" style="stop-color: rgb(225, 190, 205);"/>
      <stop offset="1" style="stop-color: rgb(160, 179, 215);"/>
      <stop offset="1" style="stop-color: rgb(255, 113, 186);"/>
      <stop offset="1" style="stop-color: rgb(255, 113, 186);"/>
    </radialGradient>
  </defs>
  <g style="filter: none;">
    <path id="moach" d="M 1742.485 840.58 C 1742.27 837.265 1741.756 826.293 1741.356 816.178 C 1739.556 770.961 1734.27 731.872 1725.555 699.484 C 1717.183 668.368 1705.082 642.737 1691.939 628.294 C 1687.71 623.651 1687.639 623.508 1684.524 612.736 C 1674.766 579.077 1656.294 545.746 1635.664 524.616 C 1629.721 518.516 1627.121 516.487 1619.391 511.858 L 1610.205 506.358 L 1609.691 500.372 C 1608.119 481.985 1607.591 477.499 1606.305 471.399 C 1600.747 445.069 1589.447 421.21 1571.631 398.18 C 1561.373 384.922 1546.429 369.892 1532.057 358.406 C 1523.742 351.748 1504.298 338.519 1497.626 334.976 L 1493.269 332.647 L 1492.04 327.589 C 1488.725 314.088 1475.439 294.844 1457.98 278.272 C 1454.265 274.743 1450.551 270.1 1446.322 263.699 C 1422.863 228.297 1386.875 197.952 1338.643 172.907 C 1301.969 153.863 1253.209 136.89 1210.806 128.404 C 1205.592 127.361 1201.048 125.875 1196.305 123.661 C 1188.39 119.961 1173.932 114.318 1164.646 111.303 C 1126.201 98.845 1092.17 93.688 1054.782 94.659 L 1038.281 95.087 L 1032.509 91.987 C 1015.58 82.887 992.806 74.9 971.119 70.443 C 952.589 66.628 943.803 65.843 919.944 65.857 C 892.742 65.871 879.027 67.4 855.697 72.986 L 845.211 75.5 L 835.539 74.014 C 830.224 73.185 822.852 72.114 819.152 71.628 C 809.894 70.414 765.648 70.442 754.448 71.671 C 725.746 74.814 695.758 81.672 673.257 90.215 L 667.028 92.587 L 658.399 91.744 C 616.01 87.587 579.936 89.958 541.291 99.444 C 497.702 110.159 454.357 131.475 419.94 159.119 C 416.04 162.248 410.697 166.848 408.039 169.348 L 403.224 173.891 L 396.995 173.062 C 388.737 171.962 383.066 172.019 375.365 173.276 C 347.763 177.791 315.59 196.892 278.816 230.608 C 265.644 242.695 255.357 253.238 240.399 269.997 C 227.512 284.441 185.581 324.429 179.666 327.901 C 170.908 333.058 164.008 338.587 154.664 347.931 C 139.22 363.389 128.805 378.362 117.262 401.735 C 110.09 416.222 107.161 423.294 102.19 438.152 C 100.433 443.41 98.147 448.967 97.09 450.524 C 94.033 455.053 87.604 466.282 84.318 472.811 C 74.103 493.184 68.588 514.857 69.803 529.958 C 70.689 541.03 74.818 552.931 79.989 559.36 C 81.218 560.874 82.218 562.546 82.218 563.075 C 82.218 563.589 80.632 566.775 78.718 570.133 C 71.06 583.477 68.417 594.363 68.432 612.493 C 68.461 626.737 69.618 634.037 74.047 647.695 C 82.59 674.054 100.706 703.884 121.679 726.157 L 127.222 732.043 L 128.822 739.815 C 133.094 760.645 138.365 774.589 148.366 791.504 C 159.71 810.691 180.711 832.392 202.798 847.751 C 239.186 873.081 287.747 891.854 343.093 902.026 L 357.523 904.683 L 358.723 908.512 C 361.637 917.856 367.166 926.07 377.996 937.185 L 385.668 945.057 L 386.711 954.158 C 387.511 960.973 388.311 964.587 389.925 968.459 C 391.897 973.216 392.011 973.945 391.325 977.16 C 390.225 982.232 390.396 991.661 391.654 996.547 C 395.654 1012.062 409.241 1028.635 430.171 1043.564 C 433.871 1046.193 442.358 1051.493 449.044 1055.322 C 456.673 1059.694 463.731 1064.394 468.017 1067.951 C 490.39 1086.467 511.534 1100.167 537.322 1112.84 C 560.466 1124.226 578.11 1130.77 600.412 1136.227 C 628.771 1143.185 638.643 1144.299 672.045 1144.342 C 688.675 1144.37 702.861 1144.742 708.476 1145.299 C 729.849 1147.399 774.866 1142.113 825.77 1131.498 C 832.313 1130.141 838.071 1129.169 838.542 1129.355 C 839.028 1129.541 839.985 1131.227 840.685 1133.112 C 841.385 1134.998 844.743 1142.013 848.157 1148.685 C 864.444 1180.544 888.731 1209.403 915.447 1228.662 C 918.804 1231.091 922.19 1234.105 922.947 1235.377 C 923.719 1236.648 926.247 1240.706 928.576 1244.406 C 930.919 1248.092 935.205 1255.25 938.12 1260.307 C 941.02 1265.364 951.321 1283.037 960.979 1299.567 C 970.637 1316.097 980.452 1333.598 982.766 1338.469 C 985.08 1343.327 994.081 1360.685 1002.753 1377.043 C 1013.397 1397.087 1019.454 1409.331 1021.34 1414.617 C 1031.927 1444.148 1047.627 1466.82 1066.715 1480.107 C 1073.144 1484.579 1085.073 1490.393 1091.017 1491.951 C 1097.303 1493.608 1107.704 1493.723 1114.433 1492.222 C 1117.162 1491.622 1121.448 1490.879 1123.976 1490.565 C 1129.791 1489.851 1132.977 1488.508 1136.606 1485.236 C 1141.106 1481.164 1142.635 1476.421 1142.635 1466.478 C 1142.635 1453.12 1138.763 1439.09 1124.477 1400.702 C 1114.419 1373.672 1109.247 1357.285 1110.09 1355.099 C 1110.376 1354.356 1112.447 1354.67 1119.862 1356.57 C 1125.048 1357.899 1137.077 1360.628 1146.621 1362.628 L 1163.936 1366.271 L 1192.581 1366.771 C 1218.526 1367.214 1222.554 1367.457 1235.369 1369.257 C 1265.2 1373.443 1286.101 1371.4 1340.176 1359.028 C 1383.979 1348.999 1410.066 1338.941 1437.968 1321.311 C 1473.699 1298.738 1500.829 1264.364 1503.501 1238.248 C 1503.972 1233.676 1504.015 1233.619 1509.359 1228.162 C 1519.031 1218.29 1522.46 1210.304 1525.66 1190.345 C 1527.132 1181.13 1527.16 1180.287 1526.131 1176.573 C 1525.217 1173.273 1523.102 1163.529 1521.674 1155.986 L 1521.331 1154.2 L 1537.832 1154.186 C 1546.904 1154.172 1557.99 1153.757 1562.462 1153.272 C 1609.351 1148.172 1644.825 1131.556 1674.555 1100.726 C 1689.199 1085.568 1699.699 1070.367 1709.929 1049.565 C 1730.016 1008.662 1740.931 960.287 1743.431 901.041 C 1743.999 887.526 1743.499 855.724 1742.485 840.58 Z M 1010.217 529.663 C 1000.377 537.22 995.135 549.324 996.174 561.688 L 1020.074 846.02 C 1021.189 859.278 1010.728 870.655 997.422 870.655 L 881.62 870.655 C 868.283 870.655 857.812 859.227 858.975 845.941 L 884.039 559.656 C 885.098 547.564 880.131 535.684 870.673 528.075 C 844.929 507.364 828.454 475.6 828.454 439.987 C 828.454 390.764 859.927 348.892 903.847 333.396 C 915.611 329.245 928.268 326.987 941.453 326.987 C 953.843 326.987 965.767 328.983 976.922 332.668 C 1021.954 347.543 1054.453 389.969 1054.453 439.987 C 1054.454 476.523 1037.115 509.007 1010.217 529.663 Z" 
    style="stroke: url(#gradient-0); stroke-miterlimit: 35; stroke-width: 36px; paint-order: fill; fill: url(#gradient-2);"/>
    <path 
    transition:fly|local={{y: 250, x: 250, opacity: 0.9, duration: 5000} } 
    id="maf" 
    transform="{`translate(${$txx},${ty})`}" 
    stroke-miterlimit="10" d="M 2631.277 428.551 C 2628.163 410.601 2628.984 410.521 2620.705 392.535 C 2589.329 324.385 2505.726 284.31 2433.186 304.401 C 2434.016 266.628 2433.123 227.178 2415.995 192.563 C 2393.308 147.376 2353.367 109.683 2304.638 94.473 C 2250.262 77.228 2188.143 85.489 2140.654 117.312 C 2107.663 138.777 2081.086 170.805 2068.676 208.355 C 2052.27 258.966 2053.171 317.312 2080.167 364.211 C 2088.696 380.519 2101.043 394.231 2112.855 408.131 C 2088.009 400.022 2066.178 385.203 2042.795 373.784 C 2029.663 385.623 2016.093 396.944 2002.042 407.721 C 1997.929 391.431 1991.069 373.82 1975.501 365.264 C 1943.803 348.367 1898.527 376.032 1902.979 412.895 C 1877.91 413.056 1852.841 413.198 1827.772 413.323 L 1827.772 413.377 C 1574.209 412.717 1320.636 411.825 1067.064 413.216 C 1065.503 420.906 1068.063 428.552 1067.787 436.197 C 1053.254 436.759 1049.079 419.951 1037.731 414.17 C 1019.683 403.286 996.818 405.614 978.181 413.786 C 951.738 428.114 939.783 464.379 953.058 491.482 C 965.994 518.014 999.556 533.618 1027.757 523.055 C 1039.881 519.103 1048.455 509.334 1056.965 500.457 C 1059.731 497.691 1064.834 494.694 1067.385 499.253 C 1067.653 505.971 1067.198 512.608 1067.091 519.228 C 1110.815 519.701 1154.654 516.828 1198.333 519.844 C 1197.842 532.396 1198.743 544.984 1197.548 557.465 C 1157.357 556.082 1117.14 557.911 1076.967 556.341 C 1071.632 556.127 1066.118 556.296 1060.721 557.046 C 1061.997 571.044 1063.076 585.095 1062.095 599.164 C 1062.648 608.317 1059.642 617.738 1063.032 626.508 C 1074.585 630.309 1085.906 634.671 1097.647 637.517 C 1099.155 646.893 1100.288 656.502 1098.093 665.816 C 1085.755 668.243 1074.184 673.426 1062.113 677.03 C 1062.158 729.167 1060.579 781.33 1063.3 833.395 C 1102.795 832.182 1142.326 833.814 1181.785 832.244 C 1185.211 795.158 1178.743 757.617 1184.559 720.762 C 1201.304 721.279 1218.032 720.548 1234.715 721.101 C 1237.588 757.973 1234.43 794.952 1236.598 831.815 C 1268.777 832.993 1300.992 833.724 1333.092 831.128 C 1333.19 794.131 1330.532 756.947 1332.485 720.021 C 1350.461 721.823 1368.527 719.049 1386.397 721.457 C 1385.764 758.73 1384.898 796.066 1387.004 833.304 C 1426.758 830.824 1466.583 832.76 1506.345 832.439 C 1508.602 780.142 1505.783 727.711 1505.569 675.369 C 1493.24 672.898 1481.731 667.59 1469.553 664.387 C 1468.09 655.341 1467.626 645.866 1470.213 636.9 C 1482.078 633.447 1493.926 629.763 1505.283 624.892 C 1506.934 602.169 1506.131 579.384 1505.658 556.617 C 1460.703 556.189 1415.713 556.207 1370.74 556.938 C 1368.206 543.815 1369.009 530.442 1370.124 517.193 C 1522.671 516.711 1827.773 513.83 1827.773 513.83 C 1853.244 513.75 1878.714 513.446 1904.149 512.09 C 1899.867 539.425 1924.061 565.199 1951.013 565.69 C 1968.945 567.617 1986.038 556.537 1995.04 541.549 C 1998.644 533.716 1998.751 524.768 2002.079 516.792 C 2014.899 529.112 2029.271 539.613 2042.671 551.211 C 2066.821 541.46 2087.929 525.054 2112.998 517.497 C 2098.447 534.1 2083.914 551.282 2075.144 571.792 C 2048.576 631.806 2053.438 706.273 2092.576 759.783 C 2122.909 803.275 2171.851 833.83 2224.996 838.309 C 2295.85 846.436 2370.968 811.063 2406.734 748.756 C 2430.242 710.947 2439.752 664.11 2430.822 620.342 C 2457.274 624.794 2484.725 626.346 2510.972 619.905 C 2564.527 607.406 2609.821 565.056 2626.727 512.84 C 2626.727 512.84 2631.964 498.361 2633.24 478.484 C 2635.033 461.605 2635.595 453.478 2631.277 428.551 Z M 2561.797 464.942 C 2559.718 515.036 2510.205 556.993 2460.602 551.952 C 2431.84 548.856 2408.724 528.828 2391.176 507.185 C 2369.801 525.92 2348.648 544.931 2327.246 563.631 C 2346.436 584.061 2362.021 609.433 2364.743 637.83 C 2369.462 678.315 2351.066 720.058 2319.235 745.145 C 2295.923 763.193 2265.778 772.944 2236.239 769.857 C 2201.597 767.35 2169.614 747.598 2149.157 719.933 C 2113.855 673.899 2121.367 602.162 2165.01 564.077 C 2183.504 545.405 2209.073 536.653 2234.4 532.237 C 2234.364 522.218 2231.09 511.843 2235.114 502.11 C 2244.437 501.477 2248.434 511.576 2253.662 517.383 C 2267.963 532.192 2293.603 532.05 2308.921 518.784 C 2329.048 502.253 2334.9 473.642 2330.993 448.867 C 2328.201 429.285 2318.03 408.899 2299.206 400.344 C 2284.771 393.055 2265.019 394.679 2254.26 407.677 C 2248.354 413.413 2244.099 423.138 2234.579 422.95 C 2231.501 414.493 2234.151 405.562 2233.499 396.828 C 2233.838 391.538 2227.79 391.859 2224.292 390.744 C 2208.76 387.666 2193.558 382.126 2180.229 373.41 C 2144.017 350.536 2122.124 306.464 2126.424 263.74 C 2129.145 226.029 2152.242 191.254 2184.235 171.645 C 2209.161 156.38 2239.976 150.867 2268.613 156.755 C 2325.612 167.362 2371.548 224.95 2364.286 283.403 C 2361.11 312.781 2346.443 339.84 2326.798 361.527 C 2349.334 379.236 2369.335 400.014 2392.54 416.831 C 2401.72 403.815 2412.622 391.592 2426.718 383.849 C 2451.957 368.7 2484.779 368.638 2510.847 381.761 C 2542.09 396.425 2563.439 430.273 2561.797 464.942 Z" style="fill: url(#gradient-1); stroke: url(#gradient-4); stroke-width: 23px;"/>
  </g>
</svg>
</div></div>
<style>
#moach{
  display: "";
}
#maf{
  display: "";
}
.body{
  padding: -1rem;
	
		max-width: auto;
height: 100vh;
 width:100vw;
}
.midscreen  {
  min-width:80%;
min-height:80%;
position: fixed;
top: 50%;
left: 50%;
display: grid;
grid-template-columns: auto auto auto auto;
transform: translate(-50%, -50%);
align-items: center;
justify-content: center;
   background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592319/love_nnzswg.svg);
   background-position: center; 
  background-repeat: no-repeat; 
  background-size: contain;
}

 .midscreenText-3 {
      grid-column: 1 /5;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 1.8rem;
  line-height: normal;
  font-weight: 900;
  color: var(--barbi-pink);
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
  background-size: 29.5rem 9.75rem;
  height: 9.75rem;
  width: 29.5rem;
text-align: center; 
  margin-top: -11vh;  
padding-top: 8px;
padding-right: 25px;
padding-left: 25px;
margin-bottom: 8vh;
}

@media (max-width:500px){
	 .midscreenText-3 {
		   background-size: 15.25rem 5rem;
  height: 5rem;
  width: 15.25rem;
  font-size: 1rem;
    margin-top: 5vh;

	 }
   .midscreen{
     width: 98vw;
   }
}
@media (max-width:750px){
	 .midscreenText-3 {
		   background-size: 22.875rem 7.5rem;
  height: 7.5rem;
  width: 22.875rem;
  font-size: 1rem;
    margin-top: 1vh;

	 }
   .midscreen{
     width: 98vw;
   }
}
.background{
  width: 100vw;
  height: 100vh;
  background-color: #bbf0f3;
background-image: linear-gradient(315deg, #bbf0f3 0%, #f6d285 74%);

}

</style>