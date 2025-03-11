import { getFormPages, combineDateFields } from './helpers.js'
import { formService } from './index.js'

/**
 * Dashboard controller to display saved forms
 * @satisfies {Partial<ServerRoute>}
 */
export const dashboardController = {
  async handler(request, h) {
    try {
      const savedForms = await formService.getForms(request)

      return h.view('form/templates/dashboard', {
        pageTitle: 'Your saved forms',
        heading: 'Your saved forms',
        savedForms: savedForms || []
      })
    } catch (error) {
      request.logger.error('Error in dashboard controller:', error)
      return h.view('form/templates/dashboard', {
        pageTitle: 'Your saved forms',
        heading: 'Your saved forms',
        savedForms: [],
        error:
          'There was a problem loading your saved forms. Please try again later.'
      })
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
          return h.view('form/templates/new-form', {
            pageTitle: 'Start a new application',
            heading: 'Start a new application',
            formName: payload.formName,
            error: 'Please enter an application name'
          })
        }

        // Create a new form in the API
        const formData = {
          formName: payload.formName.trim()
        }

        const newForm = await formService.createForm(request, formData)

        if (!newForm?.id) {
          request.logger.error('Failed to create form - missing form ID')
          return h.view('form/templates/new-form', {
            pageTitle: 'Start a new application',
            heading: 'Start a new application',
            formName: payload.formName,
            error:
              'There was a problem creating your application. Please try again.'
          })
        }

        // Redirect to the first page of the form
        return h.redirect(`/form/${newForm.id}/page/1`)
      } catch (error) {
        request.logger.error('Error creating form:', error)

        // Handle specific API errors
        const errorMessage =
          error.message ||
          'There was a problem creating your application. Please try again.'

        return h
          .view('form/templates/new-form', {
            pageTitle: 'Start a new application',
            heading: 'Start a new application',
            formName: request.payload?.formName,
            error: errorMessage
          })
          .code(error.status || 500)
      }
    }

    return h.view('form/templates/new-form', {
      pageTitle: 'Start a new application',
      heading: 'Start a new application'
    })
  }
}

/**
 * Split an ISO date string into day, month, year components
 * @param {string} isoDate - The ISO date string to split
 * @returns {object} Object containing day, month, year values
 */
