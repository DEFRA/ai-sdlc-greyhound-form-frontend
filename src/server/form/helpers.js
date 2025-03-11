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
      title: 'Condition 1: Veterinary Surgeon Agreement',
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
 * @returns {string} The ISO date string
 */
export function combineDateFields(payload, prefix) {
  const day = payload[`${prefix}-day`]
  const month = payload[`${prefix}-month`]
  const year = payload[`${prefix}-year`]

  if (!day || !month || !year) {
    return null
  }

  // Create a date object and return ISO string
  const date = new Date(year, month - 1, day)
  return date.toISOString().split('T')[0]
}
