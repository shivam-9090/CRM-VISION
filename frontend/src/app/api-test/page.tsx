'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { runCompleteAPITest, testAllAPIs, testAuthFlow, testAuthenticatedEndpoints } from '@/lib/api-test';

export default function APITestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async (testFunction: () => Promise<unknown>, testName: string) => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    addLog(`🚀 Starting ${testName}...`);

    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message);
      originalLog(...args);
    };
    
    console.error = (...args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(`❌ ${message}`);
      originalError(...args);
    };

    try {
      await testFunction();
      addLog(`✅ ${testName} completed`);
    } catch (error) {
      addLog(`❌ ${testName} failed: ${error}`);
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-emerald-800">
              🧪 API Testing Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Test API connectivity and authentication to identify issues with backend endpoints.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Button
                onClick={() => runTest(testAllAPIs, 'Basic Connectivity')}
                disabled={isRunning}
                variant="outline"
                className="h-12"
              >
                🔗 Test Basic API
              </Button>
              
              <Button
                onClick={() => runTest(testAuthFlow, 'Authentication')}
                disabled={isRunning}
                variant="outline"
                className="h-12"
              >
                🔐 Test Auth Flow
              </Button>
              
              <Button
                onClick={() => runTest(async () => {
                  const authData = await testAuthFlow();
                  if (authData?.access_token) {
                    await testAuthenticatedEndpoints(authData.access_token);
                  }
                }, 'Authenticated Endpoints')}
                disabled={isRunning}
                variant="outline"
                className="h-12"
              >
                🛡️ Test Protected APIs
              </Button>
              
              <Button
                onClick={() => runTest(runCompleteAPITest, 'Complete Test Suite')}
                disabled={isRunning}
                className="h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                🚀 Run All Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Test Logs
              {isRunning && (
                <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Click a test button to begin.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}