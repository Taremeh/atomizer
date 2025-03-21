import { IAtom } from "../../models/atom.model";
import { INode } from "../../models/node.model";


/**
 * Recursively traverses a MarkdownNode tree and returns a flat array of objects,
 * where each object contains all properties of the node (id, type, content) except for the children.
 *
 * @param nodes - The array of MarkdownNode objects (a tree structure) to flatten.
 * @returns A flat array (1d list) of MarkdownAtom objects.
 */
export function reduceJsonToAtoms(nodes: INode[]): IAtom[] {
  const atoms: IAtom[] = [];

  // Helper function to traverse the tree.
  function traverse(node: INode) {
    // Extract the properties we want from the node (ignoring children)
    const { id, type, content } = node;
    atoms.push({ id, type, content });

    // Recursively traverse each child node.
    for (const child of node.children) {
      traverse(child);
    }
  }

  // Start the traversal for each root node.
  for (const node of nodes) {
    traverse(node);
  }

  return atoms;
}

/* Example usage:

Assume the following MarkdownNode tree is generated by parseMarkdown (IDs are for illustration):
  
  A
  ├─ B
  │   ├─ D
  │   └─ E
  └─ C

const markdownNodes: MarkdownNode[] = [
  {
    id: "A",
    type: "h1",
    content: "Heading Title Level 1",
    children: [
      {
        id: "B",
        type: "h2",
        content: "Heading Title Level 2",
        children: [
          { id: "D", type: "p", content: "Paragraph D", children: [] },
          { id: "E", type: "p", content: "Paragraph E", children: [] }
        ]
      },
      {
        id: "C",
        type: "h2",
        content: "Another Heading",
        children: []
      }
    ]
  }
];

const atoms = flattenJsonToAtoms(markdownNodes);
console.log(JSON.stringify(atoms, null, 2));

The expected output is a flat array where each node is represented without its children:

[
  { "id": "A", "type": "h1", "content": "Heading Title Level 1" },
  { "id": "B", "type": "h2", "content": "Heading Title Level 2" },
  { "id": "D", "type": "p", "content": "Paragraph D" },
  { "id": "E", "type": "p", "content": "Paragraph E" },
  { "id": "C", "type": "h2", "content": "Another Heading" }
]
*/
