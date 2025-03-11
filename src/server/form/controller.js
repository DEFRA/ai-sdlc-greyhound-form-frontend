import { getFormPages, combineDateFields } from './helpers.js'
import { formService } from './index.js'

/**
 * Helper function to add cache control headers to prevent caching
 * @param {object} response - The response object
 * @returns {object} The response object with cache control headers
 */
function addNoCacheHeaders(response) {
  return response.header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0'
  )
}

/**
 * Dashboard controller to display saved forms
 * @satisfies {Partial<ServerRoute>}
 */
export const dashboardController = {
  async handler(request, h) {
    try {
      const savedForms = await formService.getForms(request)

      return addNoCacheHeaders(
        h.view('form/templates/dashboard', {
          pageTitle: 'Your saved forms',
          heading: 'Your saved forms',
          savedForms: savedForms || []
        })
      )
    } catch (error) {
      request.logger.error('Error in dashboard controller:', error)
      return addNoCacheHeaders(
        h.view('form/templates/dashboard', {
          pageTitle: 'Your saved forms',
          heading: 'Your saved forms',
          savedForms: [],
          error:
            'There was a problem loading your saved forms. Please try again later.'
        })
      )
    }
  }
}

/**
 * New form controller to create a new form
 * @satisfies {Partial<ServerRoute>}
 */
export const newFormController = {
  async handler(request, h) {
    if (request.method === 'post') {
      try {
        const { payload } = request

        // Validate form name
        if (!payload.formName?.trim()) {
          return addNoCacheHeaders(
            h.view('form/templates/new-form', {
              pageTitle: 'Start a new application',
              heading: 'Start a new application',
              formName: payload.formName,
              error: 'Please enter an application name'
            })
          )
        }

        // Create a new form in the API
        const formData = {
          formName: payload.formName.trim()
        }

        const newForm = await formService.createForm(request, formData)

        if (!newForm?.id) {
          request.logger.error('Failed to create form - missing form ID')
          return addNoCacheHeaders(
            h.view('form/templates/new-form', {
              pageTitle: 'Start a new application',
              heading: 'Start a new application',
              formName: payload.formName,
              error:
                'There was a problem creating your application. Please try again.'
            })
          )
        }

        // Redirect to the first page of the form
        return h.redirect(`/form/${newForm.id}/page/1`)
      } catch (error) {
        request.logger.error('Error creating form:', error)

        // Handle specific API errors
        const errorMessage =
          error.message ||
          'There was a problem creating your application. Please try again.'

        return addNoCacheHeaders(
          h
            .view('form/templates/new-form', {
              pageTitle: 'Start a new application',
              heading: 'Start a new application',
              formName: request.payload?.formName,
              error: errorMessage
            })
            .code(error.status || 500)
        )
      }
    }

    return addNoCacheHeaders(
      h.view('form/templates/new-form', {
        pageTitle: 'Start a new application',
        heading: 'Start a new application'
      })
    )
  }
}

/**
 * Split an ISO date string into day, month, year components
 * @param {string} isoDate - The ISO date string to split
 * @returns {object} Object containing day, month, year values
 */
function splitDateString(isoDate) {
  if (!isoDate) return { day: '', month: '', year: '' }

  // Parse the ISO date string directly to avoid timezone issues
  const [year, month, day] = isoDate.split('T')[0].split('-')
  return {
    day: parseInt(day, 10).toString(),
    month: parseInt(month, 10).toString(),
    year
  }
}

/**
 * Map of condition IDs to their date fields
 */
const conditionDateFields = {
  condition1: ['anticipatedAgreementDate', 'anticipatedRegisterDate'],
  condition2: ['anticipatedFacilitiesDate'],
  condition3: ['anticipatedKennelsDate'],
  condition4: ['anticipatedIdentificationDate'],
  condition5: ['anticipatedRecordsDate'],
  condition6: ['anticipatedInjuryRecordsDate']
}

