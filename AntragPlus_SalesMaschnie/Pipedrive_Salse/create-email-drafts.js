require('dotenv').config();
const { PipedriveClient } = require('./dist/pipedrive');
const { STAGES_TO_SYNC } = require('./dist/mapping');

const EMAIL_TEMPLATE = `Mein Name ist Robert Tepass, Account Manager für gemeinnützige Organisationen bei AntragPlus – einer Initiative der Visioneers gGmbH. 

Ich habe selbst mehrere Jahre in der freien Kinder- und Jugendhilfe als Einrichtungsleiter gearbeitet und finde Ihre Arbeit {PERSONAL_REFERENCE} sehr inspirierend. Es ist ermutigend zu sehen, dass es {ORGANIZATION_TYPE} wie {ORGANIZATION_NAME} gibt, die sich trotz aller Herausforderungen, die in diesem Arbeitsbereich herrschen, mit so viel Engagement für {TARGET_GROUP} einsetzen.

In den letzten Monaten war ich mit vielen Mitstreiter:innen aus der Praxis im Gespräch. Dabei kamen immer wieder dieselben Herausforderungen zur Sprache:

• Förderprogramme gibt es – aber niemand hat Zeit, sie gezielt zu recherchieren.
• Anträge zu schreiben ist mühsam und oft ein Trial-and-Error-Spiel.
• Die Abrechnung verursacht unnötig viel Verwaltungsaufwand und Unsicherheit.

Wir haben uns bei Visioneers selbst intensiv die letzten 10 Jahre mit diesen Problemen beschäftigt – und können heute sagen: Wir haben einen funktionierenden Weg gefunden, wie man diese Hürden nachhaltig bewältigen kann.

Jetzt bin ich auf der Suche nach Organisationen/Einrichtungen, für die dieser Ansatz ebenfalls hilfreich sein könnte.

Könnten Sie mir sagen, wer bei Ihnen für diesen Bereich zuständig ist – oder wer mir hier ggf. kurzes Feedback geben könnte?

Beste Grüße,
Robert Tepass
Account Manager
AntragPlus – eine Initiative der Visioneers gGmbH`;

async function generatePersonalizedEmail(deal, person, organization) {
  let email = EMAIL_TEMPLATE;
  
  // Get organization name
  const orgName = organization?.name || deal.org_name || 'Ihre Organisation';
  
  // Determine organization type based on name patterns
  let orgType = 'Träger/Einrichtungen';
  if (orgName.toLowerCase().includes('verein') || orgName.toLowerCase().includes('e.v.')) {
    orgType = 'Vereine';
  } else if (orgName.toLowerCase().includes('gmbh') || orgName.toLowerCase().includes('ggmbh')) {
    orgType = 'Organisationen';
  } else if (orgName.toLowerCase().includes('stiftung')) {
    orgType = 'Stiftungen';
  }
  
  // Determine target group and personal reference based on organization name/notes
  let targetGroup = 'Menschen in Not';
  let personalReference = 'im sozialen Bereich';
  
  const orgNameLower = orgName.toLowerCase();
  const dealNotes = deal.notes || '';
  const combinedText = (orgNameLower + ' ' + dealNotes.toLowerCase());
  
  // Analyze organization focus
  if (combinedText.includes('jugend') || combinedText.includes('kinder')) {
    targetGroup = 'Kinder und Jugendliche';
    personalReference = 'in der Kinder- und Jugendhilfe';
  } else if (combinedText.includes('familie')) {
    targetGroup = 'Familien';
    personalReference = 'in der Familienförderung';
  } else if (combinedText.includes('bildung') || combinedText.includes('schul')) {
    targetGroup = 'Bildung und Entwicklung';
    personalReference = 'im Bildungsbereich';
  } else if (combinedText.includes('integration') || combinedText.includes('migration')) {
    targetGroup = 'Menschen mit Migrationshintergrund';
    personalReference = 'in der Integrationsarbeit';
  } else if (combinedText.includes('pflege') || combinedText.includes('senior')) {
    targetGroup = 'ältere Menschen';
    personalReference = 'in der Altenpflege';
  } else if (combinedText.includes('behindert') || combinedText.includes('inklusion')) {
    targetGroup = 'Menschen mit Behinderung';
    personalReference = 'in der Inklusionsarbeit';
  } else if (combinedText.includes('obdach') || combinedText.includes('wohnungs')) {
    targetGroup = 'wohnungslose Menschen';
    personalReference = 'in der Wohnungslosenhilfe';
  } else if (combinedText.includes('sucht') || combinedText.includes('drogen')) {
    targetGroup = 'suchtkranke Menschen';
    personalReference = 'in der Suchthilfe';
  } else if (combinedText.includes('frauen') || combinedText.includes('mädchen')) {
    targetGroup = 'Frauen und Mädchen';
    personalReference = 'in der Frauenförderung';
  } else if (combinedText.includes('kultur') || combinedText.includes('kunst')) {
    targetGroup = 'kulturelle Teilhabe';
    personalReference = 'im Kulturbereich';
  } else if (combinedText.includes('sport')) {
    targetGroup = 'Sport und Bewegung';
    personalReference = 'im Sportbereich';
  } else if (combinedText.includes('umwelt') || combinedText.includes('natur')) {
    targetGroup = 'Umwelt und Nachhaltigkeit';
    personalReference = 'im Umweltschutz';
  }
  
  // Replace placeholders
  email = email.replace('{ORGANIZATION_NAME}', orgName);
  email = email.replace('{ORGANIZATION_TYPE}', orgType);
  email = email.replace('{TARGET_GROUP}', targetGroup);
  email = email.replace('{PERSONAL_REFERENCE}', personalReference);
  
  return email;
}

