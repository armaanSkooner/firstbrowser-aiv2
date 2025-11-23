import OpenAI from "openai";
import { fetchWebsiteText } from "./scraper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AnswerEngineResult {
  engine: string;
  query: string;
  appearance: string;
  lastSeen: string;
  response: string;
  mentioned: boolean;
}

interface CompanyAnalysisResult {
  name: string;
  industry: string;
  location: string;
  website: string;
  aeoScore: number;
  geoScore: number;
  answerEngines: Array<{
    engine: string;
    query: string;
    appearance: string;
    lastSeen: string;
  }>;
  topQueries: Array<{
    query: string;
    category: string;
  }>;
  localPresence: {
    countries: Array<{
      country: string;
      cities: number;
      avgRating: number;
      reviewCount: number;
    }>;
  };
  citations: {
    missing: number;
    total: number;
    present: string[];
  };
  contacts: Array<{
    name: string;
    role: string;
    linkedIn?: string;
  }>;
  potentialImpact: {
    score: number;
    compared: string;
    totalMarket: number;
  };
  competitors?: string[];
}

async function callOpenAIWithRetry(apiCall: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`OpenAI API timeout - attempt ${attempt}`)), 30000)
      );
      return await Promise.race([apiCall(), timeoutPromise]);
    } catch (error: any) {
      console.log(`OpenAI API attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Extract company information from query
async function extractCompanyInfo(query: string): Promise<{
  name: string;
  isUrl: boolean;
  url?: string;
}> {
  const urlPattern = /^https?:\/\//i;
  const isUrl = urlPattern.test(query);

  if (isUrl) {
    // Extract company name from URL
    const domain = new URL(query).hostname.replace('www.', '');
    const name = domain.split('.')[0];
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      isUrl: true,
      url: query
    };
  }

  return {
    name: query,
    isUrl: false
  };
}

// Get company details using AI
async function getCompanyDetails(companyName: string, websiteUrl?: string): Promise<{
  industry: string;
  location: string;
  website: string;
  description: string;
}> {
  let websiteContent = "";

  if (websiteUrl) {
    try {
      websiteContent = await fetchWebsiteText(websiteUrl);
    } catch (error) {
      console.log("Could not fetch website content, proceeding with AI knowledge only");
    }
  }

  const prompt = `Analyze this company: "${companyName}"
  ${websiteContent ? `\nWebsite content:\n${websiteContent.substring(0, 2000)}` : ""}

  Provide a JSON response with:
  - industry: The primary industry/sector
  - location: Primary headquarters location (City, Country)
  - website: Official website URL (if known or can be inferred)
  - description: Brief 2-3 sentence description

  Respond ONLY with valid JSON.`;

  const response = await callOpenAIWithRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a business analyst. Provide accurate company information in JSON format."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })
  );

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

// Generate diverse queries for testing
async function generateTestQueries(companyName: string, industry: string): Promise<string[]> {
  const prompt = `Generate 10 diverse search queries that people might use when looking for information about companies in the "${industry}" industry.

  The company we're analyzing is "${companyName}".

  Include a mix of:
  - Direct queries about the company
  - Industry comparison queries
  - Problem-solving queries where this company might be mentioned
  - "Best of" and recommendation queries
  - How-to and informational queries

  Respond with a JSON array of query strings only.`;

  const response = await callOpenAIWithRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a search query expert. Generate realistic user queries."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    })
  );

  const content = response.choices[0].message.content || '{"queries":[]}';
  const parsed = JSON.parse(content);
  return parsed.queries || [];
}

// Test a query across different AI models (simulated for now, using different prompts)
async function testQueryAcrossEngines(
  query: string,
  companyName: string
): Promise<AnswerEngineResult[]> {
  const engines = [
    { name: "ChatGPT", temp: 0.7 },
    { name: "Perplexity", temp: 0.5 },
  ];

  const results: AnswerEngineResult[] = [];

  for (const engine of engines) {
    try {
      const response = await callOpenAIWithRetry(() =>
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are ${engine.name}, an AI assistant. Answer questions helpfully and mention relevant companies, products, and solutions.`
            },
            { role: "user", content: query }
          ],
          temperature: engine.temp,
        })
      );

      const answer = response.choices[0].message.content || "";
      const mentioned = answer.toLowerCase().includes(companyName.toLowerCase());

      // Determine appearance type
      let appearance = "Not mentioned";
      if (mentioned) {
        const position = answer.toLowerCase().indexOf(companyName.toLowerCase());
        appearance = position < 200 ? "Mentioned prominently" : "Mentioned";
      }

      results.push({
        engine: engine.name,
        query,
        appearance,
        lastSeen: new Date().toISOString().split('T')[0],
        response: answer,
        mentioned
      });
    } catch (error) {
      console.error(`Error testing on ${engine.name}:`, error);
    }
  }

  return results;
}

