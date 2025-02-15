import { supabase } from '../helper/supabaseClient';
import { IContext } from '../models/context.model';

/**
 * Retrieves and rebuilds the nested JSON structure for a given root context id.
 * 
 * This function calls the Postgres RPC "get_subtree" (which must be defined in your database)
 * to retrieve a flat array of IContext objects for the entire subtree.
 * It then rebuilds the nested structure by linking each node’s children (which are stored
 * as an array of { id: string } objects) with their full node objects.
 *
 * @param rootId - The id of the root context.
 * @returns A promise that resolves to the nested JSON structure starting at rootId.
 */
export async function retrieveNestedContext(rootId: string): Promise<any> {
  // Call the RPC function "get_subtree" to retrieve the flat subtree.
  const { data, error } = await supabase.rpc('get_subtree', { root_id: rootId });

  if (error) {
    console.error('Error retrieving subtree:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  console.log(data)

  // Build a map of nodes keyed by their id.
  const nodeMap = new Map<string, any>();

  // Initialize the node map by cloning each node and ensuring a fresh empty children array.
  data.forEach((node: IContext) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Rebuild the nested structure:
  // For each node in the flat array, look at its children (which are stored as { id: string }).
  // Then, replace each child reference with the corresponding full node from the nodeMap.
  data.forEach((node: IContext) => {
    const currentNode = nodeMap.get(node.id);
    if (node.children && node.children.length > 0) {
      node.children.forEach(childRef => {
        const childNode = nodeMap.get(childRef.id);
        if (childNode) {
          currentNode.children.push(childNode);
        } else {
          // If the full node isn’t found, include the reference as a leaf node.
          currentNode.children.push({ id: childRef.id, owner: null, children: [] });
        }
      });
    }
  });
  
  // Return the nested tree starting at the root id.
  return nodeMap.get(rootId);
}

/* Example usage:

(async () => {
  try {
    const nestedTree = await retrieveNestedContext('A');  // replace 'A' with your root id
    console.log('Nested Tree:', JSON.stringify(nestedTree, null, 2));
  } catch (err) {
    console.error('Failed to retrieve nested context:', err);
  }
})();
*/
