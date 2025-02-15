import { supabase } from '../helper/supabaseClient';
import { IAtom } from '../models/atom.model';

/**
 * Enriches a nested context structure with additional "type" and "content" information.
 * It traverses the nested tree, looks up each node's id in the "atoms" table,
 * and then injects the "type" and "content" into the node.
 *
 * @param nestedContext - The nested context structure to be enriched.
 * @returns A promise that resolves to the enriched nested context.
 */
export async function enrichAtoms(nestedContext: any): Promise<any> {
  // Step 1: Traverse the nested context and collect all node ids.
  const ids: string[] = [];
  function collectIds(node: any): void {
    if (node && node.id) {
      ids.push(node.id);
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => collectIds(child));
      }
    }
  }
  collectIds(nestedContext);

  // Remove duplicates if any.
  const uniqueIds = Array.from(new Set(ids));

  // Step 2: Query the "atoms" table for these ids.
  const { data: atoms, error } = await supabase
    .from('atoms')
    .select('id, type, content')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error retrieving atoms:', error);
    throw error;
  }

  // Step 3: Build a lookup map from atom id to atom data.
  const atomsMap = new Map<string, IAtom>();
  atoms.forEach((atom: IAtom) => {
    atomsMap.set(atom.id, atom);
  });

  // Step 4: Recursively enrich the nested context nodes.
  function enrich(node: any): any {
    const atomData = atomsMap.get(node.id);
    if (atomData) {
      node.type = atomData.type;
      node.content = atomData.content;
    }
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map((child: any) => enrich(child));
    }
    return node;
  }

  return enrich(nestedContext);
}