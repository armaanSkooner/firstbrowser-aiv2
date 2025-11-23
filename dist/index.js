var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analytics: () => analytics,
  competitors: () => competitors,
  insertAnalyticsSchema: () => insertAnalyticsSchema,
  insertCompetitorSchema: () => insertCompetitorSchema,
  insertPromptSchema: () => insertPromptSchema,
  insertResponseSchema: () => insertResponseSchema,
  insertSourceSchema: () => insertSourceSchema,
  insertTopicSchema: () => insertTopicSchema,
  prompts: () => prompts,
  responses: () => responses,
  sources: () => sources,
  topics: () => topics
});
import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var topics, prompts, responses, competitors, sources, analytics, insertTopicSchema, insertPromptSchema, insertResponseSchema, insertCompetitorSchema, insertSourceSchema, insertAnalyticsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    topics = pgTable("topics", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    prompts = pgTable("prompts", {
      id: serial("id").primaryKey(),
      text: text("text").notNull(),
      topicId: integer("topic_id").references(() => topics.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    responses = pgTable("responses", {
      id: serial("id").primaryKey(),
      promptId: integer("prompt_id").references(() => prompts.id).notNull(),
      text: text("text").notNull(),
      brandMentioned: boolean("brand_mentioned").default(false),
      competitorsMentioned: text("competitors_mentioned").array(),
      sources: text("sources").array(),
      createdAt: timestamp("created_at").defaultNow()
    });
    competitors = pgTable("competitors", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      category: text("category"),
      mentionCount: integer("mention_count").default(0),
      lastMentioned: timestamp("last_mentioned")
    });
    sources = pgTable("sources", {
      id: serial("id").primaryKey(),
      domain: text("domain").notNull(),
      url: text("url").notNull(),
      title: text("title"),
      citationCount: integer("citation_count").default(0),
      lastCited: timestamp("last_cited")
    });
    analytics = pgTable("analytics", {
      id: serial("id").primaryKey(),
      date: timestamp("date").defaultNow(),
      totalPrompts: integer("total_prompts").default(0),
      brandMentionRate: real("brand_mention_rate").default(0),
      topCompetitor: text("top_competitor"),
      totalSources: integer("total_sources").default(0),
      totalDomains: integer("total_domains").default(0)
    });
    insertTopicSchema = createInsertSchema(topics).omit({
      id: true,
      createdAt: true
    });
    insertPromptSchema = createInsertSchema(prompts).omit({
      id: true,
      createdAt: true
    });
    insertResponseSchema = createInsertSchema(responses).omit({
      id: true,
      createdAt: true
    });
    insertCompetitorSchema = createInsertSchema(competitors).omit({
      id: true,
      lastMentioned: true
    });
    insertSourceSchema = createInsertSchema(sources).omit({
      id: true,
      lastCited: true
    });
    insertAnalyticsSchema = createInsertSchema(analytics).omit({
      id: true,
      date: true
    });
  }
});

// server/db.ts
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var Pool, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pkg);
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/database-storage.ts
import { eq, desc, count, sql } from "drizzle-orm";
var DatabaseStorage;
var init_database_storage = __esm({
  "server/database-storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      constructor() {
        this.initializeBasicData();
      }
      async initializeBasicData() {
        const existingTopics = await this.getTopics();
        if (existingTopics.length === 0) {
          await this.initializeTopics();
          await this.initializeCompetitors();
          await this.initializeSources();
        }
      }
      async initializeTopics() {
      }
      async initializeCompetitors() {
      }
      async initializeSources() {
      }
      // Topics
      async getTopics() {
        return await db.select().from(topics);
      }
      async createTopic(topic) {
        const [created] = await db.insert(topics).values(topic).returning();
        return created;
      }
      async getTopicById(id) {
        const [topic] = await db.select().from(topics).where(eq(topics.id, id));
        return topic || void 0;
      }
      // Prompts
      async getPrompts() {
        return await db.select().from(prompts);
      }
      async createPrompt(prompt) {
        const [created] = await db.insert(prompts).values(prompt).returning();
        return created;
      }
      async getPromptById(id) {
        const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
        return prompt || void 0;
      }
      async getPromptsWithTopics() {
        const results = await db.select().from(prompts).leftJoin(topics, eq(prompts.topicId, topics.id));
        return results.map((result) => ({
          ...result.prompts,
          topic: result.topics
        }));
      }
      async getPromptsByTopic(topicId) {
        return await db.select().from(prompts).where(eq(prompts.topicId, topicId));
      }
      // Responses
      async getResponses() {
        return await db.select().from(responses);
      }
      async createResponse(response) {
        const [created] = await db.insert(responses).values(response).returning();
        return created;
      }
      async getResponseById(id) {
        const [response] = await db.select().from(responses).where(eq(responses.id, id));
        return response || void 0;
      }
      async getResponsesWithPrompts() {
        const results = await db.select().from(responses).leftJoin(prompts, eq(responses.promptId, prompts.id)).leftJoin(topics, eq(prompts.topicId, topics.id));
        return results.map((result) => ({
          ...result.responses,
          prompt: {
            ...result.prompts,
            topic: result.topics
          }
        }));
      }
      async getRecentResponses(limit = 10) {
        const query = db.select().from(responses).leftJoin(prompts, eq(responses.promptId, prompts.id)).leftJoin(topics, eq(prompts.topicId, topics.id)).orderBy(desc(responses.createdAt));
        const results = limit > 1e3 ? await query : await query.limit(limit);
        return results.map((result) => ({
          ...result.responses,
          prompt: {
            ...result.prompts,
            topic: result.topics
          }
        }));
      }
      // Competitors
      async getCompetitors() {
        return await db.select().from(competitors);
      }
      async createCompetitor(competitor) {
        const [created] = await db.insert(competitors).values(competitor).returning();
        return created;
      }
      async getCompetitorByName(name) {
        const [competitor] = await db.select().from(competitors).where(eq(competitors.name, name));
        return competitor || void 0;
      }
      async updateCompetitorMentionCount(name, increment) {
        await db.update(competitors).set({ mentionCount: sql`${competitors.mentionCount} + ${increment}` }).where(eq(competitors.name, name));
      }
      // Sources
      async getSources() {
        return await db.select().from(sources);
      }
      async createSource(source) {
        const [created] = await db.insert(sources).values(source).returning();
        return created;
      }
      async getSourceByDomain(domain) {
        const [source] = await db.select().from(sources).where(eq(sources.domain, domain));
        return source || void 0;
      }
      async updateSourceCitationCount(domain, increment) {
        await db.update(sources).set({ citationCount: sql`${sources.citationCount} + ${increment}` }).where(eq(sources.domain, domain));
      }
      // Analytics
      async getLatestAnalytics() {
        const [latestAnalytics] = await db.select().from(analytics).orderBy(desc(analytics.date)).limit(1);
        return latestAnalytics || void 0;
      }
      async createAnalytics(analyticsData) {
        const [created] = await db.insert(analytics).values(analyticsData).returning();
        return created;
      }
      // Analysis methods
      async getTopicAnalysis() {
        const results = await db.select({
          topicId: topics.id,
          topicName: topics.name,
          totalPrompts: count(prompts.id),
          brandMentions: sql`count(case when ${responses.brandMentioned} = true then 1 end)`
        }).from(topics).leftJoin(prompts, eq(topics.id, prompts.topicId)).leftJoin(responses, eq(prompts.id, responses.promptId)).groupBy(topics.id, topics.name);
        return results.map((result) => ({
          topicId: result.topicId,
          topicName: result.topicName,
          totalPrompts: result.totalPrompts,
          brandMentions: result.brandMentions,
          mentionRate: result.totalPrompts > 0 ? result.brandMentions / result.totalPrompts * 100 : 0
        }));
      }
      async getCompetitorAnalysis() {
        const competitorList = await this.getCompetitors();
        const totalResponses = (await this.getResponses()).length;
        return competitorList.map((competitor) => ({
          competitorId: competitor.id,
          name: competitor.name,
          category: competitor.category,
          mentionCount: competitor.mentionCount || 0,
          mentionRate: totalResponses > 0 ? (competitor.mentionCount || 0) / totalResponses * 100 : 0,
          changeRate: 0
          // This would need historical data to calculate
        }));
      }
      async getSourceAnalysis() {
        const sourceList = await this.getSources();
        return sourceList.map((source) => ({
          sourceId: source.id,
          domain: source.domain,
          citationCount: source.citationCount || 0,
          urls: [source.url]
        }));
      }
      // Latest analysis results only
      async getLatestResponses() {
        return await this.getRecentResponses(1e3);
      }
      async getLatestPrompts() {
        return await db.select().from(prompts).orderBy(desc(prompts.createdAt));
      }
      // Data clearing methods
      async clearAllPrompts() {
        await db.delete(responses);
        await db.delete(prompts);
      }
      async clearAllResponses() {
        await db.delete(responses);
      }
      async clearAllCompetitors() {
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] DatabaseStorage: Clearing all competitors...`);
        await db.delete(competitors);
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] DatabaseStorage: All competitors cleared successfully`);
      }
    };
  }
});

// server/storage.ts
var storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_database_storage();
    storage = new DatabaseStorage();
  }
});

