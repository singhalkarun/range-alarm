const features = [
  {
    title: 'Intensity Progression',
    description:
      'Four tiers — Gentle, Moderate, Strong, Aggressive — with distinct sounds and vibration patterns at each level.',
  },
  {
    title: 'Flexible Duration',
    description:
      'Set alarm windows from 2 to 120 minutes. Perfect for quick naps or gradual morning wake-ups.',
  },
  {
    title: 'Configurable Intervals',
    description:
      'Alarms fire every 2, 5, 10, 15, or 20 minutes throughout your chosen duration.',
  },
  {
    title: 'Smart Snooze',
    description:
      'Snooze for 2, 5, or 10 minutes per notification. Set a max snooze limit from 1 to 10.',
  },
  {
    title: 'Repeating Schedules',
    description:
      'Set alarms for specific days of the week or use one-time alarms for naps and special occasions.',
  },
  {
    title: 'Full-Screen Alarm',
    description:
      'Alarms display over the lock screen and turn on the display so you never miss a wake-up call.',
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Everything You Need
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Designed to work with your sleep, not against it.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-charcoal-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
