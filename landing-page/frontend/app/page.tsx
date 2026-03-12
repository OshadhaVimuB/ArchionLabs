import Navbar from "./components/Navbar";
import HeroCanvas from "./components/HeroCanvas";
import PricingSection from "./components/PricingSection";
import ScrollAnimations from "./components/ScrollAnimations";

const TEAM_MEMBERS = [
  { name: "Oshadha Vimukthi", role: "System Architect, UX Engineer" },
  { name: "Visula Siriwardana", role: "Full-Stack Developer" },
  { name: "Chamath Anupama", role: "Full-Stack Developer" },
  { name: "Sadewni Mendis", role: "Full-Stack Developer" },
  { name: "Danuka Dulanjana", role: "Full-Stack Developer" },
  { name: "Sachiro Hithosha", role: "Full-Stack Developer" },
];

const TEAM_AVATAR =
  "https://static.vecteezy.com/system/resources/thumbnails/008/442/086/small/illustration-of-human-icon-user-symbol-icon-modern-design-on-blank-background-free-vector.jpg";

const PRODUCTS = [
  {
    name: "Archion Sim",
    icon: "/Assets/Ar Sim icon.svg",
    desc: "Archion Sim uses AI-driven agents to show how people move inside your building. It highlights congestion, accessibility issues, and overall flow quality using heatmaps.",
    delay: undefined,
  },
  {
    name: "Archion Build",
    icon: "/Assets/Ar Build icon.svg",
    desc: "Archion Build instantly transforms your 2D floor plans into accurate 3D models. It removes the need for slow manual modeling and gives you a ready to edit structure.",
    delay: "0.1s",
  },
  {
    name: "Archion View",
    icon: "/Assets/Ar View icon.svg",
    desc: "Archion View allows anyone to explore 3D designs directly in the browser with smooth controls. Users can rotate, zoom, cut sections, and review details.",
    delay: undefined,
  },
  {
    name: "Archion Share",
    icon: "/Assets/Ar Share icon.svg",
    desc: "Archion Share lets you share your 3D models safely with flexible permission settings. You can choose private, view-only, or public access.",
    delay: "0.1s",
  },
];

