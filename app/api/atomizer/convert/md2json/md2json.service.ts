import { v4 as uuidv4 } from 'uuid';

interface MarkdownNode {
  id: string;
  type: string;
  content: string;
  children: MarkdownNode[];
}


// Example Usage
const markdown_example = `
# Heading Title Level 1
Some text here
## Heading Title Level 2
Some second level text
- List item 1
- List item 2
`;

// console.log(JSON.stringify(parseMarkdown(markdown), null, 2));

export function convertMarkdownToJson(markdown: string): MarkdownNode[] {
  const lines = markdown.split('\n');
  const root: MarkdownNode[] = [];
  const stack: MarkdownNode[] = [];

  function createNode(type: string, content: string): MarkdownNode {
    return { id: uuidv4(), type, content, children: [] };
  }

  function getHeadingLevel(line: string): number {
    return line.match(/^#+/)?.[0].length || 0;
  }

  function processListItem(line: string): MarkdownNode {
    return createNode('li', line.replace(/^[-*] /, '').trim());
  }

  function processParagraphOrText(line: string): MarkdownNode {
    return createNode('p', line.trim());
  }

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    if (/^#+ /.test(line)) { // Check if line is a heading
      const level = getHeadingLevel(line);
      const headingNode = createNode(`h${level}`, line.replace(/^#+ /, '').trim());
      
      // Remove elements from stack if they are of equal or greater heading level
      while (stack.length > 0 && getHeadingLevel(stack[stack.length - 1].content) >= level) {
        stack.pop();
      }
      
      // If stack is not empty, add heading as a child of last element
      if (level === 1) { // Always push h1 headings to the root level
        root.push(headingNode);
        stack.length = 0; // Reset the stack so new h1 starts fresh
      } else {
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(headingNode);
        } else {
          root.push(headingNode);
        }
      }
      

      stack.push(headingNode); // Push heading to stack to track hierarchy
    } else if (/^[-*] /.test(line)) { // Check if line is a list item
      const listItem = processListItem(line);
      if (stack.length > 0 && stack[stack.length - 1].type === 'ul') {
        // If last element in stack is a list, add item to it
        stack[stack.length - 1].children.push(listItem);
      } else {
        // Otherwise, create a new list and add item
        const listNode = createNode('ul', '');
        listNode.children.push(listItem);
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(listNode);
        } else {
          root.push(listNode);
        }
        stack.push(listNode); // Push new list to stack
      }
    } else { // Process paragraphs and regular text
      const paragraphNode = processParagraphOrText(line);
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(paragraphNode);
      } else {
        root.push(paragraphNode);
      }
    }
  }
  
  return root;

}
