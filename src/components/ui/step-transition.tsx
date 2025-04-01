// src/components/ui/step-transition.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"

interface StepTransitionProps {
  children: React.ReactNode
  direction: number // 1 pour avant, -1 pour arrière
  currentStep: number
}

export function StepTransition({ 
  children, 
  direction, 
  currentStep 
}: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={currentStep}
        initial={{ 
          x: direction > 0 ? 50 : -50, 
          opacity: 0 
        }}
        animate={{ 
          x: 0, 
          opacity: 1 
        }}
        exit={{ 
          x: direction < 0 ? 50 : -50, 
          opacity: 0 
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}