/**
 * Form page controller to display and process form pages
 * @satisfies {Partial<ServerRoute>}
 */
export const formPageController = {
  async handler(request, h) {
    const { formId, pageNumber } = request.params
    const pages = getFormPages()
    const currentPage = parseInt(pageNumber, 10)

    if (currentPage < 1 || currentPage > pages.length) {
      return h.redirect('/dashboard')
    }

    const page = pages[currentPage - 1]

    try {
      // Get the form data from the API
      const form = await formService.getFormById(request, formId)

      if (!form) {
        return h.redirect('/dashboard')
      }

      if (request.method === 'post') {
        const { payload } = request

        // Check if the user clicked "Save for later"
        if (payload.saveForLater) {
          // Process date fields if they exist
          const processedPayload = { ...payload }
          delete processedPayload.saveForLater

          // Handle application date on page 2
          if (page.id === 'disqualification') {
            const applicationDate = combineDateFields(
              payload,
              'applicationDate'
            )
            if (applicationDate) {
              processedPayload.applicationDate = new Date(
                applicationDate
              ).toISOString()
            }
            // Remove the individual date fields
            delete processedPayload['applicationDate-day']
            delete processedPayload['applicationDate-month']
            delete processedPayload['applicationDate-year']
            delete processedPayload.applicationDate_day
            delete processedPayload.applicationDate_month
            delete processedPayload.applicationDate_year
          }

          // Handle condition dates only on their respective pages
          if (page.section.startsWith('licensingConditions.')) {
            const condition = page.section.split('.')[1]
            const dateFields = conditionDateFields[condition] || []

            for (const dateField of dateFields) {
              // Only process this date field if at least one of its components is present in the payload
              const hasDateComponents =
                payload[`${dateField}_day`] !== undefined ||
                payload[`${dateField}_month`] !== undefined ||
                payload[`${dateField}_year`] !== undefined ||
                payload[`${dateField}-day`] !== undefined ||
                payload[`${dateField}-month`] !== undefined ||
                payload[`${dateField}-year`] !== undefined

              if (hasDateComponents) {
                const combinedDate = combineDateFields(payload, dateField)
                if (combinedDate) {
                  processedPayload[dateField] = new Date(
                    combinedDate
                  ).toISOString()
                } else {
                  // Only set to null if the user attempted to enter a date but it was invalid
                  processedPayload[dateField] = null
                }
                // Remove the individual date fields
                delete processedPayload[`${dateField}-day`]
                delete processedPayload[`${dateField}-month`]
                delete processedPayload[`${dateField}-year`]
                delete processedPayload[`${dateField}_day`]
                delete processedPayload[`${dateField}_month`]
                delete processedPayload[`${dateField}_year`]
              }
            }
          }

          // Update the form with the current page data
          const updatedForm = {
            formName: form.formName,
            page: page.section.startsWith('licensingConditions.')
              ? 'licensingConditions'
              : page.section,
            data: page.section.startsWith('licensingConditions.')
              ? {
                  ...(form.pages?.licensingConditions || {}),
                  [page.section.split('.')[1]]: {
                    ...(form.pages?.licensingConditions?.[
                      page.section.split('.')[1]
                    ] || {}),
                    ...processedPayload
                  }
                }
              : processedPayload
          }

          await formService.updateForm(request, formId, updatedForm)

          return h.redirect('/dashboard')
        }

        // Process date fields if they exist
        const processedPayload = { ...payload }

        // Handle application date on page 2
        if (page.id === 'disqualification') {
          const applicationDate = combineDateFields(payload, 'applicationDate')
          if (applicationDate) {
            processedPayload.applicationDate = new Date(
              applicationDate
            ).toISOString()
          }
          // Remove the individual date fields
          delete processedPayload['applicationDate-day']
          delete processedPayload['applicationDate-month']
          delete processedPayload['applicationDate-year']
          delete processedPayload.applicationDate_day
          delete processedPayload.applicationDate_month
          delete processedPayload.applicationDate_year
        }

        // Handle condition dates only on their respective pages
        if (page.section.startsWith('licensingConditions.')) {
          const condition = page.section.split('.')[1]
          const dateFields = conditionDateFields[condition] || []

          for (const dateField of dateFields) {
            // Only process this date field if at least one of its components is present in the payload
            const hasDateComponents =
              payload[`${dateField}_day`] !== undefined ||
              payload[`${dateField}_month`] !== undefined ||
              payload[`${dateField}_year`] !== undefined ||
              payload[`${dateField}-day`] !== undefined ||
              payload[`${dateField}-month`] !== undefined ||
              payload[`${dateField}-year`] !== undefined

            if (hasDateComponents) {
              const combinedDate = combineDateFields(payload, dateField)
              if (combinedDate) {
                processedPayload[dateField] = new Date(
                  combinedDate
                ).toISOString()
              } else {
                // Only set to null if the user attempted to enter a date but it was invalid
                processedPayload[dateField] = null
              }
              // Remove the individual date fields
              delete processedPayload[`${dateField}-day`]
              delete processedPayload[`${dateField}-month`]
              delete processedPayload[`${dateField}-year`]
              delete processedPayload[`${dateField}_day`]
              delete processedPayload[`${dateField}_month`]
              delete processedPayload[`${dateField}_year`]
            }
          }
        }

        // Update the form with the current page data
        const updatedForm = {
          formName: form.formName,
          page: page.section.startsWith('licensingConditions.')
            ? 'licensingConditions'
            : page.section,
          data: page.section.startsWith('licensingConditions.')
            ? {
                ...(form.pages?.licensingConditions || {}),
                [page.section.split('.')[1]]: {
                  ...(form.pages?.licensingConditions?.[
                    page.section.split('.')[1]
                  ] || {}),
                  ...processedPayload
                }
              }
            : processedPayload
        }

        await formService.updateForm(request, formId, updatedForm)

        // Move to the next page or review page if this is the last page
        if (currentPage === pages.length) {
          return h.redirect(`/form/${formId}/review`)
        } else {
          return h.redirect(`/form/${formId}/page/${currentPage + 1}`)
        }
      }

      // Get the section data for the current page
      const sectionData = page.section.startsWith('licensingConditions.')
        ? form.pages?.licensingConditions?.[page.section.split('.')[1]] || {}
        : form.pages?.[page.section] || {}

      // Split date fields for display if needed
      if (page.id === 'disqualification' && sectionData.applicationDate) {
        const { day, month, year } = splitDateString(
          sectionData.applicationDate
        )
        sectionData.applicationDate_day = day
        sectionData.applicationDate_month = month
        sectionData.applicationDate_year = year
      }

      // Split condition date fields for display
      if (page.section.startsWith('licensingConditions.')) {
        const condition = page.section.split('.')[1]
        const dateFields = conditionDateFields[condition] || []
        for (const dateField of dateFields) {
          if (sectionData[dateField]) {
            const { day, month, year } = splitDateString(sectionData[dateField])
            sectionData[`${dateField}_day`] = day
            sectionData[`${dateField}_month`] = month
            sectionData[`${dateField}_year`] = year
          }
        }
      }

      return addNoCacheHeaders(
        h.view(`form/templates/${page.template}`, {
          pageTitle: page.title,
          heading: page.title,
          formId,
          currentPage,
          totalPages: pages.length,
          backLink:
            currentPage > 1
              ? `/form/${formId}/page/${currentPage - 1}`
              : '/dashboard',
          ...sectionData
        })
      )
    } catch (error) {
      request.logger.error(
        `Error in form page controller for page ${currentPage}:`,
        error
      )
      return addNoCacheHeaders(
        h.view(`form/templates/${page.template}`, {
          pageTitle: page.title,
          heading: page.title,
          formId,
          currentPage,
          totalPages: pages.length,
          backLink:
            currentPage > 1
              ? `/form/${formId}/page/${currentPage - 1}`
              : '/dashboard',
          error:
            'There was a problem loading your application. Please try again later.'
        })
      )
    }
  }
}