// Calculate AEO score based on visibility
function calculateAEOScore(allResults: AnswerEngineResult[]): number {
  if (allResults.length === 0) return 0;

  const mentionedResults = allResults.filter(r => r.mentioned);
  const coverage = (mentionedResults.length / allResults.length) * 100;

  // Weight prominent mentions higher
  const prominentCount = allResults.filter(r => r.appearance === "Mentioned prominently").length;
  const prominence = (prominentCount / allResults.length) * 100;

  // Simple scoring: 60% coverage + 40% prominence
  const score = (coverage * 0.6) + (prominence * 0.4);

  return Math.round(score);
}

// Calculate GEO score (simplified - would need real local data)
function calculateGEOScore(companyName: string): number {
  // This is a placeholder - in production, you'd query Google My Business,
  // Yelp, local directories, etc.
  return Math.floor(Math.random() * 30) + 70; // Random 70-100 for demo
}

// Extract key contacts using AI
async function extractContacts(companyName: string, websiteUrl?: string): Promise<Array<{
  name: string;
  role: string;
  linkedIn?: string;
}>> {
  const prompt = `Find key executive contacts for "${companyName}".
  ${websiteUrl ? `Website: ${websiteUrl}` : ""}

  Provide a JSON array of contacts with name, role, and LinkedIn URL (if available).
  Include C-level executives, founders, or managing partners.

  Format: {"contacts": [{"name": "...", "role": "...", "linkedIn": "..."}]}`;

  try {
    const response = await callOpenAIWithRetry(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a business research assistant. Provide accurate contact information."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    );

    const content = response.choices[0].message.content || '{"contacts":[]}';
    const parsed = JSON.parse(content);
    return parsed.contacts || [];
  } catch (error) {
    console.error("Error extracting contacts:", error);
    return [];
  }
}

// Main analysis function
export async function analyzeCompanyAEO(query: string): Promise<CompanyAnalysisResult> {
  console.log(`Starting AEO analysis for: ${query}`);

  // Step 1: Extract company info
  const companyInfo = await extractCompanyInfo(query);

  // Step 2: Get detailed company information
  const details = await getCompanyDetails(companyInfo.name, companyInfo.url);

  // Step 3: Generate test queries
  const testQueries = await generateTestQueries(companyInfo.name, details.industry);
  console.log(`Generated ${testQueries.length} test queries`);

  // Step 4: Test queries across engines (sample 5 for performance)
  const queriesToTest = testQueries.slice(0, 5);
  const allResults: AnswerEngineResult[] = [];

  for (const query of queriesToTest) {
    const results = await testQueryAcrossEngines(query, companyInfo.name);
    allResults.push(...results);
  }

  console.log(`Tested ${allResults.length} engine responses`);

  // Step 5: Calculate scores
  const aeoScore = calculateAEOScore(allResults);
  const geoScore = calculateGEOScore(companyInfo.name);

  // Step 6: Extract contacts
  const contacts = await extractContacts(companyInfo.name, details.website);

  // Step 7: Categorize queries
  const topQueries = testQueries.slice(0, 4).map((q, i) => ({
    query: q,
    category: i % 2 === 0 ? "Industry" : "Comparison"
  }));

  // Step 8: Calculate citations
  const enginesWithMentions = new Set(
    allResults.filter(r => r.mentioned).map(r => r.engine)
  );

  const totalEngines = 2; // ChatGPT, Perplexity
  const citationsMissing = totalEngines - enginesWithMentions.size;

  // Step 9: Create local presence data (simplified)
  const localPresence = {
    countries: [
      {
        country: "Canada",
        cities: 7,
        avgRating: 4.8,
        reviewCount: 50
      },
      {
        country: "United States",
        cities: 3,
        avgRating: 4.7,
        reviewCount: 30
      }
    ]
  };

  // Step 10: Compile results
  const result: CompanyAnalysisResult = {
    name: companyInfo.name,
    industry: details.industry,
    location: details.location,
    website: details.website || companyInfo.url || `https://${companyInfo.name.toLowerCase()}.com`,
    aeoScore,
    geoScore,
    answerEngines: allResults
      .filter(r => r.mentioned)
      .slice(0, 4)
      .map(r => ({
        engine: r.engine,
        query: r.query,
        appearance: r.appearance,
        lastSeen: r.lastSeen
      })),
    topQueries,
    localPresence,
    citations: {
      missing: citationsMissing,
      total: totalEngines,
      present: Array.from(enginesWithMentions)
    },
    contacts: contacts.slice(0, 3),
    potentialImpact: {
      score: Math.max(0, 100 - aeoScore),
      compared: "Airbnb",
      totalMarket: 1000
    }
  };

  console.log(`AEO analysis complete. Score: ${aeoScore}/100`);

  return result;
}
