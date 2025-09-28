import { Button } from "@/components/ui/button";

export function DuplicateTestButton() {
  const handleTestDuplicates = () => {
    console.log('🔍 Test manuel de détection de doublons...');
    
    // Déclencher l'événement personnalisé pour tester le système
    const event = new CustomEvent('triggerDuplicateCheck');
    window.dispatchEvent(event);
  };

  return (
    <Button 
      onClick={handleTestDuplicates}
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
    >
      🔍 Test Doublons
    </Button>
  );
}