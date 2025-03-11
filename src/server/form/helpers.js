/**
 * Get the form pages configuration
 * @returns {Array<object>} The form pages configuration
 */
export function getFormPages() {
  return [
    {
      id: 'applicant-details',
      title: 'Applicant Details',
      template: 'applicant-details',
      section: 'applicantDetails'
    },
    {
      id: 'disqualification',
      title: 'Disqualification',
      template: 'disqualification',
      section: 'applicantDetails'
    },
    {
      id: 'condition-1-vet-agreement',
      title: 'Licensing Conditions',
      template: 'condition-1-vet-agreement',
      section: 'licensingConditions.condition1'
    },
    {
      id: 'condition-1-vet-register',
      title: 'Condition 1: Veterinary Register',
      template: 'condition-1-vet-register',
      section: 'licensingConditions.condition1'
    },
    {
      id: 'condition-2-facilities',
      title: 'Condition 2: Facilities for the Veterinary Surgeon',
      template: 'condition-2-facilities',
      section: 'licensingConditions.condition2'
    },
    {
      id: 'condition-3-kennels',
      title: 'Condition 3: Kennel Availability',
      template: 'condition-3-kennels',
      section: 'licensingConditions.condition3'
    },
    {
      id: 'condition-4-identification',
      title: 'Condition 4: Greyhound Identification',
      template: 'condition-4-identification',
      section: 'licensingConditions.condition4'
    },
    {
      id: 'condition-5-records',
      title: 'Condition 5: Record Keeping',
      template: 'condition-5-records',
      section: 'licensingConditions.condition5'
    },
    {
      id: 'condition-6-injury-records',
      title: 'Condition 6: Injury Records',
      template: 'condition-6-injury-records',
      section: 'licensingConditions.condition6'
    }
  ]
}

/**
 * Get a value from an object by dot notation path
 * @param {object} obj - The object to get the value from
 * @param {string} path - The dot notation path
 * @returns {any} The value at the path
 */
export function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

/**
 * Format a date for display
 * @param {Date} date The date to format
 * @returns {string} The formatted date
 */
export function formatDate(date) {
  if (!date) return ''

  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Combine date fields into an ISO date string
 * @param {object} payload - The form payload containing day, month, year fields
 * @param {string} prefix - The prefix for the date fields (e.g. 'applicationDate')
 * @returns {string|null} The ISO date string or null if invalid/missing date
 */
export function combineDateFields(payload, prefix) {
  const day =
    payload[`${prefix}_day`] ||
    payload[`${prefix}-day`] ||
    payload[`${prefix}_-day`]
  const month =
    payload[`${prefix}_month`] ||
    payload[`${prefix}-month`] ||
    payload[`${prefix}_-month`]
  const year =
    payload[`${prefix}_year`] ||
    payload[`${prefix}-year`] ||
    payload[`${prefix}_-year`]

  if (!day || !month || !year) {
    return null
  }

  // Validate input values are numbers
  const dayNum = parseInt(day, 10)
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    return null
  }

  // Create date string in YYYY-MM-DD format
  const dateStr = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`

  // Validate the date components are valid
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return null
  }

  // Verify the date components match what was input (catches invalid dates like 31st Feb)
  if (
    date.getUTCFullYear() !== yearNum ||
    date.getUTCMonth() + 1 !== monthNum ||
    date.getUTCDate() !== dayNum
  ) {
    return null
  }

  return dateStr
}
