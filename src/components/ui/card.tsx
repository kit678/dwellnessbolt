'use client'

import React, { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils' // Ensure this utility exists for classNames

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-white shadow-md rounded-lg overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  )
) as React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> & {
  Header: typeof CardHeader
  Content: typeof CardContent
  Footer: typeof CardFooter
}

// Sub-components Interfaces

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

// Sub-components Definitions

const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
    {children}
  </div>
)

const CardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => (
  <div className={cn('px-6 py-4', className)} {...props}>
    {children}
  </div>
)

const CardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => (
  <div className={cn('px-6 py-4 border-t border-gray-200', className)} {...props}>
    {children}
  </div>
)

// Attach Sub-components to Card

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter

// Export Card and its sub-components
export { Card, CardHeader, CardContent, CardFooter }
