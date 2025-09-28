import { Award, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RecruitmentTipsProps {
  distributeurCode: string;
  nbDirects: number;
  niveau: number;
}

export function RecruitmentTips({ distributeurCode, nbDirects, niveau }: RecruitmentTipsProps) {
  const { toast } = useToast();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(distributeurCode);
    toast({
      title: "Code copié !",
      description: "Votre code vendeur a été copié dans le presse-papier.",
    });
  };

  // Déterminer le prochain objectif de recrutement
  const nextRecruitmentGoal = nbDirects < 3 ? 3 : nbDirects < 5 ? 5 : nbDirects + 2;
  const progressPercentage = Math.min(100, (nbDirects / nextRecruitmentGoal) * 100);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Avantages du recrutement</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5 shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium">Revenus passifs</p>
                <p className="text-muted-foreground">
                  Gagnez des commissions sur les ventes de tout votre réseau, pas uniquement sur vos ventes directes.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5 shrink-0">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-medium">Montée en niveau</p>
                <p className="text-muted-foreground">
                  Plus votre réseau grandit, plus vous augmentez votre niveau et votre taux de commission.
                </p>
              </div>
            </li>
          </ul>

          <div className="bg-muted/50 p-4 rounded-md mt-6">
            <h4 className="font-medium mb-3">Pourquoi recruter ?</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="mr-2">🚀</div>
                <div>
                  <strong>Effet de levier</strong> - Multipliez vos revenus grâce au travail d'équipe.
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-2">📊</div>
                <div>
                  <strong>Croissance exponentielle</strong> - Chaque recrutement a un effet multiplicateur.
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-2">🌱</div>
                <div>
                  <strong>Développement personnel</strong> - Devenez un leader et développez vos compétences.
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium text-lg mb-4">Votre code de parrainage</h3>
          <div className="space-y-4">
            <p className="text-sm">
              Partagez votre code vendeur avec vos prospects. Lors de leur inscription, ils devront l'utiliser comme code parrain :
            </p>
            <div className="flex items-center justify-between p-2 bg-background border border-border rounded-md">
              <code className="text-lg font-mono">{distributeurCode}</code>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Objectif de recrutement</h4>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="font-medium">{nbDirects}</span>
                <div className="flex-1 h-2 bg-background rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="font-medium">{nextRecruitmentGoal}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {nbDirects < nextRecruitmentGoal 
                  ? `Plus que ${nextRecruitmentGoal - nbDirects} recrutement${nextRecruitmentGoal - nbDirects > 1 ? 's' : ''} pour atteindre votre prochain objectif !` 
                  : "Félicitations ! Vous avez atteint votre objectif de recrutement !"}
              </p>
            </div>
            
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Comment utiliser votre code</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="bg-primary/20 w-5 h-5 flex items-center justify-center rounded-full mr-2 shrink-0">1</div>
                  <div>Partagez votre code sur vos réseaux sociaux, cartes de visite et dans votre signature email</div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/20 w-5 h-5 flex items-center justify-center rounded-full mr-2 shrink-0">2</div>
                  <div>Présentez les avantages du programme MLM à vos prospects</div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/20 w-5 h-5 flex items-center justify-center rounded-full mr-2 shrink-0">3</div>
                  <div>Accompagnez vos recrues dans leurs premiers pas pour les fidéliser</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {niveau >= 2 && (
        <div className="bg-accent/10 p-4 rounded-md">
          <h3 className="font-medium mb-3">Stratégies avancées de recrutement (niveau {niveau})</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Approche active</h4>
              <ul className="text-sm space-y-1">
                <li>• Organisez des réunions d'information hebdomadaires</li>
                <li>• Créez des groupes de discussion pour vos prospects</li>
                <li>• Proposez des formations gratuites comme teaser</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Accompagnement</h4>
              <ul className="text-sm space-y-1">
                <li>• Mettez en place un système de mentorat</li>
                <li>• Célébrez les réussites de votre équipe</li>
                <li>• Partagez les meilleures pratiques</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {niveau >= 3 && (
        <div className="border border-primary/20 p-4 rounded-md">
          <h3 className="font-medium text-primary mb-3">Bonus pour leaders (niveau {niveau}+)</h3>
          <p className="text-sm mb-3">
            En tant que leader confirmé, vous avez accès à des outils et stratégies exclusifs :
          </p>
          <ul className="text-sm space-y-2">
            <li className="flex items-start">
              <div className="mr-2">🏆</div>
              <div>
                <strong>Programme de reconnaissance</strong> - Valorisez et récompensez vos meilleurs recruteurs
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-2">📋</div>
              <div>
                <strong>Système de suivi des objectifs</strong> - Fixez des objectifs à votre équipe et suivez leur progression
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-2">🔄</div>
              <div>
                <strong>Duplication structurée</strong> - Enseignez à vos recrues comment recruter efficacement
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}