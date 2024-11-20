import { useEffect, useCallback } from 'react';
import {
  useReactFlow,
  useNodesInitialized,
  useNodes,
  useEdges,
} from '@xyflow/react';

import { createHierarchicalLayout } from '../utils/node-hierarchy';

export type Direction = 'TB' | 'LR' | 'RL' | 'BT';

export type LayoutOptions = {
  direction: Direction;
  spacing: [number, number];
};

function useAutoLayout(options: LayoutOptions) {
  const { setNodes, setEdges } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const nodes = useNodes();
  const edges = useEdges();

  const runLayout = useCallback(async () => {
    if (!nodesInitialized || nodes.length === 0) return;

    console.log("🔄 Running auto layout with nodes:", nodes);
    console.log("🔗 Current edges:", edges);

    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        await createHierarchicalLayout(
          nodes,
          edges,
          {
            direction: options.direction,
            spacing: [200, 150],
          }
        );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error("❌ Error in auto layout:", error);
    }
  }, [nodesInitialized, nodes, edges, options, setNodes, setEdges]);

  // Run layout when nodes are initialized or when they change
  useEffect(() => {
    runLayout();
  }, [runLayout]);

  return { runLayout };
}

export default useAutoLayout;
