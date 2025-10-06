// Development Test Component for API Integration
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api, auth } from '@/services';

export function DevTestPanel() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/health');
      addResult(`✅ API Health Check: ${JSON.stringify(response)}`);
      toast({
        title: "API Test Successful",
        description: "Backend connection is working!",
      });
    } catch (error: any) {
      addResult(`❌ API Health Check Failed: ${error.message}`);
      toast({
        title: "API Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthEndpoints = async () => {
    setIsLoading(true);
    try {
      // Test with demo credentials
      const response = await api.get('/auth/me');
      addResult(`✅ Auth Me Endpoint: ${JSON.stringify(response)}`);
    } catch (error: any) {
      addResult(`✅ Auth Me Endpoint (Expected 401): ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🛠️ API Integration Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testApiConnection} 
            disabled={isLoading}
            variant="outline"
          >
            Test API Health
          </Button>
          <Button 
            onClick={testAuthEndpoints} 
            disabled={isLoading}
            variant="outline"
          >
            Test Auth Endpoints
          </Button>
          <Button 
            onClick={clearResults} 
            variant="secondary"
          >
            Clear Results
          </Button>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Test Results:</h4>
          <div className="bg-muted p-3 rounded-md max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p><strong>Backend:</strong> {window.location.origin}/api</p>
          <p><strong>Frontend:</strong> {window.location.origin}</p>
          <p><strong>Status:</strong> {isLoading ? 'Testing...' : 'Ready'}</p>
        </div>
      </CardContent>
    </Card>
  );
}