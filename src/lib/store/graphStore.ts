import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DependencyGraph } from "@/lib/deps/graph";
import {
  EdgeType,
  NodeRef,
  NodeType,
  type Edge as DepEdge,
  toNodeId,
} from "@/lib/deps/types";

export type Direction = "in" | "out" | "both";

interface GraphState {
  applicationId?: string;
  apiKey?: string;
  graph?: DependencyGraph;
  root?: NodeRef;
  direction: Direction;
  edgeTypes: EdgeType[];
  depth: number;
  peerMode: boolean;
  peerDepth: number;
  selected?: NodeRef;
  selectedEdge?: DepEdge;
  groupCollapsed: Record<string, boolean>;
  setConfig: (applicationId: string, apiKey?: string) => void;
  setGraph: (g: DependencyGraph) => void;
  setRoot: (root: NodeRef) => void;
  setDirection: (d: Direction) => void;
  setEdgeTypes: (t: EdgeType[]) => void;
  setDepth: (d: number) => void;
  setPeerMode: (v: boolean) => void;
  setPeerDepth: (d: number) => void;
  setSelected: (n?: NodeRef) => void;
  setSelectedEdge: (e?: DepEdge) => void;
  toggleGroupCollapsed: (root: NodeRef, type: NodeType) => void;
  isGroupCollapsed: (root: NodeRef, type: NodeType) => boolean;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      direction: "both",
      edgeTypes: [],
      depth: 10,
      peerMode: false,
      peerDepth: Number.POSITIVE_INFINITY,
      groupCollapsed: {},
      setConfig: (applicationId, apiKey) => set({ applicationId, apiKey }),
      setGraph: (graph) => set({ graph }),
      setRoot: (root) => set({ root }),
      setDirection: (direction) => set({ direction }),
      setEdgeTypes: (edgeTypes) => set({ edgeTypes }),
      setDepth: (depth) => set({ depth }),
      setPeerMode: (peerMode) => set({ peerMode }),
      setPeerDepth: (peerDepth) =>
        set({
          peerDepth: Number.isFinite(peerDepth)
            ? peerDepth
            : Number.POSITIVE_INFINITY,
        }),
      setSelected: (selected) => set({ selected }),
      setSelectedEdge: (selectedEdge) => set({ selectedEdge }),
      toggleGroupCollapsed: (root, type) =>
        set((s) => {
          const key = `${toNodeId(root)}::${type}`;
          const next = { ...(s.groupCollapsed ?? {}) } as Record<
            string,
            boolean
          >;
          next[key] = !(s.groupCollapsed?.[key] ?? true);
          return { groupCollapsed: next } as Partial<GraphState> as GraphState;
        }),
      isGroupCollapsed: (root, type) => {
        const key = `${toNodeId(root)}::${type}`;
        const s = get();
        return s.groupCollapsed?.[key] ?? true;
      },
    }),
    {
      name: "knarc-config",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        applicationId: s.applicationId,
        apiKey: s.apiKey,
        root: s.root,
        direction: s.direction,
        edgeTypes: s.edgeTypes,
        depth: s.depth,
        peerMode: s.peerMode,
        // Avoid persisting Infinity which serializes as null; omit to use default
        peerDepth: Number.isFinite(s.peerDepth) ? s.peerDepth : undefined,
        groupCollapsed: s.groupCollapsed,
      }),
      version: 3,
      migrate: (state, version) => {
        if (version === 1) {
          const v1 = state as any;
          if (!Number.isFinite(v1.state?.peerDepth)) {
            v1.state.peerDepth = Number.POSITIVE_INFINITY;
          }
          return v1;
        }
        if (version === 2) {
          const v2 = state as any;
          if (!v2.state?.groupCollapsed) v2.state.groupCollapsed = {};
          return v2;
        }
        return state as any;
      },
    }
  )
);
