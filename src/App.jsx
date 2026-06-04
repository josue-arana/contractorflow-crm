import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, ChevronDown, ClipboardList, DollarSign, ExternalLink, FileText, Home, Menu, Search, Settings, Share2, Users, X, Zap } from 'lucide-react'
import { initialLeads, pipelineStatuses } from './data/mockLeads'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})



const LANGUAGE_STORAGE_KEYS = {
  contractor: 'contractorflow.contractorLanguage',
  portal: 'contractorflow.portalLanguage',
}

function getStoredLanguage(storageKey) {
  if (typeof window === 'undefined') return 'en'
  const storedLanguage = window.localStorage.getItem(storageKey)
  return storedLanguage === 'es' || storedLanguage === 'en' ? storedLanguage : 'en'
}

const sidebarNavItems = [
  { labelKey: 'dashboard', path: '/dashboard', icon: Home },
  { labelKey: 'leads', path: '/leads', icon: Users },
  { labelKey: 'estimates', path: '/estimates', icon: ClipboardList },
  { labelKey: 'jobs', path: '/jobs', icon: BriefcaseBusiness },
  { labelKey: 'calendar', path: '/calendar', icon: CalendarDays },
  { labelKey: 'clients', path: '/clients', icon: Users },
  { labelKey: 'invoices', path: '/invoices', icon: DollarSign },
  { labelKey: 'settings', path: '/settings', icon: Settings },
]

