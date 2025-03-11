/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  const currentPath = request?.path ?? '/'

  return [
    {
      text: 'Home',
      url: '/',
      isActive: currentPath === '/'
    },
    {
      text: 'Dashboard',
      url: '/dashboard',
      isActive:
        currentPath === '/dashboard' ||
        (currentPath.startsWith('/form/') && currentPath !== '/form/new')
    },
    {
      text: 'New Application',
      url: '/form/new',
      isActive: currentPath === '/form/new'
    },
    {
      text: 'Contact',
      url: '/contact',
      isActive: currentPath === '/contact'
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
