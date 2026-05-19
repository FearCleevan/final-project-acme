interface CheckoutStepsProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { n: 1, label: 'Crate' },
  { n: 2, label: 'Details' },
  { n: 3, label: 'Confirmed' },
]

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-0 mb-12">
      {steps.map((step, i) => {
        const done = step.n < currentStep
        const active = step.n === currentStep

        return (
          <div key={step.n} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-mono font-medium transition-colors',
                  done  ? 'bg-green-brand text-[#F5F1E6]' : '',
                  active ? 'bg-brass-deep text-[#F5F1E6] ring-2 ring-brass/30 ring-offset-2' : '',
                  !done && !active ? 'border-2 border-ink-rule text-ink-soft' : '',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l3.5 3.5 6.5-7" stroke="#F5F1E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : step.n}
              </div>
              <span
                className={[
                  'text-[10px] font-mono uppercase tracking-eyebrow whitespace-nowrap',
                  active ? 'text-ink-charcoal font-medium' : '',
                  done  ? 'text-green-brand' : '',
                  !done && !active ? 'text-ink-soft' : '',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'h-px w-16 sm:w-24 mx-3 mb-5 transition-colors',
                  done ? 'bg-green-brand' : 'bg-ink-rule',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
