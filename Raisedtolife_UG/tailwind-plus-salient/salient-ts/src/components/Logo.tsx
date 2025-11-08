import Image from 'next/image'

export function Logo(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} className="flex items-center">
      <Image
        src="/logo.jpg"
        alt="Raised to Life UG Logo"
        width={1920}
        height={512}
        className="h-80 w-auto"
        priority
      />
    </div>
  )
}
