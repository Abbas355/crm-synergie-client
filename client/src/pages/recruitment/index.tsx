import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RecruitmentRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Rediriger vers la page des prospects
    setLocation("/recruitment/prospects");
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirection...</h2>
        <p>Vous allez être redirigé vers la page des prospects.</p>
      </div>
    </div>
  );
}