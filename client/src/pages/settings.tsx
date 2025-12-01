import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Key, Save, CheckCircle, XCircle, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [promptsPerTopic, setPromptsPerTopic] = useState("5");
  const [analysisFrequency, setAnalysisFrequency] = useState("manual");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear ALL analysis data? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await apiRequest("POST", "/api/data/clear", { type: 'all' });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "All analysis data has been cleared.",
        });
      } else {
        throw new Error("Failed to clear data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch('/api/settings/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        setKeyStatus('valid');
        toast({
          title: "Success",
          description: "OpenAI API key saved and validated successfully",
        });
        setApiKey(""); // Clear the input for security
      } else {
        setKeyStatus('invalid');
        toast({
          title: "Error",
          description: "Invalid OpenAI API key or connection failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      setKeyStatus('invalid');
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveAnalysisConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/settings/analysis-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptsPerTopic: parseInt(promptsPerTopic),
          analysisFrequency 
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Analysis configuration saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save analysis configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save analysis configuration",
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getKeyStatusDisplay = () => {
    switch (keyStatus) {
      case 'valid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid Key
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Invalid Key
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/results">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <Settings className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Data Management Card */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage your analysis data and reset the system
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Clear All Data</h4>
                    <p className="text-sm text-red-800 mt-1">
                      This will permanently delete all analysis results, competitors, and metrics. 
                      Use this if you want to start fresh with a clean slate.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleClearData}
                disabled={isClearing}
                className="w-full sm:w-auto"
              >
                {isClearing ? 'Clearing...' : 'Clear All Data'}
              </Button>
            </CardContent>
          </Card>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenAI API Configuration
            </CardTitle>
            <p className="text-sm text-gray-600">
              Enter your OpenAI API key to enable real-time ChatGPT analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveApiKey}
                  disabled={isChecking || !apiKey.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isChecking ? 'Checking...' : 'Save'}
                </Button>
              </div>
              {getKeyStatusDisplay()}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">How to get your API key:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a></li>
                <li>Sign in to your OpenAI account</li>
                <li>Click "Create new secret key"</li>
                <li>Copy the key and paste it above</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Your API key is stored securely and only used for analysis</li>
                <li>Analysis requires OpenAI credits in your account</li>
                <li>Each prompt analysis costs approximately $0.01-0.03</li>
                <li>You can monitor usage in your OpenAI dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
            <p className="text-sm text-gray-600">
              Control how the brand tracking analysis runs
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prompts per Topic</Label>
                <Input 
                  type="number" 
                  value={promptsPerTopic}
                  onChange={(e) => setPromptsPerTopic(e.target.value)}
                  min="1" 
                  max="20" 
                />
                <p className="text-xs text-gray-500">Number of test prompts to generate per topic</p>
              </div>
              
              <div className="space-y-2">
                <Label>Analysis Frequency</Label>
                <Select value={analysisFrequency} onValueChange={setAnalysisFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">How often to run automatic analysis</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleSaveAnalysisConfig}
                disabled={isSavingConfig}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingConfig ? 'Saving...' : 'Save Analysis Settings'}
              </Button>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}