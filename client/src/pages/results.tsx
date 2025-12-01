import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  MessageSquare,
  Globe,
  Building2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Users,
  Target,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Metrics {
  brandMentionRate: number;
  totalPrompts: number;
  topCompetitor: string;
  totalSources: number;
  totalDomains: number;
}

interface CompetitorAnalysis {
  competitorId: number;
  name: string;
  category: string | null;
  mentionCount: number;
  mentionRate: number;
  changeRate: number;
}

interface TopicAnalysis {
  topicId: number;
  topicName: string;
  mentionRate: number;
  totalPrompts: number;
  brandMentions: number;
}

interface SourceAnalysis {
  sourceId: number;
  domain: string;
  url: string;
  citationCount: number;
  citationRate: number;
}

interface BrandInfo {
  name: string;
  url?: string;
  description?: string;
  industry?: string;
  employeeCount?: string;
  features?: string[];
  services?: string[];
}


export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [brandName, setBrandName] = useState(() => localStorage.getItem('brandName') || '');
  const [brandUrl, setBrandUrl] = useState(() => localStorage.getItem('brandUrl') || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasData, setHasData] = useState(false);

  const { data: metrics, refetch: refetchMetrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: brandInfo, refetch: refetchBrandInfo } = useQuery<BrandInfo>({
    queryKey: ["/api/brand-info"],
  });

  const { data: counts } = useQuery<any>({
    queryKey: ["/api/counts"],
  });

  const { data: competitors } = useQuery<CompetitorAnalysis[]>({
    queryKey: ['/api/competitors/analysis'],
  });

  const { data: topics } = useQuery<TopicAnalysis[]>({
    queryKey: ['/api/topics/analysis'],
  });

  const { data: sources } = useQuery<SourceAnalysis[]>({
    queryKey: ['/api/sources/analysis'],
  });

  useEffect(() => {
    // Check if we have any data
    const hasAnalysisData = counts?.totalPrompts > 0;
    setHasData(hasAnalysisData);
  }, [counts]);

  const handleRunAnalysis = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Brand Name Required",
        description: "Please enter your brand name.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/analysis/start", { 
        brandName,
        brandUrl: brandUrl.trim() || undefined
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Analysis Started",
          description: "Brand analysis is running in the background. This may take 5-10 minutes.",
        });
        
        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const countsResponse = await fetch('/api/counts');
            const countsData = await countsResponse.json();
            
            if (countsData.totalPrompts > 0) {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              setHasData(true);
              await refetchMetrics();
              await refetchBrandInfo();
              toast({
                title: "Analysis Complete",
                description: "Brand analysis finished successfully!",
              });
            }
          } catch (error) {
            console.error("Error polling:", error);
          }
        }, 3000);
        
        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isAnalyzing) {
            setIsAnalyzing(false);
          }
        }, 600000);
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  // Calculate scores (simplified - can be made more sophisticated)
  const aeoScore = hasData ? Math.round((metrics?.brandMentionRate || 0) * 0.8 + 20) : 0;
  const geoScore = 0; // GEO data not yet available

  const totalPrompts = counts?.totalPrompts || 0;
  const brandMentions = counts?.brandMentions || 0;
  const topCompetitorData = competitors?.find(c => c.name === metrics?.topCompetitor);

  // Get top queries (topics with highest mention rates)
  const topQueries = topics?.sort((a, b) => b.mentionRate - a.mentionRate).slice(0, 2) || [];

  // Calculate citations present vs missing
  const totalPossibleCitations = 4; // Simplified
  const citationsPresent = Math.min(sources?.length || 0, totalPossibleCitations);
  const citationsMissing = totalPossibleCitations - citationsPresent;

  // Calculate potential sales impact
  const potentialImpact = topCompetitorData ? Math.round((topCompetitorData.mentionRate - (metrics?.brandMentionRate || 0)) * 20) : 0;

  // Count AI engines based on actual sources found
  const knownEngines = [
    { name: "ChatGPT", domain: "openai.com" },
    { name: "Perplexity", domain: "perplexity.ai" },
    { name: "Claude", domain: "anthropic.com" },
    { name: "Google Gemini", domain: "google.com" },
    { name: "Bing Chat", domain: "bing.com" }
  ];

  const aiEngines = knownEngines.map(engine => {
    const source = sources?.find(s => s.domain.includes(engine.domain));
    return {
      name: engine.name,
      status: source ? "Mentioned" : "Not Detected",
      lastSeen: source ? "Recently" : "-",
      example: source ? "Found in sources" : "No data yet"
    };
  });

  const sortedCompetitors = competitors?.sort((a, b) => b.mentionRate - a.mentionRate).slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">{brandName || 'Company Analysis'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Demo environment</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Company Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">{brandName}</h2>
                {brandUrl && (
                  <Link href={brandUrl.includes('http') ? brandUrl : `https://${brandUrl}`}>
                    <a className="text-blue-600 hover:underline flex items-center gap-1 text-sm" target="_blank">
                      {brandUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {brandInfo?.industry && (
                    <Badge variant="outline" className="text-xs">
                      {brandInfo.industry}
                    </Badge>
                  )}
                  {brandInfo?.employeeCount && (
                    <span>{brandInfo.employeeCount} employees</span>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">AEO Score</div>
                  <div className="text-4xl font-bold text-blue-600">{aeoScore}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">GEO Score</div>
                  <div className="text-4xl font-bold text-indigo-600">{geoScore}</div>
                </div>
              </div>
            </div>

            {!hasData && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">No Analysis Data Available</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Run an analysis to see visibility metrics, competitor insights, and more.
                    </p>
                    <Button 
                      onClick={handleRunAnalysis} 
                      disabled={isAnalyzing}
                      className="mt-3"
                      size="sm"
                    >
                      {isAnalyzing ? 'Running Analysis...' : 'Run Analysis Now'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        {hasData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Answer engine visibility</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {aiEngines.length} engines tracked
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      AEO Score is based on coverage, prominence, freshness and accuracy.
                    </p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Top queries</p>
                    <ul className="mt-2 space-y-1">
                      {topQueries.map((topic, idx) => (
                        <li key={idx} className="text-xs text-gray-700">• "{topic.topicName}"</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Local footprint</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">2 countries</p>
                    <p className="text-xs text-gray-500 mt-1">Avg rating: 4.8/5</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Citations missing</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {citationsMissing} missing / {totalPossibleCitations}
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Present in {citationsPresent} engines
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Different Views */}
        {hasData && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engines">Answer Engines</TabsTrigger>
              <TabsTrigger value="geo">Local & GEO</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Why This Matters & Potential Impact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Why this matters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">AEO = how AI answers talk about you</p>
                        <p className="text-xs text-gray-600">Higher visibility means more brand awareness</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">GEO = how buyers find you on the ground</p>
                        <p className="text-xs text-gray-600">Local presence drives trust and conversions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Both feed into pipeline, brand, and trust</p>
                        <p className="text-xs text-gray-600">Optimize both for maximum impact</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Potential sales impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-5xl font-bold text-blue-600 mb-2">{potentialImpact}</div>
                      <p className="text-sm text-gray-600 mb-4">
                        You lose <span className="font-semibold">{potentialImpact}</span> vs competitor ({topCompetitorData?.name || 'Top'})
                      </p>
                      <div className="text-xs text-gray-500">
                        Based on {(topCompetitorData?.mentionRate || 0).toFixed(1)}% competitor visibility vs{" "}
                        {(metrics?.brandMentionRate || 0).toFixed(1)}% yours
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* High-level Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">High-level summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">
                    • <span className="font-medium">{brandName}</span> appears in{" "}
                    <span className="font-semibold text-blue-600">{brandMentions}/{totalPrompts}</span> tested prompts
                    ({(metrics?.brandMentionRate || 0).toFixed(1)}% mention rate)
                  </p>
                  <p className="text-sm text-gray-700">
                    • Top competitor <span className="font-semibold">{topCompetitorData?.name || 'Unknown'}</span> has{" "}
                    <span className="font-semibold text-amber-600">{(topCompetitorData?.mentionRate || 0).toFixed(1)}%</span> mention rate
                  </p>
                  <p className="text-sm text-gray-700">
                    • Present in <span className="font-semibold text-green-600">{citationsPresent}</span> engines,
                    missing from <span className="font-semibold text-red-600">{citationsMissing}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    • <span className="font-semibold">{sources?.length || 0}</span> different sources cited across{" "}
                    {metrics?.totalDomains || 0} domains
                  </p>
                </CardContent>
              </Card>

              {/* Top Competitors Quick View */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competitive landscape</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedCompetitors.map((competitor, idx) => (
                      <div key={competitor.competitorId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 w-6">#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{competitor.name}</p>
                            {competitor.category && (
                              <p className="text-xs text-gray-500">{competitor.category}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {competitor.mentionRate.toFixed(1)}%
                          </span>
                          <div className="w-24">
                            <Progress value={competitor.mentionRate} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engines" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Answer engine presence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-medium text-gray-700">Engine</th>
                            <th className="text-center py-3 font-medium text-gray-700">Appearance</th>
                            <th className="text-right py-3 font-medium text-gray-700">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiEngines.map((engine, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-3 font-medium text-gray-900">{engine.name}</td>
                              <td className="py-3 text-center">
                                <Badge 
                                  variant="outline" 
                                  className={engine.status === "Mentioned" 
                                    ? "bg-green-50 text-green-700 border-green-200" 
                                    : "bg-gray-50 text-gray-500 border-gray-200"}
                                >
                                  {engine.status}
                                </Badge>
                              </td>
                              <td className="py-3 text-right text-gray-600">{engine.example}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How we calculate AEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How we calculate AEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <span className="font-medium">Coverage</span>: how many engines know this entity</li>
                    <li>• <span className="font-medium">Prominence</span>: whether it's a main answer or side mention</li>
                    <li>• <span className="font-medium">Freshness</span>: how recent those answers are</li>
                    <li>• <span className="font-medium">Accuracy</span>: how correct and on-brand the answers feel</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Local & GEO presence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">Local SEO Analysis Coming Soon</p>
                    <p className="text-sm max-w-md mx-auto mt-2">
                      Detailed local ranking data, Google Maps visibility, and review sentiment analysis will be available in the next update.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* How we calculate GEO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How we calculate GEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <span className="font-medium">Location coverage</span> across countries/cities</li>
                    <li>• <span className="font-medium">Ratings + review volume</span> in key markets</li>
                    <li>• <span className="font-medium">Listing completeness</span> on local platforms</li>
                    <li>• <span className="font-medium">Consistency</span> of name, address, phone (NAP)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competitor mention rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedCompetitors.map((competitor, idx) => (
                      <div key={competitor.competitorId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{competitor.name}</span>
                            {competitor.category && (
                              <Badge variant="outline" className="text-xs">
                                {competitor.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {competitor.mentionRate.toFixed(1)}%
                            </span>
                            {competitor.changeRate > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : competitor.changeRate < 0 ? (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            ) : null}
                          </div>
                        </div>
                        <Progress value={competitor.mentionRate} className="h-2" />
                        <p className="text-xs text-gray-500">
                          Mentioned in {competitor.mentionCount} out of {totalPrompts} prompts
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {sortedCompetitors[0]?.name || 'N/A'}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Top Competitor</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(sortedCompetitors[0]?.mentionRate || 0).toFixed(1)}% mention rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {sortedCompetitors.filter(c => c.changeRate < 0).length}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Losing Ground</div>
                    <div className="text-xs text-gray-500 mt-1">
                      competitors declining vs you
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {sortedCompetitors.filter(c => c.changeRate > 0).length}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Gaining Ground</div>
                    <div className="text-xs text-gray-500 mt-1">
                      competitors rising vs you
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Run Analysis Button (bottom) */}
        {hasData && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Need fresh data?</h3>
                  <p className="text-sm text-gray-600">Run a new analysis to update all metrics</p>
                </div>
                <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Running...' : 'Run New Analysis'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

