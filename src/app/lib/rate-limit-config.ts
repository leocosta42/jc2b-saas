export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    action: 'login',
    maxAttempts: 5,
    windowMinutes: 15,
    identifier: 'email' as const
  },
  CREATE_DOCUMENT: {
    action: 'create_document',
    maxAttempts: 20,
    windowMinutes: 60,
    identifier: 'email' as const
  },
  EXPORT_DATA: {
    action: 'export_data',
    maxAttempts: 10,
    windowMinutes: 60,
    identifier: 'email' as const
  },
  BRUTE_FORCE_IP: {
    action: 'brute_force_detection',
    maxAttempts: 50,
    windowMinutes: 15,
    identifier: 'ip' as const
  }
}
