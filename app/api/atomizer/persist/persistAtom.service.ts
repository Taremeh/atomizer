import { supabase } from '../helper/supabaseClient';
import { IAtom } from '../models/atom.model';

/* Example MarkdownNode tree (used to generate IContext objects) */
// const markdownNodes: INode[] = [
//   {
//     id: "A",
//     type: "h1",
//     content: "Heading A",
//     children: [
//       {
//         id: "B",
//         type: "h2",
//         content: "Heading B",
//         children: [
//           { id: "D", type: "p", content: "Paragraph D", children: [] },
//           { id: "E", type: "p", content: "Paragraph E", children: [] }
//         ]
//       },
//       {
//         id: "C",
//         type: "h2",
//         content: "Heading C",
//         children: []
//       }
//     ]
//   }
// ];

// Function to persist an array of IAtom objects to Supabase
export async function persistAtoms(atoms: IAtom[]) {

  // Bulk insert the atoms array into the "atoms" table
  const { data, error } = await supabase
    .from('atoms')
    .insert(atoms);

  if (error) {
    console.error('Error inserting atoms:', error);
  } else {
    console.log('Successfully inserted atoms.');
  }
}

// Execute the persistence function
// persistAtoms(atoms);
