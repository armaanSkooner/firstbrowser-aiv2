import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CompanySearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/company-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-3xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Search any company or person
          </h1>
          <p className="text-xl text-gray-600">
            Type a name and see their visibility across{" "}
            <span className="font-semibold">answer engines</span> and{" "}
            <span className="font-semibold">local presence</span>
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="e.g. Airbnb, Shopify, Pender & Howe, Medari or Manin"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg py-6 px-4"
            />
            <Button type="submit" size="lg" className="px-8">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            This demo includes a few example entities. Try{" "}
            <button
              type="button"
              onClick={() => setSearchQuery("Airbnb")}
              className="text-blue-600 hover:underline font-medium"
            >
              Airbnb
            </button>
            ,{" "}
            <button
              type="button"
              onClick={() => setSearchQuery("Shopify")}
              className="text-blue-600 hover:underline font-medium"
            >
              Shopify
            </button>
            ,{" "}
            <button
              type="button"
              onClick={() => setSearchQuery("Pender & Howe")}
              className="text-blue-600 hover:underline font-medium"
            >
              Pender & Howe
            </button>
            , or{" "}
            <button
              type="button"
              onClick={() => setSearchQuery("Medari")}
              className="text-blue-600 hover:underline font-medium"
            >
              Medari
            </button>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
