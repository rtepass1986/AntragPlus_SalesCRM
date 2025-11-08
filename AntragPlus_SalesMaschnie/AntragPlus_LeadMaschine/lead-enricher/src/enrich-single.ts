#!/usr/bin/env ts-node
/**
 * Enrich a single organization by deal name
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { TavilyClient } from './utils/tavily';
import { logger } from './utils/logger';
import { callLLM } from './utils/llm';
import { findWebsiteAndContacts } from './search';

const dealName = process.argv[2] || 'Haus Kinderland';

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pipedriveToken || !tavilyKey) {
    logger.error('Missing API tokens');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);
  const tavily = new TavilyClient(tavilyKey);

  console.log(`\n🔍 Searching for deal: "${dealName}"\n`);

  // Find the deal
  const deals = await pipedrive.getAllDeals();
  const deal = deals.find(d => d.title && d.title.toLowerCase().includes(dealName.toLowerCase()));

  if (!deal) {
    console.log(`❌ Deal not found: "${dealName}"`);
    console.log(`\nAvailable deals with "Haus":`);
    deals.filter(d => d.title && d.title.toLowerCase().includes('haus'))
      .slice(0, 10)
      .forEach(d => console.log(`  - ${d.title} (ID: ${d.id})`));
    process.exit(1);
  }

  console.log(`✅ Found deal: "${deal.title}" (ID: ${deal.id})`);

  // Get organization
  const orgId = deal.org_id?.value || deal.org_id;
  if (!orgId) {
    console.log(`❌ No organization linked to this deal`);
    process.exit(1);
  }

  const org = await pipedrive.getOrganization(orgId);
  console.log(`✅ Organization: "${org.name}" (ID: ${org.id})\n`);

  console.log('=' .repeat(80));
  console.log('BEFORE ENRICHMENT');
  console.log('='.repeat(80));
  console.log(`Website: ${org.website || '(not set)'}`);
  console.log(`LinkedIn: ${org.linkedin || '(not set)'}`);
  console.log(`Industry: ${org.industry || '(not set)'}`);
  console.log(`Tätigkeitsfeld: ${org.d0ff2ebd4d3c12b3f1faad65b409a8e578d657a3 || '(not set)'}`);
  console.log(`Address: ${org.address || '(not set)'}`);

  const personsBefore = await pipedrive.getPersonsByOrganization(orgId);
  console.log(`\nContacts: ${personsBefore.length}`);
  if (personsBefore.length > 0) {
    personsBefore.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      const emails = p.email?.filter((e: any) => e.value?.trim()) || [];
      const phones = p.phone?.filter((p: any) => p.value?.trim()) || [];
      console.log(`     📧 Emails: ${emails.length > 0 ? emails.map((e: any) => e.value).join(', ') : '(none)'}`);
      console.log(`     📞 Phones: ${phones.length > 0 ? phones.map((p: any) => p.value).join(', ') : '(none)'}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('STARTING ENRICHMENT...');
  console.log('='.repeat(80) + '\n');

  const updates: any = {};
  const taetigkeitsfeldKey = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';

  // 1. Find website
  if (!org.website) {
    console.log('🔍 Searching for website...');
    const website = await tavily.searchDomain(org.name);
    if (website) {
      updates.website = website;
      console.log(`✅ Found: ${website}`);
    }
  }

  // 2. Scrape website for contacts
  const websiteUrl = updates.website || org.website;
  let contactInfo: any = null;
  
  if (websiteUrl) {
    console.log('🔍 Scraping website for contacts...');
    const data = await findWebsiteAndContacts(org.name, websiteUrl);
    if (data.emails.length > 0 || data.phones.length > 0) {
      contactInfo = { emails: data.emails, phones: data.phones };
      console.log(`✅ Found ${data.emails.length} emails, ${data.phones.length} phones`);
      if (data.address) {
        updates.address = data.address;
        console.log(`✅ Found address: ${data.address}`);
      }
    }
  }

  // 3. Find LinkedIn
  if (!org.linkedin) {
    console.log('🔍 Searching for LinkedIn...');
    const results = await tavily.search(`${org.name} LinkedIn company page site:linkedin.com`, 3);
    const linkedIn = results.find(r => r.url.includes('linkedin.com/company/'));
    if (linkedIn) {
      updates.linkedin = linkedIn.url;
      console.log(`✅ Found: ${linkedIn.url}`);
    }
  }

  // 4. LLM enrichment
  if (openaiKey && (!org.industry || !org[taetigkeitsfeldKey])) {
    console.log('🤖 Running AI enrichment...');
    const context = await tavily.researchCompany(org.name, websiteUrl);
    
    if (context) {
      const llmPrompt = `You are analyzing a German nonprofit organization.

Organization: ${org.name}

Research:
${context.slice(0, 3500)}

Provide:
1. Industry (e.g., "Bildung", "Soziales", "Gesundheit", "Umwelt", "Kultur")
2. Tätigkeitsfeld (ONE of: "Kinder und Jugend", "Soziales", "Umwelt und Nachhaltigkeit", "Gesundheit", "Bildung")
3. Description (2-3 German sentences about mission)

Return JSON:
{"industry": "...", "taetigkeitsfeld": "...", "description": "..."}`;

      const response = await callLLM(llmPrompt, { model: 'gpt-4o-mini', temperature: 0.2 });
      const parsed = JSON.parse(response);

      // Map to IDs
      const industryMap: Record<string, string> = {
        'Bildung': '5', 'Soziales': '11', 'Umwelt': '13', 'Jugend': '5',
        'Kultur': '6', 'Gesundheit': '11', 'Sport': '6'
      };
      const taetigkeitsfeldMap: Record<string, string> = {
        'Kinder und Jugend': '45', 'Soziales': '46', 'Umwelt und Nachhaltigkeit': '47',
        'Gesundheit': '46', 'Bildung': '45', 'Kultur und Kunst': '46'
      };

      if (parsed.industry && industryMap[parsed.industry]) {
        updates.industry = industryMap[parsed.industry];
        console.log(`✅ Industry: ${parsed.industry}`);
      }
      if (parsed.taetigkeitsfeld && taetigkeitsfeldMap[parsed.taetigkeitsfeld]) {
        updates[taetigkeitsfeldKey] = taetigkeitsfeldMap[parsed.taetigkeitsfeld];
        console.log(`✅ Tätigkeitsfeld: ${parsed.taetigkeitsfeld}`);
      }
      if (parsed.description) {
        console.log(`✅ Description generated`);
      }
    }
  }

  // 5. Update organization
  if (Object.keys(updates).length > 0) {
    console.log('\n💾 Updating organization fields...');
    await pipedrive.updateOrganization(orgId, updates);
    console.log('✅ Organization updated');
  }

  // 6. Update contact
  if (contactInfo && (contactInfo.emails.length > 0 || contactInfo.phones.length > 0)) {
    const persons = await pipedrive.getPersonsByOrganization(orgId);
    if (persons.length > 0) {
      const person = persons[0];
      const updateData: any = {};

      const hasEmail = person.email?.some((e: any) => e.value?.trim());
      const hasPhone = person.phone?.some((p: any) => p.value?.trim());

      if (!hasEmail && contactInfo.emails.length > 0) {
        updateData.email = contactInfo.emails.map((email: string, idx: number) => ({
          value: email,
          primary: idx === 0,
          label: 'work'
        }));
      }

      if (!hasPhone && contactInfo.phones.length > 0) {
        updateData.phone = contactInfo.phones.map((phone: string, idx: number) => ({
          value: phone,
          primary: idx === 0,
          label: 'work'
        }));
      }

      if (Object.keys(updateData).length > 0) {
        console.log('💾 Updating contact...');
        await pipedrive.updatePerson(person.id, updateData);
        console.log('✅ Contact updated');
      }
    }
  }

  // Show results
  console.log('\n' + '='.repeat(80));
  console.log('AFTER ENRICHMENT');
  console.log('='.repeat(80));

  const orgAfter = await pipedrive.getOrganization(orgId);
  console.log(`Website: ${orgAfter.website || '(not set)'}`);
  console.log(`LinkedIn: ${orgAfter.linkedin || '(not set)'}`);
  console.log(`Industry: ${orgAfter.industry || '(not set)'}`);
  console.log(`Tätigkeitsfeld: ${orgAfter.d0ff2ebd4d3c12b3f1faad65b409a8e578d657a3 || '(not set)'}`);
  console.log(`Address: ${orgAfter.address || '(not set)'}`);

  const personsAfter = await pipedrive.getPersonsByOrganization(orgId);
  console.log(`\nContacts: ${personsAfter.length}`);
  if (personsAfter.length > 0) {
    personsAfter.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      const emails = p.email?.filter((e: any) => e.value?.trim()) || [];
      const phones = p.phone?.filter((p: any) => p.value?.trim()) || [];
      console.log(`     📧 Emails: ${emails.length > 0 ? emails.map((e: any) => e.value).join(', ') : '(none)'}`);
      console.log(`     📞 Phones: ${phones.length > 0 ? phones.map((p: any) => p.value).join(', ') : '(none)'}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ENRICHMENT COMPLETE!');
  console.log('='.repeat(80) + '\n');
}

main().catch((error) => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});

