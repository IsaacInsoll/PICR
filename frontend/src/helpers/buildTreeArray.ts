// from https://www.geeksforgeeks.org/build-tree-array-from-flat-array-in-javascript/
// modified to add typescript and optional `rootId` param

export type NodeId = string | number;
type NodeMap = { [key: NodeId]: TreeNode };

export interface TreeNode {
  id: NodeId;
  value: string;
  label: string;
  parentId?: NodeId;
  children?: TreeNode[];
}

export function buildTreeArray(flatArray: TreeNode[], rootId?: NodeId) {
  // Use reduce to create a nodeMap
  const nodeMap: NodeMap = flatArray.reduce((acc: NodeMap, item) => {
    acc[item.id] = { ...item, children: [] };
    return acc;
  }, {});

  // Recursive function to build nodes
  const buildNode = (id: NodeId) => {
    const node = nodeMap[id];
    if (!node) return null;

    // Filter flatArray for items with parentId === id
    node.children = flatArray
      .filter((item) => item.parentId === id)
      .map((item) => buildNode(item.id))
      .filter((child): child is TreeNode => child != null);
    return node;
  };

  // Filter flatArray for root nodes
  return flatArray
    .filter((item) => (rootId ? item.id == rootId : item.parentId === null))
    .map((item) => buildNode(item.id));
}
