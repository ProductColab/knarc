import { Edge, EdgeType, NodeRef, toNodeId } from "./types";

export class DependencyGraph {
  private readonly nodes: Map<string, NodeRef> = new Map();
  private readonly outgoing: Map<string, Edge[]> = new Map();
  private readonly incoming: Map<string, Edge[]> = new Map();

  addNode(node: NodeRef): void {
    const id = toNodeId(node);
    if (!this.nodes.has(id)) {
      this.nodes.set(id, node);
    }
  }

  addEdge(edge: Edge): void {
    this.addNode(edge.from);
    this.addNode(edge.to);
    const fromId = toNodeId(edge.from);
    const toId = toNodeId(edge.to);
    if (!this.outgoing.has(fromId)) this.outgoing.set(fromId, []);
    if (!this.incoming.has(toId)) this.incoming.set(toId, []);
    this.outgoing.get(fromId)!.push(edge);
    this.incoming.get(toId)!.push(edge);
  }

  getNode(id: string): NodeRef | undefined {
    return this.nodes.get(id);
  }

  getOutgoing(node: NodeRef): Edge[] {
    return this.outgoing.get(toNodeId(node)) ?? [];
  }

  getIncoming(node: NodeRef): Edge[] {
    return this.incoming.get(toNodeId(node)) ?? [];
  }

  getAllNodes(): NodeRef[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): Edge[] {
    const all: Edge[] = [];
    for (const [, edges] of this.outgoing) all.push(...edges);
    return all;
  }

  bfs(
    start: NodeRef,
    direction: "out" | "in" = "out",
    edgeFilter?: (e: Edge) => boolean
  ): NodeRef[] {
    const visited = new Set<string>();
    const queue: NodeRef[] = [];
    const startId = toNodeId(start);
    if (!this.nodes.has(startId)) return [];
    visited.add(startId);
    queue.push(start);
    const result: NodeRef[] = [];
    while (queue.length) {
      const node = queue.shift()!;
      result.push(node);
      const edges =
        direction === "out" ? this.getOutgoing(node) : this.getIncoming(node);
      for (const edge of edges) {
        if (edgeFilter && !edgeFilter(edge)) continue;
        const next = direction === "out" ? edge.to : edge.from;
        const nextId = toNodeId(next);
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push(next);
        }
      }
    }
    return result;
  }

  dfs(
    start: NodeRef,
    direction: "out" | "in" = "out",
    edgeFilter?: (e: Edge) => boolean
  ): NodeRef[] {
    const visited = new Set<string>();
    const result: NodeRef[] = [];
    const visit = (n: NodeRef): void => {
      const id = toNodeId(n);
      if (visited.has(id)) return;
      visited.add(id);
      result.push(n);
      const edges =
        direction === "out" ? this.getOutgoing(n) : this.getIncoming(n);
      for (const edge of edges) {
        if (edgeFilter && !edgeFilter(edge)) continue;
        const next = direction === "out" ? edge.to : edge.from;
        visit(next);
      }
    };
    visit(start);
    return result;
  }

  topologicalSort(edgeTypes: EdgeType[] = ["derivesFrom"]): NodeRef[] {
    // Kahn's algorithm over the subgraph filtered by edgeTypes
    const inDegree = new Map<string, number>();
    for (const node of this.getAllNodes()) {
      inDegree.set(toNodeId(node), 0);
    }
    for (const edge of this.getAllEdges()) {
      if (!edgeTypes.includes(edge.type)) continue;
      const to = toNodeId(edge.to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }
    const queue: NodeRef[] = [];
    for (const node of this.getAllNodes()) {
      if ((inDegree.get(toNodeId(node)) ?? 0) === 0) queue.push(node);
    }
    const order: NodeRef[] = [];
    while (queue.length) {
      const n = queue.shift()!;
      order.push(n);
      for (const e of this.getOutgoing(n)) {
        if (!edgeTypes.includes(e.type)) continue;
        const toId = toNodeId(e.to);
        const deg = (inDegree.get(toId) ?? 0) - 1;
        inDegree.set(toId, deg);
        if (deg === 0) queue.push(e.to);
      }
    }
    return order;
  }

  stronglyConnectedComponents(
    edgeTypes: EdgeType[] = ["derivesFrom"]
  ): NodeRef[][] {
    // Tarjan's algorithm on a filtered view of the graph
    let index = 0;
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    const components: NodeRef[][] = [];
    const successors = (id: string): string[] => {
      const node = this.getNode(id)!;
      const outs = this.getOutgoing(node);
      const next: string[] = [];
      for (const e of outs) {
        if (!edgeTypes.includes(e.type)) continue;
        next.push(toNodeId(e.to));
      }
      return next;
    };

    const strongConnect = (id: string) => {
      indices.set(id, index);
      lowlink.set(id, index);
      index++;
      stack.push(id);
      onStack.add(id);

      for (const w of successors(id)) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowlink.set(id, Math.min(lowlink.get(id)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(id, Math.min(lowlink.get(id)!, indices.get(w)!));
        }
      }

      if (lowlink.get(id) === indices.get(id)) {
        const component: NodeRef[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          const node = this.getNode(w);
          if (node) component.push(node);
        } while (w !== id);
        components.push(component);
      }
    };

    for (const node of this.getAllNodes()) {
      const id = toNodeId(node);
      if (!indices.has(id)) strongConnect(id);
    }

    return components;
  }
}
