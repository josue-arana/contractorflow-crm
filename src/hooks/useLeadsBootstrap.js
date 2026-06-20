import { useEffect } from 'react'
import { USE_SUPABASE_LEADS } from '../config/backendConfig'
import { useAuth } from '../contexts/AuthContext'
import dataProvider from '../services/dataProvider'
import { getLeadsContractorId } from '../services/system/leadsRuntimeService'

function warnDev(message, meta) {
  if (!import.meta.env.DEV) return

  if (meta === undefined) {
    // eslint-disable-next-line no-console
    console.warn(message)
    return
  }

  // eslint-disable-next-line no-console
  console.warn(message, meta)
}

export function useLeadsBootstrap(setLeads) {
  const { contractor, company, session } = useAuth()
  const contractorId = getLeadsContractorId({ contractor, company, session })

  useEffect(() => {
    let isCancelled = false

    if (!USE_SUPABASE_LEADS) {
      return undefined
    }

    async function loadLeads() {
      const response = await dataProvider.leads.list({ contractorId })

      if (isCancelled) return

      if (response?.error) {
        warnDev('[dev] Failed to load leads from Supabase during bootstrap.', response.error)
        return
      }

      setLeads(Array.isArray(response?.data) ? response.data : [])
    }

    loadLeads()

    return () => {
      isCancelled = true
    }
  }, [contractorId, setLeads])
}

export default useLeadsBootstrap
