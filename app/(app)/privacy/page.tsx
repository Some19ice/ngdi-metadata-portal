"use server"

import { ShieldCheck } from "lucide-react"

export default async function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-6">
          <ShieldCheck className="mx-auto h-16 w-16 text-white drop-shadow-md mb-4" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            Privacy Policy
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            Your privacy is important to us. This policy explains how we handle
            your personal information.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="prose prose-invert prose-lg lg:prose-xl max-w-none text-slate-300 prose-headings:text-slate-100 prose-a:text-sky-400 hover:prose-a:text-sky-300 prose-strong:text-slate-200">
          <p className="text-sm text-slate-400">Last Updated: July 26, 2024</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to the National Geospatial Data Infrastructure (NGDI) Portal
            (the "Service"). This Privacy Policy explains how [Your
            Organization/Governing Body Name Here] ("we", "us", or "our")
            collects, uses, discloses, and safeguards your information when you
            visit our website and use our services. Please read this privacy
            policy carefully. If you do not agree with the terms of this privacy
            policy, please do not access the site.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect on the Service includes:
          </p>
          <h3>2.1. Personal Data</h3>
          <p>
            Personally identifiable information, such as your name, email
            address, and telephone number, and demographic information, such as
            your age, gender, hometown, and interests, that you voluntarily give
            to us when you register with the Service or when you choose to
            participate in various activities related to the Service, such as
            online chat and message boards. You are under no obligation to
            provide us with personal information of any kind, however your
            refusal to do so may prevent you from using certain features of the
            Service.
          </p>
          <h3>2.2. Derivative Data</h3>
          <p>
            Information our servers automatically collect when you access the
            Service, such as your IP address, your browser type, your operating
            system, your access times, and the pages you have viewed directly
            before and after accessing the Service.
          </p>
          <h3>2.3. Data from Third-Party Services</h3>
          <p>
            User information from social networking sites, such as [List of
            social networks, e.g., Google, Facebook], including your name, your
            social network username, location, gender, birth date, email
            address, profile picture, and public data for contacts, if you
            connect your account to such social networks. This information may
            also include the contact information of anyone you invite to use
            and/or join the Service.
          </p>

          <h2>3. Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Service to:
          </p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Email you regarding your account or order.</li>
            <li>Enable user-to-user communications.</li>
            <li>
              Fulfill and manage purchases, orders, payments, and other
              transactions related to the Service.
            </li>
            <li>
              Generate a personal profile about you to make future visits to the
              Service more personalized.
            </li>
            <li>Increase the efficiency and operation of the Service.</li>
            <li>
              Monitor and analyze usage and trends to improve your experience
              with the Service.
            </li>
            <li>Notify you of updates to the Service.</li>
            <li>
              Offer new products, services, and/or recommendations to you.
            </li>
            <li>Perform other business activities as needed.</li>
            <li>
              Prevent fraudulent transactions, monitor against theft, and
              protect against criminal activity.
            </li>
            <li>Process payments and refunds.</li>
            <li>
              Request feedback and contact you about your use of the Service.
            </li>
            <li>Resolve disputes and troubleshoot problems.</li>
            <li>Respond to product and customer service requests.</li>
            <li>Send you a newsletter.</li>
            <li>Solicit support for the Service.</li>
          </ul>

          <h2>4. Disclosure of Your Information</h2>
          <p>
            We may share information we have collected about you in certain
            situations. Your information may be disclosed as follows:
          </p>
          <h3>4.1. By Law or to Protect Rights</h3>
          <p>
            If we believe the release of information about you is necessary to
            respond to legal process, to investigate or remedy potential
            violations of our policies, or to protect the rights, property, and
            safety of others, we may share your information as permitted or
            required by any applicable law, rule, or regulation. This includes
            exchanging information with other entities for fraud protection and
            credit risk reduction.
          </p>
          <h3>4.2. Third-Party Service Providers</h3>
          <p>
            We may share your information with third parties that perform
            services for us or on our behalf, including payment processing, data
            analysis, email delivery, hosting services, customer service, and
            marketing assistance.
          </p>
          <h3>4.3. Business Transfers</h3>
          <p>
            We may share or transfer your information in connection with, or
            during negotiations of, any merger, sale of company assets,
            financing, or acquisition of all or a portion of our business to
            another company.
          </p>
          <h3>4.4. Affiliates</h3>
          <p>
            We may share your information with our affiliates, in which case we
            will require those affiliates to honor this Privacy Policy.
            Affiliates include our parent company and any subsidiaries, joint
            venture partners or other companies that we control or that are
            under common control with us.
          </p>
          <h3>4.5. Other Third Parties</h3>
          <p>
            We may share your information with advertisers and investors for the
            purpose of conducting general business analysis. We may also share
            your information with such third parties for marketing purposes, as
            permitted by law.
          </p>

          <h2>5. Tracking Technologies</h2>
          <h3>5.1. Cookies and Web Beacons</h3>
          <p>
            We may use cookies, web beacons, tracking pixels, and other tracking
            technologies on the Service to help customize the Service and
            improve your experience. When you access the Service, your personal
            information is not collected through the use of tracking technology.
            Most browsers are set to accept cookies by default. You can remove
            or reject cookies, but be aware that such action could affect the
            availability and functionality of the Service.
          </p>

          <h2>6. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that despite our efforts, no security measures
            are perfect or impenetrable, and no method of data transmission can
            be guaranteed against any interception or other type of misuse.
          </p>

          <h2>7. Policy for Children</h2>
          <p>
            We do not knowingly solicit information from or market to children
            under the age of 13. If you become aware of any data we have
            collected from children under age 13, please contact us using the
            contact information provided below.
          </p>

          <h2>8. Controls for Do-Not-Track Features</h2>
          <p>
            Most web browsers and some mobile operating systems include a
            Do-Not-Track ("DNT") feature or setting you can activate to signal
            your privacy preference not to have data about your online browsing
            activities monitored and collected. No uniform technology standard
            for recognizing and implementing DNT signals has been finalized. As
            such, we do not currently respond to DNT browser signals or any
            other mechanism that automatically communicates your choice not to
            be tracked online.
          </p>

          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time in order to
            reflect, for example, changes to our practices or for other
            operational, legal, or regulatory reasons. We will notify you of any
            changes by posting the new Privacy Policy on this page. You are
            advised to review this Privacy Policy periodically for any changes.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <p>
            [Provide Contact Email or Link to Contact Page, e.g.,{" "}
            <a href="/contact" className="text-sky-400 hover:text-sky-300">
              Contact Us
            </a>
            ]
          </p>
        </div>
      </div>
    </div>
  )
}
