import { HeroSection } from '@/components/hero-section';
import { HowItWorks } from '@/components/how-it-works';
import { FeaturesSection } from '@/components/features-section';
import { IntensityTiers } from '@/components/intensity-tiers';
import { CtaSection } from '@/components/cta-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <IntensityTiers />
      <CtaSection />
    </>
  );
}
