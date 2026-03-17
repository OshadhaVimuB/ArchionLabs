"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, PlayCircle } from "@phosphor-icons/react";

export default function Portfolio() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (sectionRef.current && trackRef.current) {
      const getScrollAmount = () => {
        const trackWidth = trackRef.current ? trackRef.current.scrollWidth : 0;
        return -(trackWidth - window.innerWidth + 64);
      };

      const tween = gsap.to(trackRef.current, { x: getScrollAmount, ease: "none" });

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${getScrollAmount() * -1}`,
        pin: true,
        animation: tween,
        scrub: 1,
        invalidateOnRefresh: true,
      });

      return () => {
        tween.kill();
        trigger.kill();
      };
    }
  }, []);

  return (
    <section ref={sectionRef} id="portfolio-section" className="h-screen w-full relative overflow-hidden flex items-center bg-[#F5F5F5]">
      <div ref={trackRef} id="portfolio-track" className="flex gap-4 md:gap-6 px-4 md:px-8 h-[70vh] items-stretch w-[max-content]">

        <div className="w-[85vw] md:w-[65vw] lg:w-[45vw] bg-[#EAEAEA] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden group">
          <div className="flex justify-between items-start z-20 relative gap-2 md:gap-4">
            <div className="z-20 relative">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 md:mb-4">Archion Build</h3>
              <div className="space-y-2 text-sm md:text-base text-gray-800 md:text-gray-600 max-w-[90%] md:max-w-sm leading-relaxed bg-white/40 md:bg-transparent p-2 md:p-0 rounded-lg backdrop-blur-sm md:backdrop-blur-none">
                <p>Instantly transform 2D floor plans into accurate, ready-to-edit 3D models. No manual modeling required.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 shrink-0">
              <span className="bg-black/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase border border-black/10 font-medium whitespace-nowrap text-center">2D to 3D</span>
              <span className="bg-black/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase border border-black/10 font-medium whitespace-nowrap text-center">Automated</span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop" alt="Build" className="absolute bottom-0 right-0 w-[85%] h-[55%] md:w-[65%] md:h-[70%] object-cover rounded-tl-[2rem] md:rounded-tl-[3rem] grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 z-0" />
          <button className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform">
             <ArrowRight weight="bold" className="text-lg md:text-xl" />
          </button>
        </div>

        <div className="w-[85vw] md:w-[65vw] lg:w-[45vw] bg-[#D4D4D4] rounded-[2rem] overflow-hidden shrink-0 relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1000&auto=format&fit=crop" alt="Sim" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white z-20">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 md:mb-3">Archion Sim</h3>
            <p className="text-sm md:text-base text-white/90 max-w-[95%] md:max-w-sm mb-4 md:mb-6 leading-relaxed">Simulate movement with AI agents. Identify congestion and flow quality instantly via interactive heatmaps.</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs font-medium">
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-full border border-white/20 flex gap-2 w-fit">
                <span className="text-white/50 uppercase">Feature:</span> Agent Simulation
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-full border border-white/20 flex gap-2 w-fit">
                <span className="text-white/50 uppercase">Analysis:</span> Navigation Flow
              </div>
            </div>
          </div>
          <button className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center z-20 hover:bg-white hover:text-black transition-all">
            <PlayCircle weight="fill" className="text-xl md:text-2xl" />
          </button>
        </div>

        <div className="w-[85vw] md:w-[65vw] lg:w-[45vw] bg-[#161616] text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden group">
          <div className="z-20 relative">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 md:mb-3">Viewer & Share</h3>
            <p className="text-sm md:text-base text-gray-400 max-w-[85%] md:max-w-sm mt-2 md:mt-4 leading-relaxed">Explore designs directly in your browser. Share securely with clients using flexible access controls.</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://img.cadnav.com/allimg/160322/cadnav-160322221013.jpg" alt="Share" className="absolute bottom-0 right-0 w-[80%] h-[55%] md:w-[70%] md:h-[70%] object-cover rounded-tl-[2rem] opacity-50 group-hover:opacity-80 transition-all duration-700 z-0" />
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex flex-col sm:flex-row gap-2 z-20 font-medium">
            <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-1 rounded-full text-[9px] md:text-[10px] uppercase border border-white/10 inline-block w-fit whitespace-nowrap">No Installation Required</span>
            <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-1 rounded-full text-[9px] md:text-[10px] uppercase border border-white/10 inline-block w-fit whitespace-nowrap">Secure Access Control</span>
          </div>
        </div>

      </div>
    </section>
  );
}
