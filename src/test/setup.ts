import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver - must be a proper constructor
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Store callback if needed for tests
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock hasPointerCapture (used by Radix UI)
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

// Mock pointer events (Radix UI uses these)
Object.defineProperty(window, 'PointerEvent', {
  writable: true,
  value: class PointerEvent extends MouseEvent {
    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props)
    }
  },
})

// Mock getComputedStyle for animations
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
  const style = originalGetComputedStyle(element, pseudoElt)

  // Create a proper CSSStyleDeclaration-like object
  return new Proxy(style, {
    get(target, prop) {
      if (prop === 'animationDuration') return '0s'
      if (prop === 'transitionDuration') return '0s'
      if (prop === 'getPropertyValue') {
        return (name: string) => {
          if (name === 'animation-duration') return '0s'
          if (name === 'transition-duration') return '0s'
          return target.getPropertyValue(name)
        }
      }
      const value = target[prop as keyof CSSStyleDeclaration]
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    }
  }) as CSSStyleDeclaration
}

// Suppress console errors for specific patterns during tests
const originalError = console.error
console.error = (...args: unknown[]) => {
  // Suppress React act() warnings and Radix internal warnings
  const message = args[0]?.toString() || ''
  if (
    message.includes('Warning: An update to') ||
    message.includes('Warning: Cannot update a component')
  ) {
    return
  }
  originalError.apply(console, args)
}
