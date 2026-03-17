"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight } from "@phosphor-icons/react";

export default function Services() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorBoxRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState({ title: "", desc: "" });

  useEffect(() => {
    let cursorX = 0, cursorY = 0;
    let mouseX = 0, mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);

    const tick = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      gsap.set(cursorBoxRef.current, { x: cursorX + 20, y: cursorY + 20 });
    };
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent, title: string, desc: string) => {
    setHoveredData({ title, desc });
    if (gsap.getProperty(cursorBoxRef.current, "opacity") === 0) {
      gsap.set(cursorBoxRef.current, { x: e.clientX + 20, y: e.clientY + 20 });
    }

    gsap.to(cursorBoxRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
    gsap.to(".service-item", { opacity: 0.3, duration: 0.3, overwrite: "auto" });
    gsap.to(e.currentTarget, { opacity: 1, duration: 0.3, overwrite: "auto" });
  };

  const handleMouseLeave = () => {
    gsap.to(cursorBoxRef.current, { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in", overwrite: "auto" });
    gsap.to(".service-item", { opacity: 1, duration: 0.3, overwrite: "auto" });
  };

  const handleContainerLeave = () => {
    gsap.to(cursorBoxRef.current, { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in", overwrite: "auto" });
    gsap.to(".service-item", { opacity: 1, duration: 0.3, overwrite: "auto" });
  };

  return (
    <section
      ref={containerRef}
      onMouseLeave={handleContainerLeave}
      className="bg-[#161616] text-white py-24 md:py-32 rounded-[2rem] md:rounded-[3rem] mx-4 md:mx-6 mb-20 relative overflow-hidden px-6 md:px-12 lg:px-16"
      id="services-section"
    >
      <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mb-12 md:mb-16 font-semibold">Our Intelligent Product Suite</h4>

      <div className="flex flex-wrap gap-x-4 gap-y-4 md:gap-y-6 text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-medium leading-tight tracking-tight">
        <span
          className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
          onMouseEnter={(e) => handleMouseEnter(e, "Archion Build", "Archion Build can create 2d floor plans and instantly transforms your 2D floor plans into accurate 3D models. It removes the need for slow manual modeling and gives you a ready to edit structure.")}
          onMouseLeave={handleMouseLeave}
        >
          ARCHION BUILD <sup className="text-xs md:text-sm tracking-normal">01</sup>
        </span>
        <span className="text-gray-700 font-light hidden sm:inline">/</span>

        <span
          className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
          onMouseEnter={(e) => handleMouseEnter(e, "Archion Sim", "Archion Sim uses AI-driven agents to show how people move inside your building. It highlights congestion, accessibility issues, and overall flow quality using heatmaps.")}
          onMouseLeave={handleMouseLeave}
        >
          ARCHION SIM <sup className="text-xs md:text-sm tracking-normal">02</sup>
        </span>
        <span className="text-gray-700 font-light hidden sm:inline">/</span>

        <span
          className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
          onMouseEnter={(e) => handleMouseEnter(e, "Archion Viewer & Share", "Archion View allows anyone to explore 3D designs directly in the browser with smooth controls. Users can rotate, zoom, cut sections, and review details without installing software and lets you share your 3D models safely with flexible permission settings.")}
          onMouseLeave={handleMouseLeave}
        >
          ARCHION VIEWER & SHARE <sup className="text-xs md:text-sm tracking-normal">03</sup>
        </span>
      </div>
      <div className="mt-16 md:mt-20 flex justify-end">
        <a href="#pricing-section" className="text-[10px] md:text-xs uppercase tracking-widest text-[#E8E8E8] hover:text-white border-b border-[#E8E8E8]/30 pb-1 transition-colors font-semibold flex items-center">
          Explore our tools <ArrowUpRight className="inline-block ml-1" />
        </a>
      </div>

      <div
        ref={cursorBoxRef}
        id="cursor-info-box"
        className="fixed top-0 left-0 w-[280px] md:w-[380px] bg-white text-black p-5 md:p-6 rounded-2xl shadow-2xl pointer-events-none z-[100] opacity-0 scale-90 origin-top-left will-change-transform hidden lg:flex flex-col gap-2 border border-gray-100"
      >
        <h4 className="text-base md:text-lg font-bold tracking-tight">{hoveredData.title}</h4>
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{hoveredData.desc}</p>
      </div>
    </section>
  );
}
