import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p';
}

/**
 * VisuallyHidden component - hides content visually but keeps it accessible to screen readers
 * Useful for providing additional context to screen reader users
 */
export default function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
}
