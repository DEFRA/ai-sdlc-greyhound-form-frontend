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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        // Check if this is a validation error
        if (response.status === 400) {
          const errorData = await response.json()
          request?.logger.warn(`Validation error for ${endpoint}:`, errorData)
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      request?.logger.error(`API POST error for ${endpoint}:`, error)
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
}

export default new ApiService()
