import { URL } from 'url';
import puppeteer from "puppeteer";
import { openai, GPT_MODEL } from "./openai";

export interface ScrapedContent {
  title: string;
  description: string;
  features: string[];
  services: string[];
}

// Helper to extract clean text from a page
async function extractPageText(page: any): Promise<string> {
  return await page.evaluate(() => {
    // Remove scripts, styles, and other non-content elements
    const scripts = document.querySelectorAll('script, style, noscript, iframe, svg, header, footer, nav');
    scripts.forEach(script => script.remove());
    
    // Get visible text
    return document.body.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // Increased limit for better context
  });
}

export async function fetchWebsiteText(url: string): Promise<string> {
  let browser;
  try {
    // Ensure the URL starts with http:// or https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    console.log(`[${new Date().toISOString()}] Launching Puppeteer for: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    });

    console.log(`[${new Date().toISOString()}] Navigating to ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Extract content
    const text = await extractPageText(page);
    
    console.log(`[${new Date().toISOString()}] Extracted ${text.length} characters`);
    return text;

  } catch (error) {
    console.error("Error fetching website with Puppeteer:", error);
    
    // Fallback: Try axios if Puppeteer fails (redundancy)
    try {
      console.log("Falling back to simple fetch...");
      const { default: axios } = await import("axios");
      const { load } = await import("cheerio");
      const { data } = await axios.get(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      const $ = load(data);
      $('script, style, noscript, iframe, svg, header, footer, nav').remove();
      return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
    } catch (fallbackError) {
      console.error("Fallback fetch failed:", fallbackError);
      return "";
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function scrapeBrandWebsite(brandUrl: string): Promise<ScrapedContent> {
  try {
    console.log(`[${new Date().toISOString()}] Scraping website: ${brandUrl}`);
    
    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(brandUrl)) {
      brandUrl = 'https://' + brandUrl;
    }

    // Fetch real website content
    const websiteText = await fetchWebsiteText(brandUrl);
    
    if (!websiteText || websiteText.length < 50) {
      console.log(`[${new Date().toISOString()}] Failed to fetch website, using domain name only`);
      const domain = extractDomainFromUrl(brandUrl);
      const brandName = domain.split('.')[0];
      return {
        title: brandName,
        description: `Analysis for ${brandName}`,
        features: [],
        services: []
      };
    }

    console.log(`[${new Date().toISOString()}] Extracted ${websiteText.length} characters from website`);

    // Use OpenAI to analyze the real content and extract structured data
    const analysisPrompt = `Analyze this company website content and extract key information.

Website content:
"""
${websiteText}
"""

Return a JSON object with:
{
  "title": "Company name or main heading",
  "description": "One sentence describing what this company does",
  "features": ["Key feature 1", "Key feature 2", ...], // 3-5 main features/capabilities
  "services": ["Service/product 1", "Service/product 2", ...] // 3-5 main services/products
}

Be specific and use the actual services/features mentioned on the website.`;

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: "You are an expert at analyzing company websites and extracting structured information. Return only valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`[${new Date().toISOString()}] Website analysis complete:`, result);

    return {
      title: result.title || 'Unknown Company',
      description: result.description || '',
      features: result.features || [],
      services: result.services || []
    };

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error scraping website:`, error);
    // Fallback: use domain name
    const domain = extractDomainFromUrl(brandUrl);
    const brandName = domain.split('.')[0];
    return {
      title: brandName,
      description: `Analysis for ${brandName}`,
      features: [],
      services: []
    };
  }
}

export async function generateTopicsFromContent(content: ScrapedContent): Promise<Array<{ name: string; description: string }>> {
  try {
    console.log(`[${new Date().toISOString()}] Generating industry-specific topics for: ${content.title}`);

    // Use AI to generate relevant, industry-specific topics based on actual company services
    const topicPrompt = `Based on this company information, generate 5-7 specific, relevant topic areas for AEO/GEO analysis.

Company: ${content.title}
Description: ${content.description}
Features: ${content.features.join(', ')}
Services: ${content.services.join(', ')}

Generate topics that:
1. Are specific to this company's actual industry and services
2. Reflect real user questions and pain points in this industry
3. Include both product-specific and use-case-specific topics
4. Cover different customer segments (enterprise, SMB, individual)
5. Address common problems users would search for

Examples of good topics:
- For a CRM company: "Small Business CRM Solutions", "Sales Pipeline Management", "Customer Support Integration"
- For a payment processor: "Online Payment Processing", "Subscription Billing", "E-commerce Checkout Solutions"
- For a cloud hosting: "Web Application Hosting", "Database Management Services", "CI/CD Pipeline Setup"

Return ONLY a JSON array:
[
  {"name": "Specific Topic Name", "description": "Brief description of what users search for in this topic"},
  ...
]

Make topics SPECIFIC to this company's industry, not generic.`;

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: "You are an expert at understanding industries and generating relevant search topics. Return only valid JSON array." },
        { role: "user", content: topicPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"topics":[]}');
    const topics = result.topics || result;
    
    if (Array.isArray(topics) && topics.length > 0) {
      console.log(`[${new Date().toISOString()}] Generated ${topics.length} industry-specific topics`);
      return topics;
    }

    // Fallback to generic topics if AI generation fails
    console.log(`[${new Date().toISOString()}] Falling back to generic topics`);
    return [
      { name: "Market Solutions", description: "Analysis of solutions in the company's market segment" },
      { name: "Product Alternatives", description: "Comparison with alternative products and services" },
      { name: "Implementation & Setup", description: "Common setup and implementation questions" },
      { name: "Pricing & Plans", description: "Cost comparison and pricing structure inquiries" },
      { name: "Integration & Compatibility", description: "Integration with existing tools and platforms" }
    ];

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error generating topics:`, error);
    // Fallback topics
    return [
      { name: "Market Solutions", description: "Analysis of solutions in the company's market segment" },
      { name: "Product Alternatives", description: "Comparison with alternative products and services" },
      { name: "Implementation & Setup", description: "Common setup and implementation questions" }
    ];
  }
}

export function extractDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    // If URL parsing fails, try to extract domain from text
    const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    return domainMatch ? domainMatch[1] : url;
  }
}

export function extractUrlsFromText(text: string): string[] {
  // Comprehensive URL regex patterns to capture ALL URLs
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
  
  const allUrls: string[] = [];
  
  urlPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    allUrls.push(...matches);
  });
  
  // Clean and normalize URLs
  const cleanedUrls = allUrls
    .map(url => {
      let cleanUrl = url.trim();
      // Add protocol if missing
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      // Remove trailing punctuation and whitespace
      cleanUrl = cleanUrl.replace(/[.,;!?]+$/, '').trim();
      return cleanUrl;
    })
    .filter(url => {
      // Only filter out obviously invalid URLs, keep everything else
      try {
        const urlObj = new URL(url);
        // Only skip if it's clearly a placeholder or invalid
        if (urlObj.hostname === 'example.com' || 
            urlObj.hostname === 'localhost' ||
            urlObj.hostname.length < 3) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    });
  
  return Array.from(new Set(cleanedUrls)); // Remove duplicates
}
