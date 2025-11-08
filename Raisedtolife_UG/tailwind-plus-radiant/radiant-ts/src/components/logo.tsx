
import Image from 'next/image'

export function Logo(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props}>
      <Image
        src="/logo.jpg"
        alt="Raised to Life UG Logo"
        width={120}
        height={32}
        className="h-8 w-auto"
        priority
      />
    </div>
  )
}
