import React from 'react'
import PricingComponent from '@/components/ui/adaptive-pricing-section'

import { BackgroundLines } from "@/components/ui/animated-svg-background"

export default function PricingPage() {
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
      badge: {
        text: "COMING SOON"
      },
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
  ]

  const TitleWrapper = (
    <>
      Transparent <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-300 dark:via-white/90 dark:to-rose-300">Pricing</span>.
    </>
  )

  return (
    <BackgroundLines className="min-h-screen w-full">
      <PricingComponent 
        title={TitleWrapper}
        subtitle="Start generating AI minutes completely free. Upgrade when you need deep integrations."
        tiers={pricingTiers}
      />
    </BackgroundLines>
  )
}
