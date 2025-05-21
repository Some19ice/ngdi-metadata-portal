/*
<ai_context>
This server page returns a simple "Contact Page" component as a (marketing) route.
</ai_context>
*/

"use server"

import { Mail, Phone, MapPin, Send, Building, ExternalLink } from "lucide-react"

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-r from-emerald-500 to-green-600">
        <div className="container mx-auto px-6">
          <Mail className="mx-auto h-16 w-16 text-white drop-shadow-md mb-4" />
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl drop-shadow-md">
            Contact Us
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-200 drop-shadow-sm">
            We\'d love to hear from you. Whether you have a question, feedback,
            or a collaboration proposal, feel free to reach out.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-start">
        {/* Contact Form Section (Placeholder) */}
        <section id="contact-form">
          <h2 className="text-3xl font-semibold mb-8 text-emerald-400">
            Send Us a Message
          </h2>
          <form className="space-y-6 bg-slate-800/70 p-8 rounded-lg shadow-xl">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                autoComplete="name"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Inquiry about..."
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Message
              </label>
              <textarea
                name="message"
                id="message"
                rows={4}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Your message..."
              />
            </div>
            <div>
              <button
                type="submit"
                disabled // Form is a placeholder
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 transition-colors duration-300 disabled:opacity-50"
              >
                <Send className="mr-2 h-5 w-5" />
                Send Message (Placeholder)
              </button>
              <p className="mt-2 text-xs text-slate-400 text-center">
                (Note: This form is a placeholder and does not submit data.)
              </p>
            </div>
          </form>
        </section>

        {/* Contact Details Section */}
        <section id="contact-details" className="mt-8 md:mt-0">
          <h2 className="text-3xl font-semibold mb-8 text-emerald-400">
            Our Contact Information
          </h2>
          <div className="space-y-6 text-slate-300">
            <div className="flex items-start">
              <Building className="h-8 w-8 text-emerald-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  NGDI Coordinating Office
                </h3>
                <p>National Space Research and Development Agency (NASRDA)</p>
                <p>Abuja, Nigeria.</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-emerald-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  General Inquiries
                </h3>
                <a
                  href="mailto:info@ngdi.gov.ng"
                  className="hover:text-emerald-400 transition-colors"
                >
                  info@ngdi.gov.ng (Placeholder)
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-6 w-6 text-emerald-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Phone Support
                </h3>
                <p>+234 (0) 9XX XXX XXXX (Placeholder)</p>
                <p className="text-sm text-slate-400">
                  Monday - Friday, 9:00 AM - 5:00 PM (WAT)
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-6 w-6 text-emerald-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Physical Address
                </h3>
                <p>
                  NASRDA Headquarters, Obasanjo Space Centre,
                  <br />
                  Umaru Musa Yar\'Adua Expressway, Lugbe,
                  <br />
                  Abuja, F.C.T, Nigeria.
                </p>
                <a
                  href="https://maps.google.com/?q=NASRDA+Headquarters+Abuja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center mt-1"
                >
                  View on Map <ExternalLink className="ml-1.5 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-slate-800/70 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-emerald-300 mb-3">
              Looking for Technical Support?
            </h3>
            <p className="text-slate-400 mb-4">
              For issues related to portal functionality, data access, or
              technical difficulties, please refer to our documentation or
              submit a support ticket through the designated channel (if
              available).
            </p>
            <a
              href="/docs"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors"
            >
              View Documentation
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
