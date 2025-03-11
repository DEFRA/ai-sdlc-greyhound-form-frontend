import fetch from 'node-fetch'
import { config } from '~/src/config/config.js'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Base API service for interacting with the backend API
 */
class ApiService {
  constructor() {
    this.baseUrl = config.get('apiUrl')
    this.timeout = config.get('apiTimeout')

    logger.info(`Using API service at ${this.baseUrl}`)
  }

  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} request - The request object
   * @returns {Promise<object>} The API response
   */
  async get(endpoint, request) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      request?.logger.error(`API GET error for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Make a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} data - The data to send
   * @param {object} request - The request object
   * @returns {Promise<object>} The API response
   */
  async post(endpoint, data, request) {
    try {
      // Convert form data to JSON if needed
      const jsonData =
        data instanceof URLSearchParams ? Object.fromEntries(data) : data

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Check if this is a validation error
        if (response.status === 400) {
          request?.logger.warn(
            `Validation error for ${endpoint}:`,
            responseData
          )
          const error = new Error(responseData.message || 'Validation error')
          error.status = 400
          throw error
        }
        const error = new Error(
          responseData.message || `HTTP error! status: ${response.status}`
        )
        error.status = response.status
        throw error
      }

      return responseData
    } catch (error) {
      request?.logger.error(`API POST error for ${endpoint}:`, error)

      // Handle network errors
      if (error.code === 'ECONNREFUSED') {
        const networkError = new Error(
          'Unable to connect to the API. Please ensure the API server is running.'
        )
        networkError.status = 503
        throw networkError
      }

      // Preserve the error status if it exists
      if (!error.status) {
        error.status = 500
      }
      throw error
    }
  }

  /**
   * Make a PUT request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} data - The data to send
   * @param {object} request - The request object
   * @returns {Promise<object>} The API response
   */
  async put(endpoint, data, request) {
    try {
      // Convert form data to JSON if needed
      const jsonData =
        data instanceof URLSearchParams ? Object.fromEntries(data) : data

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      request?.logger.error(`API PUT error for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} request - The request object
   * @returns {Promise<Response>} The API response
   */
  async delete(endpoint, request) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    } catch (error) {
      request?.logger.error(`API DELETE error for ${endpoint}:`, error)
      throw error
    }
  }
}

export default new ApiService()
