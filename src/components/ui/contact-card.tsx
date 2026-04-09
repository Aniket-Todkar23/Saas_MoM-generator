import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, PlusIcon } from 'lucide-react';

type ContactInfoProps = React.ComponentProps<'div'> & {
  icon: LucideIcon;
  label: string;
  value: string;
};

type ContactCardProps = React.ComponentProps<'div'> & {
  title?: string;
  description?: string;
  contactInfo?: ContactInfoProps[];
  formSectionClassName?: string;
};

export function ContactCard({
  title = 'Contact With Us',
  description = 'If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.',
  contactInfo,
  className,
  formSectionClassName,
  children,
  ...props
}: ContactCardProps) {
  return (
    <div
      className={cn(
        'bg-card/40 backdrop-blur-xl border border-border/50 relative grid h-full w-full shadow-2xl rounded-xl md:grid-cols-2 lg:grid-cols-3 overflow-hidden',
        className,
      )}
      {...props}
    >
      <PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-muted-foreground/30" />
      <PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-muted-foreground/30" />
      <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-muted-foreground/30" />
      <PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-muted-foreground/30" />
      
      <div className="flex flex-col justify-between lg:col-span-2 relative z-10">
        <div className="relative h-full space-y-6 px-6 py-10 md:p-12">
          <h1 className="text-3xl font-bold md:text-5xl lg:text-6xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base md:text-lg leading-relaxed font-light">
            {description}
          </p>
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            {contactInfo?.map((info, index) => (
              <ContactInfo key={index} {...info} />
            ))}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'bg-muted/10 flex h-full w-full items-center border-t border-border/50 p-6 md:p-8 md:col-span-1 md:border-t-0 md:border-l relative z-10',
          formSectionClassName,
        )}
      >
        {children}
      </div>
      
      {/* Decorative gradient bleed */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-indigo-500/5 opacity-50 z-0 pointer-events-none" />
    </div>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  className,
  ...props
}: ContactInfoProps) {
  return (
    <div className={cn('flex items-center gap-4 py-4', className)} {...props}>
      <div className="bg-indigo-500/10 rounded-xl p-3 shadow-inner border border-indigo-500/20">
        <Icon className="h-6 w-6 text-indigo-500" />
      </div>
      <div>
        <p className="font-bold text-sm tracking-wide uppercase text-foreground/80">{label}</p>
        <p className="text-muted-foreground text-sm font-light mt-0.5">{value}</p>
      </div>
    </div>
  );
}
