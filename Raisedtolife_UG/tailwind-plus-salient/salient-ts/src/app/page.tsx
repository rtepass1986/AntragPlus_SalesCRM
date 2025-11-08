import { AboutUs } from '@/components/AboutUs'
import { CallToAction } from '@/components/CallToAction'
import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Portfolio } from '@/components/Portfolio'
import { Pricing } from '@/components/Pricing'
import { PrimaryFeatures } from '@/components/PrimaryFeatures'
import { SecondaryFeatures } from '@/components/SecondaryFeatures'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Portfolio />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <AboutUs />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  )
}
