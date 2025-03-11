import { context } from './context.js'

const mockReadFileSync = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: () => mockReadFileSync()
}))
jest.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('#context', () => {
  describe('When webpack manifest file read succeeds', () => {
    let contextResult

    beforeAll(() => {
      contextResult = context({ path: '/' })
    })

    test('Should provide expected context', () => {
      expect(contextResult).toEqual({
        assetPath: '/public/assets',
        breadcrumbs: [],
        currentPath: '/',
        getAssetPath: expect.any(Function),
        navigation: [
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
        ],
        serviceName: 'Greyhound Racetrack Welfare Licence',
        serviceUrl: '/'
      })
    })

    describe('With valid asset path', () => {
      test('Should provide expected asset path', () => {
        const assetPath = contextResult.getAssetPath('test.css')
        expect(assetPath).toBe('/public/test.css')
      })
    })

    describe('With invalid asset path', () => {
      test('Should provide expected asset', () => {
        const assetPath = contextResult.getAssetPath()
        expect(assetPath).toBe('/public/undefined')
      })
    })
  })

  describe('When webpack manifest file read fails', () => {
    test('Should log that the Webpack Manifest file is not available', () => {
      const contextResult = context({ path: '/' })
      expect(contextResult.getAssetPath('test.css')).toBe('/public/test.css')
    })
  })
})

describe('#context cache', () => {
  describe('Webpack manifest file cache', () => {
    let contextResult

    beforeAll(() => {
      contextResult = context({ path: '/' })
    })

    test('Should read file', () => {
      expect(contextResult.getAssetPath('test.css')).toBe('/public/test.css')
    })

    test('Should use cache', () => {
      expect(contextResult.getAssetPath('test.css')).toBe('/public/test.css')
    })

    test('Should provide expected context', () => {
      expect(contextResult).toEqual({
        assetPath: '/public/assets',
        breadcrumbs: [],
        currentPath: '/',
        getAssetPath: expect.any(Function),
        navigation: [
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
        ],
        serviceName: 'Greyhound Racetrack Welfare Licence',
        serviceUrl: '/'
      })
    })
  })
})