/**
 * Review form controller to display and process the review page
 * @satisfies {Partial<ServerRoute>}
 */
export const reviewFormController = {
  async handler(request, h) {
    const { formId } = request.params

    try {
      // Get the form data from the API
      const form = await formService.getFormById(request, formId)

      if (!form) {
        return h.redirect('/dashboard')
      }

      if (request.method === 'post') {
        const { payload } = request

        // Check if the user clicked "Save for later"
        if (payload.saveForLater) {
          return h.redirect('/dashboard')
        }

        // Submit the form
        await formService.submitForm(request, formId)

        return h.redirect(`/form/${formId}/confirmation`)
      }

      return addNoCacheHeaders(
        h.view('form/templates/review', {
          pageTitle: 'Review your application',
          heading: 'Review your application',
          formId,
          formData: form.pages || {},
          pages: getFormPages()
        })
      )
    } catch (error) {
      request.logger.error(
        `Error in review form controller for form ${formId}:`,
        error
      )
      return addNoCacheHeaders(
        h.view('form/templates/review', {
          pageTitle: 'Review your application',
          heading: 'Review your application',
          formId,
          formData: {},
          error:
            'There was a problem loading your application. Please try again later.'
        })
      )
    }
  }
}

/**
 * Confirmation controller to display the confirmation page
 * @satisfies {Partial<ServerRoute>}
 */