const translations = {
  "en": {
    "brandInitials": "CF",
    "brandName": "ContractorFlow",
    "userInitials": "JA",
    "userName": "Josue Arana",
    "appName": "ContractorFlow CRM",
    "smallContractorCrm": "Small Contractor CRM",
    "language": "Language",
    "english": "English",
    "spanish": "Spanish",
    "searchPlaceholder": "Search leads, clients, estimates...",
    "ownerAdmin": "Owner Admin",
    "dashboard": "Dashboard",
    "leads": "Leads",
    "estimates": "Estimates",
    "jobs": "Jobs",
    "contracts": "Contracts",
    "payments": "Payments",
    "customerPortal": "Customer Portal",
    "calendar": "Calendar",
    "clients": "Clients",
    "invoices": "Invoices",
    "settings": "Settings",
    "nav.dashboard": "Dashboard",
    "nav.leads": "Leads",
    "nav.jobs": "Jobs",
    "nav.estimates": "Estimates",
    "nav.contracts": "Contracts",
    "nav.payments": "Payments",
    "nav.customerPortal": "Customer Portal",
    "nav.calendar": "Calendar",
    "nav.clients": "Clients",
    "nav.invoices": "Invoices",
    "nav.settings": "Settings",
    "leadPipelineDashboard": "Lead Pipeline Dashboard",
    "dashboardHeroText": "Track remodeling, deck, roofing, and painting opportunities from first call to signed job.",
    "addLead": "Add Lead",
    "metricNewLeads": "New Leads",
    "metricNewLeadsHelper": "+12% this week",
    "metricActiveEstimates": "Active Estimates",
    "metricActiveEstimatesHelper": "Needs follow-up",
    "metricJobsInProgress": "Jobs In Progress",
    "metricJobsInProgressHelper": "Across all crews",
    "metricRevenuePipeline": "Revenue Pipeline",
    "metricRevenuePipelineHelper": "Open opportunity value",
    "pipelineHealth": "Pipeline Health",
    "pipelineHealthText": "Keep jobs moving without extra CRM complexity.",
    "leadPipeline": "Lead Pipeline",
    "dragCardsHelp": "Drag cards between stages as prospects move forward.",
    "chooseStageHelp": "Choose a stage, then update each lead using the status control.",
    "activeOpportunities": "active opportunities",
    "pipelineStage": "Pipeline stage",
    "noLeadsInStage": "No leads in this stage yet.",
    "dropLeadHere": "Drop lead here",
    "changeStatus": "Change Status",
    "jobsPageTitle": "Active Job Tracking",
    "jobsHeroText": "Manage signed remodeling, roofing, deck, and bathroom projects from scheduled start through final payment.",
    "scheduleJob": "Schedule Job",
    "jobList": "Job List",
    "jobListHelp": "Click a job row or View Job to open the existing project workspace.",
    "filterJobsByStatus": "Filter jobs by status",
    "activeJobs": "Active Jobs",
    "activeJobsHelper": "Signed projects not fully closed",
    "inProgress": "In Progress",
    "inProgressHelper": "Crews currently working",
    "waiting": "Waiting",
    "waitingHelper": "Client or material blockers",
    "completedThisMonth": "Completed This Month",
    "completedThisMonthHelper": "Ready to invoice or archive",
    "outstandingBalanceHelper": "Remaining across jobs",
    "customerProject": "Customer / Project",
    "value": "Value",
    "paid": "Paid",
    "remaining": "Remaining",
    "action": "Action",
    "viewJob": "View Job",
    "start": "Start",
    "noJobsFound": "No jobs found",
    "noJobsFoundHelp": "Try another status filter or convert a won project into an active job.",
    "projectWorkspace": "Project Workspace",
    "backToDashboard": "Back to dashboard",
    "backToDashboardAction": "Back to Dashboard",
    "projectValue": "Project Value",
    "contractorActions": "Contractor Actions",
    "contractorActionsHelp": "Simple field-ready actions for estimates, contracts, payments, photos, and the customer portal.",
    "createEstimate": "Create Estimate",
    "openEstimate": "Open Estimate",
    "convertToContract": "Convert to Contract",
    "openContract": "Open Contract",
    "recordPayment": "Record Payment",
    "uploadPhotos": "Upload Photos",
    "openCustomerPortal": "Open Customer Portal",
    "viewSharedPortal": "View Shared Portal",
    "customerInformation": "Customer Information",
    "projectInformation": "Project Information",
    "name": "Name",
    "phone": "Phone",
    "email": "Email",
    "address": "Address",
    "status": "Status",
    "startDate": "Start Date",
    "targetCompletion": "Target Completion",
    "nextStep": "Next Step",
    "homeownerPortalPreview": "Homeowner Portal Preview",
    "homeownerPortalPreviewHelp": "A simple customer view for status, payments, photos, and documents.",
    "estimate": "Estimate",
    "estimateBuilder": "Estimate Builder",
    "estimateBuilderHelp": "Keep the estimate simple. Write the scope, set the total, and add line items only when needed.",
    "scopeOfWork": "Scope of Work",
    "paymentTerms": "Payment Terms",
    "materialsIncluded": "Materials included",
    "addLineItems": "Add Line Items",
    "hideLineItems": "Hide Line Items",
    "totalAmount": "Total Amount",
    "saveEstimate": "Save Estimate",
    "previewEstimate": "Preview Estimate",
    "lineItems": "Line Items",
    "item": "Item",
    "amount": "Amount",
    "addItem": "Add Item",
    "estimateContract": "Estimate & Contract",
    "estimateFor": "estimate for",
    "laborAndProjectSetup": "Labor and project setup",
    "materialsAndFinishWork": "Materials and finish work",
    "defaultPaymentTerms": "50% deposit due to start. Remaining balance due weekly based on work progress.",
    "contract": "Contract",
    "contractPreview": "Contract Preview",
    "saveContract": "Save Contract",
    "editContract": "Edit Contract",
    "previewPdf": "Preview PDF",
    "markAsSigned": "Mark as Signed",
    "projectScope": "Project Scope",
    "materials": "Materials",
    "timeline": "Timeline",
    "changeOrders": "Change Orders",
    "clientResponsibilities": "Client Responsibilities",
    "warrantyDisclaimer": "Warranty Disclaimer",
    "signatureLines": "Signature Lines",
    "contractorSignature": "Contractor Signature",
    "clientSignature": "Client Signature",
    "contractTermsText": "50% deposit is required before work begins. Remaining balance is due weekly based on work progress and final balance is due upon completion.",
    "materialsText": "Materials are included unless otherwise noted in writing. Customer selections may affect total project price.",
    "timelineTextPrefix": "Estimated start date:",
    "estimatedCompletion": "Estimated completion:",
    "changeOrdersText": "Any changes outside the approved scope must be documented and approved before work continues.",
    "clientResponsibilitiesText": "Client is responsible for access to the property, timely selections, and removing personal items from work areas.",
    "warrantyDisclaimerText": "Warranty coverage applies to workmanship only and does not cover pre-existing conditions, owner-supplied materials, or normal wear.",
    "paymentProgress": "Payment Progress",
    "documents": "Documents",
    "projectStatus": "Project Status",
    "uploadedPhotos": "Uploaded Photos",
    "contractAmount": "Contract Amount",
    "paidToDate": "Paid To Date",
    "outstandingBalance": "Outstanding Balance",
    "paymentStatus": "Payment Status",
    "depositRequired": "Deposit Required",
    "depositPaid": "Deposit Paid",
    "signedDate": "Signed Date",
    "needHelp": "Need Help?",
    "needHelpText": "Questions about schedule, payments, selections, or change orders? Contact your contractor directly from your project workspace.",
    "messageContractor": "Message Contractor",
    "target": "Target",
    "complete": "complete",
    "yes": "Yes",
    "no": "No",
    "comingSoon": "Coming Soon",
    "plannedWorkflow": "Planned workflow",
    "plannedWorkflowText": "This page is now connected to the main application navigation. The sidebar, mobile menu, active route highlighting, and browser navigation all work, so this section can be expanded without changing the app flow later.",
    "leadsComingTitle": "Leads",
    "leadsComingDescription": "A full lead list, filters, lead owners, and follow-up tasks will live here. For now, manage active opportunities from the dashboard pipeline.",
    "estimatesComingTitle": "Estimates",
    "estimatesComingDescription": "Centralized estimate management, estimate statuses, and reusable scope templates are coming soon.",
    "calendarComingTitle": "Calendar",
    "calendarComingDescription": "Upcoming walkthroughs, estimate appointments, crew schedules, and project milestones will appear here.",
    "clientsComingTitle": "Clients",
    "clientsComingDescription": "Customer profiles, contact history, addresses, and project records will be organized here.",
    "invoicesComingTitle": "Invoices",
    "invoicesComingDescription": "Invoice tracking, balances due, payment history, and overdue reminders are planned for this section.",
    "settingsComingTitle": "Settings",
    "settingsComingDescription": "Company profile, team members, estimate defaults, payment terms, and portal settings will be configured here.",
    "projectNotFound": "Project Not Found",
    "projectNotFoundDescription": "This project could not be found. Return to the dashboard and select an active project.",
    "portalNotFound": "Portal Not Found",
    "portalNotFoundDescription": "This customer portal link does not match an active project.",
    "estimateNotFound": "Estimate Not Found",
    "contractNotFound": "Contract Not Found",
    "selectProjectFirst": "Select a project first.",
    "noPayments": "No payments recorded",
    "noPhotos": "No photos uploaded",
    "noInvoices": "No invoices available",
    "noLeads": "No leads found",
    "noJobs": "No active jobs found",
    "location": "Location",
    "source": "Source",
    "priority": "Priority",
    "customerName": "Customer Name",
    "projectTitle": "Project Title",
    "projectType": "Project Type",
    "paymentDate": "Payment Date",
    "notes": "Notes",
    "paymentMethod": "Payment Method",
    "paymentType": "Payment Type",
    "description": "Description",
    "date": "Date",
    "type": "Type",
    "number": "Number",
    "summary": "Summary",
    "total": "Total",
    "balance": "Balance",
    "dueDate": "Due Date",
    "all": "All",
    "scheduled": "Scheduled",
    "waitingOnClient": "Waiting on Client",
    "waitingOnMaterials": "Waiting on Materials",
    "readyForFinalWalkthrough": "Ready for Final Walkthrough",
    "completed": "Completed",
    "signed": "Signed",
    "won": "Won",
    "newLead": "New Lead",
    "contacted": "Contacted",
    "estimateSent": "Estimate Sent",
    "paidStatus": "Paid",
    "lead": "Lead",
    "contractSent": "Contract Sent",
    "projectStageLead": "Lead",
    "projectStageEstimateSent": "Estimate Sent",
    "projectStageContractSent": "Contract Sent",
    "projectStageSigned": "Signed",
    "projectStageInProgress": "In Progress",
    "projectStageCompleted": "Completed",
    "projectStagePaid": "Paid",
    "unpaid": "Unpaid",
    "partial": "Partially Paid",
    "depositPaidStatus": "Deposit Paid",
    "paidInFull": "Paid in Full",
    "progressPaymentPaid": "Progress Payment Paid",
    "finalBalanceDue": "Final Balance Due",
    "notPaid": "Not Paid",
    "notSigned": "Not Signed",
    "notGenerated": "Not generated",
    "pending": "Pending",
    "upcoming": "Upcoming",
    "draft": "Draft",
    "available": "Available",
    "invoice": "Invoice",
    "pdf": "PDF",
    "document": "Document",
    "due": "Due",
    "needsReview": "Needs Review",
    "toBeScheduled": "To be scheduled",
    "pendingContractApproval": "Pending contract approval",
    "priorityHigh": "High",
    "priorityMedium": "Medium",
    "priorityLow": "Low",
    "Referral": "Referral",
    "Website": "Website",
    "Instagram": "Instagram",
    "Yard Sign": "Yard Sign",
    "Google Business": "Google Business",
    "Repeat Client": "Repeat Client",
    "Kitchen Remodeling": "Kitchen Remodeling",
    "Kitchen Remodeling Project": "Kitchen Remodeling Project",
    "Deck Renovation": "Deck Renovation",
    "Pressure-Treated Deck Renovation": "Pressure-Treated Deck Renovation",
    "Roof Replacement": "Roof Replacement",
    "Architectural Shingle Roof Replacement": "Architectural Shingle Roof Replacement",
    "Interior Painting": "Interior Painting",
    "Main Level Interior Painting": "Main Level Interior Painting",
    "Basement Full Renovation": "Basement Full Renovation",
    "Exterior Painting": "Exterior Painting",
    "Bathroom Remodeling": "Bathroom Remodeling",
    "Primary Bathroom Remodeling Project": "Primary Bathroom Remodeling Project",
    "Guest Bathroom Refresh": "Guest Bathroom Refresh",
    "Roof Repair and Gutter Replacement": "Roof Repair and Gutter Replacement",
    "Complete cabinet installation": "Complete cabinet installation",
    "Confirm composite railing delivery date": "Confirm composite railing delivery date",
    "Confirm dumpster drop-off window": "Confirm dumpster drop-off window",
    "Schedule final walkthrough and touch-up review": "Schedule final walkthrough and touch-up review",
    "Confirm project scope": "Confirm project scope",
    "Visit property": "Visit property",
    "Client to approve tile selection allowance": "Client to approve tile selection allowance",
    "Send final invoice receipt and request review": "Send final invoice receipt and request review",
    "Archive job and send warranty document": "Archive job and send warranty document",
    "Contract Signed": "Contract Signed",
    "Deposit Received": "Deposit Received",
    "Demolition Complete": "Demolition Complete",
    "Installation": "Installation",
    "Final Walkthrough": "Final Walkthrough",
    "Installation Started": "Installation Started",
    "Installation Complete": "Installation Complete",
    "Project Complete": "Project Complete",
    "Agreement approved and signed by homeowner.": "Agreement approved and signed by homeowner.",
    "$9,250 deposit recorded by card payment.": "$9,250 deposit recorded by card payment.",
    "Old cabinets, countertops, and backsplash removed.": "Old cabinets, countertops, and backsplash removed.",
    "Cabinet boxes installed. Countertop template scheduled.": "Cabinet boxes installed. Countertop template scheduled.",
    "Review punch list, cleanup, and final payment.": "Review punch list, cleanup, and final payment.",
    "Deck renovation contract approved.": "Deck renovation contract approved.",
    "$6,200 deposit received.": "$6,200 deposit received.",
    "Old boards and damaged railing removed.": "Old boards and damaged railing removed.",
    "Waiting for railing and stair hardware delivery.": "Waiting for railing and stair hardware delivery.",
    "Final inspection and punch list review.": "Final inspection and punch list review.",
    "Roof replacement agreement signed.": "Roof replacement agreement signed.",
    "$11,000 deposit recorded.": "$11,000 deposit recorded.",
    "Tear-off scheduled after dumpster delivery.": "Tear-off scheduled after dumpster delivery.",
    "Architectural shingles and flashing installation.": "Architectural shingles and flashing installation.",
    "Cleanup, magnet sweep, and final photo review.": "Cleanup, magnet sweep, and final photo review.",
    "Painting contract signed.": "Painting contract signed.",
    "$3,400 deposit received.": "$3,400 deposit received.",
    "No demolition required.": "No demolition required.",
    "Walls, trim, and doors painted.": "Walls, trim, and doors painted.",
    "Touch-up list pending homeowner review.": "Touch-up list pending homeowner review.",
    "Bathroom remodel contract signed.": "Bathroom remodel contract signed.",
    "$7,900 deposit received.": "$7,900 deposit received.",
    "Vanity, tile, and fixtures scheduled for removal.": "Vanity, tile, and fixtures scheduled for removal.",
    "Tile and fixture selections need customer approval.": "Tile and fixture selections need customer approval.",
    "Final inspection and balance collection.": "Final inspection and balance collection.",
    "Contract approved.": "Contract approved.",
    "$4,700 deposit received.": "$4,700 deposit received.",
    "Old vanity and flooring removed.": "Old vanity and flooring removed.",
    "Flooring, vanity, toilet, and fixtures installed.": "Flooring, vanity, toilet, and fixtures installed.",
    "Work completed and approved.": "Work completed and approved.",
    "$5,800 deposit received.": "$5,800 deposit received.",
    "Damaged gutters and shingles removed.": "Damaged gutters and shingles removed.",
    "Roof repairs and new gutters installed.": "Roof repairs and new gutters installed.",
    "Final payment received.": "Final payment received.",
    "Contract will appear here after customer approval.": "Contract will appear here after customer approval.",
    "Deposit invoice will be tracked once paid.": "Deposit invoice will be tracked once paid.",
    "Milestone will update when work begins.": "Milestone will update when work begins.",
    "Installation milestone is not started yet.": "Installation milestone is not started yet.",
    "Final walkthrough will be scheduled near completion.": "Final walkthrough will be scheduled near completion.",
    "Before kitchen": "Before kitchen",
    "Original cabinet wall before demolition": "Original cabinet wall before demolition",
    "Demo progress": "Demo progress",
    "Appliances removed and walls prepped": "Appliances removed and walls prepped",
    "Cabinet install": "Cabinet install",
    "New shaker cabinets being installed": "New shaker cabinets being installed",
    "Existing deck": "Existing deck",
    "Weathered deck boards before removal": "Weathered deck boards before removal",
    "Framing review": "Framing review",
    "Joists inspected for repairs": "Joists inspected for repairs",
    "Material staging": "Material staging",
    "Decking staged for install": "Decking staged for install",
    "Roof inspection": "Roof inspection",
    "Existing shingle wear and flashing review": "Existing shingle wear and flashing review",
    "Material delivery": "Material delivery",
    "Shingles scheduled for delivery": "Shingles scheduled for delivery",
    "Final roof": "Final roof",
    "Completion photo will be uploaded": "Completion photo will be uploaded",
    "Before walls": "Before walls",
    "Existing wall color before prep": "Existing wall color before prep",
    "Prep work": "Prep work",
    "Trim masked and walls patched": "Trim masked and walls patched",
    "Final coat": "Final coat",
    "Main level after second coat": "Main level after second coat",
    "Existing bathroom": "Existing bathroom",
    "Bathroom before demo": "Bathroom before demo",
    "Tile options": "Tile options",
    "Customer selection options": "Customer selection options",
    "Fixture plan": "Fixture plan",
    "Vanity and fixture layout": "Vanity and fixture layout",
    "Before bathroom": "Before bathroom",
    "Original guest bath": "Original guest bath",
    "New vanity": "New vanity",
    "Installed vanity and mirror": "Installed vanity and mirror",
    "Completed bath": "Completed bath",
    "Finished project photo": "Finished project photo",
    "Roof damage": "Roof damage",
    "Damaged shingles before repair": "Damaged shingles before repair",
    "New gutters": "New gutters",
    "Seamless gutter installation": "Seamless gutter installation",
    "Final cleanup": "Final cleanup",
    "Completed exterior cleanup": "Completed exterior cleanup",
    "Before photos": "Before photos",
    "Photos will be uploaded once the project starts.": "Photos will be uploaded once the project starts.",
    "Progress photos": "Progress photos",
    "Crew updates will appear here.": "Crew updates will appear here.",
    "Final photos": "Final photos",
    "Completed work photos will appear here.": "Completed work photos will appear here.",
    "Signed Contract": "Signed Contract",
    "Estimate #1042": "Estimate #1042",
    "Invoice - Deposit": "Invoice - Deposit",
    "Invoice - Final Balance": "Invoice - Final Balance",
    "Deck Estimate": "Deck Estimate",
    "Deposit Invoice": "Deposit Invoice",
    "Roof Estimate": "Roof Estimate",
    "Painting Estimate": "Painting Estimate",
    "Bathroom Estimate": "Bathroom Estimate",
    "Selection Sheet": "Selection Sheet",
    "Final Invoice": "Final Invoice",
    "Paid Invoice": "Paid Invoice",
    "Warranty Document": "Warranty Document",
    "Invoices": "Invoices",
    "Labor and materials for kitchen demo, cabinet installation, backsplash, painting, and finish work.": "Labor and materials for kitchen demo, cabinet installation, backsplash, painting, and finish work.",
    "Deck board replacement, railing installation, stair repairs, and stain-ready cleanup.": "Deck board replacement, railing installation, stair repairs, and stain-ready cleanup.",
    "Full roof tear-off, architectural shingles, underlayment, drip edge, flashing, and cleanup.": "Full roof tear-off, architectural shingles, underlayment, drip edge, flashing, and cleanup.",
    "Interior wall, ceiling, trim, and door painting with patching and prep included.": "Interior wall, ceiling, trim, and door painting with patching and prep included.",
    "Bathroom demo, tile installation, vanity replacement, fixtures, painting, and finish work.": "Bathroom demo, tile installation, vanity replacement, fixtures, painting, and finish work.",
    "Guest bathroom flooring, vanity, toilet, fixtures, painting, and finish carpentry.": "Guest bathroom flooring, vanity, toilet, fixtures, painting, and finish carpentry.",
    "Roof repairs, gutter replacement, downspouts, flashing touch-ups, and cleanup.": "Roof repairs, gutter replacement, downspouts, flashing touch-ups, and cleanup.",
    "dashboard.title": "Lead Pipeline Dashboard",
    "dashboard.hero": "Track remodeling, deck, roofing, and painting opportunities from first call to signed job.",
    "dashboard.metrics.newLeads": "New Leads",
    "dashboard.metrics.activeEstimates": "Active Estimates",
    "dashboard.metrics.jobsInProgress": "Jobs In Progress",
    "dashboard.metrics.revenuePipeline": "Revenue Pipeline",
    "leads.pipeline": "Lead Pipeline",
    "jobs.title": "Active Job Tracking",
    "jobs.list": "Job List",
    "estimates.builder": "Estimate Builder",
    "contracts.preview": "Contract Preview",
    "payments.progress": "Payment Progress",
    "customerPortal.title": "Customer Portal",
    "calendar.title": "Calendar",
    "clients.title": "Clients",
    "invoices.title": "Invoices",
    "settings.title": "Settings",
    "empty.comingSoon": "Coming Soon",
    "empty.noLeads": "No leads found",
    "empty.noJobs": "No active jobs found",
    "empty.noInvoices": "No invoices available",
    "empty.noPayments": "No payments recorded",
    "empty.noPhotos": "No photos uploaded",
    "forms.customerName": "Customer Name",
    "forms.projectTitle": "Project Title",
    "forms.scopeOfWork": "Scope of Work",
    "forms.paymentTerms": "Payment Terms",
    "forms.amount": "Amount",
    "forms.notes": "Notes",
    "forms.paymentDate": "Payment Date",
    "forms.materialsIncluded": "Materials included",
    "actions.createEstimate": "Create Estimate",
    "actions.convertToContract": "Convert to Contract",
    "actions.recordPayment": "Record Payment",
    "actions.uploadPhotos": "Upload Photos",
    "actions.openCustomerPortal": "Open Customer Portal",
    "statuses.inProgress": "In Progress",
    "statuses.waitingOnClient": "Waiting on Client",
    "statuses.waitingOnMaterials": "Waiting on Materials",
    "statuses.completed": "Completed",
    "paymentStatuses.depositPaid": "Deposit Paid",
    "timeline.contractSigned": "Contract Signed",
    "timeline.depositReceived": "Deposit Received",
    "timeline.demolitionComplete": "Demolition Complete",
    "timeline.installation": "Installation",
    "timeline.finalWalkthrough": "Final Walkthrough"
  },
  "es": {
    "brandInitials": "CF",
    "brandName": "ContractorFlow",
    "userInitials": "JA",
    "userName": "Josue Arana",
    "appName": "ContractorFlow CRM",
    "smallContractorCrm": "CRM sencillo para contratistas",
    "language": "Idioma",
    "english": "Inglés",
    "spanish": "Español",
    "searchPlaceholder": "Buscar clientes, estimados, trabajos...",
    "ownerAdmin": "Administrador",
    "dashboard": "Panel",
    "leads": "Prospectos",
    "estimates": "Estimados",
    "jobs": "Trabajos",
    "contracts": "Contratos",
    "payments": "Pagos",
    "customerPortal": "Portal del cliente",
    "calendar": "Calendario",
    "clients": "Clientes",
    "invoices": "Facturas",
    "settings": "Configuración",
    "nav.dashboard": "Panel",
    "nav.leads": "Prospectos",
    "nav.jobs": "Trabajos",
    "nav.estimates": "Estimados",
    "nav.contracts": "Contratos",
    "nav.payments": "Pagos",
    "nav.customerPortal": "Portal del cliente",
    "nav.calendar": "Calendario",
    "nav.clients": "Clientes",
    "nav.invoices": "Facturas",
    "nav.settings": "Configuración",
    "leadPipelineDashboard": "Panel de prospectos",
    "dashboardHeroText": "Administra oportunidades de remodelación, decks, techos y pintura desde la primera llamada hasta el trabajo firmado.",
    "addLead": "Agregar prospecto",
    "metricNewLeads": "Nuevos prospectos",
    "metricNewLeadsHelper": "+12% esta semana",
    "metricActiveEstimates": "Estimados activos",
    "metricActiveEstimatesHelper": "Necesitan seguimiento",
    "metricJobsInProgress": "Trabajos en progreso",
    "metricJobsInProgressHelper": "Entre todas las cuadrillas",
    "metricRevenuePipeline": "Valor en proceso",
    "metricRevenuePipelineHelper": "Valor de oportunidades abiertas",
    "pipelineHealth": "Salud del proceso",
    "pipelineHealthText": "Mantén los trabajos avanzando sin complejidad de CRM empresarial.",
    "leadPipeline": "Proceso de prospectos",
    "dragCardsHelp": "Arrastra las tarjetas entre etapas a medida que avanzan.",
    "chooseStageHelp": "Elige una etapa y actualiza cada prospecto con el control de estado.",
    "activeOpportunities": "oportunidades activas",
    "pipelineStage": "Etapa",
    "noLeadsInStage": "Todavía no hay prospectos en esta etapa.",
    "dropLeadHere": "Suelta aquí",
    "changeStatus": "Cambiar estado",
    "jobsPageTitle": "Seguimiento de trabajos activos",
    "jobsHeroText": "Administra proyectos firmados de remodelación, techos, decks y baños desde el inicio hasta el pago final.",
    "scheduleJob": "Programar trabajo",
    "jobList": "Lista de trabajos",
    "jobListHelp": "Haz clic en una fila o en Ver trabajo para abrir el espacio del proyecto.",
    "filterJobsByStatus": "Filtrar trabajos por estado",
    "activeJobs": "Trabajos activos",
    "activeJobsHelper": "Proyectos firmados no cerrados",
    "inProgress": "En progreso",
    "inProgressHelper": "Cuadrillas trabajando",
    "waiting": "En espera",
    "waitingHelper": "Bloqueos por cliente o materiales",
    "completedThisMonth": "Completados este mes",
    "completedThisMonthHelper": "Listos para facturar o archivar",
    "outstandingBalanceHelper": "Saldo restante de trabajos",
    "customerProject": "Cliente / Proyecto",
    "value": "Valor",
    "paid": "Pagado",
    "remaining": "Restante",
    "action": "Acción",
    "viewJob": "Ver trabajo",
    "start": "Inicio",
    "noJobsFound": "No se encontraron trabajos",
    "noJobsFoundHelp": "Prueba otro filtro o convierte un proyecto ganado en trabajo activo.",
    "projectWorkspace": "Espacio del proyecto",
    "backToDashboard": "Volver al panel",
    "backToDashboardAction": "Volver al panel",
    "projectValue": "Valor del proyecto",
    "contractorActions": "Acciones del contratista",
    "contractorActionsHelp": "Acciones simples para estimados, contratos, pagos, fotos y portal del cliente.",
    "createEstimate": "Crear estimado",
    "openEstimate": "Abrir estimado",
    "convertToContract": "Convertir a contrato",
    "openContract": "Abrir contrato",
    "recordPayment": "Registrar pago",
    "uploadPhotos": "Subir fotos",
    "openCustomerPortal": "Abrir portal del cliente",
    "viewSharedPortal": "Ver portal compartido",
    "customerInformation": "Información del cliente",
    "projectInformation": "Información del proyecto",
    "name": "Nombre",
    "phone": "Teléfono",
    "email": "Correo electrónico",
    "address": "Dirección",
    "status": "Estado",
    "startDate": "Fecha de inicio",
    "targetCompletion": "Finalización prevista",
    "nextStep": "Próximo paso",
    "homeownerPortalPreview": "Vista del portal del cliente",
    "homeownerPortalPreviewHelp": "Una vista simple para estado, pagos, fotos y documentos.",
    "estimate": "Estimado",
    "estimateBuilder": "Crear estimado",
    "estimateBuilderHelp": "Mantén el estimado simple. Escribe el alcance, pon el total y agrega partidas solo si hace falta.",
    "scopeOfWork": "Alcance del trabajo",
    "paymentTerms": "Términos de pago",
    "materialsIncluded": "Materiales incluidos",
    "addLineItems": "Agregar partidas",
    "hideLineItems": "Ocultar partidas",
    "totalAmount": "Monto total",
    "saveEstimate": "Guardar estimado",
    "previewEstimate": "Vista previa del estimado",
    "lineItems": "Partidas",
    "item": "Concepto",
    "amount": "Monto",
    "addItem": "Agregar concepto",
    "estimateContract": "Estimado y contrato",
    "estimateFor": "estimado para",
    "laborAndProjectSetup": "Mano de obra y preparación del proyecto",
    "materialsAndFinishWork": "Materiales y acabados",
    "defaultPaymentTerms": "50% de depósito para comenzar. El saldo restante se paga semanalmente según el progreso del trabajo.",
    "contract": "Contrato",
    "contractPreview": "Vista previa del contrato",
    "saveContract": "Guardar contrato",
    "editContract": "Editar contrato",
    "previewPdf": "Vista previa PDF",
    "markAsSigned": "Marcar como firmado",
    "projectScope": "Alcance del proyecto",
    "materials": "Materiales",
    "timeline": "Cronograma",
    "changeOrders": "Órdenes de cambio",
    "clientResponsibilities": "Responsabilidades del cliente",
    "warrantyDisclaimer": "Garantía y descargo",
    "signatureLines": "Firmas",
    "contractorSignature": "Firma del contratista",
    "clientSignature": "Firma del cliente",
    "contractTermsText": "Se requiere un depósito del 50% antes de comenzar. El saldo restante vence semanalmente según el progreso y el saldo final al completar el trabajo.",
    "materialsText": "Los materiales están incluidos salvo que se indique lo contrario por escrito. Las selecciones del cliente pueden afectar el precio final.",
    "timelineTextPrefix": "Fecha estimada de inicio:",
    "estimatedCompletion": "Finalización estimada:",
    "changeOrdersText": "Todo cambio fuera del alcance aprobado debe documentarse y aprobarse antes de continuar.",
    "clientResponsibilitiesText": "El cliente es responsable de dar acceso a la propiedad, hacer selecciones a tiempo y retirar objetos personales del área de trabajo.",
    "warrantyDisclaimerText": "La garantía aplica solo a mano de obra y no cubre condiciones existentes, materiales provistos por el dueño o desgaste normal.",
    "paymentProgress": "Progreso de pagos",
    "documents": "Documentos",
    "projectStatus": "Estado del proyecto",
    "uploadedPhotos": "Fotos subidas",
    "contractAmount": "Monto del contrato",
    "paidToDate": "Pagado hasta hoy",
    "outstandingBalance": "Saldo pendiente",
    "paymentStatus": "Estado de pago",
    "depositRequired": "Depósito requerido",
    "depositPaid": "Depósito pagado",
    "signedDate": "Fecha de firma",
    "needHelp": "¿Necesita ayuda?",
    "needHelpText": "¿Preguntas sobre horario, pagos, selecciones o cambios? Contacte directamente a su contratista desde el proyecto.",
    "messageContractor": "Enviar mensaje al contratista",
    "target": "Meta",
    "complete": "completo",
    "yes": "Sí",
    "no": "No",
    "comingSoon": "Próximamente",
    "plannedWorkflow": "Flujo planeado",
    "plannedWorkflowText": "Esta página ya está conectada a la navegación principal. El menú lateral, menú móvil, ruta activa y navegación del navegador funcionan para poder expandir esta sección después.",
    "leadsComingTitle": "Prospectos",
    "leadsComingDescription": "Aquí irá la lista completa de prospectos, filtros, responsables y tareas de seguimiento. Por ahora, administra oportunidades desde el panel.",
    "estimatesComingTitle": "Estimados",
    "estimatesComingDescription": "Pronto habrá manejo centralizado de estimados, estados y plantillas de alcance.",
    "calendarComingTitle": "Calendario",
    "calendarComingDescription": "Aquí aparecerán visitas, citas de estimado, horarios de cuadrilla e hitos del proyecto.",
    "clientsComingTitle": "Clientes",
    "clientsComingDescription": "Aquí se organizarán perfiles de clientes, historial, direcciones y proyectos.",
    "invoicesComingTitle": "Facturas",
    "invoicesComingDescription": "Aquí se manejarán facturas, saldos, historial de pagos y recordatorios.",
    "settingsComingTitle": "Configuración",
    "settingsComingDescription": "Aquí se configurará el perfil de la compañía, equipo, valores de estimados, términos de pago y portal.",
    "projectNotFound": "Proyecto no encontrado",
    "projectNotFoundDescription": "No se pudo encontrar este proyecto. Regresa al panel y selecciona un proyecto activo.",
    "portalNotFound": "Portal no encontrado",
    "portalNotFoundDescription": "Este enlace del portal no coincide con un proyecto activo.",
    "estimateNotFound": "Estimado no encontrado",
    "contractNotFound": "Contrato no encontrado",
    "selectProjectFirst": "Selecciona un proyecto primero.",
    "noPayments": "No hay pagos registrados",
    "noPhotos": "No hay fotos cargadas",
    "noInvoices": "No hay facturas disponibles",
    "noLeads": "No se encontraron prospectos",
    "noJobs": "No se encontraron trabajos activos",
    "location": "Ubicación",
    "source": "Fuente",
    "priority": "Prioridad",
    "customerName": "Nombre del cliente",
    "projectTitle": "Título del proyecto",
    "projectType": "Tipo de proyecto",
    "paymentDate": "Fecha de pago",
    "notes": "Notas",
    "paymentMethod": "Método de pago",
    "paymentType": "Tipo de pago",
    "description": "Descripción",
    "date": "Fecha",
    "type": "Tipo",
    "number": "Número",
    "summary": "Resumen",
    "total": "Total",
    "balance": "Saldo",
    "dueDate": "Fecha de vencimiento",
    "all": "Todos",
    "scheduled": "Programado",
    "waitingOnClient": "Esperando al cliente",
    "waitingOnMaterials": "Esperando materiales",
    "readyForFinalWalkthrough": "Listo para revisión final",
    "completed": "Completado",
    "signed": "Firmado",
    "won": "Ganado",
    "newLead": "Nuevo prospecto",
    "contacted": "Contactado",
    "estimateSent": "Estimado enviado",
    "paidStatus": "Pagado",
    "lead": "Prospecto",
    "contractSent": "Contrato enviado",
    "projectStageLead": "Prospecto",
    "projectStageEstimateSent": "Estimado enviado",
    "projectStageContractSent": "Contrato enviado",
    "projectStageSigned": "Firmado",
    "projectStageInProgress": "En progreso",
    "projectStageCompleted": "Completado",
    "projectStagePaid": "Pagado",
    "unpaid": "Sin pagar",
    "partial": "Pago parcial",
    "depositPaidStatus": "Depósito pagado",
    "paidInFull": "Pagado completo",
    "progressPaymentPaid": "Pago de avance pagado",
    "finalBalanceDue": "Saldo final pendiente",
    "notPaid": "No pagado",
    "notSigned": "No firmado",
    "notGenerated": "No generado",
    "pending": "Pendiente",
    "upcoming": "Próximo",
    "draft": "Borrador",
    "available": "Disponible",
    "invoice": "Factura",
    "pdf": "PDF",
    "document": "Documento",
    "due": "Vencido",
    "needsReview": "Necesita revisión",
    "toBeScheduled": "Por programar",
    "pendingContractApproval": "Pendiente de aprobación del contrato",
    "priorityHigh": "Alta",
    "priorityMedium": "Media",
    "priorityLow": "Baja",
    "Referral": "Referido",
    "Website": "Sitio web",
    "Instagram": "Instagram",
    "Yard Sign": "Letrero",
    "Google Business": "Google Business",
    "Repeat Client": "Cliente recurrente",
    "Kitchen Remodeling": "Remodelación de cocina",
    "Kitchen Remodeling Project": "Proyecto de remodelación de cocina",
    "Deck Renovation": "Renovación de deck",
    "Pressure-Treated Deck Renovation": "Renovación de deck tratado a presión",
    "Roof Replacement": "Reemplazo de techo",
    "Architectural Shingle Roof Replacement": "Reemplazo de techo con shingles arquitectónicos",
    "Interior Painting": "Pintura interior",
    "Main Level Interior Painting": "Pintura interior del nivel principal",
    "Basement Full Renovation": "Renovación completa de sótano",
    "Exterior Painting": "Pintura exterior",
    "Bathroom Remodeling": "Remodelación de baño",
    "Primary Bathroom Remodeling Project": "Proyecto de remodelación de baño principal",
    "Guest Bathroom Refresh": "Actualización de baño de visitas",
    "Roof Repair and Gutter Replacement": "Reparación de techo y reemplazo de canales",
    "Complete cabinet installation": "Completar instalación de gabinetes",
    "Confirm composite railing delivery date": "Confirmar fecha de entrega de barandas compuestas",
    "Confirm dumpster drop-off window": "Confirmar horario de entrega del contenedor",
    "Schedule final walkthrough and touch-up review": "Programar revisión final y retoques",
    "Confirm project scope": "Confirmar alcance del proyecto",
    "Visit property": "Visitar propiedad",
    "Client to approve tile selection allowance": "Cliente debe aprobar selección de azulejos",
    "Send final invoice receipt and request review": "Enviar recibo final y pedir reseña",
    "Archive job and send warranty document": "Archivar trabajo y enviar garantía",
    "Contract Signed": "Contrato firmado",
    "Deposit Received": "Depósito recibido",
    "Demolition Complete": "Demolición completada",
    "Installation": "Instalación",
    "Final Walkthrough": "Revisión final",
    "Installation Started": "Instalación iniciada",
    "Installation Complete": "Instalación completada",
    "Project Complete": "Proyecto completado",
    "Agreement approved and signed by homeowner.": "Acuerdo aprobado y firmado por el dueño.",
    "$9,250 deposit recorded by card payment.": "Depósito de $9,250 registrado con tarjeta.",
    "Old cabinets, countertops, and backsplash removed.": "Gabinetes, topes y backsplash anteriores removidos.",
    "Cabinet boxes installed. Countertop template scheduled.": "Cajas de gabinetes instaladas. Medición de tope programada.",
    "Review punch list, cleanup, and final payment.": "Revisar lista final, limpieza y pago final.",
    "Deck renovation contract approved.": "Contrato de renovación de deck aprobado.",
    "$6,200 deposit received.": "Depósito de $6,200 recibido.",
    "Old boards and damaged railing removed.": "Tablas antiguas y barandas dañadas removidas.",
    "Waiting for railing and stair hardware delivery.": "Esperando entrega de barandas y herrajes de escaleras.",
    "Final inspection and punch list review.": "Inspección final y revisión de detalles.",
    "Roof replacement agreement signed.": "Acuerdo de reemplazo de techo firmado.",
    "$11,000 deposit recorded.": "Depósito de $11,000 registrado.",
    "Tear-off scheduled after dumpster delivery.": "Remoción programada después de la entrega del contenedor.",
    "Architectural shingles and flashing installation.": "Instalación de shingles arquitectónicos y flashing.",
    "Cleanup, magnet sweep, and final photo review.": "Limpieza, barrido con imán y revisión de fotos finales.",
    "Painting contract signed.": "Contrato de pintura firmado.",
    "$3,400 deposit received.": "Depósito de $3,400 recibido.",
    "No demolition required.": "No se requiere demolición.",
    "Walls, trim, and doors painted.": "Paredes, molduras y puertas pintadas.",
    "Touch-up list pending homeowner review.": "Lista de retoques pendiente de revisión del dueño.",
    "Bathroom remodel contract signed.": "Contrato de remodelación de baño firmado.",
    "$7,900 deposit received.": "Depósito de $7,900 recibido.",
    "Vanity, tile, and fixtures scheduled for removal.": "Vanity, azulejos y accesorios programados para remover.",
    "Tile and fixture selections need customer approval.": "Selecciones de azulejos y accesorios necesitan aprobación del cliente.",
    "Final inspection and balance collection.": "Inspección final y cobro del saldo.",
    "Contract approved.": "Contrato aprobado.",
    "$4,700 deposit received.": "Depósito de $4,700 recibido.",
    "Old vanity and flooring removed.": "Vanity y piso anteriores removidos.",
    "Flooring, vanity, toilet, and fixtures installed.": "Piso, vanity, inodoro y accesorios instalados.",
    "Work completed and approved.": "Trabajo completado y aprobado.",
    "$5,800 deposit received.": "Depósito de $5,800 recibido.",
    "Damaged gutters and shingles removed.": "Canales y shingles dañados removidos.",
    "Roof repairs and new gutters installed.": "Reparaciones de techo y canales nuevos instalados.",
    "Final payment received.": "Pago final recibido.",
    "Contract will appear here after customer approval.": "El contrato aparecerá aquí después de la aprobación del cliente.",
    "Deposit invoice will be tracked once paid.": "La factura del depósito se registrará cuando se pague.",
    "Milestone will update when work begins.": "El hito se actualizará cuando comience el trabajo.",
    "Installation milestone is not started yet.": "El hito de instalación aún no ha comenzado.",
    "Final walkthrough will be scheduled near completion.": "La revisión final se programará cerca de la finalización.",
    "Before kitchen": "Cocina antes",
    "Original cabinet wall before demolition": "Pared de gabinetes original antes de demolición",
    "Demo progress": "Progreso de demolición",
    "Appliances removed and walls prepped": "Electrodomésticos removidos y paredes preparadas",
    "Cabinet install": "Instalación de gabinetes",
    "New shaker cabinets being installed": "Nuevos gabinetes shaker en instalación",
    "Existing deck": "Deck existente",
    "Weathered deck boards before removal": "Tablas deterioradas antes de remover",
    "Framing review": "Revisión de estructura",
    "Joists inspected for repairs": "Vigas revisadas para reparación",
    "Material staging": "Materiales preparados",
    "Decking staged for install": "Tablas listas para instalar",
    "Roof inspection": "Inspección de techo",
    "Existing shingle wear and flashing review": "Revisión de desgaste y flashing",
    "Material delivery": "Entrega de materiales",
    "Shingles scheduled for delivery": "Shingles programados para entrega",
    "Final roof": "Techo final",
    "Completion photo will be uploaded": "Se subirá foto al completar",
    "Before walls": "Paredes antes",
    "Existing wall color before prep": "Color existente antes de preparación",
    "Prep work": "Preparación",
    "Trim masked and walls patched": "Molduras cubiertas y paredes reparadas",
    "Final coat": "Capa final",
    "Main level after second coat": "Nivel principal después de segunda capa",
    "Existing bathroom": "Baño existente",
    "Bathroom before demo": "Baño antes de demolición",
    "Tile options": "Opciones de azulejo",
    "Customer selection options": "Opciones de selección del cliente",
    "Fixture plan": "Plan de accesorios",
    "Vanity and fixture layout": "Distribución de vanity y accesorios",
    "Before bathroom": "Baño antes",
    "Original guest bath": "Baño de visitas original",
    "New vanity": "Vanity nuevo",
    "Installed vanity and mirror": "Vanity y espejo instalados",
    "Completed bath": "Baño completado",
    "Finished project photo": "Foto del proyecto terminado",
    "Roof damage": "Daño en techo",
    "Damaged shingles before repair": "Shingles dañados antes de reparación",
    "New gutters": "Canales nuevos",
    "Seamless gutter installation": "Instalación de canales sin unión",
    "Final cleanup": "Limpieza final",
    "Completed exterior cleanup": "Limpieza exterior terminada",
    "Before photos": "Fotos antes",
    "Photos will be uploaded once the project starts.": "Las fotos se subirán cuando comience el proyecto.",
    "Progress photos": "Fotos de progreso",
    "Crew updates will appear here.": "Aquí aparecerán actualizaciones de la cuadrilla.",
    "Final photos": "Fotos finales",
    "Completed work photos will appear here.": "Aquí aparecerán fotos del trabajo terminado.",
    "Signed Contract": "Contrato firmado",
    "Estimate #1042": "Estimado #1042",
    "Invoice - Deposit": "Factura - Depósito",
    "Invoice - Final Balance": "Factura - Saldo final",
    "Deck Estimate": "Estimado de deck",
    "Deposit Invoice": "Factura de depósito",
    "Roof Estimate": "Estimado de techo",
    "Painting Estimate": "Estimado de pintura",
    "Bathroom Estimate": "Estimado de baño",
    "Selection Sheet": "Hoja de selecciones",
    "Final Invoice": "Factura final",
    "Paid Invoice": "Factura pagada",
    "Warranty Document": "Documento de garantía",
    "Invoices": "Facturas",
    "Labor and materials for kitchen demo, cabinet installation, backsplash, painting, and finish work.": "Mano de obra y materiales para demolición de cocina, instalación de gabinetes, backsplash, pintura y acabados.",
    "Deck board replacement, railing installation, stair repairs, and stain-ready cleanup.": "Reemplazo de tablas del deck, instalación de barandas, reparación de escaleras y limpieza lista para tinte.",
    "Full roof tear-off, architectural shingles, underlayment, drip edge, flashing, and cleanup.": "Remoción completa del techo, shingles arquitectónicos, underlayment, drip edge, flashing y limpieza.",
    "Interior wall, ceiling, trim, and door painting with patching and prep included.": "Pintura interior de paredes, cielos, molduras y puertas con reparación y preparación incluida.",
    "Bathroom demo, tile installation, vanity replacement, fixtures, painting, and finish work.": "Demolición de baño, instalación de azulejos, reemplazo de vanity, accesorios, pintura y acabados.",
    "Guest bathroom flooring, vanity, toilet, fixtures, painting, and finish carpentry.": "Piso, vanity, inodoro, accesorios, pintura y carpintería final del baño de visitas.",
    "Roof repairs, gutter replacement, downspouts, flashing touch-ups, and cleanup.": "Reparaciones de techo, reemplazo de canales, bajantes, retoques de flashing y limpieza.",
    "dashboard.title": "Panel de prospectos",
    "dashboard.hero": "Administra oportunidades de remodelación, decks, techos y pintura desde la primera llamada hasta el trabajo firmado.",
    "dashboard.metrics.newLeads": "Nuevos prospectos",
    "dashboard.metrics.activeEstimates": "Estimados activos",
    "dashboard.metrics.jobsInProgress": "Trabajos en progreso",
    "dashboard.metrics.revenuePipeline": "Valor en proceso",
    "leads.pipeline": "Proceso de prospectos",
    "jobs.title": "Seguimiento de trabajos activos",
    "jobs.list": "Lista de trabajos",
    "estimates.builder": "Crear estimado",
    "contracts.preview": "Vista previa del contrato",
    "payments.progress": "Progreso de pagos",
    "customerPortal.title": "Portal del cliente",
    "calendar.title": "Calendario",
    "clients.title": "Clientes",
    "invoices.title": "Facturas",
    "settings.title": "Configuración",
    "empty.comingSoon": "Próximamente",
    "empty.noLeads": "No se encontraron prospectos",
    "empty.noJobs": "No se encontraron trabajos activos",
    "empty.noInvoices": "No hay facturas disponibles",
    "empty.noPayments": "No hay pagos registrados",
    "empty.noPhotos": "No hay fotos cargadas",
    "forms.customerName": "Nombre del cliente",
    "forms.projectTitle": "Título del proyecto",
    "forms.scopeOfWork": "Alcance del trabajo",
    "forms.paymentTerms": "Términos de pago",
    "forms.amount": "Monto",
    "forms.notes": "Notas",
    "forms.paymentDate": "Fecha de pago",
    "forms.materialsIncluded": "Materiales incluidos",
    "actions.createEstimate": "Crear estimado",
    "actions.convertToContract": "Convertir a contrato",
    "actions.recordPayment": "Registrar pago",
    "actions.uploadPhotos": "Subir fotos",
    "actions.openCustomerPortal": "Abrir portal del cliente",
    "statuses.inProgress": "En progreso",
    "statuses.waitingOnClient": "Esperando al cliente",
    "statuses.waitingOnMaterials": "Esperando materiales",
    "statuses.completed": "Completado",
    "paymentStatuses.depositPaid": "Depósito pagado",
    "timeline.contractSigned": "Contrato firmado",
    "timeline.depositReceived": "Depósito recibido",
    "timeline.demolitionComplete": "Demolición completada",
    "timeline.installation": "Instalación",
    "timeline.finalWalkthrough": "Revisión final"
  }
}

