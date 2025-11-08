'use client'

import { useState } from 'react'

interface ExpandableResumeItemProps {
  title: string
  company: string
  period: string
  description: string
  achievements: string[]
}

export function ExpandableResumeItem({ 
  title, 
  company, 
  period, 
  description, 
  achievements 
}: ExpandableResumeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/3 to-slate-800/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <button 
        className="relative w-full text-left p-6 hover:bg-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-inset rounded-2xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className="font-bold text-slate-900 text-lg mb-2">{title}</h5>
            <p className="text-slate-600 font-medium mb-2">{company}</p>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <div className="w-2 h-2 bg-slate-600 rounded-full mr-2"></div>
                {period}
              </span>
            </div>
          </div>
          <div className="ml-4 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300">
            <svg 
              className={`h-4 w-4 text-slate-600 group-hover:text-slate-800 transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 relative">
          <div className="border-t border-slate-200 pt-6">
            <p className="text-slate-700 leading-relaxed mb-4 font-medium">
              {description}
            </p>
            <ul className="space-y-3">
              {achievements.map((achievement, index) => (
                <li key={index} className="flex items-start group/item">
                  <div className="flex-shrink-0 w-2 h-2 bg-slate-600 rounded-full mt-2 mr-3 group-hover/item:scale-125 transition-transform duration-200"></div>
                  <span className="text-slate-600 text-sm leading-relaxed group-hover/item:text-slate-800 transition-colors duration-200">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
