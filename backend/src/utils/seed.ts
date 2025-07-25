import prisma from '../config/database';

const seedWorkshops = async () => {
  try {
    console.log('🌱 Seeding workshops...');
    
    // Create sample workshops
    const workshops = [
      {
        title: "Introduction to Conflict Resolution",
        description: "Learn the fundamentals of conflict resolution and mediation techniques. This workshop covers basic principles, communication strategies, and practical approaches to resolving disputes.",
        instructor: "Dr. Sarah Johnson",
        maxParticipants: 25,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        duration: 90,
        meetingUrl: "https://zoom.us/j/123456789",
        isActive: true
      },
      {
        title: "Advanced Mediation Techniques",
        description: "Deep dive into advanced mediation strategies for complex disputes. Suitable for those with basic conflict resolution experience.",
        instructor: "Prof. Michael Chen",
        maxParticipants: 20,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        duration: 120,
        meetingUrl: "https://zoom.us/j/987654321",
        isActive: true
      },
      {
        title: "Family Dispute Resolution",
        description: "Specialized workshop focusing on family conflicts, divorce mediation, and child custody disputes. Learn sensitive communication techniques.",
        instructor: "Dr. Emily Rodriguez",
        maxParticipants: 15,
        scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        duration: 105,
        meetingUrl: "https://zoom.us/j/456789123",
        isActive: true
      },
      {
        title: "Workplace Conflict Management",
        description: "Address workplace disputes, team conflicts, and organizational mediation. Perfect for HR professionals and managers.",
        instructor: "James Wilson",
        maxParticipants: 30,
        scheduledAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
        duration: 75,
        meetingUrl: "https://zoom.us/j/789123456",
        isActive: true
      }
    ];

    for (const workshop of workshops) {
      await prisma.workshop.create({
        data: workshop
      });
    }

    console.log('✅ Workshops created successfully');
  } catch (error) {
    console.error('Error seeding workshops:', error);
  }
};

const seedResources = async () => {
  try {
    console.log('🌱 Seeding resources...');
    
    // Create sample resources
    const resources = [
      {
        title: "Understanding Conflict: Types and Causes",
        description: "A comprehensive guide to understanding different types of conflicts and their root causes.",
        content: `# Understanding Conflict: Types and Causes

Conflict is a natural part of human interaction, but understanding its types and causes can help us manage it more effectively.

## Types of Conflict

### 1. Task Conflict
Disagreements about goals, procedures, and work distribution.

### 2. Relationship Conflict
Personal tensions and incompatibilities between individuals.

### 3. Process Conflict
Disagreements about how to accomplish tasks and make decisions.

## Common Causes

- **Communication breakdowns**
- **Competing interests**
- **Resource scarcity**
- **Different values and beliefs**
- **Power struggles**

## Key Takeaways

Understanding the type and cause of conflict is the first step toward effective resolution. Each type requires different approaches and strategies.`,
        type: 'ARTICLE' as const,
        category: 'Fundamentals',
        author: 'Dr. Sarah Johnson',
        isPublished: true,
        tags: ['conflict-types', 'fundamentals', 'theory']
      },
      {
        title: "Active Listening Techniques",
        description: "Master the art of active listening to improve communication and resolve conflicts more effectively.",
        content: `# Active Listening Techniques

Active listening is one of the most powerful tools in conflict resolution. It involves fully concentrating on, understanding, and responding to the speaker.

## Key Components

### 1. Full Attention
- Maintain eye contact
- Avoid distractions
- Show you're engaged

### 2. Reflect and Clarify
- Paraphrase what you heard
- Ask clarifying questions
- Confirm understanding

### 3. Respond Appropriately
- Provide thoughtful feedback
- Ask relevant questions
- Summarize key points

## Practice Exercises

1. **Mirror Exercise**: Practice reflecting back what someone says
2. **Question Ladder**: Ask increasingly specific questions
3. **Summary Challenge**: Summarize complex information

## Benefits

- Builds trust and rapport
- Reduces misunderstandings
- Shows respect for others
- Helps identify root issues`,
        type: 'GUIDE' as const,
        category: 'Communication',
        author: 'Prof. Michael Chen',
        isPublished: true,
        tags: ['listening', 'communication', 'skills']
      },
      {
        title: "Mediation Process Overview",
        description: "Step-by-step guide to the mediation process, from preparation to agreement.",
        content: `# Mediation Process Overview

Mediation is a structured process that helps parties resolve disputes with the help of a neutral third party.

## Phases of Mediation

### 1. Pre-Mediation
- Initial contact and screening
- Scheduling and logistics
- Preparation of parties

### 2. Opening Statements
- Mediator introduction
- Ground rules establishment
- Party statements

### 3. Information Gathering
- Issue identification
- Interest exploration
- Option generation

### 4. Negotiation
- Bargaining and trade-offs
- Reality testing
- Agreement drafting

### 5. Closure
- Agreement finalization
- Implementation planning
- Follow-up arrangements

## Success Factors

- Voluntary participation
- Confidentiality
- Neutral facilitation
- Focus on interests, not positions`,
        type: 'TEMPLATE' as const,
        category: 'Process',
        author: 'Dr. Emily Rodriguez',
        isPublished: true,
        tags: ['mediation', 'process', 'steps']
      }
    ];

    for (const resource of resources) {
      const { tags, ...resourceData } = resource;
      
      await prisma.resource.create({
        data: {
          ...resourceData,
          tags: {
            connectOrCreate: tags.map(tag => ({
              where: { name: tag },
              create: { name: tag }
            }))
          }
        }
      });
    }

    console.log('✅ Resources created successfully');
  } catch (error) {
    console.error('Error seeding resources:', error);
  }
};

