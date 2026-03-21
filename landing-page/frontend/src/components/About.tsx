"use client";
import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Cube } from "@phosphor-icons/react";

export default function About() {
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gsap.utils.toArray('.about-elem').forEach((elem: any) => {
      gsap.from(elem, {
        scrollTrigger: { trigger: elem, start: "top 85%" },
        y: 50, opacity: 0, duration: 1, ease: "power3.out"
      });
    });
  }, []);

  return (
    <section id="about-section" className="pt-40 md:pt-48 lg:pt-40 pb-32 px-6 md:px-10 lg:px-20 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* 1. Text Block */}
        <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-black/10 about-elem">
          <p className="text-base text-gray-500 font-medium leading-relaxed tracking-tight lg:pr-8">
            Built for architects. Powered by AI. We turn complex manual modeling into a single, intelligent workflow.
          </p>
        </div>

        {/* 2. Tall Image Block */}
        <div className="md:col-span-1 lg:col-span-5 about-elem">
          <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3] sm:aspect-video md:aspect-[3/4] lg:aspect-[4/5] shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop" alt="ArchionLabs Intelligent 3D Architecture Workflow" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        {/* 3. Workflow Content Block */}
        <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-8 md:gap-10 about-elem h-full">
          <div className="pt-2">
            <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 md:mb-6 font-bold">The Workflow</h4>
            <p className="text-2xl sm:text-3xl lg:text-5xl font-medium leading-[1.15] tracking-tighter text-black">
              From 2D plans to instant 3D models and real-time movement simulation—all in one upload.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto">
            <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden aspect-square relative group cursor-pointer shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" alt="ArchionLabs 3D Model View" className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white text-[10px] md:text-xs flex items-center gap-2 font-medium shadow-xl">
                  <Cube weight="bold" className="text-base md:text-lg" /> View 3D
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden aspect-square shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Grayscale view" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:scale-105 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
