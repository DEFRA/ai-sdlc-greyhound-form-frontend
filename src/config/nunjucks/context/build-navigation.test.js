import { buildNavigation } from './build-navigation.js'

/**
 * @import { Request } from '@hapi/hapi'
 */

describe('#buildNavigation', () => {
  const mockRequest = ({ path }) => ({ path })

  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: false,
        text: 'Dashboard',
        url: '/dashboard'
      },
      {
        isActive: false,
        text: 'New Application',
        url: '/form/new'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
      {
        isActive: true,
        text: 'Home',
        url: '/'
      },
      {
        isActive: false,
        text: 'Dashboard',
        url: '/dashboard'
      },
      {
        isActive: false,
        text: 'New Application',
        url: '/form/new'
      }
    ])
  })

  test('Should highlight Dashboard when on dashboard page', () => {
    expect(buildNavigation(mockRequest({ path: '/dashboard' }))).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: true,
        text: 'Dashboard',
        url: '/dashboard'
      },
      {
        isActive: false,
        text: 'New Application',
        url: '/form/new'
      }
    ])
  })

  test('Should highlight Dashboard when on form pages', () => {
    expect(buildNavigation(mockRequest({ path: '/form/123' }))).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: true,
        text: 'Dashboard',
        url: '/dashboard'
      },
      {
        isActive: false,
        text: 'New Application',
        url: '/form/new'
      }
    ])
  })

  test('Should highlight New Application when on new form page', () => {
    expect(buildNavigation(mockRequest({ path: '/form/new' }))).toEqual([
      {
        isActive: false,
        text: 'Home',
        url: '/'
      },
      {
        isActive: false,
        text: 'Dashboard',
        url: '/dashboard'
      },
      {
        isActive: true,
        text: 'New Application',
        url: '/form/new'
      }
    ])
  })
})
