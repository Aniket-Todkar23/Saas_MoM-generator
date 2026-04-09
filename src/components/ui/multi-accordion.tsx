"use client"
import React, { ReactNode, ReactElement, isValidElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccordionContextType = {
  isActive: boolean;
  value: string;
  onChangeIndex: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextType>({
  isActive: false,
  value: '',
  onChangeIndex: () => {}
});

const useAccordion = () => React.useContext(AccordionContext);

export function AccordionContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-1', className)}>{children}</div>
  );
}

export function AccordionWrapper({ 
  children 
}: { 
  children: ReactNode 
}) {
  return <div>{children}</div>;
}

export function Accordion({
  children,
  multiple,
  defaultValue,
}: {
  children: ReactNode;
  multiple?: boolean;
  defaultValue?: string | string[];
}) {
  const [activeIndex, setActiveIndex] = React.useState<string[]>(
    multiple ? (defaultValue ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : []) : 
    (defaultValue ? (Array.isArray(defaultValue) ? [defaultValue[0]] : [defaultValue]) : [])
  );

  function onChangeIndex(value: string) {
    setActiveIndex((currentActiveIndex) => {
      if (!multiple) {
        return value === currentActiveIndex[0] ? [] : [value];
      }

      if (currentActiveIndex.includes(value)) {
        return currentActiveIndex.filter((i) => i !== value);
      }

      return [...currentActiveIndex, value];
    });
  }

  return React.Children.map(children, (child) => {
    if (!isValidElement<{ value?: string }>(child)) return null;

    const value = child.props.value ?? '';
    const isActive = multiple
      ? activeIndex.includes(value)
      : activeIndex[0] === value;

    return (
      <AccordionContext.Provider value={{ isActive, value, onChangeIndex }}>
        {React.cloneElement(child)}
      </AccordionContext.Provider>
    );
  });
}

export function AccordionItem({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: string 
}) {
  const { isActive } = useAccordion();

  return (
    <div
      data-active={isActive || undefined}
      className={cn(
        "rounded-2xl overflow-hidden mb-4 border transition-colors w-full",
        isActive
          ? "border-indigo-500/40 bg-card shadow-sm"
          : "bg-background/50 backdrop-blur-sm border-border hover:border-indigo-500/40"
      )}
      data-value={value}
    >
      {children}
    </div>
  );
}

export function AccordionHeader({
  children,
  customIcon,
  className
}: {
  children: ReactNode;
  customIcon?: boolean;
  className?: string;
}) {
  const { isActive, value, onChangeIndex } = useAccordion();

  return (
    <motion.div
      data-active={isActive || undefined}
      className={cn(
        "group px-4 py-4 md:px-5 md:py-4 cursor-pointer transition-all flex justify-between items-center text-foreground",
        isActive ? "bg-accent/30" : "bg-transparent hover:bg-background/20",
        className
      )}
      onClick={() => onChangeIndex(value)}
    >
      {children}
      {!customIcon && (
        <ChevronDown
          className={cn(
            "transition-transform text-muted-foreground",
            isActive ? "rotate-180" : "rotate-0",
          )}
        />
      )}
    </motion.div>
  );
}

export function AccordionPanel({ 
  children,
  className
}: { 
  children: ReactNode;
  className?: string;
}) {
  const { isActive } = useAccordion();

  return (
    <AnimatePresence initial={true}>
      {isActive && (
        <motion.div
          data-active={isActive || undefined}
          initial={{ height: 0, overflow: 'hidden' }}
          animate={{ height: 'auto', overflow: 'hidden' }}
          exit={{ height: 0 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          className={cn('group border-t border-border/60 bg-transparent', className)}
        >
          <motion.article
            initial={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
            animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' }}
            exit={{
              clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
            }}
            transition={{
              type: 'spring',
              duration: 0.4,
              bounce: 0,
            }}
            className="p-4 md:p-5 bg-transparent text-foreground"
          >
            {children}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
