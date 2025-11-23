import type { PromptAnalysisResult } from "./openai";

const PROVIDER = (process.env.LLM_PROVIDER || "openai").toLowerCase();

// Lazy imports to avoid bundling all providers unnecessarily
export async function analyzePromptResponse(prompt: string): Promise<PromptAnalysisResult> {
  if (PROVIDER === "anthropic" || PROVIDER === "claude") {
    const mod = await import("./anthropic");
    return mod.analyzePromptResponseClaude(prompt);
  }
  const mod = await import("./openai");
  return mod.analyzePromptResponse(prompt);
}

export async function generatePromptsForTopic(
  topicName: string,
  topicDescription: string,
  count: number = 5,
  competitors: string[] = []
): Promise<string[]> {
  if (PROVIDER === "anthropic" || PROVIDER === "claude") {
    const mod = await import("./anthropic");
    return mod.generatePromptsForTopicClaude(topicName, topicDescription, count, competitors);
  }
  const mod = await import("./openai");
  return mod.generatePromptsForTopic(topicName, topicDescription, count, competitors);
}

export async function analyzeBrandAndFindCompetitors(
  brandUrl: string
): Promise<Array<{ name: string; url: string; category: string }>> {
  if (PROVIDER === "anthropic" || PROVIDER === "claude") {
    const mod = await import("./anthropic");
    return mod.analyzeBrandAndFindCompetitorsClaude(brandUrl);
  }
  const mod = await import("./openai");
  return mod.analyzeBrandAndFindCompetitors(brandUrl);
}