function useT(lang) {
  return (key, params = {}) => {
    const dictionary = translations[lang] || translations.en
    let value = dictionary?.[key] ?? translations.en?.[key]

    if (value === undefined && key?.includes('.')) {
      value = key.split('.').reduce((current, part) => current?.[part], dictionary)
        ?? key.split('.').reduce((current, part) => current?.[part], translations.en)
    }

    if (value === undefined || value === null || value === '') value = key

    return Object.entries(params).reduce(
      (text, [paramKey, paramValue]) => String(text).replaceAll(`{{${paramKey}}}`, paramValue),
      String(value),
    )
  }
}

const statusKeyMap = {
  'New Lead': 'newLead', Contacted: 'contacted', 'Estimate Sent': 'estimateSent', Won: 'won', Scheduled: 'scheduled', 'In Progress': 'inProgress', 'Waiting on Client': 'waitingOnClient', 'Waiting on Materials': 'waitingOnMaterials', 'Ready for Final Walkthrough': 'readyForFinalWalkthrough', Completed: 'completed', Paid: 'paidStatus', Signed: 'signed', High: 'priorityHigh', Medium: 'priorityMedium', Low: 'priorityLow', Complete: 'completed', Upcoming: 'upcoming', Pending: 'pending', Draft: 'draft', Available: 'available', Due: 'due', 'Needs Review': 'needsReview', 'Final Balance Due': 'finalBalanceDue', 'Paid in Full': 'paidInFull', 'Progress Payment Paid': 'progressPaymentPaid', 'Deposit Paid': 'depositPaidStatus', 'Not Paid': 'notPaid', 'Not Signed': 'notSigned', 'Not generated': 'notGenerated'
}
function tStatus(t, status) {
  return t(statusKeyMap[status] || status)
}


