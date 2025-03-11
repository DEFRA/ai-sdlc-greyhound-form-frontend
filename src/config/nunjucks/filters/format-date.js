import { format, isDate, parseISO } from 'date-fns'

/**
 * Format a date string or Date object using date-fns
 * @param {string | Date | undefined} value - The date to format
 * @param {string} formatStr - The date-fns format string
 * @returns {string} The formatted date string or empty string if invalid
 */
export function formatDate(value, formatStr = 'd MMMM yyyy') {
  if (!value) {
    return ''
  }

  try {
    // Convert format string from template to date-fns format
    const dateFormat = formatStr.replace('DD', 'dd').replace('YYYY', 'yyyy')

    const date = isDate(value) ? value : parseISO(value)
    return format(date, dateFormat)
  } catch {
    return ''
  }
}
