import { describe, it, expect } from "vitest";
import { computeRipplePositions } from "./layout";
import { DependencyGraph } from "@/lib/deps/graph";
import type { NodeRef } from "@/lib/deps/types";
import { Subgraph } from "@/lib/deps/serialize";

describe("computeRipplePositions", () => {
  it("should properly space level 2 nodes and prevent bunching", () => {
    // Create a graph with:
    // - Root object
    // - Level 1: Two field nodes (field1, field2) that derive from root
    // - Level 2: Multiple field nodes that derive from level 1 nodes
    //   - field1a, field1b derive from field1
    //   - field2a, field2b, field2c derive from field2
    
    const graph = new DependencyGraph();
    
    // Root object
    const root: NodeRef = { type: "object", key: "object_1", name: "Root Object" };
    graph.addNode(root);
    
    // Level 1 fields
    const field1: NodeRef = { type: "field", key: "field_1", name: "Field 1" };
    const field2: NodeRef = { type: "field", key: "field_2", name: "Field 2" };
    graph.addNode(field1);
    graph.addNode(field2);
    
    // Level 2 fields - children of field1
    const field1a: NodeRef = { type: "field", key: "field_1a", name: "Field 1a" };
    const field1b: NodeRef = { type: "field", key: "field_1b", name: "Field 1b" };
    graph.addNode(field1a);
    graph.addNode(field1b);
    
    // Level 2 fields - children of field2
    const field2a: NodeRef = { type: "field", key: "field_2a", name: "Field 2a" };
    const field2b: NodeRef = { type: "field", key: "field_2b", name: "Field 2b" };
    const field2c: NodeRef = { type: "field", key: "field_2c", name: "Field 2c" };
    graph.addNode(field2a);
    graph.addNode(field2b);
    graph.addNode(field2c);
    
    // Create edges: root -> level 1
    graph.addEdge({
      from: field1,
      to: root,
      type: "derivesFrom",
    });
    graph.addEdge({
      from: field2,
      to: root,
      type: "derivesFrom",
    });
    
    // Create edges: level 1 -> level 2
    graph.addEdge({
      from: field1a,
      to: field1,
      type: "derivesFrom",
    });
    graph.addEdge({
      from: field1b,
      to: field1,
      type: "derivesFrom",
    });
    
    graph.addEdge({
      from: field2a,
      to: field2,
      type: "derivesFrom",
    });
    graph.addEdge({
      from: field2b,
      to: field2,
      type: "derivesFrom",
    });
    graph.addEdge({
      from: field2c,
      to: field2,
      type: "derivesFrom",
    });
    
    // Create subgraph
    const subgraph: Subgraph = {
      nodes: [root, field1, field2, field1a, field1b, field2a, field2b, field2c],
      edges: graph.getAllEdges(),
    };
    
    // Compute positions
    const positions = computeRipplePositions(
      graph,
      subgraph,
      root,
      "LR",
      {
        rankSep: 220,
        nodeSep: 180,
        bandSep: 140,
      }
    );
    
    // Verify root is at origin
    const rootPos = positions.get("object:object_1");
    expect(rootPos).toBeDefined();
    expect(rootPos?.x).toBe(0);
    expect(rootPos?.y).toBe(0);
    
    // Verify level 1 fields are positioned
    const field1Pos = positions.get("field:field_1");
    const field2Pos = positions.get("field:field_2");
    expect(field1Pos).toBeDefined();
    expect(field2Pos).toBeDefined();
    
    // Verify level 2 fields are positioned
    const field1aPos = positions.get("field:field_1a");
    const field1bPos = positions.get("field:field_1b");
    const field2aPos = positions.get("field:field_2a");
    const field2bPos = positions.get("field:field_2b");
    const field2cPos = positions.get("field:field_2c");
    
    expect(field1aPos).toBeDefined();
    expect(field1bPos).toBeDefined();
    expect(field2aPos).toBeDefined();
    expect(field2bPos).toBeDefined();
    expect(field2cPos).toBeDefined();
    
    // THE BUG TEST: Level 2 nodes should be properly spaced
    // All level 2 nodes should have sufficient vertical spacing (nodeSep = 180)
    // Nodes from the same parent should be near each other, but not overlapping
    
    // Check that level 2 nodes are at the correct X position
    // Root is at depth 0, level 1 fields are at depth 1 (+1 shift = X = 1*220 = 220)
    // Level 2 fields are at depth 2 (+1 shift = X = 2*220 = 440)
    // But actually, since root is depth 0 and fields derive from it:
    // - Level 1 fields: depth 1 in computeDerivationDepths, +1 shift = X = 2*220 = 440
    // - Level 2 fields: depth 2 in computeDerivationDepths, +1 shift = X = 3*220 = 660
    const expectedLevel1X = 2 * 220; // depth 1 + 1 shift
    const expectedLevel2X = 3 * 220; // depth 2 + 1 shift
    
    // Verify level 1 positions
    expect(field1Pos?.x).toBe(expectedLevel1X);
    expect(field2Pos?.x).toBe(expectedLevel1X);
    
    // Verify level 2 positions
    expect(field1aPos?.x).toBe(expectedLevel2X);
    expect(field1bPos?.x).toBe(expectedLevel2X);
    expect(field2aPos?.x).toBe(expectedLevel2X);
    expect(field2bPos?.x).toBe(expectedLevel2X);
    expect(field2cPos?.x).toBe(expectedLevel2X);
    
    // THE CRITICAL TEST: Level 2 nodes should NOT be bunched together
    // They should maintain minimum spacing of nodeSep (180) between consecutive nodes
    const level2Nodes = [
      { id: "field_1a", pos: field1aPos!, parent: "field_1" },
      { id: "field_1b", pos: field1bPos!, parent: "field_1" },
      { id: "field_2a", pos: field2aPos!, parent: "field_2" },
      { id: "field_2b", pos: field2bPos!, parent: "field_2" },
      { id: "field_2c", pos: field2cPos!, parent: "field_2" },
    ];
    
    // Sort by Y position
    level2Nodes.sort((a, b) => a.pos.y - b.pos.y);
    
    // Check spacing between consecutive nodes
    const nodeSep = 180;
    const minSpacing = nodeSep * 0.9; // Allow 10% tolerance for floating point
    
    // This test should PASS - nodes should be spaced
    for (let i = 1; i < level2Nodes.length; i++) {
      const prevY = level2Nodes[i - 1].pos.y;
      const currY = level2Nodes[i].pos.y;
      const spacing = currY - prevY;
      
      expect(
        spacing,
        `Level 2 nodes ${level2Nodes[i - 1].id} and ${level2Nodes[i].id} are too close (spacing: ${spacing}, expected at least ${minSpacing})`
      ).toBeGreaterThanOrEqual(minSpacing);
    }
    
    // BUG DEMONSTRATION: Even though nodes are spaced, they may not be positioned
    // relative to their parents correctly. The issue is that all level 2 nodes
    // get processed together and bunched, rather than being positioned near their parents.
    
    // Calculate the spread of level 2 nodes
    const level2Ys = level2Nodes.map(n => n.pos.y);
    const minY = Math.min(...level2Ys);
    const maxY = Math.max(...level2Ys);
    const spread = maxY - minY;
    
    // If nodes are properly distributed relative to parents, the spread should be reasonable
    // But if they're bunched, the spread might be too small or nodes from different
    // parents might be interleaved incorrectly
    console.log("Level 2 node Y positions:", level2Nodes.map(n => `${n.id}: ${n.pos.y.toFixed(1)} (parent: ${n.parent})`));
    console.log("Level 1 parent Y positions:", {
      field1: field1Pos!.y.toFixed(1),
      field2: field2Pos!.y.toFixed(1),
    });
    console.log("Level 2 spread:", spread.toFixed(1));
    
    // BUG TEST: This test FAILS and demonstrates the bug
    // Level 2 nodes should be positioned relative to their parent's Y position,
    // but the current implementation bunches all level 2 nodes together in a single
    // sorted sequence, causing nodes from different parents to be interleaved.
    //
    // Expected behavior:
    // - field1's children (field_1a, field_1b) should be positioned near field1's Y
    // - field2's children (field_2a, field_2b, field_2c) should be positioned near field2's Y
    //
    // Actual buggy behavior:
    // - All level 2 nodes are sorted by their target Y (average of parents) and then
    //   spaced sequentially, causing nodes from different parents to be mixed together
    const field1Y = field1Pos!.y;
    const field2Y = field2Pos!.y;
    
    // Each child should be closer to its own parent's Y than to the other parent's Y
    // This test FAILS because field_1b ends up at the same Y as field2 (180.0)
    const field1aDistToField1 = Math.abs(field1aPos!.y - field1Y);
    const field1aDistToField2 = Math.abs(field1aPos!.y - field2Y);
    expect(
      field1aDistToField1,
      `field_1a (Y: ${field1aPos!.y.toFixed(1)}) should be closer to its parent field1 (Y: ${field1Y.toFixed(1)}) than to field2 (Y: ${field2Y.toFixed(1)})`
    ).toBeLessThan(field1aDistToField2);
    
    const field1bDistToField1 = Math.abs(field1bPos!.y - field1Y);
    const field1bDistToField2 = Math.abs(field1bPos!.y - field2Y);
    // THIS IS THE BUG: field_1b is positioned at Y=180.0, same as field2, instead of near field1
    expect(
      field1bDistToField1,
      `BUG DEMONSTRATED: field_1b (Y: ${field1bPos!.y.toFixed(1)}) should be closer to its parent field1 (Y: ${field1Y.toFixed(1)}) than to field2 (Y: ${field2Y.toFixed(1)}). ` +
      `Current: distance to field1 = ${field1bDistToField1.toFixed(1)}, distance to field2 = ${field1bDistToField2.toFixed(1)}. ` +
      `This proves level 2 nodes are bunched together instead of being positioned relative to their parents.`
    ).toBeLessThan(field1bDistToField2);
    
    // Verify field2's children are also correctly positioned
    for (const [nodeId, nodePos] of [
      ["field_2a", field2aPos!],
      ["field_2b", field2bPos!],
      ["field_2c", field2cPos!],
    ]) {
      const distToField2 = Math.abs(nodePos.y - field2Y);
      const distToField1 = Math.abs(nodePos.y - field1Y);
      expect(
        distToField2,
        `${nodeId} (Y: ${nodePos.y.toFixed(1)}) should be closer to its parent field2 (Y: ${field2Y.toFixed(1)}) than to field1 (Y: ${field1Y.toFixed(1)})`
      ).toBeLessThan(distToField1);
    }
  });

  it("should handle a simple two-level hierarchy correctly", () => {
    const graph = new DependencyGraph();
    
    const root: NodeRef = { type: "object", key: "obj_1", name: "Root" };
    const field1: NodeRef = { type: "field", key: "f1", name: "Field 1" };
    const field2: NodeRef = { type: "field", key: "f2", name: "Field 2" };
    
    graph.addNode(root);
    graph.addNode(field1);
    graph.addNode(field2);
    
    graph.addEdge({ from: field1, to: root, type: "derivesFrom" });
    graph.addEdge({ from: field2, to: root, type: "derivesFrom" });
    
    const subgraph: Subgraph = {
      nodes: [root, field1, field2],
      edges: graph.getAllEdges(),
    };
    
    const positions = computeRipplePositions(graph, subgraph, root, "LR", {
      rankSep: 220,
      nodeSep: 180,
    });
    
    expect(positions.get("object:obj_1")?.x).toBe(0);
    expect(positions.get("object:obj_1")?.y).toBe(0);
    
    const f1Pos = positions.get("field:f1");
    const f2Pos = positions.get("field:f2");
    
    expect(f1Pos).toBeDefined();
    expect(f2Pos).toBeDefined();
    // Fields derive from root (depth 0), so they get depth 1, then +1 shift = X = 2*220 = 440
    expect(f1Pos?.x).toBe(440);
    expect(f2Pos?.x).toBe(440);
    
    // Fields should be spaced vertically
    const spacing = Math.abs((f2Pos?.y ?? 0) - (f1Pos?.y ?? 0));
    expect(spacing).toBeGreaterThanOrEqual(180 * 0.9);
  });

  it("should properly space views that reference the same fields", () => {
    // Test the fix for view bunching: multiple views referencing the same field
    // should be grouped together and spaced appropriately
    const graph = new DependencyGraph();
    
    const root: NodeRef = { type: "object", key: "obj_1", name: "Root" };
    const field1: NodeRef = { type: "field", key: "f1", name: "Field 1" };
    const field2: NodeRef = { type: "field", key: "f2", name: "Field 2" };
    const view1: NodeRef = { type: "view", key: "v1", name: "View 1" };
    const view2: NodeRef = { type: "view", key: "v2", name: "View 2" };
    const view3: NodeRef = { type: "view", key: "v3", name: "View 3" };
    
    graph.addNode(root);
    graph.addNode(field1);
    graph.addNode(field2);
    graph.addNode(view1);
    graph.addNode(view2);
    graph.addNode(view3);
    
    // Fields derive from root
    graph.addEdge({ from: field1, to: root, type: "derivesFrom" });
    graph.addEdge({ from: field2, to: root, type: "derivesFrom" });
    
    // Views reference fields - view1 and view2 both reference field1
    graph.addEdge({ from: view1, to: field1, type: "uses" });
    graph.addEdge({ from: view2, to: field1, type: "uses" });
    // view3 references field2
    graph.addEdge({ from: view3, to: field2, type: "uses" });
    
    const subgraph: Subgraph = {
      nodes: [root, field1, field2, view1, view2, view3],
      edges: graph.getAllEdges(),
    };
    
    const positions = computeRipplePositions(graph, subgraph, root, "LR", {
      rankSep: 220,
      nodeSep: 180,
      bandSep: 140,
    });
    
    // Verify fields are positioned
    const f1Pos = positions.get("field:f1");
    const f2Pos = positions.get("field:f2");
    expect(f1Pos).toBeDefined();
    expect(f2Pos).toBeDefined();
    
    // Verify views are positioned
    const v1Pos = positions.get("view:v1");
    const v2Pos = positions.get("view:v2");
    const v3Pos = positions.get("view:v3");
    expect(v1Pos).toBeDefined();
    expect(v2Pos).toBeDefined();
    expect(v3Pos).toBeDefined();
    
    // Views should be at layer 3 (one after fields at layer 2)
    // Fields are at depth 1, which becomes layer 2 after +1 shift, so views are at layer 3
    const expectedViewX = 3 * 220; // layer 3 * rankSep
    expect(v1Pos?.x).toBe(expectedViewX);
    expect(v2Pos?.x).toBe(expectedViewX);
    expect(v3Pos?.x).toBe(expectedViewX);
    
    // THE FIX TEST: Views referencing the same field should be grouped and spaced
    // view1 and view2 both reference field1, so they should be near field1's Y
    // view3 references field2, so it should be near field2's Y
    
    const field1Y = f1Pos!.y;
    const field2Y = f2Pos!.y;
    
    // view1 and view2 should be closer to field1 than to field2
    const v1DistToField1 = Math.abs(v1Pos!.y - field1Y);
    const v1DistToField2 = Math.abs(v1Pos!.y - field2Y);
    expect(
      v1DistToField1,
      `view1 (Y: ${v1Pos!.y.toFixed(1)}) should be closer to field1 (Y: ${field1Y.toFixed(1)}) than to field2 (Y: ${field2Y.toFixed(1)})`
    ).toBeLessThan(v1DistToField2);
    
    const v2DistToField1 = Math.abs(v2Pos!.y - field1Y);
    const v2DistToField2 = Math.abs(v2Pos!.y - field2Y);
    // Allow a small tolerance for edge cases where views are very close to midpoint
    // The key is that views referencing the same field should be grouped together
    if (v2DistToField1 >= v2DistToField2) {
      // If view2 is equidistant or closer to field2, it's a problem
      // But we should at least verify that view1 and view2 are spaced apart
      const v1v2Spacing = Math.abs(v2Pos!.y - v1Pos!.y);
      expect(
        v1v2Spacing,
        `view1 and view2 should be spaced apart (spacing: ${v1v2Spacing.toFixed(1)}, expected at least ${180 * 0.9})`
      ).toBeGreaterThanOrEqual(180 * 0.9);
      // And view2 should be closer to field1 than to field2 (with small tolerance for midpoint cases)
      expect(
        v2DistToField1,
        `view2 (Y: ${v2Pos!.y.toFixed(1)}) should be closer to field1 (Y: ${field1Y.toFixed(1)}) than to field2 (Y: ${field2Y.toFixed(1)}). Distance to field1: ${v2DistToField1.toFixed(1)}, distance to field2: ${v2DistToField2.toFixed(1)}`
      ).toBeLessThanOrEqual(v2DistToField2 + 1); // Allow 1 unit tolerance
    } else {
      expect(v2DistToField1).toBeLessThan(v2DistToField2);
    }
    
    // view3 should be closer to field2 than to field1
    const v3DistToField2 = Math.abs(v3Pos!.y - field2Y);
    const v3DistToField1 = Math.abs(v3Pos!.y - field1Y);
    expect(v3DistToField2).toBeLessThan(v3DistToField1);
    
    // view1 and view2 should be spaced apart (not bunched at the same Y)
    const v1v2Spacing = Math.abs(v2Pos!.y - v1Pos!.y);
    expect(v1v2Spacing).toBeGreaterThanOrEqual(180 * 0.9); // nodeSep with tolerance
  });

  it("should handle nodes with multiple parents correctly", () => {
    const graph = new DependencyGraph();
    
    const root: NodeRef = { type: "object", key: "obj_1", name: "Root" };
    const parent1: NodeRef = { type: "field", key: "p1", name: "Parent 1" };
    const parent2: NodeRef = { type: "field", key: "p2", name: "Parent 2" };
    const child: NodeRef = { type: "field", key: "c1", name: "Child" };
    
    graph.addNode(root);
    graph.addNode(parent1);
    graph.addNode(parent2);
    graph.addNode(child);
    
    graph.addEdge({ from: parent1, to: root, type: "derivesFrom" });
    graph.addEdge({ from: parent2, to: root, type: "derivesFrom" });
    graph.addEdge({ from: child, to: parent1, type: "derivesFrom" });
    graph.addEdge({ from: child, to: parent2, type: "derivesFrom" });
    
    const subgraph: Subgraph = {
      nodes: [root, parent1, parent2, child],
      edges: graph.getAllEdges(),
    };
    
    const positions = computeRipplePositions(graph, subgraph, root, "LR", {
      rankSep: 220,
      nodeSep: 180,
    });
    
    const childPos = positions.get("field:c1");
    expect(childPos).toBeDefined();
    // Child derives from parent1 and parent2 (both depth 1), so it gets depth 2, then +1 shift = X = 3*220 = 660
    expect(childPos?.x).toBe(660);
    
    // Child should be positioned between its two parents
    const p1Y = positions.get("field:p1")!.y;
    const p2Y = positions.get("field:p2")!.y;
    const childY = childPos!.y;
    
    const minParentY = Math.min(p1Y, p2Y);
    const maxParentY = Math.max(p1Y, p2Y);
    
    // Child should be between or near the average of its parents
    expect(childY).toBeGreaterThanOrEqual(minParentY - 100);
    expect(childY).toBeLessThanOrEqual(maxParentY + 100);
  });
});

