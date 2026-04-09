"use client"

import React from "react";
import HeroGeometric from "@/components/ui/modern-hero-section";
import { VerticalTabs } from "@/components/ui/vertical-tabs";
import PricingComponent from "@/components/ui/adaptive-pricing-section";
import { BackgroundLines } from "@/components/ui/animated-svg-background";
import { ContactCard } from "@/components/ui/contact-card";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

// Reusable Scroll Reveal Wrapper
function ScrollReveal({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// PRICING DATA CONFIG
const pricingTiers = [
  {
    name: "Free",
    subtitle: "MVP STACK",
    description: "Perfect for testing out the fundamental meeting minutes workflow.",
    features: [
      { text: "Unlimited raw transcriptions", included: true },
      { text: "Core Gemini API processing", included: true, hasInfo: true },
      { text: "Copy to Clipboard export", included: true },
      { text: "Speaker Diarization", included: false },
      { text: "Advanced PDF Export", included: false }
    ],
    buttonText: "Start Recording"
  },
  {
    name: "$15",
    subtitle: "PRO",
    price: "$15",
    period: "/month",
    description: "For professionals who require back-to-back deep-dive meetings.",
    badge: { text: "COMING SOON" },
    features: [
      { text: "Everything in Free", included: true },
      { text: "Priority Gemini 1.5 Pro access", included: true, hasInfo: true },
      { text: "Speaker Diarization (Who said what)", included: true },
      { text: "Advanced PDF Export", included: true },
      { text: "Notion & Slack Integrations", included: true }
    ],
    buttonText: "Join Waitlist",
    highlighted: true,
    footerText: "Scaling massively?",
    footerLink: "Ask about annual."
  },
  {
    name: "Enterprise",
    subtitle: "ENTERPRISE", 
    description: "For sprawling organizations needing SSO, custom compliance, and silos.",
    features: [
      { text: "Custom LLM deployments (Azure, Local)", included: true },
      { text: "Automated CRM webhooks", included: true },
      { text: "SSO, OIDC, & SCIM support", included: true },
      { text: "Volume based annual discounts", included: true },
      { text: "SOC 2 & Security SLAs", included: true }
    ],
    buttonText: "Contact Sales"
  }
];

const PricingTitleWrapper = (
  <>
    Transparent <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">Pricing</span>.
  </>
);

export default function SPA() {
  return (
    <main className="w-full flex flex-col selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* 1. HOME SECTION */}
      <section id="home">
        <HeroGeometric />
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section id="how-it-works">
        <VerticalTabs />
      </section>

      {/* 3. PRICING SECTION */}
      <section id="pricing" className="relative">
        <ScrollReveal>
          <BackgroundLines className="min-h-[100dvh] w-full bg-transparent">
            <PricingComponent 
              title={PricingTitleWrapper}
              subtitle="Start generating AI minutes completely free. Upgrade when you need deep integrations."
              tiers={pricingTiers}
              className="bg-transparent relative z-10"
            />
          </BackgroundLines>
        </ScrollReveal>
      </section>

      {/* 4. ABOUT US SECTION */}
      <section id="about" className="w-full min-h-[60vh] flex items-center justify-center py-20 relative border-t border-border/10">
        <ScrollReveal className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 font-bold tracking-widest uppercase text-xs">
            <Building2 className="w-4 h-4" /> About The Project
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Built for deep work.
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
            We were tired of manually writing summaries for intense, one-hour engineering syncs. So we integrated raw browser APIs directly into LLM architectures to create the fastest, cleanest Meeting Minutes pipeline on the web.
          </p>
        </ScrollReveal>
      </section>

      {/* 5. CONTACT US SECTION */}
      <section id="contact" className="w-full min-h-[100dvh] flex items-center justify-center py-24 relative border-t border-border/10">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/[0.03] to-transparent pointer-events-none" />
        <ScrollReveal className="w-full max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <ContactCard
            title="Let's build together."
            description="Have feature requests, bug reports, or enterprise compliance queries? Reach directly out to the core engineering team."
            contactInfo={[
              { icon: Mail, label: 'Email', value: 'founders@aistack.dev' },
              { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
              { icon: MapPin, label: 'Headquarters', value: 'San Francisco, CA', className: 'col-span-2 md:col-span-1 lg:col-span-2' }
            ]}
          >
            <form className="w-full space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input type="text" placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Enterprise Email</Label>
                  <Input type="email" placeholder="john@company.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>What's on your mind?</Label>
                  <Textarea placeholder="We need custom SCIM provisioning..." className="min-h-[120px]" />
                </div>
              </div>
              <Button className="w-full py-6 text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:opacity-90 transition-opacity text-white shadow-lg" type="button">
                Send Transmission
              </Button>
            </form>
          </ContactCard>
        </ScrollReveal>
      </section>

    </main>
  );
}
