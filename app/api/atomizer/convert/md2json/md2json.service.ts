// md2json.service.ts

import { v4 as uuidv4 } from 'uuid';

export interface MarkdownNode {
  id: string;
  type: string;
  content: string;
  children: MarkdownNode[];
}

/**
 * Converts a Markdown string into a JSON tree of MarkdownNodes.
 * This implementation nests headings (and their following content) according
 * to heading levels. It also supports lists (and nested list items based on indent).
 *
 * For example, given:
 *
 *   # Heading 1
 *   ## Heading 2
 *   Some text
 *
 * "Heading 2" (with its text) will be nested under "Heading 1".
 *
 * @param markdown The markdown string.
 * @returns An array of MarkdownNodes representing the markdown structure.
 */
export function convertMarkdownToJson(markdown: string): MarkdownNode[] {
  const lines = markdown.split('\n');
  const root: MarkdownNode[] = [];
  // Stack to manage nested lists.
  const listStack: { node: MarkdownNode; indent: number }[] = [];
  // Stack to manage nested headings.
  const headingStack: { node: MarkdownNode; level: number }[] = [];

  function createNode(type: string, content: string): MarkdownNode {
    return { id: uuidv4(), type, content, children: [] };
  }

  function getHeadingLevel(line: string): number {
    return line.match(/^#+/)?.[0].length || 0;
  }

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    // Process headings.
    if (/^#+ /.test(line)) {
      // End any in-progress list.
      listStack.length = 0;
      const level = getHeadingLevel(line);
      const headingNode = createNode(`h${level}`, line.replace(/^#+ /, '').trim());
      
      // Pop headings until the top has a lower level than the current heading.
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      if (headingStack.length > 0) {
        // Nest the heading as a child of the last heading.
        headingStack[headingStack.length - 1].node.children.push(headingNode);
      } else {
        // Otherwise, add at the root.
        root.push(headingNode);
      }
      // Push the new heading onto the heading stack.
      headingStack.push({ node: headingNode, level });
      continue;
    }

    // Process list items.
    if (/^\s*[-*] /.test(line)) {
      const indentMatch = line.match(/^(\s*)[-*] /);
      const indent = indentMatch ? indentMatch[1].length : 0;
      const content = line.replace(/^\s*[-*] /, '').trim();
      const listItem = createNode('li', content);

      if (listStack.length === 0) {
        // Create a new list if none is in progress.
        const ulNode = createNode('ul', '');
        ulNode.children.push(listItem);
        // Add to the last heading's children if exists; otherwise, at the root.
        if (headingStack.length > 0) {
          headingStack[headingStack.length - 1].node.children.push(ulNode);
        } else {
          root.push(ulNode);
        }
        listStack.push({ node: ulNode, indent });
      } else {
        const lastEntry = listStack[listStack.length - 1];
        if (indent > lastEntry.indent) {
          // More indented: create a nested list.
          const ulNode = createNode('ul', '');
          // Attach to the last list item.
          const parentLi = lastEntry.node.children[lastEntry.node.children.length - 1];
          if (parentLi) {
            parentLi.children.push(ulNode);
          } else {
            lastEntry.node.children.push(ulNode);
          }
          ulNode.children.push(listItem);
          listStack.push({ node: ulNode, indent });
        } else if (indent === lastEntry.indent) {
          // Same level: add to the current list.
          lastEntry.node.children.push(listItem);
        } else {
          // Less indented: pop until matching level is found.
          while (listStack.length > 0 && indent < listStack[listStack.length - 1].indent) {
            listStack.pop();
          }
          if (listStack.length === 0) {
            const ulNode = createNode('ul', '');
            ulNode.children.push(listItem);
            if (headingStack.length > 0) {
              headingStack[headingStack.length - 1].node.children.push(ulNode);
            } else {
              root.push(ulNode);
            }
            listStack.push({ node: ulNode, indent });
          } else {
            const current = listStack[listStack.length - 1];
            if (indent === current.indent) {
              current.node.children.push(listItem);
            } else {
              const ulNode = createNode('ul', '');
              const parentLi = current.node.children[current.node.children.length - 1];
              if (parentLi) {
                parentLi.children.push(ulNode);
              } else {
                current.node.children.push(ulNode);
              }
              ulNode.children.push(listItem);
              listStack.push({ node: ulNode, indent });
            }
          }
        }
      }
      continue;
    }

    // Process paragraphs or regular text.
    // End any in-progress list.
    listStack.length = 0;
    const paragraphNode = createNode('p', line.trim());
    // If there's an active heading, nest the paragraph under it.
    if (headingStack.length > 0) {
      headingStack[headingStack.length - 1].node.children.push(paragraphNode);
    } else {
      root.push(paragraphNode);
    }
  }

  return root;
}
