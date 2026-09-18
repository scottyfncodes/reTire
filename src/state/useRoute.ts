import { useCallback, useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'mode'; mode: string }
  | { name: 'adventure'; id: string }
  | { name: 'builder' }
  | { name: 'trips' }
  | { name: 'trip'; id: string }
  | { name: 'log' }
  | { name: 'profile' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [head, tail] = path.split('/')
  switch (head) {
    case 'mode':
      return tail ? { name: 'mode', mode: tail } : { name: 'home' }
    case 'adventure':
      return tail ? { name: 'adventure', id: tail } : { name: 'home' }
    case 'builder':
      return { name: 'builder' }
    case 'trips':
      return { name: 'trips' }
    case 'trip':
      return tail ? { name: 'trip', id: tail } : { name: 'trips' }
    case 'log':
      return { name: 'log' }
    case 'profile':
      return { name: 'profile' }
    default:
      return { name: 'home' }
  }
}

export function useRoute(): [Route, (path: string) => void, () => void] {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((path: string) => {
    location.hash = path.startsWith('#') ? path : `#/${path}`
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    if (history.length > 1) history.back()
    else location.hash = '#/'
  }, [])

  return [route, go, back]
}
