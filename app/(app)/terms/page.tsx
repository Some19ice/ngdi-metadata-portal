"use server"

import { Gavel } from "lucide-react"

export default async function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="container mx-auto px-6">
          <Gavel className="mx-auto h-16 w-16 text-white drop-shadow-md mb-4" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            Terms of Service
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-300 drop-shadow-sm">
            Please read these terms carefully before using the NGDI Portal.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="prose prose-invert prose-lg lg:prose-xl max-w-none text-slate-300 prose-headings:text-slate-100 prose-a:text-sky-400 hover:prose-a:text-sky-300 prose-strong:text-slate-200">
          <p className="text-sm text-slate-400">Last Updated: July 26, 2024</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the National Geospatial Data Infrastructure
            (NGDI) Portal (the "Service"), operated by [Your
            Organization/Governing Body Name Here] ("we", "us", or "our"), you
            agree to be bound by these Terms of Service ("Terms"). If you
            disagree with any part of the terms, then you may not access the
            Service.
          </p>

          <h2>2. Use of the Service</h2>
          <p>
            The NGDI Portal provides access to geospatial metadata, data, and
            related services. You agree to use the Service in compliance with
            all applicable local, state, national, and international laws,
            rules, and regulations.
          </p>
          <p>
            You are responsible for your use of the Service and for any content
            you provide, including compliance with applicable laws, rules, and
            regulations. You should only provide content that you are
            comfortable sharing with others.
          </p>

          <h3>2.1. User Accounts</h3>
          <p>
            When you create an account with us, you must provide information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password, whether your password is with our Service or a third-party
            service.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must
            notify us immediately upon becoming aware of any breach of security
            or unauthorized use of your account.
          </p>

          <h3>2.2. Prohibited Uses</h3>
          <p>You may not use the Service:</p>
          <ul>
            <li>
              In any way that violates any applicable national or international
              law or regulation.
            </li>
            <li>
              For the purpose of exploiting, harming, or attempting to exploit
              or harm minors in any way by exposing them to inappropriate
              content or otherwise.
            </li>
            <li>
              To transmit, or procure the sending of, any advertising or
              promotional material, including any "junk mail", "chain letter",
              "spam", or any other similar solicitation.
            </li>
            <li>
              To impersonate or attempt to impersonate the NGDI, an NGDI
              employee, another user, or any other person or entity.
            </li>
            <li>
              In any way that infringes upon the rights of others, or in any way
              is illegal, threatening, fraudulent, or harmful, or in connection
              with any unlawful, illegal, fraudulent, or harmful purpose or
              activity.
            </li>
            <li>
              To engage in any other conduct that restricts or inhibits anyone's
              use or enjoyment of the Service, or which, as determined by us,
              may harm or offend the NGDI or users of the Service or expose them
              to liability.
            </li>
            <li>
              To attempt to gain unauthorized access to, interfere with, damage,
              or disrupt any parts of the Service, the server on which the
              Service is stored, or any server, computer, or database connected
              to the Service.
            </li>
          </ul>

          <h2>3. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by
            users), features, and functionality are and will remain the
            exclusive property of [Your Organization/Governing Body Name Here]
            and its licensors.
          </p>
          <p>
            Data and metadata available through the portal may be subject to
            their own specific licenses and use constraints, as indicated in
            their respective metadata records. Users are responsible for
            adhering to these individual licenses.
          </p>

          <h2>4. Content Provided by Users</h2>
          <p>
            If you submit, post, or display content on or through the Service
            ("User Content"), you grant us a worldwide, non-exclusive,
            royalty-free license (with the right to sublicense) to use, copy,
            reproduce, process, adapt, modify, publish, transmit, display, and
            distribute such User Content in any and all media or distribution
            methods (now known or later developed) solely for the purpose of
            operating, developing, providing, and improving the Service.
          </p>
          <p>
            You represent and warrant that you have, or have obtained, all
            rights, licenses, consents, permissions, power and/or authority
            necessary to grant the rights granted herein for any User Content
            that you submit, post or display on or through the Service.
          </p>

          <h2>5. Disclaimers and Limitation of Liability</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The
            Service is provided without warranties of any kind, whether express
            or implied, including, but not limited to, implied warranties of
            merchantability, fitness for a particular purpose, non-infringement,
            or course of performance.
          </p>
          <p>
            [Your Organization/Governing Body Name Here], its subsidiaries,
            affiliates, and its licensors do not warrant that a) the Service
            will function uninterrupted, secure or available at any particular
            time or location; b) any errors or defects will be corrected; c) the
            Service is free of viruses or other harmful components; or d) the
            results of using the Service will meet your requirements.
          </p>
          <p>
            In no event shall [Your Organization/Governing Body Name Here], nor
            its directors, employees, partners, agents, suppliers, or
            affiliates, be liable for any indirect, incidental, special,
            consequential or punitive damages, including without limitation,
            loss of profits, data, use, goodwill, or other intangible losses,
            resulting from (i) your access to or use of or inability to access
            or use the Service; (ii) any conduct or content of any third party
            on the Service; (iii) any content obtained from the Service; and
            (iv) unauthorized access, use or alteration of your transmissions or
            content, whether based on warranty, contract, tort (including
            negligence) or any other legal theory, whether or not we have been
            informed of the possibility of such damage, and even if a remedy set
            forth herein is found to have failed of its essential purpose.
          </p>

          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the
            Service immediately, without prior notice or liability, under our
            sole discretion, for any reason whatsoever and without limitation,
            including but not limited to a breach of the Terms.
          </p>
          <p>
            If you wish to terminate your account, you may simply discontinue
            using the Service or contact us to request account deletion.
          </p>
          <p>
            All provisions of the Terms which by their nature should survive
            termination shall survive termination, including, without
            limitation, ownership provisions, warranty disclaimers, indemnity,
            and limitations of liability.
          </p>

          <h2>7. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of [Your Country/Jurisdiction], without regard to its conflict
            of law provisions.
          </p>
          <p>
            Our failure to enforce any right or provision of these Terms will
            not be considered a waiver of those rights. If any provision of
            these Terms is held to be invalid or unenforceable by a court, the
            remaining provisions of these Terms will remain in effect. These
            Terms constitute the entire agreement between us regarding our
            Service, and supersede and replace any prior agreements we might
            have had between us regarding the Service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will provide
            at least 30 days' notice prior to any new terms taking effect. What
            constitutes a material change will be determined at our sole
            discretion.
          </p>
          <p>
            By continuing to access or use our Service after any revisions
            become effective, you agree to be bound by the revised terms. If you
            do not agree to the new terms, you are no longer authorized to use
            the Service.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
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
