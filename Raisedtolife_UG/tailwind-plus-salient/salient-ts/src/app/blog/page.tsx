import { Blog } from '@/components/Blog'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export default function BlogPage() {
  return (
    <>
      <Header />
      <main>
        <Blog />
      </main>
      <Footer />
    </>
  )
}

