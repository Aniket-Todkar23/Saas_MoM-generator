import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Info, X } from 'lucide-react'

export interface PricingFeature {
  text: string
  included: boolean
  hasInfo?: boolean
}

export interface PricingTier {
  name: string
  subtitle?: string
  price?: string
  period?: string
  description: string
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  features: PricingFeature[]
  buttonText: string
  buttonVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  highlighted?: boolean
  footerText?: string
  footerLink?: string
}

export interface PricingComponentProps {
  title?: React.ReactNode
  subtitle?: string
  tiers: PricingTier[]
  className?: string
}

const PricingComponent: React.FC<PricingComponentProps> = ({
  title = "Simple pricing.",
  subtitle = "Pay for what matters. Enjoy everything else.",
  tiers,
  className
}) => {
  return (
    <div className={cn("w-full min-h-[100dvh] pt-32 pb-20 relative flex items-center justify-center overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 max-md:gap-8 max-w-6xl mx-auto items-stretch">
          {tiers.map((tier, index) => (
            <Card 
              key={index}
              className={cn(
                "relative flex flex-col h-full transition-all duration-300 border-border/50",
                tier.highlighted 
                  ? "bg-muted/10 border-border/70 shadow-2xl md:scale-105 z-20" 
                  : "bg-background/40 border-border/40 hover:bg-muted/20"
              )}
              style={{
                backdropFilter: "blur(10px)"
              }}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white shadow-xl text-xs font-bold px-4 py-1.5 rounded-full">
                    {tier.badge.text}
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-12 flex-none">
                <div className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
                  {tier.subtitle}
                </div>
                <CardTitle className="mb-6">
                  {tier.price ? (
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                      {tier.period && (
                        <span className="text-lg font-light text-muted-foreground ml-2">
                          {tier.period}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-5xl font-bold text-foreground">{tier.name}</div>
                  )}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base leading-relaxed px-4">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 px-8">
                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 border-b border-border/50 pb-2">
                    PLAN HIGHLIGHTS
                  </h4>
                  <div className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        {feature.included ? <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />}
                        <span className={cn("text-sm flex items-center gap-2 leading-relaxed transition-colors", feature.included ? "text-foreground font-medium" : "text-muted-foreground/60")}>
                          {feature.text}
                          {feature.hasInfo && (
                            <Info className="h-3 w-3 text-muted-foreground/60" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-8 pb-8 flex-none mt-auto">
                <div className="w-full">
                  {tier.highlighted ? (
                    <Button 
                      className="w-full py-6 text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {tier.buttonText}
                    </Button>
                  ) : (
                    <Button 
                      className={cn(
                        "w-full py-6 text-sm font-bold transition-all duration-300",
                        "bg-muted hover:bg-muted/80 text-foreground border-border/50"
                      )}
                      variant="secondary"
                    >
                      {tier.buttonText}
                    </Button>
                  )}
                  {tier.footerText && (
                    <div className="text-center mt-6">
                      <p className="text-xs text-muted-foreground">
                        {tier.footerText}{' '}
                        {tier.footerLink && (
                          <button className="text-primary hover:text-primary/80 underline transition-colors">
                            {tier.footerLink}
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PricingComponent
