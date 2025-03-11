import {
  dashboardController,
  newFormController,
  formPageController,
  reviewFormController,
  confirmationController,
  saveFormController
} from './controller.js'

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
        }
      ])
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