function App() {
  return (
    <BrowserRouter>
      <ContractorFlowApp />
    </BrowserRouter>
  )
}

function ContractorFlowApp() {
  const [leads, setLeads] = useState(initialLeads)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [selectedMobileStage, setSelectedMobileStage] = useState(pipelineStatuses[0])
  const [contractorLanguage, setContractorLanguage] = useState(() => getStoredLanguage(LANGUAGE_STORAGE_KEYS.contractor))
  const [portalLanguage, setPortalLanguage] = useState(() => getStoredLanguage(LANGUAGE_STORAGE_KEYS.portal))
  const t = useT(contractorLanguage)
  const portalT = useT(portalLanguage)
  const navigate = useNavigate()

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEYS.contractor, contractorLanguage)
  }, [contractorLanguage])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEYS.portal, portalLanguage)
  }, [portalLanguage])

  const metrics = useMemo(() => {
    const newLeads = leads.filter((lead) => lead.status === 'New Lead').length
    const estimates = leads.filter((lead) => lead.status === 'Estimate Sent').length
    const activeJobs = leads.filter((lead) => ['Contacted', 'Estimate Sent', 'Won'].includes(lead.status)).length
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0)

    return [
      { label: t('metricNewLeads'), value: newLeads, helper: t('metricNewLeadsHelper'), icon: Users },
      { label: t('metricActiveEstimates'), value: estimates, helper: t('metricActiveEstimatesHelper'), icon: ClipboardList },
      { label: t('metricJobsInProgress'), value: activeJobs, helper: t('metricJobsInProgressHelper'), icon: BriefcaseBusiness },
      { label: t('metricRevenuePipeline'), value: currency.format(pipelineValue), helper: t('metricRevenuePipelineHelper'), icon: DollarSign },
    ]
  }, [leads, t])

  function moveLead(leadId, targetStatus) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, status: targetStatus } : lead,
      ),
    )
  }

  function openProject(leadId) {
    navigate(`/projects/${leadId}`)
    setSidebarOpen(false)
  }

  function openPortal(leadId) {
    navigate(`/portal/${leadId}`)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} t={t} />

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} language={contractorLanguage} setLanguage={setContractorLanguage} t={t} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  leads={leads}
                  metrics={metrics}
                  draggedLeadId={draggedLeadId}
                  setDraggedLeadId={setDraggedLeadId}
                  selectedMobileStage={selectedMobileStage}
                  setSelectedMobileStage={setSelectedMobileStage}
                  moveLead={moveLead}
                  onLeadClick={openProject}
                  t={t}
                />
              }
            />
            <Route path="/leads" element={<ComingSoonPage title={t('leadsComingTitle')} description={t('leadsComingDescription')} icon={Users} t={t} />} />
            <Route path="/estimates" element={<ComingSoonPage title={t('estimatesComingTitle')} description={t('estimatesComingDescription')} icon={ClipboardList} t={t} />} />
            <Route path="/jobs" element={<JobsPage leads={leads} onViewJob={openProject} t={t} />} />
            <Route path="/calendar" element={<ComingSoonPage title={t('calendarComingTitle')} description={t('calendarComingDescription')} icon={CalendarDays} t={t} />} />
            <Route path="/clients" element={<ComingSoonPage title={t('clientsComingTitle')} description={t('clientsComingDescription')} icon={Users} t={t} />} />
            <Route path="/invoices" element={<ComingSoonPage title={t('invoicesComingTitle')} description={t('invoicesComingDescription')} icon={DollarSign} t={t} />} />
            <Route path="/settings" element={<ComingSoonPage title={t('settingsComingTitle')} description={t('settingsComingDescription')} icon={Settings} t={t} />} />
            <Route path="/projects/:leadId" element={<ProjectRoute leads={leads} onBack={() => navigate('/dashboard')} onOpenPortal={openPortal} t={t} language={contractorLanguage} />} />
            <Route path="/projects/:leadId/estimate" element={<EstimateRoute leads={leads} t={t} />} />
            <Route path="/projects/:leadId/contract" element={<ContractRoute leads={leads} t={t} />} />
            <Route path="/portal/:leadId" element={<PortalRoute leads={leads} onBack={(leadId) => navigate(`/projects/${leadId}`)} t={portalT} language={portalLanguage} setLanguage={setPortalLanguage} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function DashboardPage({
  leads,
  metrics,
  draggedLeadId,
  setDraggedLeadId,
  selectedMobileStage,
  setSelectedMobileStage,
  moveLead,
  onLeadClick,
  t,
}) {
  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('appName')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('leadPipelineDashboard')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {t('dashboardHeroText')}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <Zap className="h-4 w-4" /> {t('addLead')}
        </button>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PipelineBoard
        leads={leads}
        statuses={pipelineStatuses}
        draggedLeadId={draggedLeadId}
        setDraggedLeadId={setDraggedLeadId}
        moveLead={moveLead}
        selectedMobileStage={selectedMobileStage}
        setSelectedMobileStage={setSelectedMobileStage}
        onLeadClick={onLeadClick}
        t={t}
      />
    </>
  )
}


