import fetch from 'node-fetch'
import { config } from '~/src/config/config.js'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'

// Mock data store for development
const mockStore = {
  forms: new Map(),
  nextId: 1
}

const logger = createLogger()

/**
 * Base API service for interacting with the backend API
 */
class ApiService {
  constructor() {
    this.baseUrl = config.get('apiUrl')
    this.timeout = config.get('apiTimeout')
    this.useMock = process.env.USE_MOCK_API === 'true'

    if (this.useMock) {
      logger.info('Using mock API service for development')
    } else {
      logger.info(`Using API service at ${this.baseUrl}`)
    }
  }

  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} request - The request object
   * @returns {Promise<object>} The API response
   */
  async get(endpoint, request) {
    try {
      if (this.useMock) {
        return await this._mockGet(endpoint)
      }

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
      if (this.useMock) {
        return await this._mockPost(endpoint, data)
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
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
      if (this.useMock) {
        return await this._mockPut(endpoint, data)
      }

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

  // Mock implementations

  /**
   * Mock GET implementation
   * @private
   */
  _mockGet(endpoint) {
    if (endpoint === '/api/forms') {
      return Promise.resolve(Array.from(mockStore.forms.values()))
    }

    const formIdMatch = endpoint.match(/\/api\/forms\/([^/]+)$/)
    if (formIdMatch) {
      const formId = formIdMatch[1]
      const form = mockStore.forms.get(formId)

      if (!form) {
        throw new Error('Form not found')
      }

      return Promise.resolve({ ...form })
    }

    throw new Error(`Unhandled mock endpoint: ${endpoint}`)
  }

  /**
   * Mock POST implementation
   * @private
   */
  _mockPost(endpoint, data) {
    if (endpoint === '/api/forms') {
      const id = String(mockStore.nextId++)
      const newForm = {
        id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: {
          applicantDetails: {},
          disqualification: {},
          licensingConditions: {
            condition1: {},
            condition2: {},
            condition3: {},
            condition4: {},
            condition5: {},
            condition6: {}
          }
        }
      }

      mockStore.forms.set(id, newForm)
      return Promise.resolve({ ...newForm })
    }

    const submitMatch = endpoint.match(/\/api\/forms\/([^/]+)\/submit$/)
    if (submitMatch) {
      const formId = submitMatch[1]
      const form = mockStore.forms.get(formId)

      if (!form) {
        throw new Error('Form not found')
      }

      const updatedForm = {
        ...form,
        status: 'submitted',
        updatedAt: new Date().toISOString(),
        referenceNumber: `HDJ${Math.floor(Math.random() * 10000)}F`
      }

      mockStore.forms.set(formId, updatedForm)
      return Promise.resolve({ ...updatedForm })
    }

    throw new Error(`Unhandled mock endpoint: ${endpoint}`)
  }

  /**
   * Mock PUT implementation
   * @private
   */
  _mockPut(endpoint, data) {
    const formIdMatch = endpoint.match(/\/api\/forms\/([^/]+)$/)
    if (formIdMatch) {
      const formId = formIdMatch[1]
      const existingForm = mockStore.forms.get(formId)

      if (!existingForm) {
        throw new Error('Form not found')
      }

      // Update form data
      const updatedForm = {
        ...existingForm,
        ...data,
        id: formId, // Ensure ID doesn't get overwritten
        updatedAt: new Date().toISOString()
      }

      // If updating a specific page
      if (data.pages) {
        updatedForm.pages = {
          ...existingForm.pages,
          ...data.pages
        }
      }

      mockStore.forms.set(formId, updatedForm)
      return Promise.resolve({ ...updatedForm })
    }

    throw new Error(`Unhandled mock endpoint: ${endpoint}`)
  }
}

export default new ApiService()
