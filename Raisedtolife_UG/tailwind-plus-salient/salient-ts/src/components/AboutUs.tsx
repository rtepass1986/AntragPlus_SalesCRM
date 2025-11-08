import Image from 'next/image'

import { Container } from '@/components/Container'
import { ExpandableResumeItem } from '@/components/ExpandableResumeItem'

export function AboutUs() {
  return (
    <section
      id="testimonials"
      aria-label="Über mich"
      className="bg-white py-20 sm:py-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Über mich
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Lernen Sie den Gründer von Raised to Life UG kennen
          </p>
        </div>

        {/* Personal Bio Section */}
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Profile Picture - Left Side */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <Image
                  src="/profile.jpg"
                  alt="Robert Tepass - Gründer & Geschäftsführer"
                  width={500}
                  height={600}
                  className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/20 to-transparent"></div>
              </div>
            </div>

            {/* Bio Text - Right Side */}
            <div className="order-1 lg:order-2">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Robert Tepass
                  </h3>
                  <p className="text-lg text-blue-600 font-medium">
                    Gründer & Geschäftsführer
                  </p>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    Ich bin Gründer von <em>AntragPlus</em> sowie <em>VISIONEERS</em> in Berlin und Costa Rica, 
                    Pastor in Ausbildung am Theologischen Seminar Erzhausen und Mitglied der Gemeindeleitung 
                    von <em>realLife Berlin</em>. Meine Leidenschaft ist es, <strong>Technologie, Unternehmertum 
                    und geistliche Werte</strong> zu verbinden – als Ausdruck von <em>Business as Mission</em>.
                  </p>
                  
                  <p className="text-slate-700 leading-relaxed">
                    Meine eigene Geschichte ist von tiefen Umbrüchen geprägt. Nach einer herausfordernden 
                    Jugendzeit, über die u.a. <em>ERF Mensch Gott</em> und das <em>SWR Nachtcafé</em> berichteten, 
                    habe ich erlebt, wie Glaube, Gemeinschaft und neue Perspektiven Leben verändern können. 
                    Diese Erfahrungen haben meine Berufung geprägt: Menschen zu begleiten, innovative 
                    Projekte aufzubauen und Brücken zwischen Wirtschaft, Kirche und Gesellschaft zu schlagen.
                  </p>

                  <p className="text-slate-700 leading-relaxed">
                    Heute setze ich mich mit meinen Initiativen dafür ein, Organisationen zu stärken, 
                    soziale Wirkung zu entfalten und neue Wege für nachhaltiges Unternehmertum und 
                    geistliches Leben zu eröffnen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    Business as Mission
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    Technologie & Innovation
                  </span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                    Geistliche Leitung
                  </span>
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                    Soziale Wirkung
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Resume Section */}
          <div className="mt-20">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-200/50">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/3 to-slate-800/3"></div>
              <div className="relative">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    Professioneller Werdegang
                  </h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-slate-600 to-slate-800 mx-auto rounded-full"></div>
                </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Education - Left Side */}
                <div>
                  <div className="flex items-center mb-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.083 12.083 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 ml-4">Ausbildung</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/3 to-slate-800/3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-900 text-lg mb-2">Theologisches Seminar Erzhausen (TSE)</h5>
                            <p className="text-slate-600 font-medium mb-2">Pastor in Ausbildung</p>
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                <div className="w-2 h-2 bg-slate-600 rounded-full mr-2 animate-pulse"></div>
                                Aktuell
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="w-4 h-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/3 to-slate-800/3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-900 text-lg mb-2">Bachelor of Arts in Risk Assessment and Investment Banking</h5>
                            <p className="text-slate-600 font-medium mb-2">NYU Stern School of Business</p>
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                <div className="w-2 h-2 bg-slate-600 rounded-full mr-2"></div>
                                Abgeschlossen
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="w-4 h-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Experience - Right Side with Expandable Items */}
                <div>
                  <div className="flex items-center mb-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 ml-4">Berufserfahrung</h4>
                  </div>
                  <div className="space-y-4">
                    <ExpandableResumeItem
                      title="Gründer & Geschäftsführer"
                      company="Raised to Life UG"
                      period="2020 - heute"
                      description="Leitung und strategische Ausrichtung von Raised to Life UG mit Fokus auf nachhaltige Investitionen und soziale Wirkung. Aufbau von Partnerschaften zwischen Wirtschaft, Kirche und Gesellschaft."
                      achievements={[
                        "Entwicklung von Business-as-Mission Strategien",
                        "Aufbau von VISIONEERS Netzwerk in Berlin und Costa Rica",
                        "Leitung von AntragPlus Plattform"
                      ]}
                    />

                    <ExpandableResumeItem
                      title="Gründer & Geschäftsführer"
                      company="VISIONEERS Berlin & Costa Rica"
                      period="2018 - heute"
                      description="Aufbau und Leitung von VISIONEERS als internationales Netzwerk für soziale Innovation und nachhaltiges Unternehmertum in Berlin und Costa Rica."
                      achievements={[
                        "Entwicklung von sozialen Innovationsprojekten",
                        "Aufbau von internationalen Partnerschaften",
                        "Mentoring von Social Entrepreneurs"
                      ]}
                    />

                    <ExpandableResumeItem
                      title="Gründer & CEO"
                      company="AntragPlus"
                      period="2016 - heute"
                      description="Entwicklung und Leitung einer digitalen Plattform zur Vereinfachung von Antragsprozessen für staatliche Förderungen und Zuschüsse."
                      achievements={[
                        "Technologie-Entwicklung und Produktmanagement",
                        "Aufbau von Kundenbeziehungen und Partnerschaften",
                        "Digitalisierung von Verwaltungsprozessen"
                      ]}
                    />

                    <ExpandableResumeItem
                      title="Gemeindeleitung"
                      company="realLife Berlin"
                      period="2015 - heute"
                      description="Mitglied der Gemeindeleitung von realLife Berlin mit Fokus auf die Verbindung von Glaube und gesellschaftlichem Engagement."
                      achievements={[
                        "Strategische Gemeindeleitung und -entwicklung",
                        "Aufbau von sozialen Projekten und Initiativen",
                        "Mentoring und Seelsorge"
                      ]}
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
