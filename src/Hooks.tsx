import { useEffect, useState } from 'react'

function useBrowserStorage<T>(
  key: string,
  initialValue: T,
  type: 'session' | 'local',
  prefix?: string
): [T, (v: T) => void] {
  const storage = type === 'session' ? sessionStorage : localStorage
  key = `${prefix ?? ''}${key}`

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    const item = localStorage.getItem(key)
    try {
      return item ? JSON.parse(item) : initialValue
    } catch (error: any) {
      console.warn(
        `Failed to parse stored value for '${key}'.\nContinuing with default value.\nError: ${error.message}`
      )
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)): void => {
    if (typeof window === 'undefined') {
      return
    }
    if (value === undefined) {
      // Delete item if set to undefined. This avoids warning on loading invalid json
      setStoredValue(value)
      storage.removeItem(key)
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      storage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.log(`Failed to store value '${value}' for key '${key}'`)
    }
  }

  useEffect(() => {
    const storageEventHandler = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === key) {
        setStoredValue(JSON.parse(event.newValue ?? '') as T)
      }
    }
    window.addEventListener('storage', storageEventHandler, false)
    return () => window.removeEventListener('storage', storageEventHandler, false)
  })

  return [storedValue, setValue]
}

export default useBrowserStorage