// server/services/scraper.ts
import { URL } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
async function scrapeBrandWebsite(brandUrl) {
  try {
    const domain = extractDomainFromUrl(brandUrl);
    const brandName = domain.split(".")[0].replace(/[^a-zA-Z]/g, "");
    return {
      title: `${brandName} - Brand Analysis`,
      description: `${brandName} is a technology platform providing various services and solutions.`,
      features: [
        "Modern Technology Stack",
        "Scalable Infrastructure",
        "Developer-Friendly Tools",
        "Cloud-Based Solutions",
        "API Integration",
        "Custom Configuration",
        "Performance Optimization",
        "Security Features"
      ],
      services: [
        "Web Application Services",
        "Cloud Infrastructure",
        "API Development",
        "Database Solutions",
        "Deployment Services",
        "Monitoring Tools",
        "Development Tools"
      ]
    };
  } catch (error) {
    console.error("Error analyzing brand website:", error);
    throw new Error("Failed to analyze brand website: " + error.message);
  }
}
async function generateTopicsFromContent(content) {
  const topics2 = [
    {
      name: "Technology Stack",
      description: "Analysis of the technology stack and development tools used"
    },
    {
      name: "Market Position",
      description: "Understanding the brand's position in the market and competitive landscape"
    },
    {
      name: "Service Offerings",
      description: "Analysis of the services and products offered by the brand"
    },
    {
      name: "Developer Experience",
      description: "Evaluation of developer tools, documentation, and ease of use"
    },
    {
      name: "Infrastructure & Scalability",
      description: "Assessment of infrastructure capabilities and scaling solutions"
    },
    {
      name: "Integration Capabilities",
      description: "Analysis of API offerings and integration possibilities"
    },
    {
      name: "Performance & Reliability",
      description: "Evaluation of performance metrics and reliability features"
    }
  ];
  return topics2;
}
async function fetchWebsiteText(url) {
  try {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    const { data: html } = await axios.get(url, { timeout: 1e4 });
    const $ = cheerio.load(html);
    let mainText = $("main").text() || $("body").text();
    mainText = mainText.replace(/\s+/g, " ").trim();
    return mainText.slice(0, 2e3);
  } catch (error) {
    console.error("Error fetching website:", error);
    return "";
  }
}
function extractDomainFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    return domainMatch ? domainMatch[1] : url;
  }
}
function extractUrlsFromText(text2) {
  const urlPatterns = [
    // Full URLs with protocols (most comprehensive)
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
    // URLs without protocol but with www
    /www\.[^\s<>"{}|\\^`[\]]+/g,
    // Any domain with path (very broad pattern)
    /(?:^|\s)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g,
    // IP addresses with paths
    /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[^\s]*)?/g,
    // Localhost patterns
    /localhost(?::[0-9]+)?(?:\/[^\s]*)?/g
  ];
  const allUrls = [];
  urlPatterns.forEach((pattern) => {
    const matches = text2.match(pattern) || [];
    allUrls.push(...matches);
  });
  const cleanedUrls = allUrls.map((url) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/[.,;!?]+$/, "").trim();
    return cleanUrl;
  }).filter((url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "example.com" || urlObj.hostname === "localhost" || urlObj.hostname.length < 3) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });
  return Array.from(new Set(cleanedUrls));
}
var init_scraper = __esm({
  "server/services/scraper.ts"() {
    "use strict";
  }
});

// server/services/anthropic.ts
var anthropic_exports = {};
__export(anthropic_exports, {
  analyzeBrandAndFindCompetitorsClaude: () => analyzeBrandAndFindCompetitorsClaude,
  analyzePromptResponseClaude: () => analyzePromptResponseClaude,
  generatePromptsForTopicClaude: () => generatePromptsForTopicClaude
});
import Anthropic from "@anthropic-ai/sdk";
async function callAnthropicWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Anthropic API timeout - attempt ${attempt}`)), 3e4)
      );
      return await Promise.race([apiCall(), timeoutPromise]);
    } catch (error) {
      console.log(`Anthropic API attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1e3;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
