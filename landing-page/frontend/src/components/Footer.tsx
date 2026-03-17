"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LinkedinLogo, InstagramLogo, TiktokLogo, FacebookLogo } from "@phosphor-icons/react";

export default function Footer() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".footer-elem", {
      scrollTrigger: {
        trigger: ".footer-container",
        start: "top 80%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
    });
  }, []);

  return (
    <footer className="bg-[#F5F5F5] p-3 md:p-5 pb-3 md:pb-5 pt-10">
      <div className="w-full max-w-[1800px] mx-auto bg-[#111111] text-white rounded-[2.5rem] p-8 md:p-12 lg:px-24 lg:py-20 relative overflow-hidden flex flex-col justify-between min-h-[60vh] footer-container shadow-2xl">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] -mr-[400px] -mt-[400px] pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 relative z-10">
          <div className="md:col-span-2 lg:col-span-7 flex flex-col justify-between">
            <div className="footer-elem">
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] font-medium leading-[1.05] tracking-tighter mb-6">
                Ready to build<br />the future?
              </h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-md font-light">
                Join the leading architects using AI to redefine spatial design.
              </p>
            </div>

            <div className="mt-16 md:mt-24 footer-elem">
              <label className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-4 block font-semibold">Subscribe to our newsletter</label>
              <div className="flex border-b border-white/20 pb-4 max-w-md focus-within:border-white transition-colors group">
                <input type="email" placeholder="Email address" className="w-full bg-transparent outline-none text-white placeholder-gray-600 text-base md:text-lg" />
                <button className="text-xs md:text-sm font-bold tracking-wider hover:text-gray-300 transition-colors uppercase group-focus-within:text-white text-gray-500">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-5 grid grid-cols-2 gap-8 pt-4">
            <div className="flex flex-col gap-4 footer-elem">
              <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Platform</h4>
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Archion Build</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Archion Sim</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Viewer & Share</a>
              <a href="#pricing-section" className="text-gray-300 hover:text-white transition-colors text-sm">Pricing</a>
            </div>
            <div className="flex flex-col gap-4 footer-elem">
              <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Contact</h4>
              <a href="mailto:support@archionlabs.com" className="text-gray-300 hover:text-white transition-colors text-sm">support@archionlabs.com</a>
              <p className="text-gray-300 text-sm">+94 78 671 4988</p>
              <p className="text-gray-300 text-sm leading-relaxed mt-2">IIT, 435 Galle Rd,<br />Colombo 03, Sri Lanka.</p>
            </div>
          </div>
        </div>

        <div className="mt-24 md:mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 footer-elem">
          <div className="text-gray-500 text-sm text-center md:text-left">
            &copy; 2026 ArchionLabs. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.linkedin.com/company/achionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><LinkedinLogo className="text-xl" /></a>
            <a href="https://www.instagram.com/archionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><InstagramLogo className="text-xl" /></a>
            <a href="https://www.tiktok.com/@archionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><TiktokLogo className="text-xl" /></a>
            <a href="https://www.facebook.com/share/1DDZBdRe7q/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><FacebookLogo className="text-xl" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