export const confirmationController = {
  async handler(request, h) {
    const { formId } = request.params

    try {
      // Get the form data from the API
      const form = await formService.getFormById(request, formId)

      if (!form) {
        return h.redirect('/dashboard')
      }

      return addNoCacheHeaders(
        h.view('form/templates/confirmation', {
          pageTitle: 'Application complete',
          heading: 'Application complete',
          formId,
          referenceNumber: form.referenceNumber || 'HDJ2123F'
        })
      )
    } catch (error) {
      request.logger.error(
        `Error in confirmation controller for form ${formId}:`,
        error
      )
      return addNoCacheHeaders(
        h.view('form/templates/confirmation', {
          pageTitle: 'Application complete',
          heading: 'Application complete',
          referenceNumber: 'HDJ2123F'
        })
      )
    }
  }
}

/**
 * Save form controller to save the form for later
 * @satisfies {Partial<ServerRoute>}
 */
export const saveFormController = {
  async handler(request, h) {
    const { formId } = request.params

    try {
      // Get the form data from the API
      const form = await formService.getFormById(request, formId)

      if (!form) {
        return h.redirect('/dashboard')
      }

      // Process date fields if they exist
      const processedPayload = { ...request.payload }

      // Get current page info
      const pages = getFormPages()
      const currentPage = pages.find((p) => p.section === form.page) || pages[0]

      // Handle application date on page 2
      if (currentPage.id === 'disqualification') {
        const applicationDate = combineDateFields(
          request.payload,
          'applicationDate'
        )
        if (applicationDate) {
          processedPayload.applicationDate = new Date(
            applicationDate
          ).toISOString()
        }
        // Remove the individual date fields
        delete processedPayload['applicationDate-day']
        delete processedPayload['applicationDate-month']
        delete processedPayload['applicationDate-year']
        delete processedPayload.applicationDate_day
        delete processedPayload.applicationDate_month
        delete processedPayload.applicationDate_year
      }

      // Handle condition dates only on their respective pages
      if (currentPage.section.startsWith('licensingConditions.')) {
        const condition = currentPage.section.split('.')[1]
        const dateFields = conditionDateFields[condition] || []

        for (const dateField of dateFields) {
          // Only process this date field if at least one of its components is present in the payload
          const hasDateComponents =
            request.payload[`${dateField}_day`] !== undefined ||
            request.payload[`${dateField}_month`] !== undefined ||
            request.payload[`${dateField}_year`] !== undefined ||
            request.payload[`${dateField}-day`] !== undefined ||
            request.payload[`${dateField}-month`] !== undefined ||
            request.payload[`${dateField}-year`] !== undefined

          if (hasDateComponents) {
            const combinedDate = combineDateFields(request.payload, dateField)
            if (combinedDate) {
              processedPayload[dateField] = new Date(combinedDate).toISOString()
            } else {
              // Only set to null if the user attempted to enter a date but it was invalid
              processedPayload[dateField] = null
            }
            // Remove the individual date fields
            delete processedPayload[`${dateField}-day`]
            delete processedPayload[`${dateField}-month`]
            delete processedPayload[`${dateField}-year`]
            delete processedPayload[`${dateField}_day`]
            delete processedPayload[`${dateField}_month`]
            delete processedPayload[`${dateField}_year`]
          }
        }
      }

      // Update the form with the current page data
      await formService.updateForm(request, formId, {
        formName: form.formName,
        page: currentPage.section.startsWith('licensingConditions.')
          ? 'licensingConditions'
          : currentPage.section,
        data: currentPage.section.startsWith('licensingConditions.')
          ? {
              ...(form.pages?.licensingConditions || {}),
              [currentPage.section.split('.')[1]]: {
                ...(form.pages?.licensingConditions?.[
                  currentPage.section.split('.')[1]
                ] || {}),
                ...processedPayload
              }
            }
          : processedPayload
      })

      return h.redirect('/dashboard')
    } catch (error) {
      request.logger.error(
        `Error in save form controller for form ${formId}:`,
        error
      )
      return h.redirect('/dashboard')
    }
  }
}

