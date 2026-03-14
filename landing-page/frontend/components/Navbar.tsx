"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`navbar${menuOpen ? " active" : ""}${scrolled ? " scrolled" : ""}`} id="navbar" role="navigation">
            <div className="container nav-container">
                <a href="/" className="logo" aria-label="ArchionLabs Home">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/Assets/icon svg 2 1.svg"
                        alt="ArchionLabs Logo"
                        className="logo-img"
                        width={120}
                        height={40}
                        style={{ filter: "invert(1)" }}
                    />
                </a>

                <button
                    className="mobile-toggle"
                    id="mobile-menu-btn"
                    aria-label="Toggle mobile menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <i className={menuOpen ? "fas fa-times" : "fas fa-bars"} />
                </button>

                <ul className="nav-links">
                    <li>
                        <a href="#products">
                            Products{" "}
                            <i
                                className="fas fa-chevron-down"
                                style={{ fontSize: "0.7em", marginLeft: 4 }}
                            />
                        </a>
                    </li>
                    <li>
                        <a href="#how-it-works">How it works</a>
                    </li>
                    <li>
                        <a href="#pricing">Pricing</a>
                    </li>
                    <li>
                        <a href="#team">Team</a>
                    </li>
                </ul>

                <div className="nav-actions">
                    <a href="#" className="btn btn-outline btn-sm">
                        Login
                    </a>
                    <a href="#" className="btn btn-primary btn-sm">
                        Sign up
                    </a>
                </div>
            </div>
        </nav>
    );
}
