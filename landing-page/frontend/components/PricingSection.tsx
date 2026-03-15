"use client";

import { useState } from "react";

const MONTHLY_PRICES = ["$0.00", "$20.00", "$25.00"];
const YEARLY_PRICES = ["$0.00", "$18.00", "$22.00"];

export default function PricingSection() {
    const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
    const prices = plan === "yearly" ? YEARLY_PRICES : MONTHLY_PRICES;

    return (
        <section
            className="pricing-section"
            id="pricing"
            aria-labelledby="pricing-heading"
        >
            <div className="container">
                <div className="slide-left mb-8">
                    <h2 id="pricing-heading">Simple and Affordable Pricing Plans</h2>
                    <p className="subtitle mt-4" style={{ marginLeft: 0 }}>
                        Designed for architects, studios, and teams of all sizes.
                    </p>

                    <div className="toggle-container" role="tablist">
                        <div className="toggle-switch">
                            <button
                                className={`toggle-btn${plan === "monthly" ? " active" : ""}`}
                                onClick={() => setPlan("monthly")}
                                role="tab"
                                aria-selected={plan === "monthly"}
                            >
                                Monthly
                            </button>
                            <button
                                className={`toggle-btn${plan === "yearly" ? " active" : ""}`}
                                onClick={() => setPlan("yearly")}
                                role="tab"
                                aria-selected={plan === "yearly"}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pricing-cards" id="pricing-cards">
                    <article className="price-card scale-in">
                        <h3 className="price-title">Free</h3>
                        <span className="price-sub">
                            Great for students and personal use
                        </span>
                        <div className="price-amount">
                            {prices[0]}
                            <span>/month</span>
                        </div>
                        <ul className="feature-list">
                            <li>
                                <i className="fas fa-check-circle" /> Upload 2D floor plans
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Limited Auto 3D generation
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Access to Archion View
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> 2GB Storage for Files
                            </li>
                        </ul>
                        <a href="#" className="btn btn-outline btn-full mt-4">
                            Get Started
                        </a>
                    </article>

                    <article
                        className="price-card pro scale-in"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        <h3 className="price-title">Pro Plan</h3>
                        <span className="price-sub">
                            Great for Freelancers &amp; Professional use
                        </span>
                        <div className="price-amount">
                            {prices[1]}
                            <span>/month</span>
                        </div>
                        <ul className="feature-list">
                            <li>
                                <i className="fas fa-check-circle" /> High-precision 3D
                                generation
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Full Archion Sim features
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Advanced sharing controls
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> 100GB Storage for Files
                            </li>
                        </ul>
                        <a href="#" className="btn btn-primary btn-full mt-4">
                            Continue with Pro
                        </a>
                    </article>

                    <article
                        className="price-card scale-in"
                        style={{ transitionDelay: "0.2s" }}
                    >
                        <h3 className="price-title">Enterprise Plan</h3>
                        <span className="price-sub">
                            Great for Large scale enterprises
                        </span>
                        <div className="price-amount">
                            {prices[2]}
                            <span>/month</span>
                        </div>
                        <span
                            style={{
                                display: "block",
                                fontSize: "0.75rem",
                                marginTop: -20,
                                marginBottom: 20,
                                color: "#64748b",
                            }}
                        >
                            *per member
                        </span>
                        <ul className="feature-list">
                            <li>
                                <i className="fas fa-check-circle" /> Team workspaces &amp;
                                assets
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Version history &amp;
                                comparisons
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> Priority support
                            </li>
                            <li>
                                <i className="fas fa-check-circle" /> 5TB Shared Storage
                            </li>
                        </ul>
                        <a href="#" className="btn btn-outline btn-full mt-4">
                            Contact team
                        </a>
                    </article>
                </div>
            </div>
        </section>
    );
}
