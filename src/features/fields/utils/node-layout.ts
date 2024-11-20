import { Node, Position } from "@xyflow/react";

export type Direction = 'TB' | 'BT' | 'LR' | 'RL';

export interface LayoutOptions {
  direction: Direction;
  spacing: [number, number];
}

export function getSourceHandlePosition(direction: Direction) {
  switch (direction) {
    case 'TB':
      return Position.Bottom;
    case 'BT':
      return Position.Top;
    case 'LR':
      return Position.Right;
    case 'RL':
      return Position.Left;
  }
}

export function getTargetHandlePosition(direction: Direction) {
  switch (direction) {
    case 'TB':
      return Position.Top;
    case 'BT':
      return Position.Bottom;
    case 'LR':
      return Position.Left;
    case 'RL':
      return Position.Right;
  }
}

// Helper function to get node dimensions
export function getNodeDimensions(nodes: Node[]): { width: number; height: number } {
  let maxWidth = 0;
  let maxHeight = 0;

  nodes.forEach(node => {
    maxWidth = Math.max(maxWidth, node.width || 150); // Default width if not measured
    maxHeight = Math.max(maxHeight, node.height || 50); // Default height if not measured
  });

  return { width: maxWidth, height: maxHeight };
} 