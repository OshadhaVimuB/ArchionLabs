'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
)

export default function HomePage() {
  const portfolioTrackRef = useRef<HTMLDivElement>(null)
  const cursorBoxRef = useRef<HTMLDivElement>(null)
  const cursorTitleRef = useRef<HTMLHeadingElement>(null)
  const cursorDescRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    let lenisInstance: import('lenis').default | null = null

    const init = async () => {
      const Lenis = (await import('lenis')).default

      // 1. Initialize Lenis
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // @ts-ignore
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      })
      lenisInstance = lenis

      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time: number) => { lenis.raf(time * 1000) })
      gsap.ticker.lagSmoothing(0)

      // Anchor link smooth scrolling
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault()
          const href = (this as HTMLAnchorElement).getAttribute('href')
          if (href) lenis.scrollTo(href)
        })
      })

      // 2. Set initial states & build hero timeline
      const heroTl = gsap.timeline({ paused: true })

      gsap.set('.nav-item', { y: -20, opacity: 0 })
      gsap.set('.hero-title', { y: 40, opacity: 0 })
      gsap.set('.stat-card', { y: 60, opacity: 0 })
      gsap.set('.hero-img', { scale: 1.15 })

      heroTl
        .to('.hero-img', { scale: 1, duration: 2, ease: 'power3.out' })
        .to('.nav-item', { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=1.5')
        .to('.hero-title', { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'power3.out' }, '-=1.2')
        .to('.stat-card', { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=1')

      // Splash screen logic
      const runSplash = () => {
        const splashTl = gsap.timeline({
          onComplete: () => {
            const splash = document.getElementById('splash-screen')
            if (splash) splash.remove()
            document.body.classList.remove('overflow-hidden')
          },
        })

        splashTl
          .to('#splash-logo', { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' })
          .to('#splash-logo', { duration: 0.4 })
          .to('#splash-screen', {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onStart: () => heroTl.play(),
          })
      }

      if (document.readyState === 'complete') {
        runSplash()
      } else {
        window.addEventListener('load', runSplash, { once: true })
      }

      // 3. About section scroll animations
      gsap.utils.toArray<HTMLElement>('.about-elem').forEach((elem) => {
        gsap.from(elem, {
          scrollTrigger: { trigger: elem, start: 'top 85%' },
          y: 50,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        })
      })

      // 4. Service hover info box
      const cursorBox = cursorBoxRef.current
      const cursorTitle = cursorTitleRef.current
      const cursorDesc = cursorDescRef.current
      const serviceItems = document.querySelectorAll('.service-item')
      const servicesSection = document.getElementById('services-section')

      let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX
        mouseY = e.clientY
      })

      gsap.ticker.add(() => {
        cursorX += (mouseX - cursorX) * 0.15
        cursorY += (mouseY - cursorY) * 0.15
        if (cursorBox) gsap.set(cursorBox, { x: cursorX + 20, y: cursorY + 20 })
      })

      serviceItems.forEach((item) => {
        item.addEventListener('mouseenter', (e: Event) => {
          const me = e as MouseEvent
          if (cursorTitle) cursorTitle.textContent = item.getAttribute('data-title')
          if (cursorDesc) cursorDesc.textContent = item.getAttribute('data-desc')

          if (cursorBox && gsap.getProperty(cursorBox, 'opacity') === 0) {
            cursorX = me.clientX
            cursorY = me.clientY
            gsap.set(cursorBox, { x: cursorX + 20, y: cursorY + 20 })
          }

          gsap.to(cursorBox, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
          gsap.to(serviceItems, { opacity: 0.3, duration: 0.3, overwrite: 'auto' })
          gsap.to(item, { opacity: 1, duration: 0.3, overwrite: 'auto' })
        })

        item.addEventListener('mouseleave', () => {
          gsap.to(cursorBox, { opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in', overwrite: 'auto' })
          gsap.to(serviceItems, { opacity: 1, duration: 0.3, overwrite: 'auto' })
        })
      })

      if (servicesSection) {
        servicesSection.addEventListener('mouseleave', () => {
          gsap.to(cursorBox, { opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in', overwrite: 'auto' })
          gsap.to(serviceItems, { opacity: 1, duration: 0.3, overwrite: 'auto' })
        })
      }

      // 5. Horizontal scroll portfolio
      const portfolioTrack = portfolioTrackRef.current
      if (portfolioTrack) {
        const getScrollAmount = () => {
          const trackWidth = portfolioTrack.scrollWidth
          return -(trackWidth - window.innerWidth + 64)
        }

        const tween = gsap.to(portfolioTrack, { x: getScrollAmount, ease: 'none' })
        ScrollTrigger.create({
          trigger: '#portfolio-section',
          start: 'top top',
          end: () => `+=${getScrollAmount() * -1}`,
          pin: true,
          animation: tween,
          scrub: 1,
          invalidateOnRefresh: true,
        })
      }

      // 6. Pricing section animations
      gsap.from('.pricing-elem', {
        scrollTrigger: { trigger: '#pricing-section', start: 'top 75%' },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      })

      // 7. Team section animations
      gsap.from('.team-elem', {
        scrollTrigger: { trigger: '#team-section', start: 'top 80%' },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      })

      // 8. Footer animations
      gsap.from('.footer-elem', {
        scrollTrigger: { trigger: '.footer-container', start: 'top 80%' },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      })
    }

    init()

    return () => {
      if (lenisInstance) lenisInstance.destroy()
      ScrollTrigger.killAll()
    }
  }, [])

  return (
    <>
      {/* Splash Screen */}
      <div
        id="splash-screen"
        className="fixed inset-0 z-[100] bg-[#111111] flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Assets/Logo.svg"
          alt="ArchionLabs Logo"
          className="h-16 md:h-20 w-auto opacity-0 scale-90"
          id="splash-logo"
        />
      </div>

      {/* Hero Section */}
      <section className="relative w-full p-3 md:p-5">
        <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] md:h-[95vh] min-h-[550px] md:min-h-[700px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
            alt="ArchionLabs AI-Powered Modern Architecture 3D rendering"
            className="hero-img absolute inset-0 w-full h-full object-cover object-center brightness-[0.4] z-0"
          />

          {/* Navigation */}
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

          {/* Hero Content */}
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
                Get a demo <i className="ph ph-arrow-right text-lg group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Floating Cards */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-10 lg:px-20 -mt-16 sm:-mt-24 md:-mt-40 lg:-mt-52">
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
          <div className="stat-card bg-white rounded-[2rem] p-5 lg:p-8 flex-1 flex justify-between items-end shadow-2xl min-h-[140px] md:min-h-[160px]">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 text-black tracking-tight">1-Click</h3>
              <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">2D to 3D Generation</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-200 flex items-center justify-center bg-transparent shrink-0">
              <i className="ph ph-magic-wand text-lg lg:text-xl text-black"></i>
            </div>
          </div>

          <div className="stat-card bg-white rounded-[2rem] p-5 lg:p-8 flex-1 flex justify-between items-end shadow-2xl min-h-[140px] md:min-h-[160px]">
            <div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 text-black tracking-tight">AI Driven</h3>
              <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Movement Simulations</p>
            </div>
            <div className="w-16 h-8 lg:w-20 lg:h-10 bg-gray-100 rounded-full overflow-hidden shrink-0 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=2069&auto=format&fit=crop"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="stat-card bg-[#111111] text-white rounded-[2rem] p-5 lg:p-8 flex-1 flex flex-col justify-end shadow-2xl relative overflow-hidden group min-h-[140px] md:min-h-[160px]">
            <div className="relative z-10 flex justify-between items-end w-full">
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 tracking-tight">Real-time</h3>
                <p className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-widest font-bold">Browser Collaboration</p>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute top-2 -right-4 w-16 h-16 border border-white/10 rounded-full group-hover:scale-110 transition-transform duration-700 delay-100"></div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about-section" className="pt-40 md:pt-48 lg:pt-40 pb-32 px-6 md:px-10 lg:px-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Text Block */}
          <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-black/10 about-elem">
            <p className="text-base text-gray-500 font-medium leading-relaxed tracking-tight lg:pr-8">
              Built for architects. Powered by AI. We turn complex manual modeling into a single, intelligent workflow.
            </p>
          </div>

          {/* Tall Image Block */}
          <div className="md:col-span-1 lg:col-span-5 about-elem">
            <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3] sm:aspect-video md:aspect-[3/4] lg:aspect-[4/5] shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop"
                alt="ArchionLabs Intelligent 3D Architecture Workflow"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Workflow Content Block */}
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
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                  alt="ArchionLabs 3D Model View"
                  className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white text-[10px] md:text-xs flex items-center gap-2 font-medium shadow-xl">
                    <i className="ph ph-cube text-base md:text-lg"></i> View 3D
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden aspect-square shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:scale-105 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services / What We Do Section */}
      <section
        className="bg-dark text-white py-24 md:py-32 rounded-[2rem] md:rounded-[3rem] mx-4 md:mx-6 mb-20 relative overflow-hidden px-6 md:px-12 lg:px-16"
        id="services-section"
      >
        <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mb-12 md:mb-16 font-semibold">
          Our Intelligent Product Suite
        </h4>

        <div className="flex flex-wrap gap-x-4 gap-y-4 md:gap-y-6 text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-medium leading-tight tracking-tight">
          <span
            className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
            data-title="Archion Build"
            data-desc="Archion Build can create 2d floor plans and instantly transforms your 2D floor plans into accurate 3D models. It removes the need for slow manual modeling and gives you a ready to edit structure."
          >
            ARCHION BUILD <sup className="text-xs md:text-sm tracking-normal">01</sup>
          </span>
          <span className="text-gray-700 font-light hidden sm:inline">/</span>

          <span
            className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
            data-title="Archion Sim"
            data-desc="Archion Sim uses AI-driven agents to show how people move inside your building. It highlights congestion, accessibility issues, and overall flow quality using heatmaps."
          >
            ARCHION SIM <sup className="text-xs md:text-sm tracking-normal">02</sup>
          </span>
          <span className="text-gray-700 font-light hidden sm:inline">/</span>

          <span
            className="service-item cursor-pointer text-gray-500 hover:text-white transition-colors duration-300"
            data-title="Archion Viewer & Share"
            data-desc="Archion View allows anyone to explore 3D designs directly in the browser with smooth controls. Users can rotate, zoom, cut sections, and review details without installing software and lets you share your 3D models safely with flexible permission settings."
          >
            ARCHION VIEWER &amp; SHARE <sup className="text-xs md:text-sm tracking-normal">03</sup>
          </span>
        </div>

        <div className="mt-16 md:mt-20 flex justify-end">
          <a
            href="#pricing-section"
            className="text-[10px] md:text-xs uppercase tracking-widest text-brandGray hover:text-white border-b border-brandGray/30 pb-1 transition-colors font-semibold"
          >
            Explore our tools <i className="ph ph-arrow-up-right inline-block ml-1"></i>
          </a>
        </div>

        {/* Cursor Info Box */}
        <div
          ref={cursorBoxRef}
          className="fixed top-0 left-0 w-[280px] md:w-[380px] bg-white text-black p-5 md:p-6 rounded-2xl shadow-2xl pointer-events-none z-[100] opacity-0 scale-90 origin-top-left will-change-transform hidden lg:flex flex-col gap-2 border border-gray-100"
        >
          <h4 ref={cursorTitleRef} className="text-base md:text-lg font-bold tracking-tight"></h4>
          <p ref={cursorDescRef} className="text-xs md:text-sm text-gray-500 leading-relaxed"></p>
        </div>
      </section>

      {/* Horizontal Scroll Portfolio Section */}
      <section id="portfolio-section" className="h-screen w-full relative overflow-hidden flex items-center bg-light">
        <div
          ref={portfolioTrackRef}
          id="portfolio-track"
          className="flex gap-4 md:gap-6 px-4 md:px-8 h-[70vh] items-stretch w-[max-content]"
        >
          {/* Archion Build Card */}
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
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
              alt=""
              className="absolute bottom-0 right-0 w-[85%] h-[55%] md:w-[65%] md:h-[70%] object-cover rounded-tl-[2rem] md:rounded-tl-[3rem] grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 z-0"
            />
            <button className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform">
              <i className="ph ph-arrow-right text-lg md:text-xl"></i>
            </button>
          </div>

          {/* Archion Sim Card */}
          <div className="w-[85vw] md:w-[65vw] lg:w-[45vw] bg-[#D4D4D4] rounded-[2rem] overflow-hidden shrink-0 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1000&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white z-20">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 md:mb-3">Archion Sim</h3>
              <p className="text-sm md:text-base text-white/90 max-w-[95%] md:max-w-sm mb-4 md:mb-6 leading-relaxed">
                Simulate movement with AI agents. Identify congestion and flow quality instantly via interactive heatmaps.
              </p>
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
              <i className="ph ph-play-circle text-xl md:text-2xl"></i>
            </button>
          </div>

          {/* Viewer & Share Card */}
          <div className="w-[85vw] md:w-[65vw] lg:w-[45vw] bg-dark text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden group">
            <div className="z-20 relative">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 md:mb-3">Viewer &amp; Share</h3>
              <p className="text-sm md:text-base text-gray-400 max-w-[85%] md:max-w-sm mt-2 md:mt-4 leading-relaxed">
                Explore designs directly in your browser. Share securely with clients using flexible access controls.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.cadnav.com/allimg/160322/cadnav-160322221013.jpg"
              alt=""
              className="absolute bottom-0 right-0 w-[80%] h-[55%] md:w-[70%] md:h-[70%] object-cover rounded-tl-[2rem] opacity-50 group-hover:opacity-80 transition-all duration-700 z-0"
            />
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex flex-col sm:flex-row gap-2 z-20 font-medium">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-1 rounded-full text-[9px] md:text-[10px] uppercase border border-white/10 inline-block w-fit whitespace-nowrap">
                No Installation Required
              </span>
              <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 md:py-1 rounded-full text-[9px] md:text-[10px] uppercase border border-white/10 inline-block w-fit whitespace-nowrap">
                Secure Access Control
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
              <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">
                $0<span className="text-lg text-gray-400 font-normal">/mo</span>
              </h3>
              <p className="text-sm text-gray-500 h-10">Perfect for exploring Archion&apos;s AI capabilities.</p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                3 projects per month
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                Basic 2D to 3D Generation
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                Standard rendering resolution
              </li>
            </ul>
            <button className="w-full bg-gray-100 text-black py-4 rounded-full text-xs font-bold uppercase tracking-wider group-hover:bg-gray-200 transition-colors">
              Start Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-dark text-white rounded-[2rem] p-8 lg:p-10 shadow-2xl flex flex-col pricing-elem relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 lg:scale-105 z-10 border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="mb-8 relative z-10">
              <div className="flex justify-between items-center">
                <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm">Professional</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold flex items-center">
                  <i className="ph ph-star-four text-white mr-1"></i> Popular
                </span>
              </div>
              <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">
                $49<span className="text-lg text-gray-400 font-normal">/mo</span>
              </h3>
              <p className="text-sm text-gray-400 h-10">Full power for independent architects &amp; small teams.</p>
            </div>
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              <li className="flex items-start gap-3 text-sm font-medium text-white/90">
                <i className="ph ph-check-circle text-lg text-white shrink-0"></i>
                Unlimited projects &amp; generations
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-white/90">
                <i className="ph ph-check-circle text-lg text-white shrink-0"></i>
                Full Archion Sim AI Agents
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-white/90">
                <i className="ph ph-check-circle text-lg text-white shrink-0"></i>
                4K Export &amp; DWG/RVT Integrations
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-white/90">
                <i className="ph ph-check-circle text-lg text-white shrink-0"></i>
                Viewer sharing with clients
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
              <h3 className="text-4xl lg:text-5xl font-medium mt-6 mb-2 tracking-tight">
                $199<span className="text-lg text-gray-400 font-normal">/mo</span>
              </h3>
              <p className="text-sm text-gray-500 h-10">Enterprise-grade security and team collaboration.</p>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                Everything in Pro
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                5 Team Seats included
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                Real-time collaborative editing
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <i className="ph ph-check-circle text-lg text-black shrink-0"></i>
                API Access &amp; Custom Integrations
              </li>
            </ul>
            <button className="w-full bg-black text-white py-4 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Team Section */}
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
          {/* Oshadha Vimukthi */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/oshadha.jpg" alt="Oshadha Vimukthi" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Oshadha Vimukthi</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Architecting the system and crafting the user experience that powers the platform.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/oshadhavimukthi/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/OshadhaVimuB" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Visula Siriwardana */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/visula.jpeg" alt="Visula Siriwardana" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Visula Siriwardana</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Building end-to-end product experiences from backend logic to intuitive interfaces.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/visula-siriwardhana-b206631aa/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/ViuslaS16" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Chamath Anupama */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/chamath.jpeg" alt="Chamath Anupama" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Chamath Anupama</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Turning complex ideas into scalable full-stack solutions and seamless UX.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/chamath-anupama-422967386/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/chamath6136" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Sadewni Mendis */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/sadewni.jpeg" alt="Sadewni Mendis" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Sadewni Mendis</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Developing the core full-stack features that bring the product to life.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/sadewni-mendis-441277335/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/sadewni2023" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Danuka Dulanjana */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/danuka.jpeg" alt="Danuka Dulanjana" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Danuka Dulanjana</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Engineering reliable systems that keep the platform fast and scalable.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/danuka-dulanjan-0b972832b/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/Danukad" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Sachiro Hithosha */}
          <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl border border-gray-100 flex flex-col team-elem group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-6 bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/profilepics/sachiro.jpeg" alt="Sachiro Hithosha" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
            </div>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-2 text-black">Sachiro Hithosha</h3>
            <p className="text-sm text-gray-500 mb-8 flex-1 leading-relaxed">Building and integrating full-stack solutions that drive the product forward.</p>
            <div className="flex gap-3 mt-auto">
              <a href="https://www.linkedin.com/in/sachiro-hithosha-76a742332/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/sachiro24" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-[#181717] hover:text-white hover:border-[#181717] transition-all">
                <GitHubIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-light p-3 md:p-5 pb-3 md:pb-5 pt-10">
        <div className="w-full max-w-[1800px] mx-auto bg-[#111111] text-white rounded-[2.5rem] p-8 md:p-12 lg:px-24 lg:py-20 relative overflow-hidden flex flex-col justify-between min-h-[60vh] footer-container shadow-2xl">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] -mr-[400px] -mt-[400px] pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 relative z-10">
            {/* CTA & Newsletter */}
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
                <label className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-4 block font-semibold">
                  Subscribe to our newsletter
                </label>
                <div className="flex border-b border-white/20 pb-4 max-w-md focus-within:border-white transition-colors group">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-transparent outline-none text-white placeholder-gray-600 text-base md:text-lg"
                  />
                  <button className="text-xs md:text-sm font-bold tracking-wider hover:text-gray-300 transition-colors uppercase group-focus-within:text-white text-gray-500">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Links & Contact */}
            <div className="md:col-span-2 lg:col-span-5 grid grid-cols-2 gap-8 pt-4">
              <div className="flex flex-col gap-4 footer-elem">
                <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">Platform</h4>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Archion Build</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Archion Sim</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Viewer &amp; Share</a>
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

          {/* Bottom Row */}
          <div className="mt-24 md:mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 footer-elem">
            <div className="text-gray-500 text-sm text-center md:text-left">
              &copy; 2026 ArchionLabs. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="https://www.linkedin.com/company/achionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <i className="ph ph-linkedin-logo text-xl"></i>
              </a>
              <a href="https://www.instagram.com/archionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <i className="ph ph-instagram-logo text-xl"></i>
              </a>
              <a href="https://www.tiktok.com/@archionlabs" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <i className="ph ph-tiktok-logo text-xl"></i>
              </a>
              <a href="https://www.facebook.com/share/1DDZBdRe7q/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <i className="ph ph-facebook-logo text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
