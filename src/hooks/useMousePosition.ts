import { useEffect, useRef } from 'react';

/**
 * Global mousemove listener (not canvas-scoped) so it keeps working even
 * when DOM sections visually cover the canvas — consumed via refs inside
 * useFrame loops, never as React state.
 */
export function useMousePosition() {
  const position = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      position.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      position.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}