function JobsPage({ leads, onViewJob, t }) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const jobFilters = ['All', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid']

  const jobs = useMemo(() => {
    return leads
      .filter((lead) => ['Won', 'Signed'].includes(lead.status) || ['Signed', 'Scheduled', 'In Progress', 'Waiting on Client', 'Waiting on Materials', 'Ready for Final Walkthrough', 'Completed', 'Paid'].includes(lead.projectStatus))
      .map((lead) => {
        const portal = getPortalData(lead)
        const amountPaid = portal.amountPaid || 0
        const remainingBalance = Math.max((portal.contractAmount || lead.value) - amountPaid, 0)
        const derivedStatus = remainingBalance === 0 && ['Completed', 'Paid'].includes(lead.projectStatus) ? 'Paid' : lead.projectStatus || (lead.status === 'Won' ? 'Scheduled' : 'In Progress')

        return {
          ...lead,
          jobStatus: derivedStatus,
          startDate: portal.startDate,
          projectValue: portal.contractAmount || lead.value,
          amountPaid,
          remainingBalance,
          nextStep: lead.nextStep || t('projectStatus'),
        }
      })
  }, [leads])

  const filteredJobs = selectedFilter === 'All'
    ? jobs
    : jobs.filter((job) => job.jobStatus === selectedFilter)

  const activeJobs = jobs.filter((job) => !['Completed', 'Paid'].includes(job.jobStatus)).length
  const inProgressJobs = jobs.filter((job) => job.jobStatus === 'In Progress').length
  const waitingJobs = jobs.filter((job) => ['Waiting on Client', 'Waiting on Materials'].includes(job.jobStatus)).length
  const completedThisMonth = jobs.filter((job) => ['Completed', 'Paid'].includes(job.jobStatus)).length
  const outstandingBalance = jobs.reduce((sum, job) => sum + job.remainingBalance, 0)

  const summaryCards = [
    { label: t('activeJobs'), value: activeJobs, helper: t('activeJobsHelper'), icon: BriefcaseBusiness },
    { label: t('inProgress'), value: inProgressJobs, helper: t('inProgressHelper'), icon: Zap },
    { label: t('waiting'), value: waitingJobs, helper: t('waitingHelper'), icon: CalendarDays },
    { label: t('completedThisMonth'), value: completedThisMonth, helper: t('completedThisMonthHelper'), icon: CheckCircle2 },
    { label: t('outstandingBalance'), value: currency.format(outstandingBalance), helper: t('outstandingBalanceHelper'), icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('jobs')}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('jobsPageTitle')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {t('jobsHeroText')}
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-blue-50">
          <CalendarDays className="h-4 w-4" /> {t('scheduleJob')}
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('jobList')}</h2>
            <p className="text-sm text-slate-500">{t('jobListHelp')}</p>
          </div>
          <SelectField
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value)}
            containerClassName="w-full lg:w-72"
            className="bg-slate-50"
            aria-label={t('filterJobsByStatus')}
          >
            {jobFilters.map((filter) => (
              <option key={filter} value={filter}>{filter === 'All' ? t('all') : tStatus(t, filter)}</option>
            ))}
          </SelectField>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {jobFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${selectedFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {filter === 'All' ? t('all') : tStatus(t, filter)}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('customerProject')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('startDate')}</th>
                <th className="px-4 py-3 text-right">{t('value')}</th>
                <th className="px-4 py-3 text-right">{t('paid')}</th>
                <th className="px-4 py-3 text-right">{t('remaining')}</th>
                <th className="px-4 py-3">{t('nextStep')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} onClick={() => onViewJob(job.id)} className="cursor-pointer bg-white transition hover:bg-blue-50/40">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-950">{job.client}</p>
                    <p className="text-sm text-slate-500">{job.projectTitle || job.projectType}</p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={job.jobStatus} t={t} /></td>
                  <td className="px-4 py-4 font-medium text-slate-700">{job.startDate}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(job.projectValue)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700">{currency.format(job.amountPaid)}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{currency.format(job.remainingBalance)}</td>
                  <td className="max-w-[220px] px-4 py-4 text-slate-600">{job.nextStep}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={(event) => { event.stopPropagation(); onViewJob(job.id) }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                      {t('viewJob')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredJobs.map((job) => (
            <article key={job.id} onClick={() => onViewJob(job.id)} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{job.client}</h3>
                  <p className="text-sm text-slate-500">{job.projectTitle || job.projectType}</p>
                </div>
                <StatusBadge status={job.jobStatus} t={t} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MobileJobStat label={t('start')} value={job.startDate} />
                <MobileJobStat label={t('value')} value={currency.format(job.projectValue)} />
                <MobileJobStat label={t('paid')} value={currency.format(job.amountPaid)} />
                <MobileJobStat label={t('remaining')} value={currency.format(job.remainingBalance)} />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('nextStep')}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{job.nextStep}</p>
              </div>
              <button onClick={(event) => { event.stopPropagation(); onViewJob(job.id) }} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                {t('viewJob')}
              </button>
            </article>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-900">{t('noJobsFound')}</p>
            <p className="mt-2 text-sm text-slate-500">{t('noJobsFoundHelp')}</p>
          </div>
        )}
      </section>
    </div>
  )
}

