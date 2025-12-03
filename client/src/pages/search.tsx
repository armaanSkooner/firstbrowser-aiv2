import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, TrendingUp, Globe, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [companyInput, setCompanyInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!companyInput.trim()) return;
    
    setIsSearching(true);
    
    // Store the company name/URL for the analysis
    const isUrl = companyInput.includes('.');
    if (isUrl) {
      localStorage.setItem('brandUrl', companyInput.trim());
      // Extract company name from URL
      try {
        const url = new URL(companyInput.includes('http') ? companyInput : `https://${companyInput}`);
        const domain = url.hostname.replace('www.', '');
        const companyName = domain.split('.')[0];
        localStorage.setItem('brandName', companyName);
      } catch (e) {
        localStorage.setItem('brandName', companyInput.trim());
      }
    } else {
      localStorage.setItem('brandName', companyInput.trim());
      localStorage.setItem('brandUrl', '');
    }
    
    // Navigate to results page
    setTimeout(() => {
      setLocation('/results');
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const exampleCompanies = [
    "Shopify", 
    "Stripe", 
    "Airbnb", 
    "Linear", 
    "Vercel"
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto space-y-12"
      >
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Brand Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            How do AI Engines <br/>
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              perceive your brand?
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Analyze your visibility across ChatGPT, Claude, Perplexity, and Google Gemini.
            Optimize your Answer Engine Optimization (AEO) strategy.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 ring-1 ring-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <div className="pl-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter brand name (e.g. Spotify, Notion)..."
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-14 text-lg border-0 focus-visible:ring-0 bg-transparent placeholder:text-slate-400"
                  disabled={isSearching}
                  autoFocus
                />
                <Button
                  size="lg"
                  onClick={handleSearch}
                  disabled={!companyInput.trim() || isSearching}
                  className="h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example Companies */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Try searching for:{" "}
              {exampleCompanies.map((company, i) => (
                <span 
                  key={company}
                  onClick={() => setCompanyInput(company)}
                  className="inline-block mx-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-medium cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {company}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            {
              icon: TrendingUp,
              color: "text-blue-600",
              bg: "bg-blue-50",
              title: "Share of Voice",
              desc: "Track your brand mentions against competitors in AI responses."
            },
            {
              icon: Globe,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              title: "Global Reach",
              desc: "Understand how your brand appears in different regions."
            },
            {
              icon: Zap,
              color: "text-purple-600",
              bg: "bg-purple-50",
              title: "Real-time Analysis",
              desc: "Get instant feedback on your brand's standing in the AI era."
            }
          ].map((feature, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white/60 hover:bg-white hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 text-center space-y-3">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
