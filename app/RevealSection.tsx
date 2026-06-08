"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface RevealSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

export default function RevealSection({
  children,
  id,
  className = "",
}: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("cela-revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} className={`cela-reveal ${className}`}>
      {children}
    </section>
  );
}
