import { Node, Edge } from "@xyflow/react";
import { stratify, tree } from "d3-hierarchy";
import { Direction } from "./node-layout";

interface HierarchyData {
  id: string;
  parentId?: string;
}

export async function createHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: {
    direction: Direction;
    spacing: [number, number];
  }
) {
  console.log("🎯 Starting hierarchical layout with nodes:", nodes);
  console.log("🔗 Edges:", edges);

  // Create hierarchy data from nodes and edges
  const hierarchyData: HierarchyData[] = nodes.map(node => ({
    id: node.id,
    parentId: edges.find(e => e.source === node.id)?.target
  }));

  // Create D3 hierarchy
  const root = stratify<HierarchyData>()
    .id(d => d.id)
    .parentId(d => d.parentId)
    (hierarchyData);

  // Create tree layout
  const treeLayout = tree<HierarchyData>()
    .nodeSize([options.spacing[0], options.spacing[1]]);

  // Apply layout
  const hierarchyNodes = treeLayout(root);

  // Map hierarchy nodes back to React Flow nodes with positions
  const nextNodes = nodes.map(node => {
    const hierarchyNode = hierarchyNodes.descendants()
      .find(n => n.data.id === node.id);

    if (!hierarchyNode) {
      console.warn(`Could not find hierarchy node for ${node.id}`);
      return node;
    }

    // D3 hierarchy uses y for depth (vertical) and x for breadth (horizontal)
    // We swap these to match the expected top-to-bottom layout
    const position = {
      x: hierarchyNode.x,
      y: hierarchyNode.y
    };

    console.log(`📍 Positioning "${node.data.label}": x=${position.x}, y=${position.y}`);

    return {
      ...node,
      position
    };
  });

  return { nodes: nextNodes, edges };
}