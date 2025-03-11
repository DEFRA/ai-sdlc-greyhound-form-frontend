import { getFormPages, getValueByPath } from './helpers.js'
import formService from './services/form.js'

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
        const newForm = await formService.createForm(request, {
          formName: payload.formName.trim(),
          status: 'in-progress'
        })

        if (!newForm) {
          request.logger.error('Failed to create form - API returned null')
          return h.view('form/templates/new-form', {
            pageTitle: 'Start a new application',
            heading: 'Start a new application',
            formName: payload.formName,
            error:
              'There was a problem creating your application. Please try again.'
          })
        }

        return h.redirect(`/form/${newForm.id}/page/1`)
      } catch (error) {
        request.logger.error('Error creating form:', error)
        return h.view('form/templates/new-form', {
          pageTitle: 'Start a new application',
          heading: 'Start a new application',
          formName: request.payload?.formName,
          error:
            'There was a problem creating your application. Please try again.'
        })
      }
    }

    return h.view('form/templates/new-form', {
      pageTitle: 'Start a new application',
      heading: 'Start a new application'
    })
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
          // Update the form with the current page data
          const updatedForm = {
            ...form,
            pages: {
              ...form.pages,
              [page.section]: {
                ...getValueByPath(form.pages, page.section),
                ...payload
              }
            }
          }

          await formService.updateForm(request, formId, updatedForm)

          return h.redirect('/dashboard')
        }

        // Update the form with the current page data
        const updatedForm = {
          ...form,
          pages: {
            ...form.pages,
            [page.section]: {
              ...getValueByPath(form.pages, page.section),
              ...payload
            }
          }
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
      const sectionData = getValueByPath(form.pages, page.section) || {}

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

      // Update the form with the current page data
      await formService.updateForm(request, formId, {
        ...form,
        ...request.payload
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