function StatusBadge({ status, t = (key) => key }) {
  const styles = {
    Scheduled: 'bg-sky-50 text-sky-700 ring-sky-100',
    'In Progress': 'bg-blue-50 text-blue-700 ring-blue-100',
    'Waiting on Client': 'bg-amber-50 text-amber-700 ring-amber-100',
    'Waiting on Materials': 'bg-orange-50 text-orange-700 ring-orange-100',
    'Ready for Final Walkthrough': 'bg-purple-50 text-purple-700 ring-purple-100',
    Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    Paid: 'bg-slate-100 text-slate-700 ring-slate-200',
    Signed: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  }

  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {tStatus(t, status)}
    </span>
  )
}

function MobileJobStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}

function ProjectRoute({ leads, onBack, onOpenPortal, t, language }) {
  const { leadId } = useParams()
  const lead = leads.find((item) => item.id === leadId)

  if (!lead) {
    return (
      <ComingSoonPage
        title={t('projectNotFound')}
        description={t('projectNotFoundDescription')}
        icon={BriefcaseBusiness}
        actionLabel={t('backToDashboardAction')}
        onAction={onBack}
      />
    )
  }

  return (
    <ProjectDetailPage
      lead={lead}
      onBack={onBack}
      onOpenPortal={() => onOpenPortal(lead.id)}
      t={t}
      language={language}
    />
  )
}

