import axios from 'axios';
import { logger } from './logger';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  query: string;
  results: TavilySearchResult[];
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for general information about a company
   */
  async search(query: string, maxResults: number = 5): Promise<TavilySearchResult[]> {
    try {
      logger.info({ query }, 'Tavily search');

      const response = await axios.post<TavilyResponse>(`${this.baseUrl}/search`, {
        api_key: this.apiKey,
        query,
        max_results: maxResults,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
      });

      logger.info({ resultsCount: response.data.results.length }, 'Tavily search complete');
      return response.data.results;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;
      
      // Log detailed error
      logger.error({ 
        query, 
        error: errorMsg, 
        statusCode,
        details: error.response?.data 
      }, 'Tavily search failed');
      
      // If it's a quota, rate limit, or auth error, throw to stop the process
      if (statusCode === 432 || statusCode === 429 || statusCode === 401 || statusCode === 403) {
        const readableError = statusCode === 432 
          ? 'Tavily API quota exceeded. Please upgrade your plan or wait for quota reset.'
          : statusCode === 429
          ? 'Tavily API rate limit exceeded. Please wait before retrying.'
          : statusCode === 401 || statusCode === 403
          ? 'Tavily API authentication failed. Please check your API key.'
          : 'Tavily API error';
        
        throw new Error(`🛑 TAVILY ERROR (${statusCode}): ${readableError}`);
      }
      
      return [];
    }
  }

  /**
   * Search specifically for a company's website/domain
   */
  async searchDomain(companyName: string): Promise<string | null> {
    try {
      const query = `${companyName} official website`;
      const results = await this.search(query, 5);

      if (results.length === 0) {
        return null;
      }

      // Prefer .org, .de, and avoid social media
      const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com'];
      
      const candidates = results
        .filter(r => !socialDomains.some(social => r.url.includes(social)))
        .map(r => {
          try {
            const url = new URL(r.url);
            return {
              domain: `${url.protocol}//${url.hostname}`,
              hostname: url.hostname,
              score: r.score,
              title: r.title,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Array<{ domain: string; hostname: string; score: number; title: string }>;

      if (candidates.length === 0) {
        return null;
      }

      // Score candidates: prefer .org, .de
      const scored = candidates.map(c => {
        let bonus = 0;
        if (c.hostname.endsWith('.org')) bonus += 20;
        if (c.hostname.endsWith('.de')) bonus += 15;
        if (c.hostname.includes('verein') || c.hostname.includes('stiftung')) bonus += 10;
        
        return {
          ...c,
          finalScore: c.score + bonus,
        };
      });

      scored.sort((a, b) => b.finalScore - a.finalScore);

      logger.info({ domain: scored[0].domain, companyName }, 'Domain found');
      return scored[0].domain;
    } catch (error: any) {
      // If it's a critical Tavily error, rethrow to stop the process
      if (error.message && error.message.includes('🛑 TAVILY ERROR')) {
        throw error;
      }
      logger.error({ error: error.message, companyName }, 'Domain search failed');
      return null;
    }
  }

  /**
   * Extract contact information from search results
   */
  async findContactInfo(companyName: string, website?: string): Promise<{
    emails: string[];
    phones: string[];
    address?: string;
  }> {
    try {
      const query = website
        ? `${companyName} ${website} contact email phone impressum`
        : `${companyName} contact email phone impressum`;

      const results = await this.search(query, 3);
      
      const emails = new Set<string>();
      const phones = new Set<string>();

      for (const result of results) {
        // Extract emails
        const emailMatches = result.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        if (emailMatches) {
          emailMatches.forEach(email => {
            // Filter out common generic/freemail addresses
            const freemailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'web.de', 'gmx.de'];
            const domain = email.split('@')[1];
            if (!freemailDomains.includes(domain)) {
              emails.add(email);
            }
          });
        }

        // Extract phones (German format)
        const phoneMatches = result.content.match(/(\+49|0)[1-9]\d{1,4}[\s\-]?\d{3,10}/g);
        if (phoneMatches) {
          phoneMatches.forEach(phone => phones.add(phone.trim()));
        }
      }

      return {
        emails: Array.from(emails).slice(0, 5),
        phones: Array.from(phones).slice(0, 3),
      };
    } catch (error: any) {
      // If it's a critical Tavily error, rethrow to stop the process
      if (error.message && error.message.includes('🛑 TAVILY ERROR')) {
        throw error;
      }
      logger.error({ error: error.message, companyName }, 'Contact info extraction failed');
      return { emails: [], phones: [] };
    }
  }

  /**
   * Research company for enrichment data
   */
  async researchCompany(companyName: string, website?: string): Promise<string> {
    try {
      const query = website
        ? `${companyName} ${website} about mission goals activities`
        : `${companyName} nonprofit organization about mission`;

      const results = await this.search(query, 3);
      
      if (results.length === 0) {
        return '';
      }

      // Combine top results into research context
      const context = results
        .slice(0, 3)
        .map(r => `Source: ${r.title}\n${r.content}`)
        .join('\n\n---\n\n');

      return context;
    } catch (error: any) {
      // If it's a critical Tavily error, rethrow to stop the process
      if (error.message && error.message.includes('🛑 TAVILY ERROR')) {
        throw error;
      }
      logger.error({ error: error.message, companyName }, 'Company research failed');
      return '';
    }
  }
}


