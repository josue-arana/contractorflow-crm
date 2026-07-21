const PAYMENT_TERM_DEFINITIONS = Object.freeze([
  { value: 'due_on_receipt', labelKey: 'onboardingPaymentDueReceipt' },
  { value: 'net_7', labelKey: 'onboardingPaymentNet7' },
  { value: 'net_15', labelKey: 'onboardingPaymentNet15' },
  { value: 'net_30', labelKey: 'onboardingPaymentNet30' },
])

const LEGACY_PAYMENT_TERM_LABEL_KEYS = Object.freeze({
  'Due on receipt': 'onboardingPaymentDueReceipt',
  'Net 7': 'onboardingPaymentNet7',
  'Net 15': 'onboardingPaymentNet15',
  'Net 30': 'onboardingPaymentNet30',
})

const PAYMENT_TERM_ALIASES = Object.freeze({
  due_on_receipt: 'due_on_receipt',
  'due on receipt': 'due_on_receipt',
  net_7: 'net_7',
  net7: 'net_7',
  'net 7': 'net_7',
  pay_7: 'net_7',
  pay7: 'net_7',
  net_15: 'net_15',
  net15: 'net_15',
  'net 15': 'net_15',
  pay_15: 'net_15',
  pay15: 'net_15',
  net_30: 'net_30',
  net30: 'net_30',
  'net 30': 'net_30',
  pay_30: 'net_30',
  pay30: 'net_30',
})

export function normalizePaymentTermValue(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return PAYMENT_TERM_ALIASES[normalizedValue] || ''
}

export function isKnownPaymentTermValue(value) {
  return Boolean(normalizePaymentTermValue(value))
}

export function getPaymentTermLabel(value, t) {
  const canonicalValue = normalizePaymentTermValue(value)
  const definition = PAYMENT_TERM_DEFINITIONS.find((option) => option.value === canonicalValue)
  const labelKey = definition?.labelKey || LEGACY_PAYMENT_TERM_LABEL_KEYS[value]

  return labelKey ? t(labelKey) : value || ''
}

export function getPaymentTermOptions(t, currentValue = '') {
  const options = PAYMENT_TERM_DEFINITIONS.map(({ value, labelKey }) => [value, t(labelKey)])

  if (currentValue && !options.some(([value]) => value === currentValue)) {
    options.unshift([currentValue, getPaymentTermLabel(currentValue, t)])
  }

  return options
}

export default {
  getPaymentTermLabel,
  getPaymentTermOptions,
  isKnownPaymentTermValue,
  normalizePaymentTermValue,
}
