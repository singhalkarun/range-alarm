import type { Metadata } from 'next';
import { APP_NAME, DEVELOPER_EMAIL, EFFECTIVE_DATE, WEBSITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mb-12 text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-10 text-charcoal-300 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-relaxed [&_li]:mb-1">
        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how {APP_NAME} (&quot;we,&quot;
            &quot;our,&quot; or &quot;the app&quot;) collects, uses, and
            protects information when you use our mobile application. We are
            committed to protecting your privacy and being transparent about
            our data practices.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>
            {APP_NAME} is designed with privacy in mind. The app collects and
            stores only the minimum information needed to function:
          </p>
          <ul>
            <li>
              <strong>Alarm configurations:</strong> Times, durations,
              intervals, intensity settings, day selections, and labels you
              create within the app.
            </li>
            <li>
              <strong>Device locale:</strong> Your device&apos;s language
              preference, used solely to display the app in your preferred
              language.
            </li>
            <li>
              <strong>Unique identifiers:</strong> The app generates random
              UUIDs locally on your device (using the device&apos;s
              cryptographic module) to identify your alarms. These are never
              transmitted externally.
            </li>
          </ul>
          <p>
            <strong>We do NOT collect:</strong> Personal information, names,
            email addresses, location data, contacts, photos, camera or
            microphone data, browsing history, or any form of analytics or
            tracking data.
          </p>
        </section>

        <section>
          <h2>3. How We Use Information</h2>
          <p>The information stored by the app is used exclusively to:</p>
          <ul>
            <li>Schedule and deliver alarm notifications at your configured times</li>
            <li>Run background tasks to re-schedule alarms when needed</li>
            <li>Store your alarm preferences locally on your device</li>
            <li>Display the app interface in your preferred language</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          <p>
            All alarm data is stored locally on your device using encrypted
            storage (MMKV). Your data never leaves your device for alarm
            functionality. There is no cloud sync, no server-side storage, and
            no account system. If you uninstall the app, all data is
            permanently deleted.
          </p>
        </section>

        <section>
          <h2>5. Device Permissions</h2>
          <p>
            {APP_NAME} requests the following device permissions to function
            properly:
          </p>
          <ul>
            <li>
              <strong>Notifications:</strong> Required to deliver alarm sounds
              and alerts at your scheduled times.
            </li>
            <li>
              <strong>Exact Alarm / Schedule Exact Alarm (Android 12+):</strong>{' '}
              Required for precise alarm timing. You may need to grant this
              permission in your device Settings.
            </li>
            <li>
              <strong>Full-Screen Intent (Android):</strong> Required to
              display the alarm over your lock screen and turn on the display
              when an alarm fires.
            </li>
            <li>
              <strong>Background Tasks:</strong> Required to re-schedule
              alarms when the app is not in the foreground.
            </li>
            <li>
              <strong>Battery Optimization Exemption (Android, optional):</strong>{' '}
              Recommended to prevent the operating system from suppressing
              alarm notifications.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Third-Party Services</h2>
          <p>
            {APP_NAME} uses Expo&apos;s over-the-air (OTA) update service to
            deliver app updates. This may transmit basic device information
            (device type, OS version, app version) to Expo&apos;s servers when
            checking for updates.
          </p>
          <p>
            All alarm notifications are scheduled and delivered entirely
            on-device. No alarm data is sent to Expo&apos;s push notification
            servers or any other third-party service.
          </p>
        </section>

        <section>
          <h2>7. Children&apos;s Privacy</h2>
          <p>
            {APP_NAME} is not directed at children under the age of 13. We do
            not knowingly collect any information from children. If you believe
            a child has provided data through the app, please contact us at
            the email below.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will
            be communicated through app updates or by posting the revised
            policy on our website at{' '}
            <a href={WEBSITE_URL} className="text-cyan-400 underline hover:text-cyan-500">
              {WEBSITE_URL}
            </a>
            . Your continued use of the app after changes are posted
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at{' '}
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
