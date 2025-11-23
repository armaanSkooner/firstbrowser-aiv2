# 🎯 How to Use LLM Brand Tracker - Quick Guide

## ⚠️ Important: What This Tool Actually Does

This tool does **NOT** show website traffic. Instead, it shows:
- **Brand Mentions**: How often ChatGPT mentions your brand in its responses
- **Mention Rate**: What percentage of tested prompts resulted in your brand being mentioned
- **Competitor Analysis**: Which competitors are mentioned more often than you
- **Sources**: What websites ChatGPT cites when discussing your brand/industry

Think of it as **"Brand Visibility in AI Responses"** rather than traffic analytics.

---

## 🚀 Step-by-Step: How to Run Your First Analysis

### Step 1: Go to Dashboard
- Open http://localhost:3000
- You'll see the **Dashboard** page by default

### Step 2: Enter Brand Information
1. **Brand Name** field (required): Enter your brand name, e.g., `HubSpot`, `Salesforce`, `Notion`
2. **Brand URL** field (optional but recommended): Enter your website URL, e.g., `https://www.hubspot.com`

### Step 3: Click "Run Analysis" 
- The big blue **"Run Analysis"** button at the top right
- Wait 5-10 minutes for the analysis to complete

### Step 4: What Happens Behind the Scenes
1. 🔍 **Scraping**: If you provided a URL, it scrapes your website to understand your brand
2. 🎯 **Topic Generation**: Creates relevant topics based on your brand (e.g., "Marketing Automation", "CRM Tools")
3. 💬 **Prompt Creation**: Generates 20+ test prompts per topic (e.g., "What are the best CRM tools?")
4. 🤖 **ChatGPT Testing**: Sends each prompt to ChatGPT and gets responses
5. 📊 **Analysis**: Checks if your brand was mentioned, who else was mentioned (competitors), what sources were cited
6. 💾 **Storage**: Saves all results to the database

### Step 5: View Results
Once complete, the dashboard will show:
- **Brand Mentions**: `X/Y` (e.g., "15/100" = your brand mentioned 15 times out of 100 prompts tested)
- **Mention Rate**: Percentage showing how often you're mentioned
- **Top Competitor**: Who else gets mentioned more
- **Sources Found**: What websites ChatGPT references

---

## 📊 Understanding the Results

### On the Dashboard:
- **Brand Mentions**: Shows how many times your brand appeared in ChatGPT responses
- **Total Prompts Tested**: Number of queries sent to ChatGPT
- **Top Competitor**: Your biggest competitor in ChatGPT responses
- **Sources Found**: Number of unique sources/websites cited

### Other Pages You Can Explore:
1. **Prompt Results** (`/prompt-results`): See individual ChatGPT responses, which ones mentioned your brand
2. **Competitors** (`/competitors`): Detailed competitor analysis
3. **Sources** (`/sources`): All websites cited by ChatGPT
4. **Analysis Progress** (`/analysis-progress`): Monitor ongoing analysis, adjust settings

---

## 💡 Example: Analyzing HubSpot

1. Enter **Brand Name**: `HubSpot`
2. Enter **Brand URL**: `https://www.hubspot.com`
3. Click **"Run Analysis"**
4. Wait ~10 minutes
5. You'll see results like:
   - "HubSpot was mentioned in 18 out of 100 prompts"
   - "Top competitor: Salesforce (mentioned 35 times)"
   - "15 different sources cited"

---

## 🔍 Why You Might See "No Data" or Zeros

If you see zeros everywhere, it means:
- ❌ You haven't run an analysis yet (just typing the brand name isn't enough!)
- ❌ The analysis is still running (check "Analysis Progress" page)
- ❌ The analysis completed but your brand wasn't mentioned in any responses

---

## ⚙️ Tips for Better Results

1. **Always provide a URL**: Helps the tool understand your brand better
2. **Be patient**: Analysis takes 5-10 minutes
3. **Check "Analysis Progress"**: See real-time progress and adjust settings
4. **Run multiple analyses**: Test different brand names to compare

---

## 🎯 For Your AEO Tool

This codebase is perfect for your AEO (AI Engine Optimization) tool because it:
- ✅ Shows how brands are mentioned across LLMs (currently ChatGPT, but extensible)
- ✅ Tracks competitor mentions
- ✅ Identifies sources/citations
- ✅ Provides actionable insights on brand visibility

**Next Steps for Multi-LLM Support:**
- The architecture is ready to add Claude, Gemini, Perplexity
- You'd need to add similar API integrations for each LLM
- The analysis flow stays the same, just swap the LLM service

---

## 🆘 Troubleshooting

**"No data showing"**:
- Did you click "Run Analysis"? (Not just enter the brand name)
- Check the "Analysis Progress" page to see if it's still running

**"Analysis failed"**:
- Check your OpenAI API key is valid in `.env` file
- Make sure PostgreSQL database is running
- Check server logs for errors

**"Brand mentioned 0 times"**:
- This is actually useful data! It means ChatGPT isn't mentioning your brand
- Try different brand variations (e.g., "HubSpot" vs "HubSpot CRM")
- Check competitor analysis to see who IS getting mentioned


