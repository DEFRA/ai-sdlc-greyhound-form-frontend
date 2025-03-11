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
      return await apiService.get('/api/forms')
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
      return await apiService.get(`/api/forms/${formId}`)
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
      return await apiService.post('/api/forms', formData)
    } catch (error) {
      request.logger.error('Error creating form:', error)
      return null
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
      return await apiService.put(`/api/forms/${formId}`, formData)
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
      return await apiService.post(`/api/forms/${formId}/submit`, {})
    } catch (error) {
      request.logger.error(`Error submitting form ${formId}:`, error)
      return null
    }
  }
}

export default new FormService()
