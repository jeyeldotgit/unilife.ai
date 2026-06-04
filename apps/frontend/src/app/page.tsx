"use client";

import { useEffect, useRef } from "react";

// Component Imports
import { HeaderComponent } from "@/components/landing/HeaderComponent";
import { HeroComponent } from "@/components/landing/HeroComponent";
import { FeaturesComponent } from "@/components/landing/FeaturesComponent";
import { SocialProofComponent } from "@/components/landing/SocialProofComponent";
import { CTAComponent } from "@/components/landing/CtaComponent";
import { FooterComponent } from "@/components/landing/FooterComponent";

const UniLifeLanding = () => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const blobs = document.querySelectorAll<HTMLElement>(".parallax-blob");
      blobs.forEach((blob, index) => {
        const speed = (index + 1) * 0.05;
        const x = (window.innerWidth - e.pageX * speed) / 100;
        const y = (window.innerHeight - e.pageY * speed) / 100;
        blob.style.transform = `translateX(${x}px) translateY(${y}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-[#3B82F6] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 16px;
          height: 550px;
        }
        @media (max-width: 768px) {
          .bento-grid { height: 400px; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-bounce { animation: bounce 1s infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="parallax-blob animate-pulse absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "rgba(0,88,190,0.05)", filter: "blur(60px)" }}
        />
        <div
          className="parallax-blob absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: "rgba(16,185,129,0.05)", filter: "blur(60px)" }}
        />
      </div>

      {/* Header */}
      <HeaderComponent />
      <main className="relative overflow-hidden">
        {/* Hero Section */}

        <HeroComponent />

        {/* Features Section */}
        <FeaturesComponent />

        {/* Social Proof */}
        <SocialProofComponent />

        {/* CTA Section */}
        <CTAComponent />
      </main>

      {/* Footer */}
      <FooterComponent />
    </div>
  );
};

export default UniLifeLanding;