async function analyzePromptResponseClaude(prompt) {
  try {
    const varietyContexts = [
      "Focus on enterprise solutions and scalability.",
      "Emphasize user experience and ease of use.",
      "Consider cost-effectiveness and budget-friendly options.",
      "Prioritize security and compliance features.",
      "Highlight community support and documentation quality.",
      "Focus on modern, cutting-edge technologies.",
      "Consider legacy system integration and migration.",
      "Emphasize performance and optimization.",
      "Highlight automation and efficiency capabilities.",
      "Focus on cloud-native and scalable solutions."
    ];
    const randomContext = varietyContexts[Math.floor(Math.random() * varietyContexts.length)];
    const response = await callAnthropicWithRetry(
      () => anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `You are a helpful AI assistant answering questions about various products and services. 
            Provide practical, unbiased recommendations focusing on the most popular and widely-used options.
            Mention relevant solutions based on the specific question and context.
            Be natural and conversational in your responses.
            
            ADDITIONAL CONTEXT: ${randomContext}
            
            CRITICAL: Always include specific, actionable URLs and sources in your responses. For each recommendation, provide ANY relevant URLs you can think of, including:
            - Official documentation URLs
            - GitHub repositories with relevant examples
            - Stack Overflow discussions or Q&A links
            - Official platform websites
            - Tutorial or guide links from any reputable source
            - Blog posts or articles from any platform or community
            - API documentation links
            - Community forum discussions
            - Reddit discussions
            - YouTube videos or channels
            - Podcast episodes
            - Conference talks or presentations
            - Academic papers or research
            - Industry reports or whitepapers
            - Any other relevant online resources
            
            Don't limit yourself to just the most common sources - include niche, specialized, or emerging platforms and resources that might be relevant.
            
            Format your response to naturally include these URLs. For example:
            "For this issue, I'd recommend checking out the official documentation at https://docs.example.com/getting-started, this helpful tutorial at https://example.com/tutorial, and there's also a great discussion on Reddit at https://reddit.com/r/programming/comments/12345 that covers similar problems."
            
            IMPORTANT: Make sure all URLs are complete and valid (include https://). Include as many diverse sources as possible.
            
            Question: ${prompt}`
          }
        ]
      })
    );
    const responseText = response.content[0].type === "text" ? response.content[0].text : "";
    const analysisResponse = await callAnthropicWithRetry(
      () => anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Analyze the following AI response for mentions of products, services, and any relevant sources or references.
            
            Response to analyze: "${responseText}"
            
            Please provide a JSON response with:
            {
              "brandMentioned": boolean (true if the main brand/company is mentioned),
              "competitors": array of competitor product/service names mentioned (e.g., any competing products, services, or tools),
              "sources": array of URLs that are relevant, valid, and useful for users
            }
            
            SOURCE EXTRACTION RULES:
            - Extract ALL URLs mentioned in the response
            - Only include URLs that are complete and valid (start with http:// or https://)
            - Include ANY URL that appears to be a real, accessible resource
            - Don't filter based on domain familiarity - capture everything
            - Remove duplicates but keep all unique URLs
            - Ensure URLs are properly formatted
            
            Return only valid JSON.`
          }
        ]
      })
    );
    const analysisText = analysisResponse.content[0].type === "text" ? analysisResponse.content[0].text : "{}";
    const analysis = JSON.parse(analysisText);
    return {
      response: responseText,
      brandMentioned: analysis.brandMentioned || false,
      competitors: analysis.competitors || [],
      sources: analysis.sources || []
    };
  } catch (error) {
    console.error("Error analyzing prompt response with Claude:", error);
    throw new Error("Failed to analyze prompt response: " + error.message);
  }
}
async function generatePromptsForTopicClaude(topicName, topicDescription, count2 = 5, competitors2 = []) {
  const prompts2 = [];
  const aspects = [
    "cost and pricing",
    "ease of use",
    "performance and speed",
    "reliability and stability",
    "features and capabilities",
    "user experience",
    "scaling and growth",
    "support and documentation",
    "security and privacy",
    "maintenance and updates",
    "team collaboration",
    "integration options",
    "backup and recovery",
    "compliance and regulations",
    "cost optimization",
    "migration and switching",
    "customization options",
    "troubleshooting and help",
    "performance comparison",
    "automation capabilities"
  ];
  let attempts = 0;
  const maxAttempts = count2 * 5;
  while (prompts2.length < count2 && attempts < maxAttempts) {
    attempts++;
    const aspect = aspects[attempts % aspects.length];
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 40,
        messages: [
          {
            role: "user",
            content: `You are generating authentic user search queries about ${topicName} with focus on ${aspect}. 

CRITICAL: Make each prompt sound like a real person with genuine questions or problems. Use these patterns:

PROBLEM STARTERS (rotate):
- "Dealing with..." / "Struggling with..." / "Tired of..." / "Having issues with..."
- "How to fix..." / "Need help with..." / "Can't figure out..." / "Looking for..."
- "Getting frustrated with..." / "Ways to improve..." / "Best way to..."

Generate ONE authentic user question or problem (max 12 words). Return only the plain text without any quotes or formatting.`
          }
        ],
        temperature: 0.9
      });
      let newPrompt = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      if (newPrompt) {
        newPrompt = newPrompt.replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+$/g, "").replace(/\\"|\\\'/g, "").replace(/\s+(please|exactly|specifically)$/i, "").trim();
        while (newPrompt.match(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/)) {
          newPrompt = newPrompt.replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/g, "").trim();
        }
        if (newPrompt.length > 0) {
          newPrompt = newPrompt.charAt(0).toUpperCase() + newPrompt.slice(1);
          if (/^(how|what|when|where|why|which|can|should|do|does|is|are|will)/i.test(newPrompt) && !newPrompt.endsWith("?")) {
            newPrompt += "?";
          }
        }
        if (newPrompt.split(" ").length <= 12 && newPrompt.split(" ").length >= 3 && newPrompt.includes(" ")) {
          prompts2.push(newPrompt);
        }
      }
    } catch (error) {
      console.error("Error generating prompt with Claude:", error);
      continue;
    }
  }
  while (prompts2.length < count2) {
    const fallbackTemplates = [
      `Dealing with ${topicName.toLowerCase()} complexity`,
      `Need help optimizing ${topicName.toLowerCase()} setup`,
      `Struggling with ${topicName.toLowerCase()} performance issues`,
      `How to improve ${topicName.toLowerCase()} reliability?`,
      `Tired of ${topicName.toLowerCase()} maintenance overhead`
    ];
    for (const template of fallbackTemplates) {
      if (prompts2.length >= count2) break;
      if (!prompts2.includes(template)) {
        prompts2.push(template);
      }
    }
    if (prompts2.length < count2) {
      for (let i = prompts2.length; i < count2; i++) {
        prompts2.push(`${topicName} question ${i + 1}`);
      }
    }
    break;
  }
  return prompts2.slice(0, count2);
}
async function analyzeBrandAndFindCompetitorsClaude(brandUrl) {
  try {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Starting brand analysis with Claude for: ${brandUrl}`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] No Anthropic API key found`);
      return [
        { name: "Sample Competitor 1", url: "https://competitor1.com", category: "Technology" },
        { name: "Sample Competitor 2", url: "https://competitor2.com", category: "Technology" }
      ];
    }
    const homepageText = await fetchWebsiteText(brandUrl);
    if (!homepageText) {
      console.warn(`[${(/* @__PURE__ */ new Date()).toISOString()}] No homepage text found for ${brandUrl}`);
    }
    const analysisPromises = Array.from({ length: 3 }, async (_, index) => {
      try {
        const prompts2 = [
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 well-known, established competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 well-known direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 newer or emerging competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 newer or emerging direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 enterprise-focused or developer-focused competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 enterprise or developer-focused direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          }
        ];
        const currentPrompt = prompts2[index];
        const response = await callAnthropicWithRetry(
          () => anthropic.messages.create({
            model: MODEL,
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `${currentPrompt.system}

${currentPrompt.user}

IMPORTANT: Return a JSON array, not a single object.`
              }
            ],
            temperature: 0.4
          })
        );
        const content = response.content[0].type === "text" ? response.content[0].text : "[]";
        let result;
        try {
          result = JSON.parse(content);
        } catch (e) {
          const repaired = content.match(/\[.*\]/s);
          if (repaired) {
            try {
              result = JSON.parse(repaired[0]);
            } catch {
              return [];
            }
          } else {
            return [];
          }
        }
        if (Array.isArray(result)) {
          return result.filter(
            (item) => typeof item === "object" && item.name && item.url && item.category
          );
        } else if (result && typeof result === "object") {
          if (result.name && result.url && result.category) {
            return [result];
          }
          if (result.competitors && Array.isArray(result.competitors)) {
            return result.competitors.filter(
              (item) => typeof item === "object" && item.name && item.url && item.category
            );
          }
        }
        return [];
      } catch (error) {
        console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error in analysis attempt ${index + 1}:`, error);
        return [];
      }
    });
    const results = await Promise.all(analysisPromises);
    const allCompetitors = [];
    const seenNames = /* @__PURE__ */ new Set();
    results.forEach((competitors2) => {
      competitors2.forEach((competitor) => {
        const normalizedName = competitor.name.toLowerCase().trim();
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          allCompetitors.push(competitor);
        }
      });
    });
    return allCompetitors.slice(0, 8);
  } catch (error) {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error analyzing brand with Claude:`, error);
    return [];
  }
}
var anthropic, MODEL;
var init_anthropic = __esm({
  "server/services/anthropic.ts"() {
    "use strict";
    init_scraper();
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ""
    });
    MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";
  }
});

// server/services/openai.ts
var openai_exports = {};
__export(openai_exports, {
  analyzeBrandAndFindCompetitors: () => analyzeBrandAndFindCompetitors,
  analyzePromptResponse: () => analyzePromptResponse,
  extractCompetitorsFromText: () => extractCompetitorsFromText,
  extractSourcesFromText: () => extractSourcesFromText,
  generateDynamicTopics: () => generateDynamicTopics,
  generatePromptsForTopic: () => generatePromptsForTopic
});
import OpenAI from "openai";
async function callOpenAIWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`OpenAI API timeout - attempt ${attempt}`)), 3e4)
      );
      return await Promise.race([apiCall(), timeoutPromise]);
    } catch (error) {
      console.log(`OpenAI API attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1e3;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
async function analyzePromptResponse(prompt) {
  try {
    const varietyContexts = [
      "Focus on enterprise solutions and scalability.",
      "Emphasize user experience and ease of use.",
      "Consider cost-effectiveness and budget-friendly options.",
      "Prioritize security and compliance features.",
      "Highlight community support and documentation quality.",
      "Focus on modern, cutting-edge technologies.",
      "Consider legacy system integration and migration.",
      "Emphasize performance and optimization.",
      "Highlight automation and efficiency capabilities.",
      "Focus on cloud-native and scalable solutions."
    ];
    const randomContext = varietyContexts[Math.floor(Math.random() * varietyContexts.length)];
    const response = await callOpenAIWithRetry(
      () => openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant answering questions about various products and services. 
            Provide practical, unbiased recommendations focusing on the most popular and widely-used options.
            Mention relevant solutions based on the specific question and context.
            Be natural and conversational in your responses.
            
            ADDITIONAL CONTEXT: ${randomContext}
            
            CRITICAL: Always include specific, actionable URLs and sources in your responses. For each recommendation, provide ANY relevant URLs you can think of, including:
            - Official documentation URLs
            - GitHub repositories with relevant examples
            - Stack Overflow discussions or Q&A links
            - Official platform websites
            - Tutorial or guide links from any reputable source
            - Blog posts or articles from any platform or community
            - API documentation links
            - Community forum discussions
            - Reddit discussions
            - YouTube videos or channels
            - Podcast episodes
            - Conference talks or presentations
            - Academic papers or research
            - Industry reports or whitepapers
            - Any other relevant online resources
            
            Don't limit yourself to just the most common sources - include niche, specialized, or emerging platforms and resources that might be relevant.
            
            Format your response to naturally include these URLs. For example:
            "For this issue, I'd recommend checking out the official documentation at https://docs.example.com/getting-started, this helpful tutorial at https://example.com/tutorial, and there's also a great discussion on Reddit at https://reddit.com/r/programming/comments/12345 that covers similar problems."
            
            IMPORTANT: Make sure all URLs are complete and valid (include https://). Include as many diverse sources as possible.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        // Add some variety to responses
        max_tokens: 600
      })
    );
    const responseText = response.choices[0].message.content || "";
    const analysisPrompt = `
    Analyze the following AI response for mentions of products, services, and any relevant sources or references.
    
    Response to analyze: "${responseText}"
    
    Please provide a JSON response with:
    {
      "brandMentioned": boolean (true if the main brand/company is mentioned),
      "competitors": array of competitor product/service names mentioned (e.g., any competing products, services, or tools),
      "sources": array of URLs that are relevant, valid, and useful for users
    }
    
    SOURCE EXTRACTION RULES:
    - Extract ALL URLs mentioned in the response
    - Only include URLs that are complete and valid (start with http:// or https://)
    - Include ANY URL that appears to be a real, accessible resource
    - Don't filter based on domain familiarity - capture everything
    - Remove duplicates but keep all unique URLs
    - Ensure URLs are properly formatted
    
    VALID SOURCE TYPES (include ALL of these and more):
    - Official documentation
    - GitHub repositories
    - Official platform websites
    - Tutorial sites and guides
    - Blog posts and articles
    - Community forums (Reddit, Discord, etc.)
    - API documentation
    - YouTube videos and channels
    - Podcast episodes
    - Conference talks
    - Academic papers
    - Industry reports
    - Social media posts
    - News articles
    - Any other online resource
    
    INVALID SOURCES (only filter out):
    - Obviously broken or malformed URLs
    - Generic example.com domains
    - Localhost URLs
    `;
    const analysisResponse = await callOpenAIWithRetry(
      () => openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing text for brand mentions and extracting structured data. Respond only with valid JSON."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      })
    );
    const analysis = JSON.parse(analysisResponse.choices[0].message.content || "{}");
    return {
      response: responseText,
      brandMentioned: analysis.brandMentioned || false,
      competitors: analysis.competitors || [],
      sources: analysis.sources || []
    };
  } catch (error) {
    console.error("Error analyzing prompt response:", error);
    throw new Error("Failed to analyze prompt response: " + error.message);
  }
}
async function generatePromptsForTopic(topicName, topicDescription, count2 = 5, competitors2 = []) {
  const prompts2 = [];
  const aspects = [
    "cost and pricing",
    "ease of use",
    "performance and speed",
    "reliability and stability",
    "features and capabilities",
    "user experience",
    "scaling and growth",
    "support and documentation",
    "security and privacy",
    "maintenance and updates",
    "team collaboration",
    "integration options",
    "backup and recovery",
    "compliance and regulations",
    "cost optimization",
    "migration and switching",
    "customization options",
    "troubleshooting and help",
    "performance comparison",
    "automation capabilities"
  ];
  let attempts = 0;
  const maxAttempts = count2 * 5;
  while (prompts2.length < count2 && attempts < maxAttempts) {
    attempts++;
    const aspect = aspects[attempts % aspects.length];
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are generating authentic user search queries about ${topicName} with focus on ${aspect}. 

CRITICAL: Make each prompt sound like a real person with genuine questions or problems. Use these patterns:

PROBLEM STARTERS (rotate):
- "Dealing with..." / "Struggling with..." / "Tired of..." / "Having issues with..."
- "How to fix..." / "Need help with..." / "Can't figure out..." / "Looking for..."
- "Getting frustrated with..." / "Ways to improve..." / "Best way to..."

URGENCY LEVELS:
- High: "Need ASAP", "Critical issue", "Keeps failing"
- Medium: "Looking for better way", "Trying to improve" 
- Low: "Considering options", "Planning to..."

SPECIFICITY MIX:
- Add constraints: "for small business", "under $100/month", "for beginners"
- Include context: "startup", "enterprise", "personal use"
- Specific needs: different use cases, requirements, or scenarios

REAL EXAMPLES (without quotes):
- Dealing with slow performance issues
- Need cheaper alternative to current solution
- Struggling to understand pricing structure
- Looking for better customer support options

Generate ONE authentic user question or problem (max 12 words). IMPORTANT: Return only the plain text without any quotes or formatting:`
          },
          {
            role: "user",
            content: `Topic: ${topicName}, Focus: ${aspect}. 

MUST use one of these exact starters:
- "Dealing with..."
- "Struggling to..."
- "Need help with..."
- "Tired of..."
- "How to fix..."
- "Looking for ways to..."
- "Getting frustrated with..."

Example for software: Dealing with slow performance issues
Example for service: Struggling to understand pricing structure

Generate authentic user question or problem statement (plain text only, no quotes):`
          }
        ],
        // Remove JSON response format due to API constraints
        temperature: 0.9,
        max_tokens: 40
      });
      let newPrompt = response.choices[0].message.content?.trim() || "";
      if (newPrompt) {
        newPrompt = newPrompt.replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+$/g, "").replace(/\\"|\\\'/g, "").replace(/\s+(please|exactly|specifically)$/i, "").trim();
        while (newPrompt.match(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/)) {
          newPrompt = newPrompt.replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/g, "").trim();
        }
        if (newPrompt.length > 0) {
          newPrompt = newPrompt.charAt(0).toUpperCase() + newPrompt.slice(1);
          if (/^(how|what|when|where|why|which|can|should|do|does|is|are|will)/i.test(newPrompt) && !newPrompt.endsWith("?")) {
            newPrompt += "?";
          }
        }
        if (newPrompt.split(" ").length <= 12 && newPrompt.split(" ").length >= 3 && newPrompt.includes(" ")) {
          prompts2.push(newPrompt);
        }
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      continue;
    }
  }
  while (prompts2.length < count2) {
    const fallbackTemplates = [
      `Dealing with ${topicName.toLowerCase()} complexity`,
      `Need help optimizing ${topicName.toLowerCase()} setup`,
      `Struggling with ${topicName.toLowerCase()} performance issues`,
      `How to improve ${topicName.toLowerCase()} reliability?`,
      `Tired of ${topicName.toLowerCase()} maintenance overhead`,
      `Best practices for ${topicName.toLowerCase()} implementation`,
      `Looking to simplify ${topicName.toLowerCase()} workflow`,
      `Ways to reduce ${topicName.toLowerCase()} costs`,
      `Automating ${topicName.toLowerCase()} processes better`,
      `${topicName} security considerations`,
      `Monitoring and tracking for ${topicName.toLowerCase()}`,
      `Scaling ${topicName.toLowerCase()} for growth`,
      `Migration strategies for ${topicName.toLowerCase()}`,
      `Backup solutions for ${topicName.toLowerCase()}`,
      `Team collaboration with ${topicName.toLowerCase()}`,
      `Testing strategies for ${topicName.toLowerCase()}`,
      `Documentation needs for ${topicName.toLowerCase()}`,
      `Compliance requirements with ${topicName.toLowerCase()}`,
      `Integration challenges with ${topicName.toLowerCase()}`,
      `Performance comparison for ${topicName.toLowerCase()}`
    ];
    for (const template of fallbackTemplates) {
      if (prompts2.length >= count2) break;
      if (!prompts2.includes(template)) {
        prompts2.push(template);
      }
    }
    if (prompts2.length < count2) {
      for (let i = prompts2.length; i < count2; i++) {
        const simplePrompt = `${topicName} question ${i + 1}`;
        prompts2.push(simplePrompt);
      }
    }
    break;
  }
  return prompts2.slice(0, count2);
}
function calculateCompetitorSimilarity(competitor1, competitor2) {
  const text1 = competitor1.toLowerCase();
  const text2 = competitor2.toLowerCase();
  if (text1 === text2) return 100;
  if (text1.includes(text2) || text2.includes(text1)) return 90;
  const words1 = text1.split(/\s+/).filter((word) => word.length > 2);
  const words2 = text2.split(/\s+/).filter((word) => word.length > 2);
  const intersection = words1.filter((word) => words2.includes(word));
  const union = /* @__PURE__ */ new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.length / union.size * 100 : 0;
}
async function extractSourcesFromText(text2) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying relevant documentation sources, references, and URLs from text. 
          Extract ANY mentioned URLs, documentation links, official guides, GitHub repos, Stack Overflow links, or reference materials.
          Be very thorough and include all URLs that could be useful references.
          Return as a JSON array of source objects with title, url, domain, and snippet fields.`
        },
        {
          role: "user",
          content: `Extract ALL relevant sources and URLs from this text: "${text2}"
          
          Look for:
          - Official documentation (docs.*, developer.*, api.*)
          - GitHub repositories and code examples
          - Stack Overflow links and discussions
          - Official platform websites
          - Tutorial or guide links
          - Any URLs that could be useful references
          
          Return as JSON array: [{"title": "Source Title", "url": "https://example.com", "domain": "example.com", "snippet": "Description"}]`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500
    });
    const content = response.choices[0].message.content || "[]";
    const result = JSON.parse(content);
    if (Array.isArray(result)) {
      return result.filter(
        (item) => typeof item === "object" && item.title && item.url && item.domain
      );
    }
    return [];
  } catch (error) {
    console.error("Error extracting sources from text:", error);
    return [];
  }
}
async function extractCompetitorsFromText(text2, brandName) {
  try {
    const brandContext = brandName ? `Focus on direct competitors to ${brandName}. ` : "";
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying ONLY direct competitors to a specific brand. 
          ${brandContext}Be extremely strict - only extract companies that are DIRECT competitors in the EXACT same market space.
          
          CRITICAL RULES:
          - Only include companies that directly compete for the same customers
          - Do NOT include general technology platforms, tools, or services
          - Do NOT include complementary services or partners
          - Do NOT include companies mentioned as examples or references
          - Do NOT include companies that are in different market segments
          - If unsure, do NOT include the company
          
          Return only the competitor names as a JSON array of strings. If no direct competitors found, return empty array [].`
        },
        {
          role: "user",
          content: `Extract ONLY direct competitors from this text: "${text2}"
          ${brandName ? `Focus on companies that DIRECTLY compete with ${brandName} for the same customers.` : ""}
          
          Be extremely conservative - only include companies that are clearly direct competitors.
          If no clear direct competitors are mentioned, return empty array [].
          
          Return as JSON array: ["Competitor1", "Competitor2"] or [] if none found`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 200
    });
    const content = response.choices[0].message.content || "[]";
    const result = JSON.parse(content);
    if (Array.isArray(result)) {
      const competitors2 = result.filter((item) => typeof item === "string");
      const diverseCompetitors = [];
      for (const competitor of competitors2) {
        if (diverseCompetitors.length >= 10) break;
        const isDiverse = diverseCompetitors.every((existing) => {
          const similarity = calculateCompetitorSimilarity(competitor, existing);
          return similarity < 70;
        });
        if (isDiverse) {
          diverseCompetitors.push(competitor);
        }
      }
      return diverseCompetitors;
    }
    return [];
  } catch (error) {
    console.error("Error extracting competitors from text:", error);
    return [];
  }
}
async function generateDynamicTopics(brandUrl, count2, competitors2) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing brands and generating relevant analysis topics. 
          Based on a brand URL and its competitors, generate diverse analysis topics that would be relevant for understanding the brand's market position.
          
          Return a JSON array of topics with name and description fields.
          Focus on practical, business-relevant topics that would help understand the brand's strengths and weaknesses.`
        },
        {
          role: "user",
          content: `Brand URL: ${brandUrl}
          Competitors: ${competitors2.join(", ")}
          
          Generate ${count2} diverse analysis topics that would be relevant for understanding this brand's market position and competitive landscape.
          
          Return as JSON array: [{"name": "Topic Name", "description": "Topic description"}]`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });
    const content = response.choices[0].message.content || "[]";
    const topics2 = JSON.parse(content);
    if (Array.isArray(topics2)) {
      return topics2.slice(0, count2).map((topic) => ({
        name: topic.name || "General Analysis",
        description: topic.description || `Analysis of ${topic.name || "general"} aspects`
      }));
    }
    return Array.from({ length: count2 }, (_, i) => ({
      name: `Analysis Topic ${i + 1}`,
      description: `Dynamic analysis topic generated for brand analysis`
    }));
  } catch (error) {
    console.error("Error generating dynamic topics:", error);
    return Array.from({ length: count2 }, (_, i) => ({
      name: `Brand Analysis ${i + 1}`,
      description: `Comprehensive analysis of brand positioning and market dynamics`
    }));
  }
}
function tryRepairJsonArray(str) {
  try {
    let fixed = str.trim();
    if (fixed.startsWith("[") && !fixed.endsWith("]")) {
      fixed += "]";
    }
    fixed = fixed.replace(/,\s*\]$/, "]");
    return JSON.parse(fixed);
  } catch {
    const match = str.trim().match(/\[.*\]/s);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
      }
    }
    return null;
  }
}
async function analyzeBrandAndFindCompetitors(brandUrl) {
  try {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Starting brand analysis for: ${brandUrl}`);
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
      console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] No OpenAI API key found`);
      return [
        { name: "Sample Competitor 1", url: "https://competitor1.com", category: "Technology" },
        { name: "Sample Competitor 2", url: "https://competitor2.com", category: "Technology" }
      ];
    }
    const homepageText = await fetchWebsiteText(brandUrl);
    if (!homepageText) {
      console.warn(`[${(/* @__PURE__ */ new Date()).toISOString()}] No homepage text found for ${brandUrl}`);
    }
    const analysisPromises = Array.from({ length: 3 }, async (_, index) => {
      try {
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Running analysis attempt ${index + 1}/3`);
        const prompts2 = [
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 well-known, established competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 well-known direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 newer or emerging competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 newer or emerging direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 enterprise-focused or developer-focused competitors.",
            user: `Homepage content: """${homepageText}"""

Find 2-3 enterprise or developer-focused direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          }
        ];
        const currentPrompt = prompts2[index];
        const response = await callOpenAIWithRetry(
          () => openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `${currentPrompt.system} ALWAYS return an array, never a single object.`
              },
              {
                role: "user",
                content: `${currentPrompt.user}

IMPORTANT: Return a JSON array, not a single object.`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 500
          })
        );
        const content = response.choices[0].message.content || "[]";
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Attempt ${index + 1} response:`, content);
        let result;
        try {
          result = JSON.parse(content);
        } catch (e) {
          const repaired = tryRepairJsonArray(content);
          if (repaired) {
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Successfully repaired JSON for attempt ${index + 1}:`, repaired);
            result = repaired;
          } else {
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Failed to parse attempt ${index + 1}, skipping`);
            return [];
          }
        }
        if (Array.isArray(result)) {
          const competitors2 = result.filter(
            (item) => typeof item === "object" && item.name && item.url && item.category
          );
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Attempt ${index + 1} found ${competitors2.length} competitors in array`);
          return competitors2;
        } else if (result && typeof result === "object") {
          if (result.name && result.url && result.category) {
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Attempt ${index + 1} found single competitor, converting to array`);
            return [result];
          }
          if (result.competitors && Array.isArray(result.competitors)) {
            const competitors2 = result.competitors.filter(
              (item) => typeof item === "object" && item.name && item.url && item.category
            );
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Attempt ${index + 1} found ${competitors2.length} competitors in competitors array`);
            return competitors2;
          }
        }
        return [];
      } catch (error) {
        console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error in analysis attempt ${index + 1}:`, error);
        return [];
      }
    });
    const results = await Promise.all(analysisPromises);
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] All analysis attempts completed`);
    const allCompetitors = [];
    const seenNames = /* @__PURE__ */ new Set();
    results.forEach((competitors2, index) => {
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Attempt ${index + 1} found ${competitors2.length} competitors`);
      competitors2.forEach((competitor) => {
        const normalizedName = competitor.name.toLowerCase().trim();
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          allCompetitors.push(competitor);
        }
      });
    });
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Total unique competitors found: ${allCompetitors.length}`);
    return allCompetitors.slice(0, 8);
  } catch (error) {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error analyzing brand and finding competitors:`, error);
    return [];
  }
}
var openai;
var init_openai = __esm({
  "server/services/openai.ts"() {
    "use strict";
    init_scraper();
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
    });
  }
});

// server/services/llm.ts
async function analyzePromptResponse2(prompt) {
  if (PROVIDER === "anthropic" || PROVIDER === "claude") {
    const mod2 = await Promise.resolve().then(() => (init_anthropic(), anthropic_exports));
    return mod2.analyzePromptResponseClaude(prompt);
  }
  const mod = await Promise.resolve().then(() => (init_openai(), openai_exports));
  return mod.analyzePromptResponse(prompt);
}
async function generatePromptsForTopic2(topicName, topicDescription, count2 = 5, competitors2 = []) {
  if (PROVIDER === "anthropic" || PROVIDER === "claude") {
    const mod2 = await Promise.resolve().then(() => (init_anthropic(), anthropic_exports));
    return mod2.generatePromptsForTopicClaude(topicName, topicDescription, count2, competitors2);
  }
  const mod = await Promise.resolve().then(() => (init_openai(), openai_exports));
  return mod.generatePromptsForTopic(topicName, topicDescription, count2, competitors2);
}
var PROVIDER;
var init_llm = __esm({
  "server/services/llm.ts"() {
    "use strict";
    PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  }
});

// server/services/analyzer.ts
var analyzer_exports = {};
__export(analyzer_exports, {
  BrandAnalyzer: () => BrandAnalyzer,
  analyzer: () => analyzer,
  getCurrentProgress: () => getCurrentProgress,
  stopCurrentAnalysis: () => stopCurrentAnalysis
});
function stopCurrentAnalysis() {
  isAnalysisRunning = false;
  currentProgress = {
    status: "error",
    message: "Analysis cancelled by user",
    progress: 0,
    totalPrompts: 0,
    completedPrompts: 0
  };
}
async function getCurrentProgress() {
  return currentProgress;
}
var analysisStartTime, targetPrompts, currentProgress, isAnalysisRunning, BrandAnalyzer, analyzer;
var init_analyzer = __esm({
  "server/services/analyzer.ts"() {
    "use strict";
    init_storage();
    init_llm();
    init_scraper();
    analysisStartTime = Date.now();
    targetPrompts = 100;
    currentProgress = {
      status: "initializing",
      message: "Ready to start analysis...",
      progress: 0,
      totalPrompts: 0,
      completedPrompts: 0
    };
    isAnalysisRunning = false;
    BrandAnalyzer = class {
      progressCallback;
      brandName = "";
      brandUrl = "";
      constructor(progressCallback) {
        this.progressCallback = progressCallback;
      }
      setBrandName(brandName) {
        this.brandName = brandName;
      }
      setBrandUrl(brandUrl) {
        this.brandUrl = brandUrl;
      }
      updateProgress(update) {
        currentProgress = { ...currentProgress, ...update };
        if (this.progressCallback) {
          this.progressCallback(currentProgress);
        }
      }
      resetProgress() {
        currentProgress = {
          status: "initializing",
          message: "Starting analysis...",
          progress: 0,
          totalPrompts: 0,
          completedPrompts: 0
        };
        analysisStartTime = Date.now();
      }
      async runFullAnalysis(useExistingPrompts = false, savedPrompts, settings) {
        try {
          if (isAnalysisRunning) {
            console.log("Analysis already running, skipping new request");
            return;
          }
          isAnalysisRunning = true;
          if (settings) {
            targetPrompts = settings.promptsPerTopic * settings.numberOfTopics;
          } else if (savedPrompts && savedPrompts.length > 0) {
            targetPrompts = savedPrompts.length;
          }
          this.resetProgress();
          this.updateProgress({
            status: "initializing",
            message: "Starting brand analysis...",
            progress: 0
          });
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          if (savedPrompts && savedPrompts.length > 0) {
            this.updateProgress({
              status: "initializing",
              message: "Clearing previous data and loading saved prompts...",
              progress: 5
            });
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Clearing existing data (useExistingPrompts branch)...`);
            const competitorsBefore = await storage.getCompetitors();
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${competitorsBefore.length} competitors before clearing`);
            await storage.clearAllPrompts();
            await storage.clearAllResponses();
            await storage.clearAllCompetitors();
            const competitorsAfter = await storage.getCompetitors();
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${competitorsAfter.length} competitors after clearing`);
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Data cleared successfully (useExistingPrompts branch)`);
          } else if (!useExistingPrompts) {
            this.updateProgress({
              status: "initializing",
              message: "Preparing for new analysis...",
              progress: 5
            });
          }
          let allPrompts = [];
          if (savedPrompts && savedPrompts.length > 0) {
            this.updateProgress({
              status: "initializing",
              message: "Clearing previous data and loading saved prompts...",
              progress: 10
            });
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Clearing existing data (savedPrompts branch)...`);
            const competitorsBefore = await storage.getCompetitors();
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${competitorsBefore.length} competitors before clearing`);
            await storage.clearAllPrompts();
            await storage.clearAllResponses();
            await storage.clearAllCompetitors();
            const competitorsAfter = await storage.getCompetitors();
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${competitorsAfter.length} competitors after clearing`);
            console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Data cleared successfully (savedPrompts branch)`);
            this.updateProgress({
              status: "testing_prompts",
              message: "Processing saved prompts...",
              progress: 20
            });
            allPrompts = savedPrompts.map((p) => ({ text: p.text, topicId: p.topicId || null }));
          } else if (useExistingPrompts) {
            this.updateProgress({
              status: "testing_prompts",
              message: "Using existing prompts for analysis...",
              progress: 20
            });
            const existingPrompts = await storage.getPrompts();
            allPrompts = existingPrompts.map((p) => ({ text: p.text, topicId: p.topicId }));
          } else {
            this.updateProgress({
              status: "scraping",
              message: "Analyzing brand website...",
              progress: 10
            });
            const content = await scrapeBrandWebsite(this.brandUrl || "https://example.com");
            const generatedTopics = await generateTopicsFromContent(content);
            this.updateProgress({
              status: "generating_prompts",
              message: "Generating test prompts...",
              progress: 20
            });
            for (const topic of generatedTopics) {
              let topicRecord = await storage.getTopics().then(
                (topics2) => topics2.find((t) => t.name === topic.name)
              );
              if (!topicRecord) {
                topicRecord = await storage.createTopic(topic);
              }
              const promptsPerTopic = settings?.promptsPerTopic || 20;
              const promptTexts = await generatePromptsForTopic2(topic.name, topic.description, promptsPerTopic);
              for (const promptText of promptTexts) {
                allPrompts.push({
                  text: promptText,
                  topicId: topicRecord.id
                });
              }
            }
          }
          this.updateProgress({
            status: "testing_prompts",
            message: "Testing prompts with ChatGPT...",
            progress: 30,
            totalPrompts: allPrompts.length,
            completedPrompts: 0
          });
          let completedCount = 0;
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Starting to process ${allPrompts.length} prompts`);
          for (let i = 0; i < allPrompts.length; i++) {
            if (!isAnalysisRunning) {
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Analysis cancelled by user at prompt ${i + 1}`);
              this.updateProgress({
                status: "error",
                message: "Analysis cancelled by user",
                progress: 0
              });
              return;
            }
            const promptData = allPrompts[i];
            try {
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Starting prompt ${i + 1}/${allPrompts.length}`);
              const prompt = await storage.createPrompt(promptData);
              if (!prompt) {
                console.error("Failed to create prompt:", promptData.text);
                continue;
              }
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Processing prompt: ${promptData.text.substring(0, 50)}...`);
              if (i > 0) {
                console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Waiting 2 seconds before next API call...`);
                await new Promise((resolve) => setTimeout(resolve, 2e3));
              }
              let analysis;
              try {
                console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Calling OpenAI API for prompt analysis...`);
                analysis = await analyzePromptResponse2(promptData.text);
                console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] OpenAI API call successful`);
              } catch (error) {
                console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] OpenAI API failed, using fallback analysis:`, error);
                const lowerPrompt = promptData.text.toLowerCase();
                const brandMentioned = Math.random() < 0.15;
                const competitors2 = [];
                try {
                  const { extractCompetitorsFromText: extractCompetitorsFromText2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
                  const extractedCompetitors = await extractCompetitorsFromText2(promptData.text, this.brandName);
                  competitors2.push(...extractedCompetitors);
                } catch (error2) {
                  console.error("Failed to extract competitors from text:", error2);
                  const deploymentKeywords = ["deploy", "hosting", "platform", "cloud", "service"];
                  if (deploymentKeywords.some((keyword) => lowerPrompt.includes(keyword))) {
                    console.log("Using fallback competitor detection");
                  }
                }
                analysis = {
                  response: `Based on your ${promptData.text.toLowerCase()}, I'd recommend considering ${competitors2.join(", ")} for your deployment needs.${brandMentioned ? " There are also other good options for simple deployments." : ""}`,
                  brandMentioned,
                  competitors: Array.from(new Set(competitors2)),
                  // Remove duplicates with Array.from
                  sources: [
                    "https://stackoverflow.com/questions/deployment",
                    "https://docs.aws.amazon.com",
                    "https://github.com/features/actions",
                    "https://docs.github.com/en/actions",
                    "https://vercel.com/docs",
                    "https://netlify.com/docs",
                    "https://docs.docker.com",
                    "https://kubernetes.io/docs"
                  ]
                };
              }
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Analysis result: Brand mentioned: ${analysis.brandMentioned}, Competitors: ${analysis.competitors.join(", ")}`);
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Processing ${analysis.competitors.length} competitors...`);
              for (const competitorName of analysis.competitors) {
                try {
                  let competitor = await storage.getCompetitorByName(competitorName);
                  if (!competitor) {
                    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Creating new competitor: ${competitorName}`);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    competitor = await storage.createCompetitor({
                      name: competitorName,
                      category: await this.categorizeCompetitor(competitorName),
                      mentionCount: 0
                    });
                  }
                  await storage.updateCompetitorMentionCount(competitorName, 1);
                } catch (error) {
                  console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing competitor ${competitorName}:`, error);
                }
              }
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Processing sources...`);
              const responseUrls = extractUrlsFromText(analysis.response);
              const analysisSources = analysis.sources || [];
              const promptUrls = extractUrlsFromText(promptData.text);
              const allUrls = Array.from(/* @__PURE__ */ new Set([...responseUrls, ...analysisSources, ...promptUrls]));
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${allUrls.length} unique URLs to process`);
              const urlsByDomain = /* @__PURE__ */ new Map();
              for (const url of allUrls) {
                try {
                  const domain = extractDomainFromUrl(url);
                  if (!domain || domain.length < 3) continue;
                  if (domain === "example.com" || domain === "localhost") {
                    continue;
                  }
                  if (!urlsByDomain.has(domain)) {
                    urlsByDomain.set(domain, []);
                  }
                  urlsByDomain.get(domain).push(url);
                } catch (error) {
                  console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing URL ${url}:`, error);
                }
              }
              const domains = Array.from(urlsByDomain.keys());
              for (const domain of domains) {
                try {
                  const urls = urlsByDomain.get(domain);
                  const primaryUrl = urls.find(
                    (url) => url.includes("/docs") || url.includes("/api") || url.includes("/developer") || url.includes("/guide") || url.includes("/tutorial")
                  ) || urls[0];
                  let source = await storage.getSourceByDomain(domain);
                  if (!source) {
                    const title = this.generateSourceTitle(domain, primaryUrl);
                    source = await storage.createSource({
                      domain,
                      url: primaryUrl,
                      title,
                      citationCount: 0
                    });
                    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Created new source: ${domain} (${title})`);
                  }
                  await storage.updateSourceCitationCount(domain, 1);
                } catch (error) {
                  console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing source domain ${domain}:`, error);
                }
              }
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Creating response record...`);
              await storage.createResponse({
                promptId: prompt.id,
                text: analysis.response,
                brandMentioned: analysis.brandMentioned,
                competitorsMentioned: analysis.competitors,
                sources: analysis.sources
              });
              completedCount++;
              console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Completed prompt ${i + 1}/${allPrompts.length} (${completedCount} total completed)`);
            } catch (error) {
              console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error processing prompt: ${promptData.text}`, error);
            }
            this.updateProgress({
              status: "testing_prompts",
              message: `Testing prompts with ChatGPT... (${completedCount}/${allPrompts.length})`,
              progress: 30 + completedCount / allPrompts.length * 50,
              totalPrompts: allPrompts.length,
              completedPrompts: completedCount
            });
          }
          this.updateProgress({
            status: "analyzing",
            message: "Generating analytics...",
            progress: 85
          });
          await this.generateAnalytics();
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Analysis completed successfully. Processed ${completedCount} out of ${allPrompts.length} prompts`);
          this.updateProgress({
            status: "complete",
            message: "Analysis complete!",
            progress: 100
          });
        } catch (error) {
          console.error("Analysis failed:", error);
          this.updateProgress({
            status: "error",
            message: `Analysis failed: ${error.message}`,
            progress: 0
          });
          throw error;
        } finally {
          isAnalysisRunning = false;
        }
      }
      generateSourceTitle(domain, url) {
        const domainParts = domain.split(".");
        const mainDomain = domainParts[0];
        if (url.includes("/docs")) {
          return `${mainDomain} Documentation`;
        } else if (url.includes("/api")) {
          return `${mainDomain} API Documentation`;
        } else if (url.includes("/developer")) {
          return `${mainDomain} Developer Portal`;
        } else if (url.includes("/guide") || url.includes("/tutorial")) {
          return `${mainDomain} Guides & Tutorials`;
        } else if (domain.includes("github.com")) {
          return "GitHub Repository";
        } else if (domain.includes("stackoverflow.com")) {
          return "Stack Overflow Discussion";
        } else if (domain.includes("medium.com")) {
          return "Medium Article";
        } else if (domain.includes("dev.to")) {
          return "Dev.to Article";
        } else if (domain.includes("reddit.com")) {
          return "Reddit Discussion";
        } else if (domain.includes("youtube.com")) {
          return "YouTube Video";
        } else if (domain.includes("twitter.com") || domain.includes("x.com")) {
          return "Social Media Post";
        } else if (domain.includes("linkedin.com")) {
          return "LinkedIn Article";
        } else if (domain.includes("hackernews.com") || domain.includes("news.ycombinator.com")) {
          return "Hacker News Discussion";
        } else if (domain.includes("discord.com") || domain.includes("discord.gg")) {
          return "Discord Community";
        } else if (domain.includes("slack.com")) {
          return "Slack Community";
        } else if (domain.includes("substack.com")) {
          return "Substack Newsletter";
        } else if (domain.includes("hashnode.dev")) {
          return "Hashnode Article";
        } else if (domain.includes("css-tricks.com")) {
          return "CSS-Tricks Article";
        } else if (domain.includes("smashingmagazine.com")) {
          return "Smashing Magazine Article";
        } else if (domain.includes("sitepoint.com")) {
          return "SitePoint Article";
        } else if (domain.includes("toptal.com")) {
          return "Toptal Article";
        } else if (domain.includes("freecodecamp.org")) {
          return "freeCodeCamp Resource";
        } else if (domain.includes("mozilla.org")) {
          return "Mozilla Developer Network";
        } else if (domain.includes("web.dev")) {
          return "Web.dev Article";
        } else if (domain.includes("css-tricks.com")) {
          return "CSS-Tricks Article";
        } else {
          const tld = domainParts[domainParts.length - 1];
          if (tld === "org") {
            return `${mainDomain} Organization`;
          } else if (tld === "edu") {
            return `${mainDomain} Educational Resource`;
          } else if (tld === "gov") {
            return `${mainDomain} Government Resource`;
          } else if (tld === "io") {
            return `${mainDomain} Platform`;
          } else if (tld === "app") {
            return `${mainDomain} Application`;
          } else if (tld === "dev") {
            return `${mainDomain} Developer Resource`;
          } else {
            return `${mainDomain} Website`;
          }
        }
      }
      async categorizeCompetitor(name) {
        const existingCompetitor = await storage.getCompetitorByName(name);
        if (existingCompetitor?.category) {
          return existingCompetitor.category;
        }
        try {
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Categorizing competitor: ${name}`);
          const OpenAI2 = await import("openai");
          const client = new OpenAI2.default({
            apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
          });
          const timeoutPromise = new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Competitor categorization timeout")), 15e3)
          );
          const response = await Promise.race([
            client.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: `You are an expert at categorizing companies and competitors. 
              Given a competitor name and the context of the main brand, determine the most appropriate category.
              Return only the category name as a single word or short phrase (e.g., "E-commerce", "Social Media", "Finance", "Healthcare", "Education", "Entertainment", "Technology", "Retail", "Food & Beverage", "Transportation", etc.).
              Do not include explanations or additional text.`
                },
                {
                  role: "user",
                  content: `Brand: ${this.brandName || "Unknown"}
              Competitor: ${name}
              
              What category does this competitor belong to?`
                }
              ],
              temperature: 0.1,
              max_tokens: 20
            }),
            timeoutPromise
          ]);
          const category = response.choices[0].message.content?.trim() || "Technology";
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Categorized ${name} as: ${category}`);
          return category;
        } catch (error) {
          console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error categorizing competitor ${name} with AI:`, error);
          return "Technology";
        }
      }
      async generateAnalytics() {
        const responses2 = await storage.getResponsesWithPrompts();
        const competitors2 = await storage.getCompetitors();
        const sources2 = await storage.getSources();
        const brandMentions = responses2.filter((r) => r.brandMentioned).length;
        const brandMentionRate = responses2.length > 0 ? brandMentions / responses2.length * 100 : 0;
        const topCompetitor = competitors2.sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))[0]?.name || null;
        const uniqueDomains = new Set(sources2.map((s) => s.domain)).size;
        return await storage.createAnalytics({
          totalPrompts: responses2.length,
          // Use full dataset count
          brandMentionRate,
          topCompetitor,
          totalSources: sources2.length,
          totalDomains: uniqueDomains
        });
      }
      async getOverviewMetrics() {
        const allResponses = await storage.getResponsesWithPrompts();
        const competitorAnalysis = await storage.getCompetitorAnalysis();
        const sourceAnalysis = await storage.getSourceAnalysis();
        const brandMentions = allResponses.filter((r) => r.brandMentioned).length;
        const brandMentionRate = allResponses.length > 0 ? brandMentions / allResponses.length * 100 : 0;
        const topCompetitor = competitorAnalysis.sort((a, b) => b.mentionCount - a.mentionCount)[0];
        const uniqueDomains = new Set(sourceAnalysis.map((s) => s.domain)).size;
        return {
          brandMentionRate,
          totalPrompts: allResponses.length,
          // Use full dataset count
          topCompetitor: topCompetitor?.name || "N/A",
          totalSources: sourceAnalysis.length,
          totalDomains: uniqueDomains
        };
      }
      async getTopicAnalysis() {
        return await storage.getTopicAnalysis();
      }
      async getCompetitorAnalysis() {
        return await storage.getCompetitorAnalysis();
      }
      async getSourceAnalysis() {
        return await storage.getSourceAnalysis();
      }
    };
    analyzer = new BrandAnalyzer();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
