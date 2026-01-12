import type { DesignSystem } from "./types"

/**
 * Generates a button component based on design system
 */
export function generateButtonComponent(designSystem: DesignSystem): string {
  const primaryColor = designSystem.colors.find((c) => c.usage === "primary")?.hex || "#3B82F6"

  return `'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'font-medium rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={\`\${baseStyles} \${variants[variant]} \${sizes[size]} \${className}\`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
`
}

/**
 * Generates a card component based on design system
 */
export function generateCardComponent(designSystem: DesignSystem): string {
  return `'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={\`bg-white border border-gray-200 rounded-lg shadow-sm p-6 \${className}\`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return <div className={\`mb-4 \${className}\`}>{children}</div>
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={\`mb-4 \${className}\`}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return <div className={\`mt-4 pt-4 border-t border-gray-200 \${className}\`}>{children}</div>
}
`
}

/**
 * Generates layout component
 */
export function generateLayoutComponent(designSystem: DesignSystem, sections: string[]): string {
  const sectionJSX = sections
    .map((section) => {
      return `      <${section} className="py-12 border-b border-gray-200">
        {/* ${section} content */}
      </${section}>`
    })
    .join("\n")

  return `'use client'

import React from 'react'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
${sectionJSX}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
`
}
