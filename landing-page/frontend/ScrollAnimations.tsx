"use client";

import { useEffect } from "react";

export default function ScrollAnimations() {
    useEffect(() => {
        const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, observerOptions);

        document
            .querySelectorAll(".slide-left, .slide-right, .slide-up, .scale-in")
            .forEach((el) => {
                observer.observe(el);
            });

        return () => observer.disconnect();
    }, []);

    return null;
}
