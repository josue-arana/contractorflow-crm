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

export function getPaymentTermLabel(value, t) {
  const definition = PAYMENT_TERM_DEFINITIONS.find((option) => option.value === value)
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
}
