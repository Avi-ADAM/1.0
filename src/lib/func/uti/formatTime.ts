interface TimeFormatOptions {
    lang?: 'en' | 'he'
    showSeconds?: boolean
  }
  
  export function formatTime(milliseconds: number, options: TimeFormatOptions = {}) {
    const { lang = 'en', showSeconds = true } = options // Changed default to true
  
    // Calculate time components
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60) 
    const days = Math.floor(hours / 24)
  
    // Remaining values after division
    const remainingHours = hours % 24
    const remainingMinutes = minutes % 60
    const remainingSeconds = seconds % 60
  
    // Text templates
    const templates = {
      en: {
        days: 'd',
        hours: 'h',
        minutes: 'm',
        seconds: 's',
        separator: ' '
      },
      he: {
        days: 'ימים',
        hours: 'שעות',
        minutes: 'דקות', 
        seconds: 'שניות',
        separator: ' '
      }
    }
  
    const t = templates[lang]
    const parts = []
  
    if (days > 0) {
      parts.push(`${days}${t.separator}${t.days}`)
    }
    if (remainingHours > 0 || days > 0) {
      parts.push(`${remainingHours}${t.separator}${t.hours}`)
    }
    if (remainingMinutes > 0 || hours > 0) {
      parts.push(`${remainingMinutes}${t.separator}${t.minutes}`)
    }
    // Changed this condition to always show seconds when showSeconds is true
    if (showSeconds) {
      parts.push(`${remainingSeconds}${t.separator}${t.seconds}`)
    }
  
    return parts.length > 0 ? parts.join(t.separator) : `0${t.separator}${t.seconds}`
  }