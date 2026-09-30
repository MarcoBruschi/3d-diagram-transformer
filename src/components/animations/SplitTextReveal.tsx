'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplitTextRevealProps {
  children: string | React.ReactNode;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  lineClassName?: string;
  triggerOnScroll?: boolean;
}

export function SplitTextReveal({
  children,
  delay = 0.2,
  duration = 1.1,
  stagger = 0.12,
  className = '',
  lineClassName = '',
  triggerOnScroll = false,
}: SplitTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lines = containerRef.current.querySelectorAll('.split-line-inner');
    if (!lines || lines.length === 0) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      gsap.set(lines, { yPercent: 0 });
      return;
    }

    gsap.set(lines, { yPercent: 110 });

    const animConfig: gsap.TweenVars = {
      yPercent: 0,
      duration,
      stagger,
      ease: 'power4.out',
      delay,
    };

    if (triggerOnScroll) {
      animConfig.scrollTrigger = {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      };
    }

    const tween = gsap.to(lines, animConfig);

    return () => {
      tween.kill();
    };
  }, [delay, duration, stagger, triggerOnScroll]);

  // Se for string simples com quebras de linha (\n ou <br>)
  if (typeof children === 'string') {
    const lines = children.split('\n').filter((l) => l.trim().length > 0);

    return (
      <div ref={containerRef} className={`select-none ${className}`}>
        {lines.map((line, idx) => (
          <div key={idx} className="overflow-hidden">
            <div className={`split-line-inner will-change-transform ${lineClassName}`}>
              {line}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Se forem nós React (como array de linhas ou elementos com tags)
  return (
    <div ref={containerRef} className={`select-none ${className}`}>
      {React.Children.map(children, (child, idx) => (
        <div key={idx} className="overflow-hidden">
          <div className={`split-line-inner will-change-transform ${lineClassName}`}>
            {child}
          </div>
        </div>
      ))}
    </div>
  );
}
