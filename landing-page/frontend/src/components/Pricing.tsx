"use client";
import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle, StarFour } from "@phosphor-icons/react";

export default function Pricing() {
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".pricing-elem", {
      scrollTrigger: {
        trigger: "#pricing-section",
        start: "top 75%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
      clearProps: "all"
    });
  }, []);

  return (
    <section className="py-24 md:py-32 px-6 md:px-10 lg:px-20 max-w-[1400px] mx-auto" id="pricing-section">
      <div className="mb-12 md:mb-20 pricing-elem">
        <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">Pricing Plans</h4>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-black mb-4 md:mb-6">
          Scale your vision.
        </h2>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed">
          Choose the perfect plan for your architectural workflow. Designed for solo designers and global studios alike.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-lg md:max-w-none mx-auto">
        {/* Starter Plan */}
        <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col pricing-elem group hover:-translate-y-2 transition-transform duration-500">
          <div className="mb-8">
            <span className="bg-gray-100 text-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold">Starter</span>
            <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">$0<span className="text-lg text-gray-400 font-normal">/mo</span></h3>
            <p className="text-sm text-gray-500 h-10">Perfect for exploring Archion&apos;s AI capabilities.</p>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> 3 projects per month
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> Basic 2D to 3D Generation
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> Standard rendering resolution
            </li>
          </ul>
          <button className="w-full bg-gray-100 text-black py-4 rounded-full text-xs font-bold uppercase tracking-wider group-hover:bg-gray-200 transition-colors">
            Start Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#161616] text-white rounded-[2rem] p-8 lg:p-10 shadow-2xl flex flex-col pricing-elem relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 lg:scale-105 z-10 border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-center">
              <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm">Professional</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold flex items-center">
                <StarFour weight="fill" className="text-white mr-1" /> Popular
              </span>
            </div>
            <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">$49<span className="text-lg text-gray-400 font-normal">/mo</span></h3>
            <p className="text-sm text-gray-400 h-10">Full power for independent architects & small teams.</p>
          </div>
          <ul className="space-y-4 mb-10 flex-1 relative z-10">
            <li className="flex items-start gap-3 text-sm font-medium text-white/90">
              <CheckCircle weight="fill" className="text-lg text-white shrink-0" /> Unlimited projects & generations
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-white/90">
              <CheckCircle weight="fill" className="text-lg text-white shrink-0" /> Full Archion Sim AI Agents
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-white/90">
              <CheckCircle weight="fill" className="text-lg text-white shrink-0" /> 4K Export & DWG/RVT Integrations
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-white/90">
              <CheckCircle weight="fill" className="text-lg text-white shrink-0" /> Viewer sharing with clients
            </li>
          </ul>
          <button className="w-full bg-white text-black py-4 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Upgrade to Pro
          </button>
        </div>

        {/* Studio Plan */}
        <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col pricing-elem group hover:-translate-y-2 transition-transform duration-500 md:col-span-2 lg:col-span-1">
          <div className="mb-8">
            <span className="bg-gray-100 text-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold">Studio</span>
            <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">$199<span className="text-lg text-gray-400 font-normal">/mo</span></h3>
            <p className="text-sm text-gray-500 h-10">Enterprise-grade security and team collaboration.</p>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> Everything in Pro
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> 5 Team Seats included
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> Real-time collaborative editing
            </li>
            <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
              <CheckCircle weight="fill" className="text-lg text-black shrink-0" /> API Access & Custom Integrations
            </li>
          </ul>
          <button className="w-full bg-black text-white py-4 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
