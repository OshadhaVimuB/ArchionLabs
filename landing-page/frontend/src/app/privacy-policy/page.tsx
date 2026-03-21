import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import SmoothScroller from "@/components/SmoothScroller";

export const metadata = {
  title: "Privacy Policy | ArchionLabs",
  description: "Privacy Policy for ArchionLabs platforms.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#111111] text-white selection:bg-white/20 selection:text-white">
      <SmoothScroller />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] -mr-[400px] -mt-[400px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 text-sm font-medium">
          <ArrowLeft weight="bold" />
          Back to Home
        </Link>
        
        <div className="space-y-12">
          <header>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-gray-400 text-lg">Last updated: March 2026</p>
          </header>

          <div className="space-y-8 text-gray-300 leading-relaxed font-light text-lg">
            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">1. Introduction</h2>
              <p>
                Welcome to ArchionLabs. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you as to how we look after your personal data when you visit our 
                website and use our platforms, including Archion Build, Archion Sim, and Viewer & Share.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">2. The Data We Collect</h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400">
                <li><strong className="text-gray-300">Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong className="text-gray-300">Contact Data:</strong> includes email address and telephone numbers.</li>
                <li><strong className="text-gray-300">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                <li><strong className="text-gray-300">Usage Data:</strong> includes information about how you use our website, products and services (such as project floorplans and spatial data).</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">3. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>To power our AI-driven spatial design generation architectures, ensuring your specific data models remain securely isolated within your tenant workspace.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">5. Your Legal Rights</h2>
              <p>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data, and (where the lawful ground of processing is consent) to withdraw consent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl text-white font-medium">6. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at:
                <br />
                <a href="mailto:support@archionlabs.com" className="text-white hover:underline mt-2 inline-block">support@archionlabs.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
