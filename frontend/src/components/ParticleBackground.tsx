import { Box } from '@mantine/core';
import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const maxDistance = 150;
    const pointerRadius = 120;
    const baseParticleCount = 80;
    const maxSpeed = 0.75;
    const particleColor = 'rgba(255, 255, 255, 0.1)';
    const linkColor = 'rgba(255, 255, 255, 0.06)';
    const pointer = { x: Number.NaN, y: Number.NaN };
    let animationFrame = 0;
    let particles: Particle[] = [];

    const createParticles = (width: number, height: number) => {
      const density = Math.max(40, Math.round((width * height) / 22000));
      const particleCount = Math.min(110, Math.max(baseParticleCount, density));

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * maxSpeed * 2,
        vy: (Math.random() - 0.5) * maxSpeed * 2,
        size: 1 + Math.random() * 4,
      }));
    };

    const resize = () => {
      const { innerWidth, innerHeight, devicePixelRatio } = window;
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);

      canvas.width = innerWidth * pixelRatio;
      canvas.height = innerHeight * pixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      createParticles(innerWidth, innerHeight);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.x = Number.NaN;
      pointer.y = Number.NaN;
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        particle.x = Math.min(width, Math.max(0, particle.x));
        particle.y = Math.min(height, Math.max(0, particle.y));

        if (!Number.isNaN(pointer.x) && !Number.isNaN(pointer.y)) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance < pointerRadius && distance > 0) {
            const force = (pointerRadius - distance) / pointerRadius;
            particle.x += (dx / distance) * force * 1.5;
            particle.y += (dy / distance) * force * 1.5;
          }
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];

        context.beginPath();
        context.fillStyle = particleColor;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();

        for (
          let comparisonIndex = index + 1;
          comparisonIndex < particles.length;
          comparisonIndex += 1
        ) {
          const comparison = particles[comparisonIndex];
          const distance = Math.hypot(
            particle.x - comparison.x,
            particle.y - comparison.y,
          );

          if (distance > maxDistance) continue;

          context.beginPath();
          context.strokeStyle = linkColor;
          context.globalAlpha = ((maxDistance - distance) / maxDistance) * 0.6;
          context.lineWidth = ((maxDistance - distance) / maxDistance) * 1;
          context.moveTo(particle.x, particle.y);
          context.lineTo(comparison.x, comparison.y);
          context.stroke();
          context.globalAlpha = 1;
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden="true"
      style={{
        inset: 0,
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: -1,
      }}
    />
  );
};
