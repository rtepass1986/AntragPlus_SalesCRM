import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'

const blogPosts = [
  {
    id: 1,
    title: 'Die Zukunft nachhaltiger Investitionen',
    excerpt: 'Wie wir durch bewusste Investitionsentscheidungen eine bessere Zukunft gestalten können.',
    date: '15. März 2024',
    readTime: '5 Min. Lesezeit',
    category: 'Nachhaltigkeit',
    image: '/logo.jpg', // Using your logo as placeholder
    slug: 'zukunft-nachhaltiger-investitionen',
  },
  {
    id: 2,
    title: 'Impact Investing: Mehr als nur Rendite',
    excerpt: 'Warum soziale und ökologische Auswirkungen bei Investitionen eine immer wichtigere Rolle spielen.',
    date: '8. März 2024',
    readTime: '7 Min. Lesezeit',
    category: 'Impact Investing',
    image: '/logo.jpg',
    slug: 'impact-investing-mehr-als-rendite',
  },
  {
    id: 3,
    title: 'Startup-Investitionen in der DACH-Region',
    excerpt: 'Ein Überblick über die aktuellen Trends und Chancen im deutschen Startup-Ökosystem.',
    date: '1. März 2024',
    readTime: '6 Min. Lesezeit',
    category: 'Startups',
    image: '/logo.jpg',
    slug: 'startup-investitionen-dach-region',
  },
  {
    id: 4,
    title: 'ESG-Kriterien in der Praxis',
    excerpt: 'Wie wir Umwelt-, Sozial- und Governance-Faktoren in unsere Investmentstrategie integrieren.',
    date: '22. Februar 2024',
    readTime: '8 Min. Lesezeit',
    category: 'ESG',
    image: '/logo.jpg',
    slug: 'esg-kriterien-in-der-praxis',
  },
  {
    id: 5,
    title: 'Der Weg zur erfolgreichen Due Diligence',
    excerpt: 'Best Practices für die gründliche Prüfung von Investmentmöglichkeiten.',
    date: '15. Februar 2024',
    readTime: '9 Min. Lesezeit',
    category: 'Investment',
    image: '/logo.jpg',
    slug: 'weg-zur-erfolgreichen-due-diligence',
  },
  {
    id: 6,
    title: 'Technologie-Trends 2024: Wo investieren?',
    excerpt: 'Welche Technologien das Potenzial haben, Märkte zu transformieren und nachhaltiges Wachstum zu schaffen.',
    date: '8. Februar 2024',
    readTime: '6 Min. Lesezeit',
    category: 'Technologie',
    image: '/logo.jpg',
    slug: 'technologie-trends-2024-wo-investieren',
  },
]

export function Blog() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Container className="py-20">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Unser Blog
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Erkenntnisse, Trends und Einblicke aus der Welt des nachhaltigen Investierens
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="aspect-w-16 aspect-h-9">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={225}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-500">{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <time className="text-xs text-slate-500">{post.date}</time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                  >
                    Weiterlesen
                    <svg
                      className="ml-1 h-4 w-4"
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
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Alle Artikel anzeigen
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </Container>
    </div>
  )
}
