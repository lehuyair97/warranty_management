'use client';

import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { motion, useAnimate } from 'motion/react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';

const WrenchIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      await animate(
        '.wrench-body',
        {
          rotate: [0, -20, 14, -8, 0],
          originX: '85%',
          originY: '85%',
        },
        {
          duration: 0.55,
          ease: 'easeInOut',
        },
      );
    }, [animate]);

    const stop = useCallback(() => {
      animate(
        '.wrench-body',
        {
          rotate: 0,
        },
        {
          duration: 0.2,
          ease: 'easeOut',
        },
      );
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <motion.path
          className="wrench-body"
          d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 6 6l0 0l-3.5 3.5m4.5 -4.5l6 6l-3 3l-6 -6m7.5 7.5l2 2a1.414 1.414 0 0 1 -2 2l-2 -2"
        />
      </motion.svg>
    );
  },
);

WrenchIcon.displayName = 'WrenchIcon';

export default WrenchIcon;
