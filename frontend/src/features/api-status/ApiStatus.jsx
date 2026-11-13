import { API_STATUS, useApiStatus } from './useApiStatus.js'
import './ApiStatus.css'

const LABELS = {
  [API_STATUS.checking]: "Connexion à l'API…",
  [API_STATUS.connected]: 'API connectée',
  [API_STATUS.unreachable]: 'API injoignable',
}

function ApiStatus() {
  const status = useApiStatus()

  return (
    <p className={`api-status api-status--${status}`} role="status">
      {LABELS[status]}
    </p>
  )
}

export default ApiStatus
