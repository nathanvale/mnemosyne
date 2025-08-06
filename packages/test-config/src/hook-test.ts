// Hook test utilities for Claude hooks development
export function hookTestUtility(param: unknown): unknown {
  console.warn('Hook test utility running - testing configuration')
  return param
}

// Testing Claude hooks
export const hookTestValue = 'testing hooks'
