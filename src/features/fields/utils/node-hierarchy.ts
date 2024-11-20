import { Node, Edge } from "@xyflow/react";
import { HierarchyPointNode, stratify, tree } from "d3-hierarchy";
import { Direction, getNodeDimensions } from "./node-layout";

interface NodeWithPosition extends Node {
  x: number;
  y: number;
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

  const { width: maxNodeWidth, height: maxNodeHeight } = getNodeDimensions(nodes);
  const nodeLevels = new Map<string, number>();
  const nodeParents = new Map<string, string>();
  const nodeChildren = new Map<string, string[]>();

  // Build parent-child relationships
  edges.forEach(edge => {
    nodeParents.set(edge.source, edge.target);
    const children = nodeChildren.get(edge.target) || [];
    children.push(edge.source);
    nodeChildren.set(edge.target, children);
  });

  console.log("👨‍👧‍👦 Node children map:", Object.fromEntries(nodeChildren));

  // First pass: identify primitive (input) nodes
  nodes.forEach(node => {
    if (node.data.type === 'short_text') {
      nodeLevels.set(node.id, 0); // Primitive nodes at level 0 (top)
      console.log(`📝 Identified primitive node "${node.data.label}" -> level 0`);
    }
  });

  // Second pass: calculate levels for computed nodes
  function calculateLevel(nodeId: string, visited: Set<string> = new Set()): number {
    if (visited.has(nodeId)) return nodeLevels.get(nodeId) || 0;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    // If level is already set (primitive node), return it
    if (nodeLevels.has(nodeId)) {
      return nodeLevels.get(nodeId)!;
    }

    console.log(`📊 Calculating level for computed node "${node.data.label}"`);

    // Get all children (dependencies) of this node
    const children = nodeChildren.get(nodeId) || [];
    
    if (children.length === 0) {
      // No children but not a primitive - shouldn't happen but handle anyway
      const level = 0;
      nodeLevels.set(nodeId, level);
      return level;
    }

    // Level is one more than the maximum level of dependencies
    const childLevels = children.map(child => calculateLevel(child, visited));
    const level = Math.max(...childLevels) + 1;
    console.log(`📈 Computed node "${node.data.label}" -> level ${level}`);
    nodeLevels.set(nodeId, level);
    return level;
  }

  // Calculate levels for all non-primitive nodes
  nodes.forEach(node => {
    if (!nodeLevels.has(node.id)) {
      calculateLevel(node.id);
    }
  });

  console.log("📊 Final node levels:", Object.fromEntries(nodeLevels));

  // Group nodes by level
  const nodesByLevel = new Map<number, Node[]>();
  nodes.forEach(node => {
    const level = nodeLevels.get(node.id) || 0;
    const levelNodes = nodesByLevel.get(level) || [];
    levelNodes.push(node);
    nodesByLevel.set(level, levelNodes);
  });

  // Position nodes
  const maxLevel = Math.max(...Array.from(nodeLevels.values()));
  const nextNodes = nodes.map(node => {
    const level = nodeLevels.get(node.id) || 0;
    const levelNodes = nodesByLevel.get(level) || [];
    const nodeIndex = levelNodes.indexOf(node);
    
    // y increases with level (top to bottom)
    const y = level * options.spacing[1];
    const levelWidth = (levelNodes.length - 1) * options.spacing[0];
    const x = (nodeIndex * options.spacing[0]) - (levelWidth / 2);

    console.log(`📍 Positioning "${node.data.label}": level=${level}, x=${x}, y=${y}`);

    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: nextNodes, edges };
} 