function PortalRoute({ leads, onBack, t, language, setLanguage }) {
  const { leadId } = useParams()
  const lead = leads.find((item) => item.id === leadId)

  if (!lead) {
    return (
      <ComingSoonPage
        title={t('portalNotFound')}
        description={t('portalNotFoundDescription')}
        icon={Share2}
        actionLabel={t('backToDashboardAction')}
        onAction={() => onBack(initialLeads[0].id)}
      />
    )
  }

  return (
    <CustomerPortalPage
      lead={lead}
      onBack={() => onBack(lead.id)}
      t={t}
      language={language}
      setLanguage={setLanguage}
    />
  )
}

function ComingSoonPage({ title, description, icon: Icon = FileText, actionLabel, onAction, t = (key) => key }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl items-center justify-center">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
          <Icon className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">{t('comingSoon')}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-left">
          <h2 className="text-sm font-bold text-slate-900">{t('plannedWorkflow')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('plannedWorkflowText')}
          </p>
        </div>
        {actionLabel && onAction && (
          <button onClick={onAction} className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  )
}

function Sidebar({ isOpen, onClose, t }) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-slate-950 px-5 py-6 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 font-bold shadow-lg shadow-blue-500/30">{t('brandInitials')}</div>
            <div>
              <p className="font-bold leading-tight">{t('brandName')}</p>
              <p className="text-xs text-slate-400">{t('smallContractorCrm')}</p>
            </div>
          </NavLink>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={t(item.labelKey)}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold">{t('pipelineHealth')}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{t('pipelineHealthText')}</p>
        </div>
      </aside>
    </>
  )
}


function LanguageToggle({ language, setLanguage, t }) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" aria-label={t('language')}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${language === 'en' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        <span className="hidden sm:inline">🇺🇸 English</span>
        <span className="sm:hidden">🇺🇸 EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${language === 'es' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        <span className="hidden sm:inline">🇪🇸 Español</span>
        <span className="sm:hidden">🇪🇸 ES</span>
      </button>
    </div>
  )
}

function Topbar({ onMenuClick, language, setLanguage, t }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <button className="rounded-2xl border border-slate-200 p-2 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={t('searchPlaceholder')} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageToggle language={language} setLanguage={setLanguage} t={t} />
          <button className="relative rounded-2xl border border-slate-200 p-3 hover:bg-slate-50">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
          </button>
          <button className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{t('userInitials')}</div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{t('userName')}</p>
              <p className="text-xs text-slate-500">{t('ownerAdmin')}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}

function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </article>
  )
}

function SelectField({ className = '', containerClassName = '', children, ...props }) {
  return (
    <div className={`relative ${containerClassName}`.trim()}>
      <select
        {...props}
        className={`w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`.trim()}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

function PipelineBoard({
  leads,
  statuses,
  draggedLeadId,
  setDraggedLeadId,
  moveLead,
  onLeadClick,
  selectedMobileStage,
  setSelectedMobileStage,
  t = (key) => key,
}) {
  const selectedStageLeads = leads.filter((lead) => lead.status === selectedMobileStage)

  return (
    <section>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{t('leadPipeline')}</h2>
          <p className="hidden text-sm text-slate-500 lg:block">{t('dragCardsHelp')}</p>
          <p className="text-sm text-slate-500 lg:hidden">{t('chooseStageHelp')}</p>
        </div>
        <p className="text-sm font-medium text-slate-500">{leads.length} {t('activeOpportunities')}</p>
      </div>

      <div className="lg:hidden">
        <MobilePipeline
          leads={selectedStageLeads}
          statuses={statuses}
          selectedStage={selectedMobileStage}
          setSelectedStage={setSelectedMobileStage}
          moveLead={moveLead}
          onLeadClick={onLeadClick}
          t={t}
        />
      </div>

      <div className="hidden gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4">
        {statuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            leads={leads.filter((lead) => lead.status === status)}
            draggedLeadId={draggedLeadId}
            setDraggedLeadId={setDraggedLeadId}
            moveLead={moveLead}
            onLeadClick={onLeadClick}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

function MobilePipeline({ leads, statuses, selectedStage, setSelectedStage, moveLead, onLeadClick, t }) {
  const selectedTotal = leads.reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="mobile-stage" className="mb-2 block text-sm font-semibold text-slate-700">
        Pipeline stage
      </label>
      <SelectField
        id="mobile-stage"
        value={selectedStage}
        onChange={(event) => setSelectedStage(event.target.value)}
        className="bg-slate-50"
        containerClassName="mb-4"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {tStatus(t, status)}
          </option>
        ))}
      </SelectField>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <h3 className="font-bold text-slate-900">{tStatus(t, selectedStage)}</h3>
          <p className="text-xs text-slate-500">{leads.length} {t('leads').toLowerCase()} · {currency.format(selectedTotal)}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{leads.length}</span>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            statuses={statuses}
            moveLead={moveLead}
            mobile
            onClick={() => onLeadClick(lead.id)}
          />
        ))}

        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {t('noLeadsInStage')}
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineColumn({ status, leads, draggedLeadId, setDraggedLeadId, moveLead, onLeadClick, t }) {
  const total = leads.reduce((sum, lead) => sum + lead.value, 0)

  return (
    <div
      className="min-h-[420px] min-w-[280px] rounded-3xl border border-slate-200 bg-slate-100/80 p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (draggedLeadId) moveLead(draggedLeadId, status)
        setDraggedLeadId(null)
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{tStatus(t, status)}</h3>
          <p className="text-xs text-slate-500">{leads.length} {t('leads').toLowerCase()} · {currency.format(total)}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">{leads.length}</span>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={() => setDraggedLeadId(lead.id)} onClick={() => onLeadClick(lead.id)} t={t} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-400">
            {t('dropLeadHere')}
          </div>
        )}
      </div>
    </div>
  )
}

