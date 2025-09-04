import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DependencyGraph } from "@/lib/deps/graph";
import {
  EdgeType,
  NodeRef,
  type Edge as DepEdge,
  toNodeId,
} from "@/lib/deps/types";
import { EntityKind } from "../types";

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
  minScore: number;
  selected?: NodeRef;
  selectedEdge?: DepEdge;
  groupCollapsed: Record<string, boolean>;
  focusNodeId?: string;
  setConfig: (applicationId: string, apiKey?: string) => void;
  setGraph: (g: DependencyGraph) => void;
  setRoot: (root: NodeRef) => void;
  setDirection: (d: Direction) => void;
  setEdgeTypes: (t: EdgeType[]) => void;
  setDepth: (d: number) => void;
  setPeerMode: (v: boolean) => void;
  setPeerDepth: (d: number) => void;
  setMinScore: (v: number) => void;
  setSelected: (n?: NodeRef) => void;
  setSelectedEdge: (e?: DepEdge) => void;
  setFocusNodeId: (id?: string) => void;
  toggleGroupCollapsed: (root: NodeRef, type: EntityKind) => void;
  isGroupCollapsed: (root: NodeRef, type: EntityKind) => boolean;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      direction: "both",
      edgeTypes: [],
      depth: 10,
      peerMode: false,
      peerDepth: Number.POSITIVE_INFINITY,
      minScore: 0,
      groupCollapsed: {},
      focusNodeId: undefined,
      setConfig: (applicationId, apiKey) => set({ applicationId, apiKey }),
      setGraph: (graph) => set({ graph }),
      setRoot: (root) => set({ root, focusNodeId: toNodeId(root) }),
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
      setMinScore: (minScore) => set({ minScore }),
      setSelected: (selected) => set({ selected }),
      setSelectedEdge: (selectedEdge) => set({ selectedEdge }),
      setFocusNodeId: (focusNodeId) => set({ focusNodeId }),
      toggleGroupCollapsed: (root, type) =>
        set((s) => {
          const key = `${toNodeId(root)}::${type}`;
          const next = { ...(s.groupCollapsed ?? {}) };
          next[key] = !(s.groupCollapsed?.[key] ?? true);
          return { groupCollapsed: next };
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
        peerDepth: Number.isFinite(s.peerDepth) ? s.peerDepth : undefined,
        groupCollapsed: s.groupCollapsed,
      }),
      version: 3,
      migrate: (state, version) => {
        if (version === 1) {
          const v1 = state as GraphState;
          if (!Number.isFinite(v1.peerDepth)) {
            v1.peerDepth = Number.POSITIVE_INFINITY;
          }
          return v1;
        }
        if (version === 2) {
          const v2 = state as GraphState;
          if (!v2.groupCollapsed) v2.groupCollapsed = {};
          return v2;
        }
        return state;
      },
    }
  )
);
