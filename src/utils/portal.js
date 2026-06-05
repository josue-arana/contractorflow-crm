export function getPortalData(lead) {
  const fallbackContract = lead.value || 0
  const fallbackPaid = Math.round(fallbackContract * 0.5)

  return {
    shareUrl: lead.portal?.shareUrl || `contractorflow.app/portal/${lead.id}`,
    percentComplete: lead.portal?.percentComplete ?? 42,
    contractAmount: lead.portal?.contractAmount ?? fallbackContract,
    depositRequired: lead.portal?.depositRequired ?? Math.round(fallbackContract * 0.5),
    amountPaid: lead.portal?.amountPaid ?? fallbackPaid,
    outstandingBalance: lead.portal?.outstandingBalance ?? Math.max(fallbackContract - fallbackPaid, 0),
    paymentStatus: lead.portal?.paymentStatus || 'Deposit Paid',
    startDate: lead.portal?.startDate || 'June 18, 2026',
    estimatedCompletion: lead.portal?.estimatedCompletion || 'July 2, 2026',
    timeline: lead.portal?.timeline || [
      { title: 'Contract Signed', date: 'June 7, 2026', status: 'Complete', note: 'Agreement approved and signed by homeowner.' },
      { title: 'Deposit Received', date: 'June 8, 2026', status: 'Complete', note: 'Deposit payment recorded.' },
      { title: 'Demolition Complete', date: 'June 19, 2026', status: 'Complete', note: 'Demo work completed and area cleaned.' },
      { title: 'Installation', date: 'In Progress', status: 'In Progress', note: 'Crew is completing installation work.' },
      { title: 'Final Walkthrough', date: 'Upcoming', status: 'Upcoming', note: 'Final walkthrough and punch list review.' },
    ],
    photos: lead.portal?.photos || [
      { label: 'Before photo', description: 'Project area before work started' },
      { label: 'Progress photo', description: 'Current work progress' },
      { label: 'Finish photo', description: 'Final photo will be uploaded' },
    ],
    documents: lead.portal?.documents || [
      { name: 'Estimate', type: 'PDF', status: 'Available' },
      { name: 'Contract', type: 'PDF', status: 'Pending' },
      { name: 'Invoice', type: 'Invoice', status: 'Pending' },
    ],
    estimate: lead.portal?.estimate || {
      number: `EST-${lead.id.replace(/\D/g, '').padStart(4, '0')}`,
      total: fallbackContract,
      summary: lead.projectType || 'Project estimate',
    },
    contract: lead.portal?.contract || {
      number: `CON-${lead.id.replace(/\D/g, '').padStart(4, '0')}`,
      signedDate: 'Not Signed',
      status: 'Not generated',
    },
  }
}
