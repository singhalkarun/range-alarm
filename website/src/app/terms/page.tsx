import type { Metadata } from 'next';
import { APP_NAME, DEVELOPER_EMAIL, EFFECTIVE_DATE, WEBSITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
        Terms &amp; Conditions
      </h1>
      <p className="mb-12 text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-10 text-charcoal-300 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-relaxed [&_li]:mb-1">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By downloading, installing, or using {APP_NAME} (&quot;the
            app&quot;), you agree to be bound by these Terms &amp; Conditions.
            If you do not agree to these terms, do not use the app.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            {APP_NAME} is a mobile alarm application that sends a sequence of
            notifications at increasing intensity over a configurable time
            window. The app allows users to set start times, durations,
            intervals, intensity progressions, snooze options, and repeating
            schedules.
          </p>
        </section>

        <section>
          <h2>3. Use License</h2>
          <p>
            We grant you a personal, non-commercial, non-transferable,
            revocable license to use {APP_NAME} on your personal mobile
            device. You may not copy, modify, distribute, sell, or lease any
            part of the app, nor may you reverse-engineer or attempt to
            extract the source code.
          </p>
        </section>

        <section>
          <h2>4. User Responsibilities</h2>
          <p>As a user of {APP_NAME}, you are responsible for:</p>
          <ul>
            <li>
              Granting the necessary device permissions (notifications, exact
              alarm, full-screen intent, background tasks) for the app to
              function properly.
            </li>
            <li>
              On Android 12 and above, granting the Exact Alarm permission
              through your device&apos;s Settings when prompted.
            </li>
            <li>
              Understanding that alarm delivery depends on your device&apos;s
              operating system, notification settings, battery optimization
              policies, and Do Not Disturb configuration.
            </li>
            <li>
              Not relying on the app for safety-critical, life-critical, or
              medical timing purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            {APP_NAME} is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee that:
          </p>
          <ul>
            <li>Alarms will fire in every scenario or on every device.</li>
            <li>
              The app will be free from interruptions, errors, or
              compatibility issues.
            </li>
            <li>
              Notifications will not be suppressed by operating system
              restrictions, battery optimization, power-saving modes, or Do
              Not Disturb settings.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, the developers
            of {APP_NAME} shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including but not
            limited to missed alarms, lost time, or any damages arising from
            the use or inability to use the app.
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            The {APP_NAME} name, design, code, and all associated intellectual
            property are owned by the developer. Nothing in these terms grants
            you any right to use the {APP_NAME} name or branding for any
            purpose.
          </p>
        </section>

        <section>
          <h2>8. Termination</h2>
          <p>
            We reserve the right to discontinue {APP_NAME} at any time
            without notice. Upon discontinuation, your license to use the app
            is automatically terminated. Sections regarding disclaimers,
            limitations of liability, and intellectual property survive
            termination.
          </p>
        </section>

        <section>
          <h2>9. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with
            applicable law. Any disputes arising from these terms or your use
            of the app shall be resolved in accordance with applicable
            jurisdiction.
          </p>
        </section>

        <section>
          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms &amp; Conditions from time to time.
            Changes will be communicated through app updates or by posting the
            revised terms on our website at{' '}
            <a href={WEBSITE_URL} className="text-cyan-400 underline hover:text-cyan-500">
              {WEBSITE_URL}
            </a>
            . Your continued use of the app after changes are posted
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>
            If you have questions about these Terms &amp; Conditions, please
            contact us at{' '}
            <a
              href={`mailto:${DEVELOPER_EMAIL}`}
              className="text-cyan-400 underline hover:text-cyan-500"
            >
              {DEVELOPER_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