/**
 * Form controller to handle form operations
 * @satisfies {Partial<ServerRoute>}
 */
export const formController = {
  async handler(request, h) {
    try {
      const formData = request.payload

      // Process form data
      const result = await formService.processForm(request, formData)

      return h.view('form/templates/success', {
        pageTitle: 'Form submitted',
        heading: 'Form submitted successfully',
        result
      })
    } catch (error) {
      request.logger.error('Error in form controller:', error)
      return h.view('form/templates/error', {
        pageTitle: 'Error',
        heading: 'Something went wrong',
        error:
          'There was a problem processing your form. Please try again later.'
      })
    }
  }
}

/**
 * Delete confirmation controller to display and process form deletion
 * @satisfies {Partial<ServerRoute>}
 */
export const deleteConfirmationController = {
  async handler(request, h) {
    const { formId } = request.params

    try {
      // Get the form data from the API
      const form = await formService.getFormById(request, formId)

      if (!form) {
        return h.redirect('/dashboard')
      }

      // Don't allow deletion of submitted forms
      if (form.status === 'submitted') {
        return h.redirect('/dashboard')
      }

      if (request.method === 'post') {
        try {
          // Delete the form via the API
          await formService.deleteForm(request, formId)
          return h.redirect('/dashboard')
        } catch (error) {
          request.logger.error(`Error deleting form ${formId}:`, error)
          return addNoCacheHeaders(
            h.view('form/templates/delete-confirmation', {
              pageTitle: 'Delete application',
              heading: 'Delete application',
              formId,
              formName: form.formName || 'Untitled Application',
              error:
                'There was a problem deleting your application. Please try again later.'
            })
          )
        }
      }

      return addNoCacheHeaders(
        h.view('form/templates/delete-confirmation', {
          pageTitle: 'Delete application',
          heading: 'Delete application',
          formId,
          formName: form.formName || 'Untitled Application'
        })
      )
    } catch (error) {
      request.logger.error(
        `Error in delete confirmation controller for form ${formId}:`,
        error
      )
      return addNoCacheHeaders(
        h.view('form/templates/delete-confirmation', {
          pageTitle: 'Delete application',
          heading: 'Delete application',
          formId,
          error:
            'There was a problem loading your application. Please try again later.'
        })
      )
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
