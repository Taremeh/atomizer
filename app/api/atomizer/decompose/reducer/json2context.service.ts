import { INode } from "../../models/node.model";
import { IContext } from "../../models/context.model";

/**
 * Traverses the MarkdownNode tree and returns an array of FlattenedNode objects.
 * Each flattened node has its own `id` and an array of its immediate children (each with only an `id`).
 * Finally, any node that does not have any children is filtered out.
 *
 * @param nodes - An array of MarkdownNode objects representing the tree.
 * @returns An array of FlattenedNode objects that have non-empty children arrays.
 */
export function reduceJsonToContext(nodes: INode[]): IContext[] {
  const result: IContext[] = [];

  function traverse(node: INode) {
    // Create the flattened node containing only the id and immediate children (by id)
    const flattened: IContext = {
      id: node.id,
      children: node.children.map(child => ({ id: child.id }))
    };

    result.push(flattened);

    // Process each child so that each becomes its own flattened object.
    for (const child of node.children) {
      traverse(child);
    }
  }

  // Start traversal at the root nodes.
  for (const node of nodes) {
    traverse(node);
  }

  // Remove any flattened nodes that have empty children arrays.
  return result.filter(flatNode => flatNode.children.length > 0);
}

/* Example usage:

// Suppose we have the following MarkdownNode tree (IDs are for illustration):
// A
// ├─ B
// │   ├─ D
// │   └─ E
// └─ C

const markdownNodes: MarkdownNode[] = [
  {
    id: "A",
    type: "h1",
    content: "Heading A",
    children: [
      {
        id: "B",
        type: "h2",
        content: "Heading B",
        children: [
          { id: "D", type: "p", content: "Paragraph D", children: [] },
          { id: "E", type: "p", content: "Paragraph E", children: [] }
        ]
      },
      {
        id: "C",
        type: "h2",
        content: "Heading C",
        children: []
      }
    ]
  }
];

const flattenedAndFiltered = reduceJsonToContext(markdownNodes);
console.log(JSON.stringify(flattenedAndFiltered, null, 2));

The output will be:

[
  {
    "id": "A",
    "children": [
      { "id": "B" },
      { "id": "C" }
    ]
  },
  {
    "id": "B",
    "children": [
      { "id": "D" },
      { "id": "E" }
    ]
  }
]

In this final array, nodes "C", "D", and "E" were removed because they had empty children arrays.
*/
