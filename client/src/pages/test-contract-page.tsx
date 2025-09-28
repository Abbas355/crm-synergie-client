import { TestContractForm } from "@/components/clients/test-contract-form";

export default function TestContractPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Page de test Contrat</h1>
      <TestContractForm />
    </div>
  );
}