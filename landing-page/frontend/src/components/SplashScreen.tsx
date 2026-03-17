"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SplashScreen() {
  const screenRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const splashTl = gsap.timeline({
      onComplete: () => {
        if (screenRef.current) screenRef.current.style.display = "none";
        document.body.classList.remove("overflow-hidden");
      },
    });

    splashTl
      .to(logoRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" })
      .to(logoRef.current, { duration: 0.4 })
      .to(screenRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onStart: () => {
          window.dispatchEvent(new Event("splashAnimComplete"));
        },
      });
  }, []);

  return (
    <div ref={screenRef} id="splash-screen" className="fixed inset-0 z-[100] bg-[#111111] flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={logoRef} src="/Assets/Logo.svg" alt="ArchionLabs Logo" className="h-16 md:h-20 w-auto opacity-0 scale-90" />
    </div>
  );
}
