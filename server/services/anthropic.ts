import Anthropic from "@anthropic-ai/sdk";
import { fetchWebsiteText } from "./scraper";
import type { PromptAnalysisResult } from "./openai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";

async function callAnthropicWithRetry(apiCall: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Anthropic API timeout - attempt ${attempt}`)), 30000)
      );
      
      return await Promise.race([apiCall(), timeoutPromise]);
    } catch (error: any) {
      console.log(`Anthropic API attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function analyzePromptResponseClaude(prompt: string): Promise<PromptAnalysisResult> {
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
    
    const response = await callAnthropicWithRetry(() =>
      anthropic.messages.create({
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

    const responseText = response.content[0].type === 'text' ? response.content[0].text : "";

    // Analyze the response for brand mentions and competitors
    const analysisResponse = await callAnthropicWithRetry(() =>
      anthropic.messages.create({
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

    const analysisText = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : "{}";
    const analysis = JSON.parse(analysisText);

    return {
      response: responseText,
      brandMentioned: analysis.brandMentioned || false,
      competitors: analysis.competitors || [],
      sources: analysis.sources || [],
    };
  } catch (error) {
    console.error("Error analyzing prompt response with Claude:", error);
    throw new Error("Failed to analyze prompt response: " + (error as Error).message);
  }
}

export async function generatePromptsForTopicClaude(
  topicName: string,
  topicDescription: string,
  count: number = 5,
  competitors: string[] = []
): Promise<string[]> {
  const prompts: string[] = [];
  
  const aspects = [
    'cost and pricing',
    'ease of use',
    'performance and speed',
    'reliability and stability',
    'features and capabilities',
    'user experience',
    'scaling and growth',
    'support and documentation',
    'security and privacy',
    'maintenance and updates',
    'team collaboration',
    'integration options',
    'backup and recovery',
    'compliance and regulations',
    'cost optimization',
    'migration and switching',
    'customization options',
    'troubleshooting and help',
    'performance comparison',
    'automation capabilities'
  ];

  let attempts = 0;
  const maxAttempts = count * 5;
  
  while (prompts.length < count && attempts < maxAttempts) {
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
        temperature: 0.9,
      });

      let newPrompt = response.content[0].type === 'text' ? response.content[0].text.trim() : "";
      
      if (newPrompt) {
        newPrompt = newPrompt
          .replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]+$/g, '')
          .replace(/\\"|\\\'/g, '')
          .replace(/\s+(please|exactly|specifically)$/i, '')
          .trim();
          
        while (newPrompt.match(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/)) {
          newPrompt = newPrompt.replace(/^["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]|["'`"'"'"""''„"‚'‛\u201C\u201D\u2018\u2019]$/g, '').trim();
        }
          
        if (newPrompt.length > 0) {
          newPrompt = newPrompt.charAt(0).toUpperCase() + newPrompt.slice(1);
          
          if (/^(how|what|when|where|why|which|can|should|do|does|is|are|will)/i.test(newPrompt) && !newPrompt.endsWith('?')) {
            newPrompt += '?';
          }
        }
          
        if (newPrompt.split(' ').length <= 12 && newPrompt.split(' ').length >= 3 && newPrompt.includes(' ')) {
          prompts.push(newPrompt);
        }
      }
    } catch (error) {
      console.error("Error generating prompt with Claude:", error);
      continue;
    }
  }

  // Generate additional fallback prompts if needed
  while (prompts.length < count) {
    const fallbackTemplates = [
      `Dealing with ${topicName.toLowerCase()} complexity`,
      `Need help optimizing ${topicName.toLowerCase()} setup`,
      `Struggling with ${topicName.toLowerCase()} performance issues`,
      `How to improve ${topicName.toLowerCase()} reliability?`,
      `Tired of ${topicName.toLowerCase()} maintenance overhead`,
    ];
    
    for (const template of fallbackTemplates) {
      if (prompts.length >= count) break;
      if (!prompts.includes(template)) {
        prompts.push(template);
      }
    }
    
    if (prompts.length < count) {
      for (let i = prompts.length; i < count; i++) {
        prompts.push(`${topicName} question ${i + 1}`);
      }
    }
    
    break;
  }

  return prompts.slice(0, count);
}

export async function analyzeBrandAndFindCompetitorsClaude(brandUrl: string): Promise<Array<{name: string, url: string, category: string}>> {
  try {
    console.log(`[${new Date().toISOString()}] Starting brand analysis with Claude for: ${brandUrl}`);
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(`[${new Date().toISOString()}] No Anthropic API key found`);
      return [
        { name: "Sample Competitor 1", url: "https://competitor1.com", category: "Technology" },
        { name: "Sample Competitor 2", url: "https://competitor2.com", category: "Technology" }
      ];
    }

    const homepageText = await fetchWebsiteText(brandUrl);
    if (!homepageText) {
      console.warn(`[${new Date().toISOString()}] No homepage text found for ${brandUrl}`);
    }

    const analysisPromises = Array.from({ length: 3 }, async (_, index) => {
      try {
        const prompts = [
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 well-known, established competitors.",
            user: `Homepage content: """${homepageText}"""\n\nFind 2-3 well-known direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 newer or emerging competitors.",
            user: `Homepage content: """${homepageText}"""\n\nFind 2-3 newer or emerging direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          },
          {
            system: "You are an expert at identifying direct competitors for technology companies. Given the following homepage content, find 2-3 enterprise-focused or developer-focused competitors.",
            user: `Homepage content: """${homepageText}"""\n\nFind 2-3 enterprise or developer-focused direct competitors for this company. Return as JSON array: [{"name": "Competitor Name", "url": "https://competitor.com", "category": "Category"}]`
          }
        ];
        
        const currentPrompt = prompts[index];
        
        const response = await callAnthropicWithRetry(() =>
          anthropic.messages.create({
            model: MODEL,
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `${currentPrompt.system}\n\n${currentPrompt.user}\n\nIMPORTANT: Return a JSON array, not a single object.`
              }
            ],
            temperature: 0.4,
          })
        );

        const content = response.content[0].type === 'text' ? response.content[0].text : "[]";
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
          return result.filter((item: any) => 
            typeof item === 'object' && 
            item.name && 
            item.url && 
            item.category
          );
        } else if (result && typeof result === 'object') {
          if (result.name && result.url && result.category) {
            return [result];
          }
          if (result.competitors && Array.isArray(result.competitors)) {
            return result.competitors.filter((item: any) => 
              typeof item === 'object' && 
              item.name && 
              item.url && 
              item.category
            );
          }
        }
        
        return [];
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in analysis attempt ${index + 1}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(analysisPromises);
    
    const allCompetitors: Array<{name: string, url: string, category: string}> = [];
    const seenNames = new Set<string>();
    
    results.forEach((competitors) => {
      competitors.forEach((competitor: any) => {
        const normalizedName = competitor.name.toLowerCase().trim();
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          allCompetitors.push(competitor);
        }
      });
    });
    
    return allCompetitors.slice(0, 8);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error analyzing brand with Claude:`, error);
    return [];
  }
}


