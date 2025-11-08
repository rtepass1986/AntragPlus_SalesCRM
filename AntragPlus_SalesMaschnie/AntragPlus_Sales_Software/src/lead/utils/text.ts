// src/utils/text.ts
import validator from "validator";

export function extractEmails(text: string): string[] {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const cleaned = [...new Set(matches.map((m) => m.trim().toLowerCase()))]
    .filter((e) => validator.isEmail(e))
    .filter((e) => !e.endsWith("@gmail.com") && !e.endsWith("@yahoo.com")); // Orga-Filter
  return cleaned.slice(0, 10);
}

export function extractPhones(text: string): string[] {
  // More strict German phone number regex
  // Matches: +49, 0049, or 0 followed by area code and number
  // Examples: +49 30 12345678, 0171 1234567, (030) 123-456, 0049-30-123456
  const patterns = [
    /\+49[\s\-\/]?\d{2,5}[\s\-\/]?\d{3,9}/g,  // +49 30 12345678
    /0049[\s\-\/]?\d{2,5}[\s\-\/]?\d{3,9}/g,  // 0049 30 12345678
    /\(0\d{2,4}\)[\s\-\/]?\d{3,9}/g,          // (030) 12345678
    /0\d{2,4}[\s\-\/]\d{3,9}/g,               // 030 12345678 or 0171 1234567
  ];
  
  const matches: string[] = [];
  patterns.forEach(pattern => {
    const found = text.match(pattern) || [];
    matches.push(...found);
  });
  
  const cleaned = [...new Set(matches.map((m) => m.replace(/\s+/g, " ").trim()))]
    .filter(phone => {
      // Remove all formatting to validate
      const digits = phone.replace(/[\s()\/-]/g, '');
      // Must have at least 8 digits (minimum German phone) and max 15 (international format)
      return digits.length >= 8 && digits.length <= 15;
    });
  
  return cleaned.slice(0, 10);
}

/**
 * Normalize phone numbers to German format
 * - Removes +49 and replaces with 0
 * - Removes extra spaces and special characters
 * - Returns only valid German phone numbers
 */
export function normalizeGermanPhones(phones: string[]): string[] {
  return phones
    .map(phone => {
      // Remove all spaces, parentheses, slashes, dashes
      let cleaned = phone.replace(/[\s()\/-]/g, '');
      
      // Replace +49 with 0
      if (cleaned.startsWith('+49')) {
        cleaned = '0' + cleaned.substring(3);
      } else if (cleaned.startsWith('0049')) {
        cleaned = '0' + cleaned.substring(4);
      } else if (cleaned.startsWith('49') && cleaned.length > 10) {
        cleaned = '0' + cleaned.substring(2);
      }
      
      // Ensure it starts with 0
      if (!cleaned.startsWith('0')) {
        return null;
      }
      
      // Valid German phone: 0 + 2-5 digit area code + 3-9 digit number (total 6-14 digits)
      if (cleaned.length < 6 || cleaned.length > 14) {
        return null;
      }
      
      // Only digits allowed
      if (!/^\d+$/.test(cleaned)) {
        return null;
      }
      
      // Add spacing for readability: 0123 456789 or 0171 1234567
      if (cleaned.length >= 10) {
        // Mobile or longer landline
        return cleaned.substring(0, 4) + ' ' + cleaned.substring(4);
      } else {
        // Shorter numbers
        return cleaned.substring(0, 3) + ' ' + cleaned.substring(3);
      }
    })
    .filter((p): p is string => p !== null)
    .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
}

