import { useCallback, useEffect, useState } from "react"

export type Route =
  | { page: "dashboard" }
  | { page: "editor"; room: string }

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "")
  if (!hash || hash === "dashboard") return { page: "dashboard" }
  return { page: "editor", room: hash }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const navigate = useCallback((path: string) => {
    window.location.hash = path ? `/${path}` : ""
  }, [])

  return { route, navigate }
}
