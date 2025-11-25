import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import SearchPage from "@/pages/search";
import ResultsPage from "@/pages/results";
import Dashboard from "@/pages/dashboard";
import PromptGeneratorPage from "@/pages/prompt-generator";
import PromptResultsPage from "@/pages/prompts";
import CompetitorsPage from "@/pages/competitors";
import SourcesPage from "@/pages/sources";
import SettingsPage from "@/pages/settings";
import AnalysisProgressPage from "@/pages/analysis-progress";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* New clean search page - no layout */}
      <Route path="/" component={SearchPage} />
      <Route path="/results" component={ResultsPage} />
      
      {/* Existing pages with layout */}
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/prompt-generator">
        <Layout><PromptGeneratorPage /></Layout>
      </Route>
      <Route path="/prompt-results">
        <Layout><PromptResultsPage /></Layout>
      </Route>
      <Route path="/competitors">
        <Layout><CompetitorsPage /></Layout>
      </Route>
      <Route path="/sources">
        <Layout><SourcesPage /></Layout>
      </Route>
      <Route path="/analysis-progress">
        <Layout><AnalysisProgressPage /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><SettingsPage /></Layout>
      </Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
