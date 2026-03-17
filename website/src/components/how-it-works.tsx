const steps = [
  {
    number: '01',
    title: 'Set Your Range',
    description:
      'Pick a start time and duration from 2 to 120 minutes. Choose how often alarms fire — every 2, 5, 10, 15, or 20 minutes.',
  },
  {
    number: '02',
    title: 'Choose Your Intensity',
    description:
      'Alarms automatically progress from Gentle to Moderate to Strong to Aggressive, with distinct sounds and vibration at each tier.',
  },
  {
    number: '03',
    title: 'Wake Up Right',
    description:
      'Snooze individual alarms or dismiss them all. Set repeating schedules for specific days or use one-time alarms.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-navy-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Three simple steps to better mornings.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <span className="mb-4 inline-block text-3xl font-bold text-cyan-400">
                {step.number}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-charcoal-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
