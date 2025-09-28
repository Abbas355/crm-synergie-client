import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TestStep1() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Test Étape 1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            Cette page de test confirme que le routage fonctionne correctement.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setLocation("/recruitment/step2")}
              className="w-full"
            >
              Aller à l'étape 2
            </Button>
            
            <Button 
              onClick={() => setLocation("/auth")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'authentification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}