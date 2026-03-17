"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowRight } from "@phosphor-icons/react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroTl = gsap.timeline({ paused: true });

    gsap.set(".nav-item", { y: -20, opacity: 0 });
    gsap.set(".hero-title", { y: 40, opacity: 0 });
    gsap.set(".stat-card", { y: 60, opacity: 0 });
    gsap.set(".hero-img", { scale: 1.15 });

    heroTl
      .to(".hero-img", { scale: 1, duration: 2, ease: "power3.out" })
      .to(".nav-item", { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=1.5")
      .to(".hero-title", { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "power3.out" }, "-=1.2")
      .to(".stat-card", { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }, "-=1");

    const onSplashComplete = () => {
      heroTl.play();
    };

    window.addEventListener("splashAnimComplete", onSplashComplete);
    return () => {
      window.removeEventListener("splashAnimComplete", onSplashComplete);
    };
  }, []);

  return (
    <section ref={heroRef} className="relative w-full p-3 md:p-5">
      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] md:h-[95vh] min-h-[550px] md:min-h-[700px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
          alt="ArchionLabs AI-Powered Modern Architecture 3D rendering"
          className="hero-img absolute inset-0 w-full h-full object-cover object-center brightness-[0.4] z-0"
        />

        <nav className="absolute top-0 left-0 w-full z-50 px-6 py-8 md:px-10 lg:px-12 md:py-10 flex justify-between items-center text-white">
          <div className="nav-item cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/Logo.svg" alt="ArchionLabs" className="h-6 md:h-8 w-auto" />
          </div>
          <div className="nav-item hidden md:flex md:space-x-5 lg:space-x-12 text-[9px] lg:text-xs uppercase tracking-widest font-semibold">
            <a href="#services-section" className="hover:opacity-70 transition-opacity whitespace-nowrap">Products</a>
            <a href="#about-section" className="hover:opacity-70 transition-opacity whitespace-nowrap">How it works</a>
            <a href="#pricing-section" className="hover:opacity-70 transition-opacity whitespace-nowrap">Pricing</a>
            <a href="#team-section" className="hover:opacity-70 transition-opacity whitespace-nowrap">Team</a>
          </div>
          <div className="nav-item shrink-0">
            <button className="bg-white/90 backdrop-blur-md text-black px-4 py-2 md:px-5 lg:px-6 md:py-3 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-lg whitespace-nowrap">
              Start Building
            </button>
          </div>
        </nav>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col justify-center h-full px-6 md:px-10 lg:px-20 pt-16 md:pt-20 lg:pt-12 pb-32 md:pb-40 lg:pb-48">
          <div className="max-w-4xl text-white mt-10 md:mt-0">
            <p className="hero-title text-xs md:text-sm lg:text-base opacity-90 mb-4 md:mb-6 leading-relaxed uppercase tracking-widest font-semibold text-gray-300">
              AI-Powered Architecture
            </p>
            <h1 className="hero-title text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[5.75rem] leading-[1.1] md:leading-[1.05] font-medium tracking-tighter mb-5 md:mb-6">
              Where Architecture<br />Meets Intelligence
            </h1>
            <p className="hero-title text-sm sm:text-base md:text-xl opacity-80 mb-8 md:mb-10 max-w-xl font-light leading-relaxed">
              Transform static floor plans into intelligent 3D spaces in seconds. Built specifically for boundary-pushing architects.
            </p>
            <button className="hero-title bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-full text-xs md:text-sm font-bold hover:scale-105 transition-transform duration-300 flex items-center gap-2 w-max shadow-[0_0_40px_rgba(255,255,255,0.25)] group">
              Get a demo <ArrowRight weight="bold" className="text-lg group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
