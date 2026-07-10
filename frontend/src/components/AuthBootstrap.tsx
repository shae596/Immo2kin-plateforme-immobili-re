import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

interface AuthBootstrapProps {
  children: React.ReactNode
}

/**
 * Charge la session Sanctum au démarrage sans bloquer l'interface.
 * Les routes protégées attendent la fin du bootstrap avant de rediriger.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return <>{children}</>
}
