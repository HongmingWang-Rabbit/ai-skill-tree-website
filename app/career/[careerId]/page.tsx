'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { SkillGraph } from '@/components/skill-graph/SkillGraph';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { XPProgressRing } from '@/components/ui/XPProgressRing';
import type { Node, Edge } from '@xyflow/react';
import type { SkillNodeData } from '@/components/skill-graph/SkillNode';

interface SkillEdgeData {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface Career {
  id: string;
  canonicalKey: string;
  title: string;
  description: string | null;
}

interface SkillGraphData {
  id: string;
  careerId: string | null;
  nodes: SkillNodeData[];
  edges: SkillEdgeData[];
}

interface CareerData {
  career: Career;
  skillGraph: SkillGraphData;
}

export default function CareerPage({ params }: { params: Promise<{ careerId: string }> }) {
  const resolvedParams = use(params);
  const careerId = resolvedParams.careerId;
  const router = useRouter();
  const [data, setData] = useState<CareerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchOrGenerateCareer() {
      setIsLoading(true);
      setError(null);

      try {
        // First try to fetch existing career
        const fetchResponse = await fetch(`/api/career/${careerId}`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success) {
          setData(fetchResult.data);
          setIsLoading(false);
          return;
        }

        // If not found, generate new career
        setIsGenerating(true);
        const generateResponse = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career: careerId.replace(/-/g, ' ') }),
        });

        const generateResult = await generateResponse.json();

        if (generateResult.success) {
          setData(generateResult.data);
        } else {
          setError(generateResult.error || 'Failed to generate career');
        }
      } catch (err) {
        setError('An error occurred while loading the career');
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    }

    fetchOrGenerateCareer();
  }, [careerId]);

  // Convert skill data to React Flow format
  const convertToReactFlowFormat = (
    nodes: SkillNodeData[],
    edges: SkillEdgeData[]
  ): { nodes: Node[]; edges: Edge[] } => {
    const flowNodes: Node[] = nodes.map((skill) => ({
      id: skill.id,
      type: 'skill',
      position: { x: 0, y: 0 }, // Will be calculated by layout
      data: skill,
    }));

    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated ?? true,
      type: 'skill',
    }));

    return { nodes: flowNodes, edges: flowEdges };
  };

  // Calculate overall progress
  const calculateProgress = (nodes: SkillNodeData[]): number => {
    if (nodes.length === 0) return 0;
    const totalProgress = nodes.reduce((sum, node) => sum + node.progress, 0);
    return Math.round(totalProgress / nodes.length);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">
            {isGenerating ? 'Generating skill tree with AI...' : 'Loading career...'}
          </p>
          {isGenerating && (
            <p className="text-sm text-slate-500 mt-2">
              This may take a few seconds
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassPanel className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-slate-400 mb-4">{error || 'Failed to load career'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-white transition-colors"
          >
            Go Back Home
          </button>
        </GlassPanel>
      </div>
    );
  }

  const { career, skillGraph } = data;
  const skillNodes = skillGraph.nodes as SkillNodeData[];
  const skillEdges = skillGraph.edges as SkillEdgeData[];
  const { nodes, edges } = convertToReactFlowFormat(skillNodes, skillEdges);
  const overallProgress = calculateProgress(skillNodes);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{career.title}</h1>
              <p className="text-sm text-slate-400">{career.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <XPProgressRing progress={overallProgress} size={60} strokeWidth={4} />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Skills:</span>
            <span className="text-white font-semibold">{nodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Unlocked:</span>
            <span className="text-cyan-400 font-semibold">
              {skillNodes.filter((n) => n.progress > 0).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mastered:</span>
            <span className="text-amber-400 font-semibold">
              {skillNodes.filter((n) => n.progress === 100).length}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Graph */}
      <main className="flex-1 relative">
        <div className="absolute inset-0">
          <SkillGraph
            initialNodes={nodes}
            initialEdges={edges}
            careerTitle={career.title}
            careerDescription={career.description || ''}
          />
        </div>
      </main>
    </div>
  );
}
