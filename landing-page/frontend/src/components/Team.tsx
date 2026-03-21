"use client";
import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const teamMembers = [
  {
    name: "Oshadha Vimukthi",
    role: "Architecting the system and crafting the user experience that powers the platform.",
    image: "/Assets/profilepics/oshadha.jpg",
    linkedin: "https://www.linkedin.com/in/oshadhavimukthi/",
    github: "https://github.com/OshadhaVimuB",
  },
  {
    name: "Visula Siriwardana",
    role: "Building end-to-end product experiences from backend logic to intuitive interfaces.",
    image: "/Assets/profilepics/visula.jpeg",
    linkedin: "https://www.linkedin.com/in/visula-siriwardhana-b206631aa/",
    github: "https://github.com/ViuslaS16",
  },
  {
    name: "Chamath Anupama",
    role: "Turning complex ideas into scalable full-stack solutions and seamless UX.",
    image: "/Assets/profilepics/chamath.jpeg",
    linkedin: "https://www.linkedin.com/in/chamath-anupama-422967386/",
    github: "https://github.com/chamath6136",
  },
  {
    name: "Sadewni Mendis",
    role: "Developing the core full-stack features that bring the product to life.",
    image: "/Assets/profilepics/sadewni.jpeg",
    linkedin: "https://www.linkedin.com/in/sadewni-mendis-441277335/",
    github: "https://github.com/sadewni2023",
  },
  {
    name: "Danuka Dulanjana",
    role: "Engineering reliable systems that keep the platform fast and scalable.",
    image: "/Assets/profilepics/danuka.jpeg",
    linkedin: "https://www.linkedin.com/in/danuka-dulanjan-0b972832b/",
    github: "https://github.com/Danukad",
  },
  {
    name: "Sachiro Hithosha",
    role: "Building and integrating full-stack solutions that drive the product forward.",
    image: "/Assets/profilepics/sachiro.jpeg",
    linkedin: "https://www.linkedin.com/in/sachiro-hithosha-76a742332/",
    github: "https://github.com/sachiro24",
  },
];

export default function Team() {
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(".team-elem", {
      scrollTrigger: {
        trigger: "#team-section",
        start: "top 80%",
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, []);

  return (
    <section className="py-24 md:py-32 px-6 md:px-10 lg:px-20 max-w-[1400px] mx-auto border-t border-gray-200/60" id="team-section">
      <div className="mb-12 md:mb-20 team-elem">
        <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">The Core Team</h4>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-black mb-4 md:mb-6">
          Minds behind ArchionLabs.
        </h2>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed">
          A collective of developers, designers, and visionaries building the next generation of architectural intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {teamMembers.map((member, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">{member.name}</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">{member.role}</p>
            <div className="flex gap-3 mt-auto">
              <a href={member.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href={member.github} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
