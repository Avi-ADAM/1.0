import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// הגדרת המשנים הזמינים
export const THEMES = {
  personal: 'personal',
  business: 'business'
};

// קונפיגורציה של כל משנה
export const themeConfigs = {
  personal: {
    name: 'אישי',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#f9fafb',
      text: '#1f2937',
      card: '#ffffff',
      accent: '#8b5cf6',
      muted: '#6b7280',
      gold: '#EEE8AA',
      barbiPink: '#FF0092',
      pinki: 'rgb(242, 229, 242)',
  
      blue: 'rgb(182, 240, 255)',
      naim: 'rgba(251, 207, 232)',
      lturk: 'rgb(103, 232, 249)',
      mturk: 'rgb(34, 211, 238)',
      sturk: '#CCFBF1',
      lpink: 'rgb(251, 207, 232)',
      mpink: 'rgb(244, 114, 182)',
    },
    layout: {
      showSidebar: false,
      showFooter: true,
      showNewsletter: true,
      headerStyle: 'gradient',
      cardStyle: 'rounded'
    }
  },
  business: {
    name: 'עסקי',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      background: '#f3f4f6',
      text: '#111827',
      card: '#ffffff',
      accent: '#059669',
      muted: '#9ca3af',
      gold: '#1e3a8a',
      barbiPink: '#0f766e',
      pinki: '#f8fafc',

      blue: '#e0f2fe',
      backgroundWithoutOpacity: 'rgba(255, 255, 255, 0.9)',
      columnWidth: '42rem',
      columnMarginTop: '4rem',
      naim: '#fefce8',
      lturk: '#84cc16',
      mturk: '#0369a1',
      sturk: '#f0fdf4',
      lpink: '#e5e7eb',
      mpink: '#374151',    
    },
    layout: {
      showSidebar: true,
      showFooter: false,
      showNewsletter: false,
      headerStyle: 'minimal',
      cardStyle: 'square'
    }
  }
};

// קריאה מ-localStorage או ברירת מחדל
const defaultTheme = THEMES.personal;
const initialTheme = browser ? localStorage.getItem('theme') || defaultTheme : defaultTheme;

// Store של המשנה הנוכחי
export const theme = writable(initialTheme);

// Store נגזר עם הקונפיגורציה המלאה
export const themeConfig = derived(theme, ($theme) => themeConfigs[$theme]);

// עדכון localStorage כשהמשנה משתנה
if (browser) {
  theme.subscribe((value) => {
    localStorage.setItem('theme', value);
    updateCSSVariables(value);
  });
}

// פונקציה לעדכון CSS Variables
function updateCSSVariables(themeName) {
  if (!browser) return;
  
  const config = themeConfigs[themeName];
  const root = document.documentElement;
  
  // עדכון משתני CSS
  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // עדכון class על ה-document
  root.classList.remove(...Object.keys(themeConfigs));
  root.classList.add(themeName);
  
  // הוספת data attribute
  root.setAttribute('data-theme', themeName);
}

// פונקציות עזר
export const toggleTheme = () => {
  theme.update(t => t === THEMES.personal ? THEMES.business : THEMES.personal);
};

export const setTheme = (newTheme) => {
  if (themeConfigs[newTheme]) {
    theme.set(newTheme);
  }
};

// אתחול המשנה בטעינה
if (browser) {
  updateCSSVariables(initialTheme);
}