const seedAgreementTemplates = async () => {
  try {
    console.log('🌱 Seeding agreement templates...');
    
    const templates = [
      {
        name: "General Dispute Resolution Agreement",
        description: "A comprehensive template for general dispute resolution agreements",
        category: "General",
        content: `DISPUTE RESOLUTION AGREEMENT

This Agreement is entered into on [DATE] between:

Party A: [PLAINTIFF_NAME]
Address: [PLAINTIFF_ADDRESS]
Email: [PLAINTIFF_EMAIL]

Party B: [DEFENDANT_NAME]  
Address: [DEFENDANT_ADDRESS]
Email: [DEFENDANT_EMAIL]

WHEREAS, the parties have been involved in a dispute regarding [DISPUTE_DESCRIPTION];

WHEREAS, the parties desire to resolve this matter amicably through mediation;

NOW, THEREFORE, the parties agree as follows:

1. RESOLUTION TERMS
[RESOLUTION_DETAILS]

2. PAYMENT TERMS (if applicable)
[PAYMENT_TERMS]

3. CONFIDENTIALITY
Both parties agree to keep the terms of this agreement confidential.

4. COMPLIANCE
Both parties agree to comply with all terms of this agreement.

5. ENFORCEMENT
This agreement shall be binding upon both parties and their successors.

IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.

_________________________    _________________________
[PLAINTIFF_NAME]              [DEFENDANT_NAME]
Date: _______________         Date: _______________`
      },
      {
        name: "Family Dispute Resolution Agreement",
        description: "Template specifically designed for family-related disputes",
        category: "Family",
        content: `FAMILY DISPUTE RESOLUTION AGREEMENT

This Family Agreement is made on [DATE] between:

[PARTY_1_NAME] and [PARTY_2_NAME]

BACKGROUND:
The parties have participated in mediation to resolve family matters including:
[DISPUTE_ISSUES]

AGREEMENTS REACHED:

1. CUSTODY ARRANGEMENTS (if applicable)
[CUSTODY_TERMS]

2. FINANCIAL ARRANGEMENTS
[FINANCIAL_TERMS]

3. COMMUNICATION PROTOCOL
[COMMUNICATION_TERMS]

4. FUTURE DISPUTE RESOLUTION
Any future disputes will be addressed through mediation before pursuing other remedies.

5. BEST INTERESTS OF CHILDREN
All decisions prioritize the best interests of any children involved.

This agreement represents the complete understanding between the parties.

_________________________    _________________________
[PARTY_1_NAME]               [PARTY_2_NAME]
Date: _______________        Date: _______________`
      },
      {
        name: "Business Dispute Resolution Agreement",
        description: "Template for resolving business and commercial disputes",
        category: "Business",
        content: `BUSINESS DISPUTE RESOLUTION AGREEMENT

Agreement Date: [DATE]

Parties:
Company A: [COMPANY_A_NAME]
Representative: [REP_A_NAME]
Title: [REP_A_TITLE]

Company B: [COMPANY_B_NAME]
Representative: [REP_B_NAME]
Title: [REP_B_TITLE]

DISPUTE SUMMARY:
[DISPUTE_DESCRIPTION]

RESOLUTION TERMS:

1. BUSINESS ARRANGEMENTS
[BUSINESS_TERMS]

2. FINANCIAL SETTLEMENT
[FINANCIAL_SETTLEMENT]

3. ONGOING BUSINESS RELATIONSHIP
[RELATIONSHIP_TERMS]

4. INTELLECTUAL PROPERTY (if applicable)
[IP_TERMS]

5. NON-DISCLOSURE
Both parties agree to maintain confidentiality regarding proprietary information.

6. FUTURE DISPUTES
Any future business disputes will be resolved through mediation.

AUTHORIZED SIGNATURES:

_________________________    _________________________
[REP_A_NAME]                 [REP_B_NAME]
[TITLE]                      [TITLE]
[COMPANY_A_NAME]             [COMPANY_B_NAME]
Date: _______________        Date: _______________`
      }
    ];

    for (const template of templates) {
      await prisma.agreementTemplate.create({
        data: template
      });
    }

    console.log('✅ Agreement templates created successfully');
  } catch (error) {
    console.error('Error seeding agreement templates:', error);
  }
};

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Run all seeding functions
    await seedWorkshops();
    await seedResources();
    await seedAgreementTemplates();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();