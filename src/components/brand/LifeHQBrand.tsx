interface LifeHQBrandProps {
  className?: string;
}

function BrandTreeIcon() {
  return (
    <svg className="h-8 w-8 text-[#D6AD64]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 27V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 16C11.8 16 8.5 13.4 7.7 9.2C11.5 8.7 15 10.8 16 14.2C17 10.8 20.5 8.7 24.3 9.2C23.5 13.4 20.2 16 16 16Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 13.5C13.7 12.3 12.6 9.8 13.2 6.6C15.1 7.1 16.4 8.5 16.9 10.2C17.7 8.6 19.3 7.6 21.2 7.5C21.2 10.4 19.3 12.8 16 13.5Z" fill="currentColor" opacity="0.28" />
      <path d="M11 27H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LifeHQBrand({ className = '' }: LifeHQBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="LifeHQ V1">
      <div className="lifehq-brand-tree" aria-hidden="true"><BrandTreeIcon /></div>
      <div className="flex items-baseline gap-2">
        <p className="font-serif text-2xl font-semibold tracking-tight text-[#F5F1EA]">LifeHQ</p>
        <p className="text-sm font-medium text-[#D6AD64]">V1</p>
      </div>
    </div>
  );
}
