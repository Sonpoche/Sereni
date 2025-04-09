// src/components/ui/page-header.tsx
interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode
  }
  
  export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-medium">{title}</h1>
          {description && (
            <p className="text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0 w-full sm:w-auto">{children}</div>
        )}
      </div>
    )
  }