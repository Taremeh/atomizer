import { createClient } from '@supabase/supabase-js';
import { INode } from '../models/node.model';
import { IContext } from '../models/context.model';
import { reduceJsonToContext } from '../decompose/reducer/json2context.service';
import { supabase } from '../helper/supabaseClient';

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

// Function to persist an array of IContext objects to Supabase
export async function persistContexts(contexts: IContext[]) {

  // Bulk insert the contexts array into the "contexts" table
  const { data, error } = await supabase
    .from('contexts')
    .insert(contexts);

  if (error) {
    console.error('Error inserting contexts:', error);
  } else {
    console.log('Successfully inserted contexts.');
  }
}

// Execute the persistence function
// persistContexts(flattenedContexts);
