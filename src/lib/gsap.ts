import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Registro defensivo apenas no lado cliente
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Otimização de batch para renderização fluida sem layout thrashing
  gsap.config({
    autoSleep: 60,
    force3D: true,
  });
}

export { gsap, ScrollTrigger, useGSAP };
