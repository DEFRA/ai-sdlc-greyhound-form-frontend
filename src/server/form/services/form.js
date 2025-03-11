import apiService from './api.js'

/**
 * Form service for interacting with the form API endpoints
 */
class FormService {
  /**
   * Get all forms
   * @param {object} request - The request object
   * @returns {Promise<Array>} Array of forms
   */
  async getForms(request) {
    try {
      const response = await apiService.get('/api/forms')
      return response?.forms || []
    } catch (error) {
      request.logger.error('Error fetching forms:', error)
      return []
    }
  }

  /**
   * Get a form by ID
   * @param {object} request - The request object
   * @param {string} formId - The form ID
   * @returns {Promise<object | null>} The form or null if not found
   */
  async getFormById(request, formId) {
    if (!formId) {
      request.logger.error('Form ID is required')
      return null
    }

    try {
      const response = await apiService.get(`/api/forms/${formId}`)
      return response?.form || null
    } catch (error) {
      request.logger.error(`Error fetching form ${formId}:`, error)
      return null
    }
  }

  /**
   * Create a new form
   * @param {object} request - The request object
   * @param {object} formData - The form data
   * @returns {Promise<object | null>} The created form or null if failed
   */
  async createForm(request, formData) {
    if (!formData?.formName) {
      request.logger.error('Form name is required')
      return null
    }

    try {
      const response = await apiService.post('/api/forms', formData)
      // The API returns { message, form } where form contains the form data
      if (!response?.form?.id) {
        request.logger.error(
          'API response missing form data or form ID:',
          response
        )
        return null
      }
      return response.form
    } catch (error) {
      request.logger.error('Error creating form:', error)
      throw error // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Update a form
   * @param {object} request - The request object
   * @param {string} formId - The form ID
   * @param {object} formData - The form data
   * @returns {Promise<object | null>} The updated form or null if failed
   */
  async updateForm(request, formId, formData) {
    if (!formId) {
      request.logger.error('Form ID is required')
      return null
    }

    try {
      const response = await apiService.put(`/api/forms/${formId}`, formData)
      return response?.form || null
    } catch (error) {
      request.logger.error(`Error updating form ${formId}:`, error)
      throw error
    }
  }

  /**
   * Submit a form
   * @param {object} request - The request object
   * @param {string} formId - The form ID
   * @returns {Promise<object | null>} The submitted form or null if failed
   */
  async submitForm(request, formId) {
    if (!formId) {
      request.logger.error('Form ID is required')
      return null
    }

    try {
      const response = await apiService.post(`/api/forms/${formId}/submit`, {})
      return response?.form || null
    } catch (error) {
      request.logger.error(`Error submitting form ${formId}:`, error)
      return null
    }
  }
}

export default FormService