export default function Home() {
  // Duplicate team members for infinite carousel loop
  const allTeamCards = [...TEAM_MEMBERS, ...TEAM_MEMBERS];

  return (
    <>
      <ScrollAnimations />

      <a
        href="#main-content"
        className="skip-to-main"
        style={{ position: "absolute", left: -9999, zIndex: 999 }}
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        {/* Hero Section */}
        <header className="hero">
          <div className="grid-scene" aria-hidden="true">
            <HeroCanvas />
          </div>
          <div className="grid-overlay" aria-hidden="true" />

          <div className="container hero-content slide-left">
            <div className="beta-badge" role="status">
              <span className="dot" aria-hidden="true" /> Open Beta Coming Soon
            </div>
            <h1>
              Where Architecture
              <br />
              <span className="text-gradient">Meets Intelligence</span>
            </h1>
            <p className="subtitle">
              ArchionLabs empowers boundary-pushing architects by transforming
              static floor plans into intelligent 3D spaces with AI simulations
              and real-time collaboration.
            </p>

            <div className="hero-btns">
              <a href="#" className="btn btn-primary">
                Start building
              </a>
              <a href="#" className="btn btn-outline">
                Get a demo
              </a>
            </div>
          </div>
        </header>

        {/* Intro Section */}
        <section className="intro-section" aria-labelledby="intro-heading">
          <div className="container intro-grid">
            <div className="intro-text slide-left">
              <div className="pill-badge">2D to Simulate Real World</div>
              <h2 id="intro-heading">
                Built for Architects.
                <br />
                <span>Powered by Intelligence.</span>
              </h2>
              <p>
                Not just automation, not just visualization. Archion Labs turns
                complex architectural work into a simple, intelligent workflow.
              </p>

              <div className="icon-row" role="img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Assets/Ar Build icon.svg" alt="Build" width={72} height={72} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Assets/Ar Sim icon.svg" alt="Sim" width={72} height={72} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Assets/Ar View icon.svg" alt="View" width={72} height={72} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Assets/Ar Share icon.svg" alt="Share" width={72} height={72} />
              </div>
            </div>

            <article className="intro-card slide-right">
              <p className="mb-8">
                Archion Labs streamlines the entire architectural workflow from
                turning 2D plans into instant 3D models to simulating real
                movement and sharing designs securely with clients. Our tools
                remove the slow, manual steps so architects can focus on
                designing smarter, faster, and with confidence.
              </p>
              <a href="#" className="btn btn-outline btn-sm">
                Learn more
              </a>
            </article>
          </div>
        </section>

        {/* Products Section */}
        <section
          className="products-section"
          id="products"
          aria-labelledby="products-heading"
        >
          <div className="container">
            <div className="text-center mb-8 slide-up">
              <h2 id="products-heading">Our Intelligent Product Suite</h2>
              <p className="subtitle mt-4">
                Tools designed to streamline every stage of the architectural
                workflow.
              </p>
            </div>

            <div className="products-grid">
              {PRODUCTS.map((product) => (
                <article
                  key={product.name}
                  className="product-card scale-in"
                  style={
                    product.delay
                      ? { transitionDelay: product.delay }
                      : undefined
                  }
                >
                  <div>
                    <header className="prod-header">
                      <h3>{product.name}</h3>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.icon}
                        alt={product.name}
                        className="prod-icon"
                        width={56}
                        height={56}
                      />
                    </header>
                    <p className="prod-desc">{product.desc}</p>
                  </div>
                  <div className="prod-actions">
                    <a href="#" className="btn btn-primary btn-sm">
                      {product.name}
                    </a>
                    <a href="#" className="btn btn-outline btn-sm">
                      Learn More
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow / How It Works Section */}
        <section
          className="workflow-section"
          id="how-it-works"
          aria-labelledby="workflow-heading"
        >
          <div className="container workflow-grid">
            <div className="workflow-visual slide-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Assets/Product-Diagram.svg"
                alt="Workflow diagram"
                className="workflow-diagram floating"
                width={447}
                height={327}
              />
            </div>
            <div className="workflow-text slide-right">
              <div className="pill-badge">
                <i className="fas fa-cube" style={{ marginRight: 8 }} />{" "}
                AI-Defined Architecture
              </div>
              <h2 id="workflow-heading">
                From floor plan to insight
                <br />
                <span>in one upload.</span>
              </h2>
              <p className="mb-8">
                Archion Labs instantly converts your 2D drawings into intelligent
                3D models, runs real-world movement simulations, and prepares
                them for seamless client viewing all automated, all
                architect-first.
              </p>
              <div className="flex gap-4">
                <a href="#" className="btn btn-primary btn-sm">
                  Archion Build
                </a>
                <a href="#" className="btn btn-outline btn-sm">
                  Archion Sim
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Team Section */}
        <section
          className="team-section"
          id="team"
          aria-labelledby="team-heading"
        >
          <div className="container slide-left">
            <div className="mb-8">
              <h2 id="team-heading">Meet the Minds Behind ArchionLabs</h2>
              <p className="subtitle mt-4" style={{ marginLeft: 0 }}>
                Built by a passionate team of developers and architects dedicated
                to redefining spaces.
              </p>
            </div>
          </div>

          {/* Continuous Loop Team Carousel */}
          <div className="team-carousel-wrapper slide-up">
            <div className="team-carousel-track">
              {allTeamCards.map((member, i) => (
                <article key={`${member.name}-${i}`} className="team-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TEAM_AVATAR}
                    alt={member.name}
                    className="team-img"
                    width={120}
                    height={120}
                  />
                  <h3>{member.name}</h3>
                  <span className="team-role">{member.role}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / CTA Section */}
        <section className="footer-cta" aria-labelledby="contact-heading">
          <div className="container">
            <div className="text-center mb-8 slide-up">
              <h2 id="contact-heading">
                Let&apos;s Build Smarter Spaces Together
              </h2>
              <p className="subtitle mt-4">
                Have questions, or want to explore how Archion Labs can fit into
                your workflow?
              </p>
            </div>

            <div className="contact-grid scale-in">
              <address className="contact-info">
                <h3 className="mb-4 text-dark">Get in touch</h3>
                <div className="contact-row">
                  <i className="fas fa-envelope" />
                  <a href="mailto:support@archionlabs.com">
                    support@archionlabs.com
                  </a>
                </div>
                <div className="contact-row">
                  <i className="fas fa-phone" />
                  <a href="tel:+94786714988">+94 78 671 4988</a>
                </div>
                <div className="contact-row">
                  <i className="fas fa-map-marker-alt" />
                  <span>
                    Informatics Institute of Technology
                    <br />
                    435 Galle Rd,
                    <br />
                    Colombo 03, Sri Lanka.
                  </span>
                </div>
              </address>
              <div className="map-box">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1661.149908165949!2d79.8535424625369!3d6.899525391586822!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259005994ae6f%3A0x79d8b73865f8778d!2sIIT%20City%20Campus!5e1!3m2!1sen!2slk!4v1763911484409!5m2!1sen!2slk"
                  width="500"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="map-image"
                  title="Google Maps - IIT City Campus"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo">
        <div className="container">
          <div className="footer-cols">
            <div className="footer-col brand">
              <a href="/" aria-label="ArchionLabs Home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="footer-logo"
                  src="/Assets/icon svg 2 1.svg"
                  alt="ArchionLabs Logo"
                  width={100}
                  height={33}
                  style={{ filter: "invert(1)" }}
                />
              </a>
            </div>

            <nav className="footer-col">
              <h4>Products</h4>
              <a href="#products">Archion Build</a>
              <a href="#products">Archion Sim</a>
              <a href="#products">Archion View</a>
              <a href="#products">Archion Share</a>
            </nav>

            <nav className="footer-col">
              <h4>Company</h4>
              <a href="#team">About Us</a>
              <a href="#contact-heading">Contact Us</a>
              <a href="#how-it-works">How it works</a>
              <a href="/privacy-policy">Privacy &amp; Policy</a>
            </nav>

            <nav className="footer-col">
              <h4>Legal</h4>
              <a href="/terms">Terms of Policy</a>
              <a href="/cookie-policy">Cookie Policy</a>
              <a href="/privacy-policy">Privacy &amp; Policy</a>
              <a href="/security">Security Policy</a>
            </nav>

            <nav className="footer-col">
              <h4>Social</h4>
              <a href="#" className="social-link">
                <i className="fab fa-linkedin" /> LinkedIn
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-instagram" /> Instagram
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-facebook" /> Facebook
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-tiktok" /> TikTok
              </a>
            </nav>
          </div>
          <p className="copyright">
            © 2025 ArchionLabs. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
