import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function DebugTasksPage() {
  const [tasksData, setTasksData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const testTasksEndpoint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🧪 Test endpoint /api/tasks");
      
      const response = await fetch("/api/tasks", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });

      console.log("📊 Response status:", response.status);
      console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        setError(`HTTP ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("✅ Tasks data:", data);
      setTasksData(data);
      
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      console.log("🧪 Test endpoint /api/auth/user");
      
      const response = await fetch("/api/auth/user", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();
      console.log("👤 Auth data:", data);
      
    } catch (err: any) {
      console.error("❌ Auth test error:", err);
    }
  };

  useEffect(() => {
    testAuthEndpoint();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              🧪 Debug Interface - Tâches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Utilisateur connecté:</strong> {user ? `${user.prenom} ${user.nom} (ID: ${user.id})` : "Non connecté"}
              </div>
              <div>
                <strong>Admin:</strong> {user?.isAdmin ? "Oui" : "Non"}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Tests API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={testTasksEndpoint}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Test en cours..." : "🔍 Tester GET /api/tasks"}
              </Button>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-semibold text-red-800">Erreur détectée:</h4>
                  <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap">{error}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {tasksData && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Résultats des tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Nombre de tâches:</strong> {Array.isArray(tasksData) ? tasksData.length : "N/A"}
                </div>
                
                {Array.isArray(tasksData) && tasksData.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Aperçu des tâches:</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {tasksData.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="p-3 bg-gray-50 rounded-md">
                          <div><strong>ID:</strong> {task.id}</div>
                          <div><strong>Titre:</strong> {task.title}</div>
                          <div><strong>Status:</strong> {task.status}</div>
                          <div><strong>Priorité:</strong> {task.priority}</div>
                          <div><strong>User ID:</strong> {task.userId}</div>
                          <div><strong>Client:</strong> {task.clientName || "Aucun"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Données brutes JSON:</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(tasksData, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}