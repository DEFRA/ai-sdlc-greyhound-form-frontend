/**
 * Contact page controller
 * @satisfies {Partial<ServerRoute>}
 */
export const contactController = {
  handler(_request, h) {
    return h.view('contact/views/index', {
      pageTitle: 'Contact Us',
      heading: 'Contact Us',
      breadcrumbs: [
        {
          text: 'Home',
          href: '/'
        },
        {
          text: 'Contact Us'
        }
      ]
    })
  }
}
