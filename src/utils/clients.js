export function getClientSlug(name = '') {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildClientProfiles(leads = [], customClients = []) {
  const clientMap = new Map()

  customClients.forEach((client) => {
    const id = client.id || getClientSlug(client.name)
    clientMap.set(id, {
      id,
      name: client.name || 'Unknown Client',
      phone: client.phone || '(410) 555-0100',
      email: client.email || `${id || 'client'}@example.com`,
      address: client.address || 'Address not added',
      latestProjectStatus: client.latestProjectStatus || 'Lead',
      projectCount: 0,
      totalProjectValue: 0,
      outstandingBalance: 0,
      repeatClient: Boolean(client.repeatClient),
      projects: [],
      notes: client.notes ? [client.notes] : ['Client added manually.'],
      manualClient: true,
    })
  })

  leads.forEach((lead) => {
    const name = lead.client || 'Unknown Client'
    const slug = getClientSlug(name)
    const existing = clientMap.get(slug)
    const contractAmount = lead.portal?.contractAmount || lead.value || 0
    const paid = lead.portal?.amountPaid || 0
    const balance = lead.portal?.outstandingBalance ?? Math.max(contractAmount - paid, 0)

    const projectRecord = {
      ...lead,
      projectValue: contractAmount,
      amountPaid: paid,
      outstandingBalance: balance,
      latestStatus: lead.projectStatus || lead.status,
    }

    if (existing) {
      existing.projects.push(projectRecord)
      existing.projectCount += 1
      existing.totalProjectValue += contractAmount
      existing.outstandingBalance += balance
      existing.repeatClient = existing.repeatClient || existing.projectCount > 1 || lead.source === 'Repeat Client'
      existing.latestProjectStatus = projectRecord.latestStatus || existing.latestProjectStatus
      if (!existing.phone && lead.phone) existing.phone = lead.phone
      if (!existing.email && lead.email) existing.email = lead.email
      if (!existing.address && lead.address) existing.address = lead.address
      if (lead.nextStep) existing.notes = [...new Set([...(existing.notes || []), lead.nextStep])]
    } else {
      clientMap.set(slug, {
        id: slug,
        name,
        phone: lead.phone || '(410) 555-0100',
        email: lead.email || `${slug || 'client'}@example.com`,
        address: lead.address || lead.location || 'Address not added',
        latestProjectStatus: projectRecord.latestStatus || lead.status,
        projectCount: 1,
        totalProjectValue: contractAmount,
        outstandingBalance: balance,
        repeatClient: lead.source === 'Repeat Client',
        projects: [projectRecord],
        notes: [
          lead.nextStep || 'Follow up with client on next project step.',
          lead.source ? `Source: ${lead.source}` : 'Client source not recorded.',
        ],
      })
    }
  })

  return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
