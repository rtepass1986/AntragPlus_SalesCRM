import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'

const portfolioCompanies = [
  {
    name: 'Visioneers Berlin',
    description: 'Innovative Technologie-Lösungen für nachhaltige Stadtentwicklung',
    category: 'Technologie',
    logo: '/images/logos/visioneers-berlin.svg',
    website: '#',
  },
  {
    name: 'Visioneers CR',
    description: 'Kreislaufwirtschaft und nachhaltige Produktionsprozesse',
    category: 'Nachhaltigkeit',
    logo: '/images/logos/visioneers-cr.tif',
    website: '#',
  },
  {
    name: 'Visioneers Cafe',
    description: 'Soziales Unternehmertum und Community-Building',
    category: 'Soziales',
    logo: '/images/logos/visioneers-cafe.jpg',
    website: '#',
  },
  {
    name: 'AntragPlus',
    description: 'Digitalisierung von Verwaltungsprozessen',
    category: 'Digitalisierung',
    logo: '/images/logos/antragplus.jpg',
    website: 'https://www.antragplus.de',
  },
  {
    name: 'Time2play Media',
    description: 'Kreative Medienproduktion und Storytelling',
    category: 'Medien',
    logo: '/images/logos/time2play.png',
    website: '#',
  },
]

export function Portfolio() {
  return (
    <section id="portfolio" className="py-20 bg-slate-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Unser Portfolio
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Wir investieren in zukunftsorientierte Unternehmen, die einen positiven Einfluss auf die Gesellschaft haben.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioCompanies.map((company, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <Link 
                    href={company.website}
                    target={company.website.startsWith('http') ? '_blank' : '_self'}
                    rel={company.website.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block"
                  >
                    <Image
                      src={company.logo}
                      alt={`${company.name} Logo`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover hover:opacity-80 transition-opacity"
                    />
                  </Link>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {company.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {company.category}
                  </span>
                </div>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                {company.description}
              </p>
              
              <div className="mt-6 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span className="font-medium">Mehr erfahren</span>
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-6">
            Interessiert an einer Partnerschaft mit Raised to Life UG?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Kontakt aufnehmen
          </a>
        </div>
      </Container>
    </section>
  )
}
