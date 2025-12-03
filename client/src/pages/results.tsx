import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Target,
  Settings,
  PlayCircle,
  Search,
  Share2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  const aeoScore = hasData ? Math.round((metrics?.brandMentionRate || 0) * 0.8 + 20) : 0;
  const geoScore = 0;

  const totalPrompts = counts?.totalPrompts || 0;
  const brandMentions = counts?.brandMentions || 0;
  const topCompetitorData = competitors?.find(c => c.name === metrics?.topCompetitor);
  const topQueries = topics?.sort((a, b) => b.mentionRate - a.mentionRate).slice(0, 2) || [];

  const totalPossibleCitations = 4;
  const citationsPresent = Math.min(sources?.length || 0, totalPossibleCitations);
  const citationsMissing = totalPossibleCitations - citationsPresent;
  const potentialImpact = topCompetitorData ? Math.round((topCompetitorData.mentionRate - (metrics?.brandMentionRate || 0)) * 20) : 0;

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      {/* Modern Header with Blur */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">{brandName || 'Company Analysis'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {hasData && (
              <Button variant="outline" size="sm" onClick={handleRunAnalysis} disabled={isAnalyzing} className="hidden sm:flex gap-2">
                <PlayCircle className="h-4 w-4" />
                {isAnalyzing ? 'Running...' : 'Refresh Analysis'}
              </Button>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-64 h-64 text-primary" />
          </div>
          
          <div className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{brandName}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    {brandUrl && (
                      <a href={brandUrl.includes('http') ? brandUrl : `https://${brandUrl}`} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                        <Globe className="h-4 w-4 mr-1.5" />
                        {brandUrl}
                      </a>
                    )}
                    {brandInfo?.industry && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{brandInfo.industry}</span>
                      </>
                    )}
                    {brandInfo?.employeeCount && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{brandInfo.employeeCount} employees</span>
                      </>
                    )}
                  </div>
                </div>
                
                {brandInfo?.description && (
                  <p className="text-slate-600 max-w-2xl leading-relaxed">
                    {brandInfo.description}
                  </p>
                )}

                {brandInfo?.features && brandInfo.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {brandInfo.features.slice(0, 4).map((feature, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-6 min-w-[200px]">
                <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="text-sm font-medium text-slate-500 mb-1">AEO Score</div>
                  <div className="text-5xl font-bold text-primary tracking-tight">{aeoScore}</div>
                  <div className="text-xs text-slate-400 mt-1">/ 100</div>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center opacity-50">
                  <div className="text-sm font-medium text-slate-500 mb-1">GEO Score</div>
                  <div className="text-5xl font-bold text-slate-400 tracking-tight">--</div>
                  <div className="text-xs text-slate-400 mt-1">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {!hasData ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center"
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No Analysis Data Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">
              Start your first analysis to uncover how Answer Engines perceive your brand compared to competitors.
            </p>
            <Button onClick={handleRunAnalysis} disabled={isAnalyzing} size="lg" className="gap-2">
              {isAnalyzing ? <span className="loading loading-spinner loading-sm"></span> : <PlayCircle className="h-5 w-5" />}
              {isAnalyzing ? 'Running Analysis...' : 'Start Analysis Now'}
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={item}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">Visibility</Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900">{aiEngines.filter(e => e.status === "Mentioned").length} / {aiEngines.length}</h3>
                      <p className="text-sm font-medium text-slate-600">Engines Tracked</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Presence across major AI platforms
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">Mentions</Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900">{metrics?.brandMentionRate.toFixed(1)}%</h3>
                      <p className="text-sm font-medium text-slate-600">Share of Voice</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Frequency in AI-generated responses
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Target className="h-5 w-5 text-amber-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">Gap</Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900">{citationsMissing}</h3>
                      <p className="text-sm font-medium text-slate-600">Missing Citations</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Key sources where you're not cited
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Share2 className="h-5 w-5 text-green-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">Reach</Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalSources}</h3>
                      <p className="text-sm font-medium text-slate-600">Total Sources</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      Unique domains citing your brand
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="bg-white p-1 border border-slate-200 rounded-lg w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100">Overview</TabsTrigger>
                <TabsTrigger value="engines" className="data-[state=active]:bg-slate-100">Answer Engines</TabsTrigger>
                <TabsTrigger value="competitors" className="data-[state=active]:bg-slate-100">Competitors</TabsTrigger>
                <TabsTrigger value="geo" className="data-[state=active]:bg-slate-100">Local & GEO</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Competitive Landscape</CardTitle>
                      <CardDescription>How you stack up against identified competitors in AI responses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {sortedCompetitors.map((competitor, idx) => (
                          <div key={competitor.competitorId} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                  {idx + 1}
                                </div>
                                <span className="font-medium text-slate-900">{competitor.name}</span>
                                {competitor.category && (
                                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    {competitor.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-900">{competitor.mentionRate.toFixed(1)}%</span>
                                {competitor.changeRate > 0 ? (
                                  <span className="text-xs text-red-500 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-0.5" />
                                    {competitor.changeRate}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-green-500 flex items-center">
                                    <TrendingDown className="h-3 w-3 mr-0.5" />
                                    {Math.abs(competitor.changeRate)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <Progress value={competitor.mentionRate} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Queries</CardTitle>
                        <CardDescription>Where your brand appears most</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {topQueries.map((topic, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <p className="text-sm font-medium text-slate-900">"{topic.topicName}"</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {topic.mentionRate.toFixed(0)}% Visibility
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {topQueries.length === 0 && (
                            <p className="text-sm text-slate-500">No query data available yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-primary">Potential Impact</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-primary mb-2">{potentialImpact}</div>
                        <p className="text-sm text-slate-600">
                          Estimated monthly opportunities lost to {topCompetitorData?.name || 'competitors'} based on visibility gaps.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="engines">
                <Card>
                  <CardHeader>
                    <CardTitle>Answer Engine Presence</CardTitle>
                    <CardDescription>Detailed breakdown of your visibility across key AI platforms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiEngines.map((engine, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${engine.status === "Mentioned" ? "bg-green-500" : "bg-slate-300"}`} />
                            <div>
                              <p className="font-medium text-slate-900">{engine.name}</p>
                              <p className="text-xs text-slate-500">{engine.example}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={engine.status === "Mentioned" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-slate-50 text-slate-500 border-slate-200"}
                          >
                            {engine.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competitors">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Competitor Analysis</CardTitle>
                    <CardDescription>Compare your visibility against specific competitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {competitors?.map((competitor) => (
                        <div key={competitor.competitorId} className="p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                {competitor.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{competitor.name}</h4>
                                <p className="text-xs text-slate-500">{competitor.category || 'Competitor'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">{competitor.mentionRate.toFixed(1)}%</div>
                              <p className="text-xs text-slate-500">Share of Voice</p>
                            </div>
                          </div>
                          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500" 
                              style={{ width: `${competitor.mentionRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="geo">
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Local & GEO Analysis</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                      We are currently rolling out local presence tracking. Check back soon for detailed maps and sentiment analysis.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </main>
    </div>
  );
}