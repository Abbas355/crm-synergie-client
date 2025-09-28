import { useQuery } from "@tanstack/react-query";

export default function TestRecrue() {
  const { data: recrueData, isLoading, error } = useQuery({
    queryKey: ['/api/recruitment/recrue', '31'],
    enabled: true,
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Récupération Données Recrue</h1>
      <pre style={{ background: '#f5f5f5', padding: '10px' }}>
        {JSON.stringify(recrueData, null, 2)}
      </pre>
      <div style={{ marginTop: '20px' }}>
        <strong>Code Vendeur:</strong> {(recrueData as any)?.codeVendeur || 'Non trouvé'}
      </div>
    </div>
  );
}