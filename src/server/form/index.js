import {
  dashboardController,
  newFormController,
  formPageController,
  reviewFormController,
  confirmationController,
  saveFormController
} from './controller.js'
import FormService from './services/form.js'

export const formService = new FormService()

/**
 * Sets up the routes used in the form pages.
 * These routes are registered in src/server/router.js.
 */

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const form = {
  plugin: {
    name: 'form',
    register(server) {
      server.route([
        // Frontend UI routes
        {
          method: 'GET',
          path: '/dashboard',
          ...dashboardController
        },
        {
          method: 'GET',
          path: '/form/new',
          ...newFormController
        },
        {
          method: 'POST',
          path: '/form/new',
          ...newFormController
        },
        {
          method: 'GET',
          path: '/form/{formId}/page/{pageNumber}',
          ...formPageController
        },
        {
          method: 'POST',
          path: '/form/{formId}/page/{pageNumber}',
          ...formPageController
        },
        {
          method: 'GET',
          path: '/form/{formId}/review',
          ...reviewFormController
        },
        {
          method: 'POST',
          path: '/form/{formId}/review',
          ...reviewFormController
        },
        {
          method: 'GET',
          path: '/form/{formId}/confirmation',
          ...confirmationController
        },
        {
          method: 'POST',
          path: '/form/{formId}/save',
          ...saveFormController
        },

        // API routes matching swagger spec
        {
          method: 'GET',
          path: '/api/forms',
          handler: async (request, h) => {
            return h.response(await formService.getForms(request))
          }
        },
        {
          method: 'POST',
          path: '/api/forms',
          handler: async (request, h) => {
            return h.response(
              await formService.createForm(request, request.payload)
            )
          }
        },
        {
          method: 'GET',
          path: '/api/forms/{formId}',
          handler: async (request, h) => {
            return h.response(
              await formService.getFormById(request, request.params.formId)
            )
          }
        },
        {
          method: 'PUT',
          path: '/api/forms/{formId}',
          handler: async (request, h) => {
            return h.response(
              await formService.updateForm(
                request,
                request.params.formId,
                request.payload
              )
            )
          }
        },
        {
          method: 'POST',
          path: '/api/forms/{formId}/submit',
          handler: async (request, h) => {
            return h.response(
              await formService.submitForm(request, request.params.formId)
            )
          }
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
