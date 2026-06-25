import { cache } from 'react'
import { getAdminAnalytics } from './shopifyAdmin'

export const getCachedAnalytics = cache(getAdminAnalytics)
