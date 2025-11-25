import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, TrendingUp, Globe, Zap } from "lucide-react";

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
    "Airbnb", 
    "Shopify", 
    "Pender & Howe", 
    "Medaki", 
    "Manin"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl mx-auto text-center space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AEO · GEO Demo
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900">
            Search any company or person
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Type a name and see their visibility across{" "}
            <span className="font-semibold text-blue-600">answer engines</span>{" "}
            and{" "}
            <span className="font-semibold text-indigo-600">local presence</span>
          </p>
        </div>

        {/* Search Box */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="e.g. Airbnb, Shopify, Pender & Howe, Medaki or Manin"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSearching}
                />
              </div>
              <Button
                size="lg"
                onClick={handleSearch}
                disabled={!companyInput.trim() || isSearching}
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Example Companies */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            This demo includes a few example entities. Try{" "}
            {exampleCompanies.slice(0, -1).join(", ")},{" "}
            <span className="font-medium text-gray-700">{exampleCompanies[exampleCompanies.length - 1]}</span>.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="p-6 text-center space-y-2">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Answer Engine Visibility</h3>
              <p className="text-sm text-gray-600">Track mentions across ChatGPT, Claude, Perplexity & more</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/50">
            <CardContent className="p-6 text-center space-y-2">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Local Footprint</h3>
              <p className="text-sm text-gray-600">Geographic coverage, ratings & review volume</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50/50">
            <CardContent className="p-6 text-center space-y-2">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Competitive Intelligence</h3>
              <p className="text-sm text-gray-600">See how you stack up against competitors</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

