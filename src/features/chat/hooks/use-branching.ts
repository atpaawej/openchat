"use client";

import * as React from "react";
import type { ChatMessage, BranchInfo } from "../types";

export interface UseBranchingReturn {
  activeBranchMessages: ChatMessage[];
  activeLeafId: string | null;
  setActiveLeafId: (id: string | null) => void;
  getBranchInfo: (messageId: string) => BranchInfo;
  switchBranch: (messageId: string, direction: "prev" | "next") => string | null;
}

export function useBranching(
  messages: ChatMessage[],
  initialLeafId?: string | null
): UseBranchingReturn {
  // Build lookup maps
  const { messageMap, childrenMap, latestLeafId } = React.useMemo(() => {
    const msgMap = new Map<string, ChatMessage>();
    const childMap = new Map<string | null, string[]>();

    for (const msg of messages) {
      msgMap.set(msg.id, msg);
      const pId = msg.parentId ?? null;
      if (!childMap.has(pId)) {
        childMap.set(pId, []);
      }
      childMap.get(pId)!.push(msg.id);
    }

    // Sort siblings by createdAt
    for (const [, childIds] of childMap.entries()) {
      childIds.sort((a, b) => {
        const msgA = msgMap.get(a);
        const msgB = msgMap.get(b);
        return (msgA?.createdAt ?? 0) - (msgB?.createdAt ?? 0);
      });
    }

    // Find the latest message overall as default leaf
    let latestLeaf: string | null = null;
    let latestTime = -1;
    for (const msg of messages) {
      if (msg.createdAt > latestTime) {
        latestTime = msg.createdAt;
        latestLeaf = msg.id;
      }
    }

    return { messageMap: msgMap, childrenMap: childMap, latestLeafId: latestLeaf };
  }, [messages]);

  const [activeLeafId, setActiveLeafId] = React.useState<string | null>(
    initialLeafId ?? latestLeafId
  );

  // If activeLeafId is no longer in messageMap (or was null), fallback to latestLeafId
  React.useEffect(() => {
    if (!activeLeafId || !messageMap.has(activeLeafId)) {
      setActiveLeafId(latestLeafId);
    }
  }, [latestLeafId, activeLeafId, messageMap]);

  // Compute active branch messages from root to activeLeafId
  const activeBranchMessages = React.useMemo(() => {
    if (!activeLeafId || messages.length === 0) {
      return [];
    }

    const path: ChatMessage[] = [];
    let currId: string | null = activeLeafId;
    const visited = new Set<string>();

    while (currId && messageMap.has(currId) && !visited.has(currId)) {
      visited.add(currId);
      const node: ChatMessage = messageMap.get(currId)!;
      path.unshift(node);
      currId = node.parentId ?? null;
    }

    return path;
  }, [activeLeafId, messageMap, messages.length]);

  /**
   * Helper to find deepest latest leaf in a subtree starting from a given node.
   */
  const findDeepestLeaf = React.useCallback(
    (startNodeId: string): string => {
      let currentId = startNodeId;

      while (true) {
        const children = childrenMap.get(currentId);
        if (!children || children.length === 0) {
          return currentId;
        }
        // Take the latest child
        currentId = children[children.length - 1]!;
      }
    },
    [childrenMap]
  );

  /**
   * Returns branch index and sibling count for a message.
   */
  const getBranchInfo = React.useCallback(
    (messageId: string): BranchInfo => {
      const msg = messageMap.get(messageId);
      if (!msg) {
        return {
          messageId,
          currentIndex: 1,
          totalCount: 1,
          siblingIds: [messageId],
        };
      }

      const pId = msg.parentId ?? null;
      const allSiblings = childrenMap.get(pId) || [messageId];

      // Filter siblings of same role if desired, or all direct siblings with same parent
      const siblings = allSiblings.filter((id) => {
        const s = messageMap.get(id);
        return s && s.role === msg.role;
      });

      const idx = siblings.indexOf(messageId);
      const currentIndex = idx >= 0 ? idx + 1 : 1;
      const totalCount = Math.max(siblings.length, 1);

      return {
        messageId,
        currentIndex,
        totalCount,
        siblingIds: siblings.length > 0 ? siblings : [messageId],
      };
    },
    [messageMap, childrenMap]
  );

  /**
   * Switches to adjacent sibling branch and updates active leaf.
   */
  const switchBranch = React.useCallback(
    (messageId: string, direction: "prev" | "next"): string | null => {
      const info = getBranchInfo(messageId);
      if (info.totalCount <= 1) return null;

      const currentIdx = info.currentIndex - 1; // 0-based
      const targetIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;

      if (targetIdx < 0 || targetIdx >= info.siblingIds.length) {
        return null; // out of bounds
      }

      const targetSiblingId = info.siblingIds[targetIdx]!;
      const newLeafId = findDeepestLeaf(targetSiblingId);

      setActiveLeafId(newLeafId);
      return newLeafId;
    },
    [getBranchInfo, findDeepestLeaf]
  );

  return {
    activeBranchMessages,
    activeLeafId,
    setActiveLeafId,
    getBranchInfo,
    switchBranch,
  };
}
