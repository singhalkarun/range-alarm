const tiers = [
  {
    name: 'Gentle',
    description: 'Soft chime, light vibration',
    level: 1,
  },
  {
    name: 'Moderate',
    description: 'Steady tone, rhythmic vibration',
    level: 2,
  },
  {
    name: 'Strong',
    description: 'Loud alarm, persistent vibration',
    level: 3,
  },
  {
    name: 'Aggressive',
    description: 'Maximum volume, continuous vibration',
    level: 4,
  },
];

export function IntensityTiers() {
  return (
    <section className="bg-navy-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Gradual Intensity
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Your alarm starts soft and builds up only as needed.
        </p>
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-0">
          {tiers.map((tier, i) => (
            <div key={tier.name} className="flex flex-1 flex-col items-center md:flex-row">
              <div className="flex flex-col items-center text-center">
                <div
                  className="mb-4 flex items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-400/10"
                  style={{
                    width: `${48 + tier.level * 16}px`,
                    height: `${48 + tier.level * 16}px`,
                  }}
                >
                  <div
                    className="rounded-full bg-cyan-400"
                    style={{
                      width: `${12 + tier.level * 8}px`,
                      height: `${12 + tier.level * 8}px`,
                      opacity: 0.25 + tier.level * 0.25,
                    }}
                  />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="text-sm text-charcoal-400">{tier.description}</p>
              </div>
              {i < tiers.length - 1 && (
                <div className="mx-4 hidden h-0.5 flex-1 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
