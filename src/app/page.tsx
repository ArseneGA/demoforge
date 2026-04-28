import { Nav } from "@/components/landing/Nav"
import { Hero } from "@/components/landing/Hero"
import { AgentsSection } from "@/components/landing/AgentsSection"
import { WorkflowSection } from "@/components/landing/WorkflowSection"
import { StudioSection } from "@/components/landing/StudioSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { CtaSection } from "@/components/landing/CtaSection"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <>
      {/* Ambient orb global */}
      <div
        className="pointer-events-none fixed top-[-150px] right-[-100px] w-[480px] h-[480px] rounded-full -z-10"
        style={{
          filter: "blur(100px)",
          background: "radial-gradient(circle, var(--brand-dim), transparent 70%)",
        }}
      />

      <Nav />
      <main>
        <Hero />
        <AgentsSection />
        <WorkflowSection />
        <StudioSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
