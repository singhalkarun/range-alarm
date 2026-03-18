export function PhoneMockup() {
  return (
    <div className="relative h-[580px] w-[280px]">
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[3rem] border-2 border-border bg-navy-700 shadow-[0_0_60px_rgba(0,212,255,0.1)]" />

      {/* Notch */}
      <div className="absolute top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-navy-900" />

      {/* Screen content */}
      <div className="absolute inset-[8px] overflow-hidden rounded-[2.5rem] bg-background">
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-4 pb-1">
          <span className="text-[10px] font-semibold text-charcoal-400">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px]">
              {[10, 12, 8, 14].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-sm bg-charcoal-400"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <div className="ml-1 h-[10px] w-5 rounded-sm border border-charcoal-400 p-[1px]">
              <div className="h-full w-3/4 rounded-[1px] bg-charcoal-400" />
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="px-5 pt-3 pb-3">
          <h3 className="text-lg font-extrabold text-cyan-400">RangeAlarm</h3>
          <p className="text-[10px] text-muted-foreground">Wake up gradually, not abruptly.</p>
        </div>

        {/* Alarm cards */}
        <div className="flex flex-col gap-2.5 px-4">
          <AlarmCard
            time="7:00"
            ampm="AM"
            duration={30}
            interval={10}
            sequenceCount={4}
            days={[1, 2, 3, 4, 5]}
            enabled={true}
          />
          <AlarmCard
            time="6:30"
            ampm="AM"
            duration={60}
            interval={15}
            sequenceCount={5}
            days={[0, 1, 2, 3, 4, 5, 6]}
            enabled={true}
          />
          <AlarmCard
            time="2:00"
            ampm="PM"
            duration={15}
            interval={5}
            sequenceCount={4}
            days={[6]}
            enabled={false}
          />
        </div>

        {/* FAB */}
        <div className="absolute right-5 bottom-6 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 shadow-[0_4px_15px_rgba(0,212,255,0.4)]">
          <span className="text-xl font-bold leading-none text-white">+</span>
        </div>
      </div>
    </div>
  );
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function AlarmCard({
  time,
  ampm,
  duration,
  interval,
  sequenceCount,
  days,
  enabled,
}: {
  time: string;
  ampm: string;
  duration: number;
  interval: number;
  sequenceCount: number;
  days: number[];
  enabled: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card px-3.5 py-3 ${
        enabled ? '' : 'opacity-40'
      }`}
    >
      {/* Top row: time + toggle */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold leading-none tracking-tight text-white">
              {time}
            </span>
            <span className="ml-1 text-[10px] text-muted-foreground">{ampm}</span>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground">
            Range: {duration} min, every {interval} min
          </p>
          {/* Sequence badge */}
          <div className="mt-1 inline-flex items-center rounded-full bg-cyan-400/15 px-1.5 py-0.5">
            <span className="text-[8px] font-semibold text-cyan-400">
              &#9201; {sequenceCount} alarms in sequence
            </span>
          </div>
        </div>
        {/* Toggle */}
        <div
          className={`h-[18px] w-[32px] rounded-full p-[2px] ${
            enabled ? 'bg-cyan-400' : 'bg-navy-600'
          }`}
        >
          <div
            className="h-[14px] w-[14px] rounded-full bg-white transition-transform"
            style={{ transform: enabled ? 'translateX(14px)' : 'translateX(0)' }}
          />
        </div>
      </div>

      {/* Sequence dots */}
      <div className="mt-1.5 flex gap-[3px]">
        {Array.from({ length: sequenceCount }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            style={{ opacity: i === 0 ? 1 : 0.3 }}
          />
        ))}
      </div>

      {/* Day chips */}
      <div className="mt-1.5 flex gap-1">
        {DAY_LABELS.map((label, i) => {
          const isActive = days.includes(i);
          return (
            <div
              key={i}
              className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                isActive ? 'bg-cyan-400/15' : 'bg-muted'
              }`}
            >
              <span
                className={`text-[7px] font-semibold ${
                  isActive ? 'text-cyan-400' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