async function createEmailDrafts() {
  console.log('📧 Creating personalized email drafts for "1.Follow Up Call" stage\n');
  console.log('='.repeat(70));
  
  const pipedriveClient = new PipedriveClient();
  
  try {
    // Fetch all deals from stage 16 (1.Follow Up Call)
    console.log('\n📋 Fetching deals from stage 16 (1.Follow Up Call)...');
    
    let allDeals = [];
    let start = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      const deals = await pipedriveClient.getDeals(limit, start);
      if (deals.length === 0) {
        hasMore = false;
      } else {
        allDeals = allDeals.concat(deals);
        start += limit;
      }
    }
    
    // Filter for stage 16 and open deals
    const stage16Deals = allDeals.filter(deal => 
      deal.stage_id === 16 && deal.status !== 'lost'
    );
    
    console.log(`✅ Found ${stage16Deals.length} deals in "1.Follow Up Call" stage\n`);
    
    if (stage16Deals.length === 0) {
      console.log('No deals to process.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const deal of stage16Deals) {
      try {
        console.log(`\n📝 Processing: ${deal.title} (Deal ID: ${deal.id})`);
        
        // Get person details
        let person = null;
        if (deal.person_id) {
          const personId = typeof deal.person_id === 'object' ? deal.person_id.value : deal.person_id;
          if (personId) {
            person = await pipedriveClient.getPerson(personId);
          }
        }
        
        // Get organization details
        let organization = null;
        if (deal.org_id) {
          const orgId = typeof deal.org_id === 'object' ? deal.org_id.value : deal.org_id;
          if (orgId) {
            organization = await pipedriveClient.getOrganization(orgId);
          }
        }
        
        // Get email address
        let recipientEmail = null;
        let recipientName = null;
        
        if (person && person.email && person.email.length > 0) {
          recipientEmail = person.email[0].value;
          recipientName = person.name;
        } else if (organization && organization.cc_email) {
          recipientEmail = organization.cc_email;
          recipientName = organization.name;
        }
        
        if (!recipientEmail) {
          console.log(`   ⚠️  No email found - skipping`);
          errorCount++;
          continue;
        }
        
        console.log(`   📧 Email: ${recipientEmail}`);
        console.log(`   👤 Contact: ${recipientName || 'Unknown'}`);
        console.log(`   🏢 Organization: ${organization?.name || deal.org_name || 'Unknown'}`);
        
        // Generate personalized email
        const emailBody = await generatePersonalizedEmail(deal, person, organization);
        
        // Create email draft in Pipedrive
        const subject = `Unterstützung bei Fördermitteln für ${organization?.name || deal.org_name || 'Ihre Organisation'}`;
        
        // Note: Pipedrive doesn't have a direct "draft" API, so we'll create an activity (email task)
        const response = await pipedriveClient.makeRequest('POST', '/activities', {
          subject: subject,
          type: 'email',
          deal_id: deal.id,
          person_id: person?.id || null,
          org_id: organization?.id || null,
          note: `EMAIL DRAFT - NICHT GESENDET\n\nAn: ${recipientEmail}\nBetreff: ${subject}\n\n${emailBody}`,
          due_date: new Date().toISOString().split('T')[0],
          due_time: '09:00'
        });
        
        console.log(`   ✅ Email draft created as activity`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount} email drafts created`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n💡 Check Pipedrive activities to review and send the emails!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

createEmailDrafts();

