import { createFileRoute } from '@tanstack/react-router';
import { Container } from '../components/ui/Container';

export const Route = createFileRoute('/privacy')({
    component: PrivacyPolicy
});

function PrivacyPolicy() {
    return (
        <Container>
            <div className="py-12 md:py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Last updated: November 17, 2025
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        {/* Introduction */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                1. Introduction
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Welcome to MultiTenantKit. We respect your privacy and are committed
                                to protecting your personal data. This privacy policy explains how
                                we collect, use, and safeguard your information when you visit our
                                website (
                                <a
                                    href="https://multitenantkit.com"
                                    className="text-primary hover:underline"
                                >
                                    multitenantkit.com
                                </a>
                                ).
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                MultiTenantKit is an open-source project. This privacy policy
                                applies only to our website, not to the MultiTenantKit toolkit
                                itself, which you can use in your own applications under the MIT
                                License.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                2. Information We Collect
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                2.1 Information You Provide
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We may collect the following information that you voluntarily
                                provide:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Email Address:</strong> When you subscribe to our
                                    newsletter or contact us through forms
                                </li>
                                <li>
                                    <strong>Name:</strong> If provided through contact forms or
                                    newsletter subscription
                                </li>
                                <li>
                                    <strong>Message Content:</strong> Any information you include in
                                    messages sent through contact forms
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                2.2 Automatically Collected Information
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                When you visit our website, we may automatically collect:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Usage Data:</strong> Pages visited, time spent on pages,
                                    referring websites, browser type, and device information
                                </li>
                                <li>
                                    <strong>Technical Data:</strong> IP address, browser type and
                                    version, time zone setting, operating system and platform
                                </li>
                                <li>
                                    <strong>Analytics Data:</strong> We use analytics services to
                                    understand how visitors interact with our website
                                </li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                3. How We Use Your Information
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We use the information we collect for the following purposes:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Newsletter Communications:</strong> To send you updates
                                    about MultiTenantKit, new features, and relevant content (only
                                    if you've subscribed)
                                </li>
                                <li>
                                    <strong>Respond to Inquiries:</strong> To answer questions and
                                    provide support
                                </li>
                                <li>
                                    <strong>Website Improvement:</strong> To analyze usage patterns
                                    and improve our website's functionality and content
                                </li>
                                <li>
                                    <strong>Security:</strong> To detect and prevent fraud, abuse,
                                    or security issues
                                </li>
                            </ul>
                        </section>

                        {/* Analytics and Cookies */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                4. Analytics and Cookies
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                4.1 Analytics Services
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We use <strong>Umami Analytics</strong> (hosted in Europe) to
                                collect anonymized usage statistics about how visitors interact with
                                our website.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Umami is a privacy-focused analytics solution that:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Does not use cookies</strong> - No consent popup
                                    required
                                </li>
                                <li>
                                    <strong>Does not track individual users</strong> - Only
                                    aggregated data
                                </li>
                                <li>
                                    <strong>Is GDPR compliant</strong> - Fully respects user privacy
                                </li>
                                <li>
                                    <strong>Hosted in Europe</strong> - Your data stays in EU
                                    servers
                                </li>
                                <li>
                                    <strong>Open source</strong> - Transparent code you can review
                                </li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We collect only non-personal information such as:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>Pages visited and time spent on pages</li>
                                <li>Referring websites (where you came from)</li>
                                <li>Browser type and device category (desktop/mobile)</li>
                                <li>Country (based on IP address, not stored)</li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400">
                                Learn more about Umami's privacy practices:{' '}
                                <a
                                    href="https://umami.is/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    https://umami.is/privacy
                                </a>
                            </p>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                4.2 Cookies
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Our website uses minimal cookies:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Essential Cookies:</strong> Only if necessary for the
                                    website to function properly (e.g., session management if you
                                    log in)
                                </li>
                                <li>
                                    <strong>Preference Cookies:</strong> To remember your settings
                                    such as dark mode preference (stored in browser local storage)
                                </li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>We do not use analytics cookies</strong> - Umami Analytics
                                does not require any cookies to function. You can control cookies
                                through your browser settings.
                            </p>
                        </section>

                        {/* Third-Party Services */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                5. Third-Party Services
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Our website is hosted and delivered through third-party services:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Hosting Services:</strong> AWS (Amazon Web Services) or
                                    Cloudflare may process and store website data
                                </li>
                                <li>
                                    <strong>Umami Analytics:</strong> Privacy-focused analytics
                                    hosted in Europe to collect anonymized usage statistics
                                </li>
                                <li>
                                    <strong>GitHub:</strong> Our open-source code is hosted on
                                    GitHub
                                </li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400">
                                These services have their own privacy policies and may collect data
                                as data processors on our behalf.
                            </p>
                        </section>

                        {/* Data Sharing */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                6. Data Sharing and Disclosure
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We do not sell, trade, or rent your personal information to third
                                parties. We may share your information only in the following
                                circumstances:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Service Providers:</strong> With trusted third-party
                                    service providers who assist us in operating our website (e.g.,
                                    email service providers, analytics providers)
                                </li>
                                <li>
                                    <strong>Legal Requirements:</strong> When required by law or to
                                    protect our rights, safety, or property
                                </li>
                                <li>
                                    <strong>Business Transfers:</strong> In connection with any
                                    merger, sale, or acquisition (if applicable)
                                </li>
                            </ul>
                        </section>

                        {/* Data Retention */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                7. Data Retention
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We retain your personal information only for as long as necessary to
                                fulfill the purposes outlined in this privacy policy, unless a
                                longer retention period is required or permitted by law. Analytics
                                data is typically retained according to the default settings of our
                                analytics provider (usually 14-26 months).
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                8. Your Rights
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Depending on your location, you may have the following rights:
                            </p>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4 space-y-2">
                                <li>
                                    <strong>Access:</strong> Request a copy of the personal data we
                                    hold about you
                                </li>
                                <li>
                                    <strong>Rectification:</strong> Request correction of inaccurate
                                    or incomplete data
                                </li>
                                <li>
                                    <strong>Erasure:</strong> Request deletion of your personal data
                                </li>
                                <li>
                                    <strong>Opt-out:</strong> Unsubscribe from our newsletter at any
                                    time
                                </li>
                                <li>
                                    <strong>Data Portability:</strong> Request a copy of your data
                                    in a machine-readable format
                                </li>
                                <li>
                                    <strong>Object:</strong> Object to processing of your personal
                                    data
                                </li>
                            </ul>
                            <p className="text-gray-600 dark:text-gray-400">
                                To exercise any of these rights, please contact us at the email
                                address provided below.
                            </p>
                        </section>

                        {/* International Data Transfers */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                9. International Data Transfers
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your information may be transferred to and processed in countries
                                other than your country of residence. These countries may have data
                                protection laws that are different from the laws of your country. We
                                take appropriate safeguards to ensure that your personal data
                                remains protected in accordance with this privacy policy.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                10. Children's Privacy
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Our website is not intended for children under the age of 13 (or 16
                                in the EU). We do not knowingly collect personal information from
                                children. If you believe we have collected information from a child,
                                please contact us immediately.
                            </p>
                        </section>

                        {/* Security */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                11. Security
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We implement appropriate technical and organizational measures to
                                protect your personal data against unauthorized or unlawful
                                processing, accidental loss, destruction, or damage. However, no
                                method of transmission over the internet or electronic storage is
                                100% secure.
                            </p>
                        </section>

                        {/* Changes to Privacy Policy */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                12. Changes to This Privacy Policy
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                We may update this privacy policy from time to time. We will notify
                                you of any changes by posting the new privacy policy on this page
                                and updating the "Last updated" date at the top of this policy. We
                                encourage you to review this privacy policy periodically for any
                                changes.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                13. Contact Us
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                If you have any questions about this privacy policy or our data
                                practices, please contact us:
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-dark-border rounded-lg p-6">
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    <strong>Email:</strong>{' '}
                                    <a
                                        href="mailto:contact@multitenantkit.com"
                                        className="text-primary hover:underline"
                                    >
                                        contact@multitenantkit.com
                                    </a>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <strong>GitHub:</strong>{' '}
                                    <a
                                        href="https://github.com/multitenantkit/multitenantkit"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        github.com/multitenantkit/multitenantkit
                                    </a>
                                </p>
                            </div>
                        </section>

                        {/* Open Source Notice */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                14. Open Source Software
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                MultiTenantKit is open-source software released under the MIT
                                License. This privacy policy does not apply to your use of the
                                MultiTenantKit toolkit in your own applications. You are responsible
                                for your own privacy policies and data practices when using
                                MultiTenantKit in your applications.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                For the MIT License terms, please visit:{' '}
                                <a
                                    href="https://github.com/multitenantkit/multitenantkit/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    LICENSE
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </Container>
    );
}
