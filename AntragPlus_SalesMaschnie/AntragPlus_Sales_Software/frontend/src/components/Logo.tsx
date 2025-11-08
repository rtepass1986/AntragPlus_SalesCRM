import Image from 'next/image'
import logoImage from '@/images/AntragPlus_logo01.png'

export function Logo(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props}>
      <Image
        src={logoImage}
        alt="AntragPlus"
        className="h-full w-auto"
        priority
      />
    </div>
  )
}