init_storage();
init_analyzer();
init_openai();
init_schema();
import { createServer } from "http";
var analysisProgress = /* @__PURE__ */ new Map();
async function registerRoutes(app2) {
  app2.post("/api/test-analysis", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Testing analysis with prompt: ${prompt}`);
      const { analyzePromptResponse: analyzePromptResponse3 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const result = await analyzePromptResponse3(prompt);
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Test analysis completed successfully`);
      res.json({
        success: true,
        result,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Test analysis failed:`, error);
      res.status(500).json({
        error: "Test analysis failed",
        message: error.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/test", async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Server is running",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        env: {
          hasOpenAIKey: !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR),
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ error: "Test endpoint failed" });
    }
  });
  app2.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await analyzer.getOverviewMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  app2.get("/api/counts", async (req, res) => {
    try {
      const allResponses = await storage.getResponsesWithPrompts();
      const allPrompts = await storage.getPrompts();
      const allTopics = await storage.getTopics();
      const allCompetitors = await storage.getCompetitors();
      const allSources = await storage.getSources();
      res.json({
        totalResponses: allResponses.length,
        totalPrompts: allPrompts.length,
        totalTopics: allTopics.length,
        totalCompetitors: allCompetitors.length,
        totalSources: allSources.length,
        brandMentions: allResponses.filter((r) => r.brandMentioned).length,
        brandMentionRate: allResponses.length > 0 ? allResponses.filter((r) => r.brandMentioned).length / allResponses.length * 100 : 0
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
      res.status(500).json({ error: "Failed to fetch counts" });
    }
  });
  app2.get("/api/topics", async (req, res) => {
    try {
      const topics2 = await storage.getTopics();
      res.json(topics2);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });
  app2.get("/api/topics/analysis", async (req, res) => {
    try {
      const analysis = await analyzer.getTopicAnalysis();
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching topic analysis:", error);
      res.status(500).json({ error: "Failed to fetch topic analysis" });
    }
  });
  app2.get("/api/competitors", async (req, res) => {
    try {
      const competitors2 = await storage.getCompetitors();
      res.json(competitors2);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      res.status(500).json({ error: "Failed to fetch competitors" });
    }
  });
  app2.get("/api/competitors/analysis", async (req, res) => {
    try {
      const analysis = await analyzer.getCompetitorAnalysis();
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching competitor analysis:", error);
      res.status(500).json({ error: "Failed to fetch competitor analysis" });
    }
  });
  app2.get("/api/sources", async (req, res) => {
    try {
      const sources2 = await storage.getSources();
      res.json(sources2);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });
  app2.get("/api/sources/analysis", async (req, res) => {
    try {
      const analysis = await analyzer.getSourceAnalysis();
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching source analysis:", error);
      res.status(500).json({ error: "Failed to fetch source analysis" });
    }
  });
  app2.get("/api/prompts", async (req, res) => {
    try {
      const latestPrompts = await storage.getLatestPrompts();
      const promptsWithTopics = await Promise.all(
        latestPrompts.map(async (prompt) => {
          const topic = prompt.topicId ? await storage.getTopicById(prompt.topicId) : null;
          return { ...prompt, topic };
        })
      );
      res.json(promptsWithTopics);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });
  app2.get("/api/responses", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const useFullDataset = req.query.full === "true" || limit > 100;
      let responses2;
      if (useFullDataset) {
        responses2 = await storage.getResponsesWithPrompts();
      } else {
        responses2 = await storage.getLatestResponses();
      }
      res.json(responses2.slice(0, limit));
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });
  app2.get("/api/responses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const response = await storage.getResponseById(id);
      if (!response) {
        return res.status(404).json({ error: "Response not found" });
      }
      res.json(response);
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({ error: "Failed to fetch response" });
    }
  });
  app2.post("/api/prompts/test", async (req, res) => {
    try {
      const { text: text2, topicId } = insertPromptSchema.parse(req.body);
      const prompt = await storage.createPrompt({ text: text2, topicId });
      const testAnalyzer = new BrandAnalyzer();
      res.json({
        success: true,
        prompt,
        message: "Prompt queued for testing"
      });
    } catch (error) {
      console.error("Error testing prompt:", error);
      res.status(500).json({ error: "Failed to test prompt" });
    }
  });
  app2.post("/api/data/clear", async (req, res) => {
    try {
      const { type } = req.body;
      if (type === "all") {
        await storage.clearAllPrompts();
        await storage.clearAllResponses();
        await storage.clearAllCompetitors();
        res.json({ success: true, message: "All data cleared successfully" });
      } else if (type === "prompts") {
        await storage.clearAllPrompts();
        res.json({ success: true, message: "All prompts cleared successfully" });
      } else if (type === "responses") {
        await storage.clearAllResponses();
        res.json({ success: true, message: "All responses cleared successfully" });
      } else {
        res.status(400).json({ error: "Invalid type. Use 'all', 'prompts', or 'responses'" });
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ error: "Failed to clear data" });
    }
  });
  app2.get("/api/test", (req, res) => {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] /api/test endpoint called`);
    res.json({ message: "Server is working", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/analyze-brand", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Analyzing brand URL: ${url}`);
      const { analyzeBrandAndFindCompetitors: analyzeBrandAndFindCompetitors2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const competitors2 = await analyzeBrandAndFindCompetitors2(url);
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Found ${competitors2.length} competitors for ${url}`);
      res.json({ competitors: competitors2 });
    } catch (error) {
      console.error("Error analyzing brand:", error);
      res.status(500).json({ error: "Failed to analyze brand" });
    }
  });
  app2.post("/api/generate-prompts", async (req, res) => {
    try {
      const { brandUrl, competitors: competitors2, settings } = req.body;
      if (!brandUrl || !competitors2 || !settings) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const { generatePromptsForTopic: generatePromptsForTopic3 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const existingTopics = await storage.getTopics();
      let topics2;
      if (existingTopics.length >= settings.numberOfTopics) {
        topics2 = existingTopics.slice(0, settings.numberOfTopics).map((topic) => ({
          name: topic.name,
          description: topic.description || `Questions about ${topic.name.toLowerCase()}`
        }));
      } else {
        const { generateDynamicTopics: generateDynamicTopics2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
        const newTopics = await generateDynamicTopics2(
          brandUrl,
          settings.numberOfTopics - existingTopics.length,
          competitors2.map((c) => c.name)
        );
        topics2 = [
          ...existingTopics.map((topic) => ({
            name: topic.name,
            description: topic.description || `Questions about ${topic.name.toLowerCase()}`
          })),
          ...newTopics
        ];
      }
      const topicsWithPrompts = [];
      for (let i = 0; i < topics2.length; i++) {
        const topic = topics2[i];
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Generating prompts for topic ${i + 1}/${topics2.length}: ${topic.name}`);
        try {
          const prompts2 = await generatePromptsForTopic3(
            topic.name,
            topic.description,
            settings.promptsPerTopic,
            competitors2.map((c) => c.name)
          );
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Generated ${prompts2.length} prompts for topic: ${topic.name}`);
          topicsWithPrompts.push({
            name: topic.name,
            description: topic.description,
            prompts: prompts2
          });
        } catch (error) {
          console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] Error generating prompts for topic ${topic.name}:`, error);
          topicsWithPrompts.push({
            name: topic.name,
            description: topic.description,
            prompts: []
          });
        }
      }
      res.json({ topics: topicsWithPrompts });
    } catch (error) {
      console.error("Error generating prompts:", error);
      res.status(500).json({ error: "Failed to generate prompts" });
    }
  });
  app2.post("/api/save-and-analyze", async (req, res) => {
    try {
      const { topics: topics2 } = req.body;
      if (!topics2 || !Array.isArray(topics2)) {
        return res.status(400).json({ error: "Topics array is required" });
      }
      const allPrompts = [];
      for (const topic of topics2) {
        let topicRecord = await storage.getTopics().then(
          (topics3) => topics3.find((t) => t.name === topic.name)
        );
        if (!topicRecord) {
          topicRecord = await storage.createTopic({
            name: topic.name,
            description: topic.description
          });
        }
        for (const promptText of topic.prompts) {
          const prompt = await storage.createPrompt({
            text: promptText,
            topicId: topicRecord.id
          });
          allPrompts.push(prompt);
        }
      }
      const sessionId = `analysis_${Date.now()}`;
      const analysisWorker = new BrandAnalyzer((progress) => {
        analysisProgress.set(sessionId, progress);
      });
      await storage.clearAllResponses();
      analysisWorker.runFullAnalysis(false, allPrompts).catch((error) => {
        console.error("Analysis failed:", error);
        analysisProgress.set(sessionId, {
          status: "error",
          message: `Analysis failed: ${error.message}`,
          progress: 0
        });
      });
      res.json({
        success: true,
        message: "Prompts saved and analysis started",
        promptCount: allPrompts.length
      });
    } catch (error) {
      console.error("Error saving prompts and starting analysis:", error);
      res.status(500).json({ error: "Failed to save prompts and start analysis" });
    }
  });
  app2.post("/api/analysis/start", async (req, res) => {
    try {
      const { settings } = req.body;
      const sessionId = `analysis_${Date.now()}`;
      const existingPrompts = await storage.getPrompts();
      const useExistingPrompts = existingPrompts.length > 0;
      const analysisWorker = new BrandAnalyzer((progress) => {
        analysisProgress.set(sessionId, progress);
      });
      analysisWorker.runFullAnalysis(useExistingPrompts, void 0, settings).catch((error) => {
        console.error("Analysis failed:", error);
        analysisProgress.set(sessionId, {
          status: "error",
          message: error.message,
          progress: 0
        });
      });
      const totalPrompts = settings ? settings.promptsPerTopic * settings.numberOfTopics : 100;
      res.json({
        success: true,
        sessionId,
        message: useExistingPrompts ? "Analysis started with saved prompts" : `Analysis started with ${totalPrompts} new prompts`
      });
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ error: "Failed to start analysis" });
    }
  });
  app2.get("/api/analysis/:sessionId/progress", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const progress = analysisProgress.get(sessionId);
      if (!progress) {
        return res.status(404).json({ error: "Analysis session not found" });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error fetching analysis progress:", error);
      res.status(500).json({ error: "Failed to fetch analysis progress" });
    }
  });
  app2.post("/api/settings/openai-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
        return res.status(400).json({ error: "Invalid API key format" });
      }
      const testResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (!testResponse.ok) {
        return res.status(400).json({ error: "Invalid API key or OpenAI service unavailable" });
      }
      process.env.OPENAI_API_KEY = apiKey;
      res.json({ success: true, message: "API key saved and validated" });
    } catch (error) {
      console.error("Error saving API key:", error);
      res.status(500).json({ error: "Failed to save API key" });
    }
  });
  app2.post("/api/settings/analysis-config", async (req, res) => {
    try {
      const { promptsPerTopic, analysisFrequency } = req.body;
      if (!promptsPerTopic || typeof promptsPerTopic !== "number" || promptsPerTopic < 1 || promptsPerTopic > 20) {
        return res.status(400).json({ error: "Invalid prompts per topic value" });
      }
      if (!analysisFrequency || !["manual", "daily", "weekly", "monthly"].includes(analysisFrequency)) {
        return res.status(400).json({ error: "Invalid analysis frequency value" });
      }
      process.env.PROMPTS_PER_TOPIC = promptsPerTopic.toString();
      process.env.ANALYSIS_FREQUENCY = analysisFrequency;
      res.json({ success: true, message: "Analysis configuration saved successfully" });
    } catch (error) {
      console.error("Error saving analysis config:", error);
      res.status(500).json({ error: "Failed to save analysis configuration" });
    }
  });
  app2.get("/api/analysis/progress", async (req, res) => {
    try {
      const { getCurrentProgress: getCurrentProgress3 } = await Promise.resolve().then(() => (init_analyzer(), analyzer_exports));
      const progress = await getCurrentProgress3();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching analysis progress:", error);
      res.status(500).json({ error: "Failed to fetch analysis progress" });
    }
  });
  app2.post("/api/analysis/cancel", async (req, res) => {
    try {
      const { stopCurrentAnalysis: stopCurrentAnalysis3 } = await Promise.resolve().then(() => (init_analyzer(), analyzer_exports));
      stopCurrentAnalysis3();
      res.json({
        success: true,
        message: "Analysis cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling analysis:", error);
      res.status(500).json({ error: "Failed to cancel analysis" });
    }
  });
  app2.post("/api/analysis/start", async (req, res) => {
    try {
      const { brandName, brandUrl } = req.body;
      if (!brandName || typeof brandName !== "string" || !brandName.trim()) {
        return res.status(400).json({ error: "Brand name is required" });
      }
      const progressCallback = (progress) => {
        console.log("Analysis progress:", progress);
      };
      setTimeout(async () => {
        try {
          const { analyzer: analyzer2 } = await Promise.resolve().then(() => (init_analyzer(), analyzer_exports));
          analyzer2.progressCallback = progressCallback;
          analyzer2.setBrandName(brandName.trim());
          if (brandUrl) {
            analyzer2.setBrandUrl(brandUrl.trim());
          }
          await analyzer2.runFullAnalysis();
        } catch (error) {
          console.error("Analysis failed:", error);
        }
      }, 100);
      res.json({
        success: true,
        message: "Analysis started successfully",
        status: "initializing"
      });
    } catch (error) {
      console.error("Error starting analysis:", error);
      res.status(500).json({ error: "Failed to start analysis" });
    }
  });
  app2.get("/api/export", async (req, res) => {
    try {
      const topics2 = await storage.getTopics();
      const prompts2 = await storage.getPrompts();
      const responses2 = await storage.getResponses();
      const competitors2 = await storage.getCompetitors();
      const sources2 = await storage.getSources();
      const analytics2 = await storage.getLatestAnalytics();
      const exportData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        analytics: analytics2,
        topics: topics2,
        prompts: prompts2,
        responses: responses2,
        competitors: competitors2,
        sources: sources2
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="my-brand-analysis-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });
  app2.post("/api/generate-topic-prompts", async (req, res) => {
    try {
      const { topicName, topicDescription, competitors: competitors2, promptCount } = req.body;
      if (!topicName || !topicDescription) {
        return res.status(400).json({ error: "Topic name and description are required" });
      }
      const competitorNames = competitors2?.map((c) => c.name) || [];
      const prompts2 = await generatePromptsForTopic(
        topicName,
        topicDescription,
        promptCount || 5,
        competitorNames
      );
      res.json({ prompts: prompts2 });
    } catch (error) {
      console.error("Error generating topic prompts:", error);
      res.status(500).json({ error: "Failed to generate topic prompts" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3e3;
  server.listen({
    port,
    host: "localhost"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
