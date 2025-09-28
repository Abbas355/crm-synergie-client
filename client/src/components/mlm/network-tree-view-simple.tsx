import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Crown,
  Table,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkNode {
  id: number;
  nom: string;
  prenom: string;
  codeVendeur: string;
  niveau: number;
  parentId?: number;
  enfants?: NetworkNode[];
  stats?: {
    totalClients: number;
    commissionsGenerees: number;
    recrutements: number;
    performance: 'excellent' | 'bon' | 'moyen' | 'faible';
  };
}

interface NetworkTreeViewProps {
  networkData: NetworkNode[];
  isLoading?: boolean;
}

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
    case 'bon': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'faible': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const NetworkTreeNode = ({ 
  node, 
  level = 0, 
  onToggle, 
  expandedNodes
}: {
  node: NetworkNode;
  level?: number;
  onToggle: (id: number) => void;
  expandedNodes: Set<number>;
}) => {
  const hasChildren = node.enfants && node.enfants.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const indentWidth = level * 32;

  return (
    <div className="relative">
      <div 
        className="flex items-center py-2 hover:bg-gray-50 rounded-lg transition-colors"
        style={{ paddingLeft: `${indentWidth}px` }}
      >
        {/* Bouton d'expansion/réduction */}
        <div className="flex items-center justify-center w-6 h-6 mr-2">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 hover:bg-orange-100 group"
              onClick={() => onToggle(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-200" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6" />
          )}
        </div>

        {/* Icône de niveau */}
        <div className="flex items-center justify-center w-8 h-8 mr-3">
          {level === 0 ? (
            <Crown className="h-5 w-5 text-yellow-600" />
          ) : (
            <Users className="h-4 w-4 text-blue-600" />
          )}
        </div>

        {/* Informations du distributeur */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {node.nom} {node.prenom}
            </span>
            <Badge variant="outline" className="text-xs">
              {node.codeVendeur}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Niveau {node.niveau}
            </Badge>
            {node.stats && (
              <Badge 
                className={cn("text-xs", getPerformanceColor(node.stats.performance))}
              >
                {node.stats.performance}
              </Badge>
            )}
          </div>
          
          {/* Statistiques rapides */}
          {node.stats && (
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{node.stats.totalClients} clients</span>
              <span>{node.stats.recrutements} recrutements</span>
              <span>{node.stats.commissionsGenerees.toFixed(2)}€</span>
            </div>
          )}
        </div>

        {/* Indicateur d'enfants */}
        {hasChildren && (
          <Badge variant="outline" className="ml-2">
            {node.enfants?.length} distributeur{(node.enfants?.length || 0) > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Enfants */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.enfants?.map((enfant) => (
            <NetworkTreeNode
              key={enfant.id}
              node={enfant}
              level={level + 1}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NetworkTableView = ({ 
  networkData
}: {
  networkData: NetworkNode[];
}) => {
  const flattenNetwork = (nodes: NetworkNode[], level = 0): (NetworkNode & { level: number })[] => {
    let result: (NetworkNode & { level: number })[] = [];
    
    for (const node of nodes) {
      result.push({ ...node, level });
      if (node.enfants && node.enfants.length > 0) {
        result = [...result, ...flattenNetwork(node.enfants, level + 1)];
      }
    }
    
    return result;
  };

  const flatData = flattenNetwork(networkData);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-medium">Distributeur</th>
            <th className="text-left py-3 px-4 font-medium">Code Vendeur</th>
            <th className="text-left py-3 px-4 font-medium">Niveau</th>
            <th className="text-left py-3 px-4 font-medium">Clients</th>
            <th className="text-left py-3 px-4 font-medium">Recrutements</th>
            <th className="text-left py-3 px-4 font-medium">Commissions</th>
            <th className="text-left py-3 px-4 font-medium">Performance</th>
          </tr>
        </thead>
        <tbody>
          {flatData.map((node) => (
            <tr 
              key={node.id}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                <div 
                  className="flex items-center"
                  style={{ paddingLeft: `${node.level * 20}px` }}
                >
                  {node.level === 0 ? (
                    <Crown className="h-4 w-4 text-yellow-600 mr-2" />
                  ) : (
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                  )}
                  <span className="font-medium">
                    {node.nom} {node.prenom}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge variant="outline">{node.codeVendeur}</Badge>
              </td>
              <td className="py-3 px-4">
                <Badge variant="secondary">Niveau {node.niveau}</Badge>
              </td>
              <td className="py-3 px-4">
                {node.stats?.totalClients || 0}
              </td>
              <td className="py-3 px-4">
                {node.stats?.recrutements || 0}
              </td>
              <td className="py-3 px-4">
                {node.stats?.commissionsGenerees?.toFixed(2) || '0.00'}€
              </td>
              <td className="py-3 px-4">
                {node.stats && (
                  <Badge 
                    className={cn("text-xs", getPerformanceColor(node.stats.performance))}
                  >
                    {node.stats.performance}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function NetworkTreeViewSimple({ networkData, isLoading }: NetworkTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  const handleToggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleExpandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (nodes: NetworkNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.enfants) {
          collectIds(node.enfants);
        }
      });
    };
    collectIds(networkData);
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Arbre Hiérarchique du Réseau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Réseau de Distributeurs
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'tree' | 'table')}>
                <TabsList>
                  <TabsTrigger value="tree" className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Arbre
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Tableau
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {viewMode === 'tree' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExpandAll}
                  >
                    Tout développer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCollapseAll}
                  >
                    Tout réduire
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {networkData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun distributeur dans le réseau</p>
            </div>
          ) : (
            <>
              {viewMode === 'tree' ? (
                <div className="space-y-1">
                  {networkData.map((node) => (
                    <NetworkTreeNode
                      key={node.id}
                      node={node}
                      level={0}
                      onToggle={handleToggleNode}
                      expandedNodes={expandedNodes}
                    />
                  ))}
                </div>
              ) : (
                <NetworkTableView 
                  networkData={networkData}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}