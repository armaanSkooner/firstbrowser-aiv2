import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CompanyData {
  name: string;
  industry: string;
  location: string;
  website: string;
  aeoScore: number;
  geoScore: number;
  answerEngines: Array<{
    engine: string;
    query: string;
    appearance: string;
    lastSeen: string;
  }>;
  topQueries: Array<{
    query: string;
    category: string;
  }>;
  localPresence: {
    countries: Array<{
      country: string;
      cities: number;
      avgRating: number;
      reviewCount: number;
    }>;
  };
  citations: {
    missing: number;
    total: number;
    present: string[];
  };
  contacts: Array<{
    name: string;
    role: string;
    linkedIn?: string;
  }>;
  potentialImpact: {
    score: number;
    compared: string;
    totalMarket: number;
  };
  competitors?: string[];
}

export default function CompanyResultsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const companyQuery = searchParams.get("q") || "";

  const { data: companyData, isLoading, error } = useQuery<CompanyData>({
    queryKey: ["company-analysis", companyQuery],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/companies/analyze", {
        query: companyQuery,
      });
      return response.json();
    },
    enabled: !!companyQuery,
  });

  if (!companyQuery) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No company specified</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !companyData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading company data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {companyData.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
              <span>{companyData.industry}</span>
              <span>•</span>
              <span>{companyData.location}</span>
            </div>
            <a
              href={companyData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {companyData.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">AEO Score</div>
              <div className="text-4xl font-bold text-blue-600">
                {companyData.aeoScore}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">GEO Score</div>
              <div className="text-4xl font-bold text-green-600">
                {companyData.geoScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Answer engine visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {companyData.answerEngines.length} engines tracked
            </div>
            <p className="text-xs text-gray-500">
              AEO Score is based on coverage, prominence, freshness and accuracy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Top queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-2">
              {companyData.topQueries.slice(0, 2).map((q, i) => (
                <div key={i} className="text-sm">
                  • "{q.query}"
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Local footprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {companyData.localPresence.countries.length} countries
            </div>
            <p className="text-xs text-gray-500">
              Avg rating:{" "}
              {(
                companyData.localPresence.countries.reduce(
                  (acc, c) => acc + c.avgRating,
                  0
                ) / companyData.localPresence.countries.length
              ).toFixed(1)}
              /5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Potential sales impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {companyData.potentialImpact.score}
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span>
                You lose {companyData.potentialImpact.score} vs competitor (
                {companyData.potentialImpact.compared})
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              /{companyData.potentialImpact.totalMarket}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engines">Answer Engines</TabsTrigger>
          <TabsTrigger value="local">Local & GEO</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* High-level Summary */}
          <Card>
            <CardHeader>
              <CardTitle>High-level summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  {companyData.industry} company specializing in leadership
                  recruitment and board advisory.
                </li>
                <li>
                  Member of global networks, giving them reach across multiple
                  continents and markets.
                </li>
                <li>
                  Operates a focused search model to deliver personalized and
                  successful placements.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AEO/GEO Calculation */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How we calculate AEO</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>Coverage:</strong> how many engines know this entity
                  </li>
                  <li>
                    <strong>Prominence:</strong> whether it's a main answer or
                    side mention
                  </li>
                  <li>
                    <strong>Freshness:</strong> how recent those answers are
                  </li>
                  <li>
                    <strong>Accuracy:</strong> how correct and on-brand the
                    answers feel
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How we calculate GEO</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    <strong>Location coverage</strong> across countries/cities
                  </li>
                  <li>
                    <strong>Ratings + review volume</strong> in key markets
                  </li>
                  <li>
                    <strong>Listing completeness</strong> on local platforms
                  </li>
                  <li>
                    <strong>Consistency</strong> of name, address, phone (NAP)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Citations */}
          <Card>
            <CardHeader>
              <CardTitle>Citations missing</CardTitle>
              <CardDescription>
                {companyData.citations.missing} missing /{" "}
                {companyData.citations.total}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress
                  value={
                    ((companyData.citations.total -
                      companyData.citations.missing) /
                      companyData.citations.total) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  Present in {companyData.citations.present.length} engines
                </Badge>
                <span className="text-gray-600">
                  {companyData.citations.present.join(", ")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Answer engine presence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Engine
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Example query
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Appearance
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Last seen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.answerEngines.map((engine, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4 font-medium">
                          {engine.engine}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {engine.query}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              engine.appearance === "Mentioned"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {engine.appearance}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {engine.lastSeen}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local & GEO presence</CardTitle>
              <CardDescription>
                [Map placeholder - geographic distribution of locations and
                ratings]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Country
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Cities
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Avg rating
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Review count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyData.localPresence.countries.map((country, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4 font-medium">
                          {country.country}
                        </td>
                        <td className="py-3 px-4">{country.cities}</td>
                        <td className="py-3 px-4">{country.avgRating}</td>
                        <td className="py-3 px-4">{country.reviewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {companyData.contacts.map((contact, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-600">
                        {contact.role}
                      </div>
                    </div>
                    {contact.linkedIn && (
                      <a
                        href={contact.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