function splitDateString(isoDate) {
  if (!isoDate) return { day: '', month: '', year: '' }
  const date = new Date(isoDate)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString()
  }
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
          }

          // Handle condition dates only on their respective pages
          if (page.section.startsWith('licensingConditions.')) {
            const conditionDateFields = {
              condition1: [
                'anticipatedAgreementDate',
                'anticipatedRegisterDate'
              ],
              condition2: ['anticipatedFacilitiesDate'],
              condition3: ['anticipatedKennelsDate'],
              condition4: ['anticipatedIdentificationDate'],
              condition5: ['anticipatedRecordsDate'],
              condition6: ['anticipatedInjuryRecordsDate']
            }

            const condition = page.section.split('.')[1]
            const dateFields = conditionDateFields[condition] || []

            for (const dateField of dateFields) {
              const combinedDate = combineDateFields(payload, dateField)
              if (combinedDate) {
                processedPayload[dateField] = new Date(
                  combinedDate
                ).toISOString()
              } else {
                processedPayload[dateField] = null
              }
              // Remove the individual date fields
              delete processedPayload[`${dateField}-day`]
              delete processedPayload[`${dateField}-month`]
              delete processedPayload[`${dateField}-year`]
            }
          }

          // Update the form with the current page data
          const updatedForm = {
            formName: form.formName,
            page: page.section.startsWith('licensingConditions.')
              ? 'licensingConditions'
              : page.section,
            data: page.section.startsWith('licensingConditions.')
              ? { [page.section.split('.')[1]]: processedPayload }
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
        }

        // Handle condition dates only on their respective pages
        if (page.section.startsWith('licensingConditions.')) {
          const conditionDateFields = {
            condition1: ['anticipatedAgreementDate', 'anticipatedRegisterDate'],
            condition2: ['anticipatedFacilitiesDate'],
            condition3: ['anticipatedKennelsDate'],
            condition4: ['anticipatedIdentificationDate'],
            condition5: ['anticipatedRecordsDate'],
            condition6: ['anticipatedInjuryRecordsDate']
          }

          const condition = page.section.split('.')[1]
          const dateFields = conditionDateFields[condition] || []

          for (const dateField of dateFields) {
            const combinedDate = combineDateFields(payload, dateField)
            if (combinedDate) {
              processedPayload[dateField] = new Date(combinedDate).toISOString()
            } else {
              processedPayload[dateField] = null
            }
            // Remove the individual date fields
            delete processedPayload[`${dateField}-day`]
            delete processedPayload[`${dateField}-month`]
            delete processedPayload[`${dateField}-year`]
          }
        }

        // Update the form with the current page data
        const updatedForm = {
          formName: form.formName,
          page: page.section.startsWith('licensingConditions.')
            ? 'licensingConditions'
            : page.section,
          data: page.section.startsWith('licensingConditions.')
            ? { [page.section.split('.')[1]]: processedPayload }
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
      const sectionData = form.pages?.[page.section] || {}

      // Split date fields for display if needed
      if (page.id === 'disqualification' && sectionData.applicationDate) {
        const { day, month, year } = splitDateString(
          sectionData.applicationDate
        )
        sectionData.applicationDateDay = day
        sectionData.applicationDateMonth = month
        sectionData.applicationDateYear = year
      }

      // Split condition date fields for display
      const dateFields = [
        'anticipatedAgreementDate',
        'anticipatedRegisterDate',
        'anticipatedFacilitiesDate',
        'anticipatedKennelsDate',
        'anticipatedIdentificationDate',
        'anticipatedRecordsDate',
        'anticipatedInjuryRecordsDate'
      ]

      for (const dateField of dateFields) {
        if (sectionData[dateField]) {
          const { day, month, year } = splitDateString(sectionData[dateField])
          sectionData[`${dateField}Day`] = day
          sectionData[`${dateField}Month`] = month
          sectionData[`${dateField}Year`] = year
        }
      }

      return h.view(`form/templates/${page.template}`, {
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
    } catch (error) {
      request.logger.error(
        `Error in form page controller for page ${currentPage}:`,
        error
      )
      return h.view(`form/templates/${page.template}`, {
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

      return h.view('form/templates/review', {
        pageTitle: 'Review your application',
        heading: 'Review your application',
        formId,
        formData: form.pages,
        pages: getFormPages()
      })
    } catch (error) {
      request.logger.error(
        `Error in review form controller for form ${formId}:`,
        error
      )
      return h.view('form/templates/review', {
        pageTitle: 'Review your application',
        heading: 'Review your application',
        formId,
        error:
          'There was a problem loading your application. Please try again later.'
      })
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

      return h.view('form/templates/confirmation', {
        pageTitle: 'Application complete',
        heading: 'Application complete',
        formId,
        referenceNumber: form.referenceNumber || 'HDJ2123F'
      })
    } catch (error) {
      request.logger.error(
        `Error in confirmation controller for form ${formId}:`,
        error
      )
      return h.view('form/templates/confirmation', {
        pageTitle: 'Application complete',
        heading: 'Application complete',
        referenceNumber: 'HDJ2123F'
      })
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
      }

      // Handle condition dates only on their respective pages
      if (currentPage.section.startsWith('licensingConditions.')) {
        const conditionDateFields = {
          condition1: ['anticipatedAgreementDate', 'anticipatedRegisterDate'],
          condition2: ['anticipatedFacilitiesDate'],
          condition3: ['anticipatedKennelsDate'],
          condition4: ['anticipatedIdentificationDate'],
          condition5: ['anticipatedRecordsDate'],
          condition6: ['anticipatedInjuryRecordsDate']
        }

        const condition = currentPage.section.split('.')[1]
        const dateFields = conditionDateFields[condition] || []

        for (const dateField of dateFields) {
          const combinedDate = combineDateFields(request.payload, dateField)
          if (combinedDate) {
            processedPayload[dateField] = new Date(combinedDate).toISOString()
          } else {
            processedPayload[dateField] = null
          }
          // Remove the individual date fields
          delete processedPayload[`${dateField}-day`]
          delete processedPayload[`${dateField}-month`]
          delete processedPayload[`${dateField}-year`]
        }
      }

      // Update the form with the current page data
      await formService.updateForm(request, formId, {
        formName: form.formName,
        page: currentPage.section.startsWith('licensingConditions.')
          ? 'licensingConditions'
          : currentPage.section,
        data: currentPage.section.startsWith('licensingConditions.')
          ? { [currentPage.section.split('.')[1]]: processedPayload }
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
 * @import { ServerRoute } from '@hapi/hapi'
 */