function LeadCard({ lead, onDragStart, statuses = [], moveLead, mobile = false, onClick, t = (key) => key }) {
  const priorityClasses = {
    High: 'bg-red-50 text-red-700 ring-red-100',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    Low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }

  return (
    <article
      draggable={!mobile}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`${mobile ? '' : 'cursor-grab active:cursor-grabbing'} rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-950">{lead.client}</h4>
          <p className="text-sm text-slate-500">{t(lead.projectType)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${priorityClasses[lead.priority]}`}>
          {tStatus(t, lead.priority) || lead.priority}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('value')}</span>
          <span className="font-bold text-slate-900">{currency.format(lead.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('location')}</span>
          <span className="font-medium text-slate-700">{lead.location}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('source')}</span>
          <span className="font-medium text-slate-700">{t(lead.source)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('nextStep')}</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{t(lead.nextStep)}</p>
      </div>

      {mobile && (
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          <label htmlFor={`status-${lead.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('changeStatus')}
          </label>
          <SelectField
            id={`status-${lead.id}`}
            value={lead.status}
            onChange={(event) => moveLead(lead.id, event.target.value)}
            className="bg-white"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </article>
  )
}


function ProjectDetailPage({ lead, onBack, onOpenPortal, t }) {
  const portal = getPortalData(lead)
  const navigate = useNavigate()

  const actionButtons = [
    { label: portal.estimate?.number && portal.estimate.number !== 'Draft' ? t('openEstimate') : t('createEstimate'), icon: ClipboardList, action: () => navigate(`/projects/${lead.id}/estimate`), primary: true },
    { label: portal.contract?.status === 'Signed' ? t('openContract') : t('convertToContract'), icon: FileText, action: () => navigate(`/projects/${lead.id}/contract`) },
    { label: t('recordPayment'), icon: DollarSign, action: () => alert(t('recordPayment')) },
    { label: t('uploadPhotos'), icon: Camera, action: () => alert(t('uploadPhotos')) },
    { label: t('openCustomerPortal'), icon: Share2, action: onOpenPortal },
  ]

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> {t('backToDashboard')}
      </button>

      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('projectWorkspace')}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t(lead.projectTitle || lead.projectType)}</h1>
            <p className="mt-2 text-slate-300">{lead.client} · {lead.location}</p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 lg:block">
            <p className="text-xs text-slate-300">{t('projectValue')}</p>
            <p className="text-2xl font-bold">{currency.format(lead.value)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-950">{t('contractorActions')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('contractorActionsHelp')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {actionButtons.map((button) => {
            const Icon = button.icon
            return (
              <button
                key={button.label}
                onClick={button.action}
                className={`flex min-h-[58px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${button.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-sm'}`}
              >
                <Icon className="h-4 w-4" /> {button.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t('customerInformation')}>
          <DetailRow label={t('name')} value={lead.client} />
          <DetailRow label={t('phone')} value={lead.phone || '(410) 555-0198'} />
          <DetailRow label={t('email')} value={lead.email || 'customer@example.com'} />
          <DetailRow label={t('address')} value={lead.address || lead.location} />
        </InfoCard>
        <InfoCard title={t('projectInformation')}>
          <DetailRow label={t('status')} value={tStatus(t, lead.projectStatus || lead.status)} />
          <DetailRow label={t('startDate')} value={portal.startDate} />
          <DetailRow label={t('targetCompletion')} value={portal.estimatedCompletion} />
          <DetailRow label={t('nextStep')} value={t(lead.nextStep)} />
        </InfoCard>
        <InfoCard title={t('customerPortal')}>
          <p className="text-sm leading-6 text-slate-600">{t('homeownerPortalPreviewHelp')}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{portal.shareUrl}</div>
          <button onClick={onOpenPortal} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
            {t('openCustomerPortal')} <ExternalLink className="h-4 w-4" />
          </button>
        </InfoCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t('homeownerPortalPreview')}</h2>
            <p className="text-sm text-slate-500">{t('homeownerPortalPreviewHelp')}</p>
          </div>
        </div>
        <PortalSummary lead={lead} portal={portal} t={t} />
      </section>
    </div>
  )
}

function EstimateRoute({ leads, t }) {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const lead = leads.find((item) => item.id === leadId)
  if (!lead) return <ComingSoonPage title={t('estimateNotFound')} description={t('selectProjectFirst')} icon={ClipboardList} />
  return <EstimateBuilderPage lead={lead} t={t} onBack={() => navigate(`/projects/${lead.id}`)} onConvert={() => navigate(`/projects/${lead.id}/contract`)} />
}

function EstimateBuilderPage({ lead, t, onBack, onConvert }) {
  const portal = getPortalData(lead)
  const [scope, setScope] = useState(t(portal.estimate?.summary) || `${t('scopeOfWork')} - ${t(lead.projectType)} - ${lead.client}.`)
  const [total, setTotal] = useState(portal.estimate?.total || lead.value)
  const [materialsIncluded, setMaterialsIncluded] = useState(true)
  const [paymentTerms, setPaymentTerms] = useState(t('defaultPaymentTerms'))
  const [showLineItems, setShowLineItems] = useState(false)
  const [lineItems, setLineItems] = useState([
    { name: t('laborAndProjectSetup'), amount: Math.round(lead.value * 0.35) },
    { name: t('materialsAndFinishWork'), amount: Math.round(lead.value * 0.65) },
  ])

  const lineTotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  function updateLineItem(index, field, value) {
    setLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { name: '', amount: 0 }])
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('projectWorkspace')}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('estimateBuilder')}</p>
        <h1 className="mt-2 text-3xl font-bold">{t(lead.projectTitle || lead.projectType)}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('estimateBuilderHelp')}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <InfoCard title={t('scopeOfWork')}>
            <textarea value={scope} onChange={(event) => setScope(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <InfoCard title={t('totalAmount')}>
            <input type="number" value={total} onChange={(event) => setTotal(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <InfoCard title={t('materialsIncluded')}>
            <button onClick={() => setMaterialsIncluded((current) => !current)} className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-bold ${materialsIncluded ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
              {materialsIncluded ? `${t('materialsIncluded')}: ${t('yes')}` : `${t('materialsIncluded')}: ${t('no')}`}
            </button>
          </InfoCard>

          <InfoCard title={t('paymentTerms')}>
            <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </InfoCard>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button onClick={() => setShowLineItems((current) => !current)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-800 hover:bg-white">
              {showLineItems ? t('hideLineItems') : t('addLineItems')}
            </button>
            {showLineItems && (
              <div className="mt-4 space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-3 sm:grid-cols-[1fr_150px]">
                    <input value={item.name} onChange={(event) => updateLineItem(index, 'name', event.target.value)} placeholder={t('item')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none" />
                    <input type="number" value={item.amount} onChange={(event) => updateLineItem(index, 'amount', Number(event.target.value))} placeholder={t('amount')} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none" />
                  </div>
                ))}
                <button onClick={addLineItem} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t('addItem')}</button>
                <p className="text-sm font-bold text-slate-700">{t('lineItems')}: {currency.format(lineTotal)}</p>
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InfoCard title={t('previewEstimate')}>
            <p className="text-sm font-bold text-slate-900">{lead.client}</p>
            <p className="mt-1 text-sm text-slate-500">{lead.address || lead.location}</p>
            <div className="my-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{scope}</div>
            <DetailRow label={t('materialsIncluded')} value={materialsIncluded ? t('yes') : t('no')} />
            <DetailRow label={t('paymentTerms')} value={paymentTerms} />
            <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-center text-blue-700">
              <p className="text-xs font-bold uppercase tracking-wide">{t('totalAmount')}</p>
              <p className="text-3xl font-bold">{currency.format(total)}</p>
            </div>
          </InfoCard>
          <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('saveEstimate')}</button>
          <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{t('previewEstimate')}</button>
          <button onClick={onConvert} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white hover:bg-blue-700">{t('convertToContract')}</button>
        </aside>
      </div>
    </div>
  )
}

function ContractRoute({ leads, t }) {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const lead = leads.find((item) => item.id === leadId)
  if (!lead) return <ComingSoonPage title={t('contractNotFound')} description={t('selectProjectFirst')} icon={FileText} />
  return <ContractPreviewPage lead={lead} t={t} onBack={() => navigate(`/projects/${lead.id}/estimate`)} />
}

function ContractPreviewPage({ lead, t, onBack }) {
  const portal = getPortalData(lead)
  const scope = t(portal.estimate?.summary) || `${t('scopeOfWork')} - ${t(lead.projectType)}.`
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t('estimateBuilder')}</button>
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('contractPreview')}</p>
        <h1 className="mt-2 text-3xl font-bold">{t(lead.projectTitle || lead.projectType)}</h1>
        <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{t('saveContract')}</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('editContract')}</button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold">{t('previewPdf')}</button>
          <button className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t('markAsSigned')}</button>
        </div>
        <div className="space-y-5 text-sm leading-6 text-slate-700">
          <ContractSection title={t('projectScope')}>{scope}</ContractSection>
          <ContractSection title={t('paymentTerms')}>{t('contractTermsText')}</ContractSection>
          <ContractSection title={t('materials')}>{t('materialsText')}</ContractSection>
          <ContractSection title={t('timeline')}>{t('timelineTextPrefix')} {portal.startDate}. {t('estimatedCompletion')} {portal.estimatedCompletion}.</ContractSection>
          <ContractSection title={t('changeOrders')}>{t('changeOrdersText')}</ContractSection>
          <ContractSection title={t('clientResponsibilities')}>{t('clientResponsibilitiesText')}</ContractSection>
          <ContractSection title={t('warrantyDisclaimer')}>{t('warrantyDisclaimerText')}</ContractSection>
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('contractorSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
            <div className="rounded-2xl border border-slate-200 p-4"><p className="font-bold">{t('clientSignature')}</p><div className="mt-10 border-t border-slate-300" /></div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ContractSection({ title, children }) {
  return <section><h2 className="mb-2 text-base font-bold text-slate-950">{title}</h2><p>{children}</p></section>
}

function CustomerPortalPage({ lead, onBack, t, language, setLanguage }) {
  const portal = getPortalData(lead)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> {t('projectWorkspace')}
        </button>
        <LanguageToggle language={language} setLanguage={setLanguage} t={t} />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">{t('customerPortal')}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t(lead.projectTitle || lead.projectType)}</h1>
              <p className="mt-2 text-slate-300">{lead.client} · {lead.address || lead.location}</p>
            </div>
            <span className="w-fit rounded-full bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-100 ring-1 ring-blue-300/30">{tStatus(t, lead.projectStatus || 'In Progress')}</span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <PortalStat label={t('contractAmount')} value={currency.format(portal.contractAmount)} />
          <PortalStat label={t('paidToDate')} value={currency.format(portal.amountPaid)} />
          <PortalStat label={t('outstandingBalance')} value={currency.format(portal.outstandingBalance)} />
          <PortalStat label={t('paymentStatus')} value={tStatus(t, portal.paymentStatus)} />
        </div>
      </section>

      <PortalSummary lead={lead} portal={portal} full t={t} />
    </div>
  )
}

function PortalSummary({ lead, portal, full = false, t = (key) => key }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <InfoCard title={t('projectStatus')}>
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>{portal.percentComplete}% {t('complete')}</span>
            <span className="text-slate-500">{t('target')}: {portal.estimatedCompletion}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${portal.percentComplete}%` }} />
          </div>
        </InfoCard>

        <InfoCard title={t('timeline')}>
          <div className="space-y-4">
            {portal.timeline.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : item.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <h3 className="font-bold text-slate-950">{t(item.title)}</h3>
                    <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t(item.note)}</p>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title={t('uploadedPhotos')}>
          <div className="grid gap-3 sm:grid-cols-3">
            {portal.photos.map((photo) => (
              <div key={photo.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
                  <Camera className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900">{t(photo.label)}</h3>
                <p className="mt-1 text-sm text-slate-500">{t(photo.description)}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      <div className="space-y-5">
        <InfoCard title={t('paymentProgress')}>
          <DetailRow label={t('depositRequired')} value={currency.format(portal.depositRequired)} />
          <DetailRow label={t('depositPaid')} value={currency.format(Math.min(portal.amountPaid, portal.depositRequired))} />
          <DetailRow label={t('outstandingBalance')} value={currency.format(portal.outstandingBalance)} />
          <DetailRow label={t('paymentStatus')} value={tStatus(t, portal.paymentStatus)} />
        </InfoCard>

        <InfoCard title={t('documents')}>
          <div className="space-y-3">
            {portal.documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t(doc.name)}</p>
                    <p className="text-xs text-slate-500">{tStatus(t, doc.type)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{tStatus(t, doc.status)}</span>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title={t('estimateContract')}>
          <DetailRow label={t('estimate')} value={`${portal.estimate.number} · ${currency.format(portal.estimate.total)}`} />
          <p className="mb-4 text-sm leading-6 text-slate-600">{t(portal.estimate.summary)}</p>
          <DetailRow label={t('contract')} value={`${portal.contract.number} · ${tStatus(t, portal.contract.status)}`} />
          <DetailRow label={t('signedDate')} value={portal.contract.signedDate} />
        </InfoCard>

        {full && (
          <InfoCard title={t('needHelp')}>
            <p className="text-sm leading-6 text-slate-600">{t('needHelpText')}</p>
            <button className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{t('messageContractor')}</button>
          </InfoCard>
        )}
      </div>
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-900">{value}</span>
    </div>
  )
}

function PortalStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function getPortalData(lead) {
  return lead.portal || {
    shareUrl: `contractorflow.app/portal/${lead.id}`,
    percentComplete: lead.status === 'Won' ? 35 : 10,
    contractAmount: lead.value,
    depositRequired: Math.round(lead.value * 0.5),
    amountPaid: lead.status === 'Won' ? Math.round(lead.value * 0.5) : 0,
    outstandingBalance: lead.status === 'Won' ? Math.round(lead.value * 0.5) : lead.value,
    paymentStatus: lead.status === 'Won' ? 'Deposit Paid' : 'Not Paid',
    startDate: 'To be scheduled',
    estimatedCompletion: 'Pending contract approval',
    timeline: [
      { title: 'Contract Signed', date: 'Pending', status: 'Upcoming', note: 'Contract will appear here after customer approval.' },
      { title: 'Deposit Received', date: 'Pending', status: 'Upcoming', note: 'Deposit invoice will be tracked once paid.' },
      { title: 'Demolition Complete', date: 'Pending', status: 'Upcoming', note: 'Milestone will update when work begins.' },
      { title: 'Installation', date: 'Pending', status: 'Upcoming', note: 'Installation milestone is not started yet.' },
      { title: 'Final Walkthrough', date: 'Pending', status: 'Upcoming', note: 'Final walkthrough will be scheduled near completion.' },
    ],
    photos: [
      { label: 'Before photos', description: 'Photos will be uploaded once the project starts.' },
      { label: 'Progress photos', description: 'Crew updates will appear here.' },
      { label: 'Final photos', description: 'Completed work photos will appear here.' },
    ],
    documents: [
      { name: 'Estimate', type: 'PDF', status: 'Draft' },
      { name: 'Contract', type: 'PDF', status: 'Pending' },
      { name: 'Invoices', type: 'Invoice', status: 'Pending' },
    ],
    estimate: {
      number: 'Draft',
      total: lead.value,
      summary: `${t(lead.projectType)} ${t('estimateFor')} ${lead.location}.`,
    },
    contract: {
      number: 'Not generated',
      signedDate: 'Pending',
      status: 'Not Signed',
    },
  }
}

export default App
