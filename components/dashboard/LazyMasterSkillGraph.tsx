'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { MasterSkillGraphSkeleton } from './MasterSkillGraphSkeleton';

interface SkillData {
  id: string;
  name: string;
  icon: string;
  level: number;
  category: string;
  progress: number;
}

interface CareerWithSkills {
  id: string;
  careerId: string;
  title: string;
  skills: SkillData[];
}

interface LazyMasterSkillGraphProps {
  userName: string;
  careers: CareerWithSkills[];
  onCareerClick: (careerId: string) => void;
}

// Dynamically import the heavy MasterSkillGraph component
// This reduces initial bundle size by ~100KB (React Flow)
const DynamicMasterSkillGraph = dynamic(
  () => import('./MasterSkillGraph').then((mod) => mod.MasterSkillGraph),
  {
    ssr: false,
    loading: () => <MasterSkillGraphSkeleton />,
  }
);

export function LazyMasterSkillGraph(props: LazyMasterSkillGraphProps) {
  return (
    <Suspense fallback={<MasterSkillGraphSkeleton />}>
      <DynamicMasterSkillGraph {...props} />
    </Suspense>
  );
}
