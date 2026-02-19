// from https://www.geeksforgeeks.org/build-tree-array-from-flat-array-in-javascript/
// modified to add typescript and optional `rootId` param

export type nodeId = string | number;
type nMap = { [key: nodeId]: treeNode };

export interface treeNode {
  id: nodeId;
  value: string;
  label: string;
  parentId?: nodeId;
  children?: treeNode[];
}

export function buildTreeArray(flatArray: treeNode[], rootId?: nodeId) {
  // Use reduce to create a nodeMap
  const nodeMap: nMap = flatArray.reduce((acc: nMap, item) => {
    acc[item.id] = { ...item, children: [] };
    return acc;
  }, {});

  // Recursive function to build nodes
  const buildNode = (id: nodeId) => {
    const node = nodeMap[id];
    if (!node) return null;

    // Filter flatArray for items with parentId === id
    node.children = flatArray
      .filter((item) => item.parentId === id)
      .map((item) => buildNode(item.id))
      .filter((child): child is treeNode => child != null);
    return node;
  };

  // Filter flatArray for root nodes
  return flatArray
    .filter((item) => (rootId ? item.id == rootId : item.parentId === null))
    .map((item) => buildNode(item.id));
}
