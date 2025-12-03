import 'dotenv/config';
import { fetchWebsiteText, scrapeBrandWebsite } from "./services/scraper";
import { openai, GPT_MODEL } from "./services/openai";
import { storage } from "./storage";

async function runDiagnosis() {
  console.log("🔍 STARTING SYSTEM DIAGNOSIS...\n");

  // 1. Check Environment Variables
  console.log("1️⃣  Checking Environment Configuration...");
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasDb = !!process.env.DATABASE_URL;
  
  console.log(`   - OPENROUTER_API_KEY: ${hasOpenRouter ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - OPENAI_API_KEY: ${hasOpenAI ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - DATABASE_URL: ${hasDb ? "✅ Present" : "❌ Missing"}`);
  console.log(`   - Active Model: ${GPT_MODEL}`);
  
  if (!hasOpenRouter && !hasOpenAI) {
    console.error("\n❌ CRITICAL: No API Key found. The system cannot work without an AI provider.");
    return;
  }

  // 2. Test Database Connection
  console.log("\n2️⃣  Testing Database Connection...");
  try {
    const topicCount = (await storage.getTopics()).length;
    console.log(`   ✅ Database connected! Found ${topicCount} existing topics.`);
  } catch (error) {
    console.error("   ❌ Database connection failed:", error);
  }

  // 3. Test AI API (Simple Chat)
  console.log("\n3️⃣  Testing AI API (OpenRouter/OpenAI)...");
  try {
    const start = Date.now();
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: "Reply with just the word 'Working'." }],
      max_tokens: 10,
    });
    const duration = Date.now() - start;
    const reply = completion.choices[0]?.message?.content;
    console.log(`   ✅ AI Response received in ${duration}ms: "${reply}"`);
  } catch (error: any) {
    console.error("   ❌ AI API Check Failed:", error.message);
    if (error.message.includes("401")) {
      console.error("      -> Your API Key is likely invalid or expired.");
    }
  }

  // 4. Test Scraping (Puppeteer)
  const testUrl = "https://www.spotify.com";
  console.log(`\n4️⃣  Testing Web Scraper on ${testUrl}...`);
  try {
    const start = Date.now();
    const text = await fetchWebsiteText(testUrl);
    const duration = Date.now() - start;
    
    if (text.length > 500) {
      console.log(`   ✅ Scraping successful! Retrieved ${text.length} chars in ${duration}ms.`);
      console.log(`   Preview: "${text.substring(0, 100).replace(/\n/g, ' ')}..."`);
    } else {
      console.warn(`   ⚠️  Scraping returned very little text (${text.length} chars). Might be blocked.`);
    }
  } catch (error: any) {
    console.error("   ❌ Scraping Failed:", error.message);
  }

  console.log("\n🏁 DIAGNOSIS COMPLETE");
}

runDiagnosis().catch(console.error);

