import { flattenJsonToAtoms, MarkdownAtom } from './json2atoms.service'; // adjust the path accordingly

// The MarkdownNode interface should be available for constructing test data.
interface MarkdownNode {
  id: string;
  type: string;
  content: string;
  children: MarkdownNode[];
}

describe('flattenJsonToAtoms', () => {
  it('should return an empty array when input is empty', () => {
    const input: MarkdownNode[] = [];
    const result = flattenJsonToAtoms(input);
    expect(result).toEqual([]);
  });

  it('should flatten a single node with no children', () => {
    const input: MarkdownNode[] = [
      {
        id: '1',
        type: 'p',
        content: 'Only node',
        children: []
      }
    ];
    const result = flattenJsonToAtoms(input);
    const expected: MarkdownAtom[] = [
      { id: '1', type: 'p', content: 'Only node' }
    ];
    expect(result).toEqual(expected);
  });

  it('should flatten a tree with one level of nesting', () => {
    // Tree structure:
    // A
    // ├─ B
    // └─ C
    const input: MarkdownNode[] = [
      {
        id: 'A',
        type: 'h1',
        content: 'Heading A',
        children: [
          {
            id: 'B',
            type: 'p',
            content: 'Paragraph B',
            children: []
          },
          {
            id: 'C',
            type: 'p',
            content: 'Paragraph C',
            children: []
          }
        ]
      }
    ];

    // The expected flattened order is: [A, B, C]
    const expected: MarkdownAtom[] = [
      { id: 'A', type: 'h1', content: 'Heading A' },
      { id: 'B', type: 'p', content: 'Paragraph B' },
      { id: 'C', type: 'p', content: 'Paragraph C' }
    ];

    expect(flattenJsonToAtoms(input)).toEqual(expected);
  });

  it('should flatten a tree with multiple levels of nesting', () => {
    // Tree structure:
    // A
    // ├─ B
    // │   ├─ D
    // │   └─ E
    // └─ C
    const input: MarkdownNode[] = [
      {
        id: 'A',
        type: 'h1',
        content: 'Heading A',
        children: [
          {
            id: 'B',
            type: 'h2',
            content: 'Heading B',
            children: [
              {
                id: 'D',
                type: 'p',
                content: 'Paragraph D',
                children: []
              },
              {
                id: 'E',
                type: 'p',
                content: 'Paragraph E',
                children: []
              }
            ]
          },
          {
            id: 'C',
            type: 'h2',
            content: 'Heading C',
            children: []
          }
        ]
      }
    ];

    // Expected flattening order (pre-order traversal): [A, B, D, E, C]
    const expected: MarkdownAtom[] = [
      { id: 'A', type: 'h1', content: 'Heading A' },
      { id: 'B', type: 'h2', content: 'Heading B' },
      { id: 'D', type: 'p', content: 'Paragraph D' },
      { id: 'E', type: 'p', content: 'Paragraph E' },
      { id: 'C', type: 'h2', content: 'Heading C' }
    ];

    expect(flattenJsonToAtoms(input)).toEqual(expected);
  });

  it('should flatten a complex tree correctly', () => {
    // Construct a more complex tree with mixed levels:
    // Root1
    // ├─ Child1
    // │   └─ Grandchild1
    // └─ Child2
    // Root2 (no children)
    const input: MarkdownNode[] = [
      {
        id: 'Root1',
        type: 'h1',
        content: 'Root Heading 1',
        children: [
          {
            id: 'Child1',
            type: 'h2',
            content: 'Child Heading 1',
            children: [
              {
                id: 'Grandchild1',
                type: 'p',
                content: 'Grandchild Paragraph 1',
                children: []
              }
            ]
          },
          {
            id: 'Child2',
            type: 'h2',
            content: 'Child Heading 2',
            children: []
          }
        ]
      },
      {
        id: 'Root2',
        type: 'h1',
        content: 'Root Heading 2',
        children: []
      }
    ];

    // Expected pre-order flattening: [Root1, Child1, Grandchild1, Child2, Root2]
    const expected: MarkdownAtom[] = [
      { id: 'Root1', type: 'h1', content: 'Root Heading 1' },
      { id: 'Child1', type: 'h2', content: 'Child Heading 1' },
      { id: 'Grandchild1', type: 'p', content: 'Grandchild Paragraph 1' },
      { id: 'Child2', type: 'h2', content: 'Child Heading 2' },
      { id: 'Root2', type: 'h1', content: 'Root Heading 2' }
    ];

    expect(flattenJsonToAtoms(input)).toEqual(expected);
  });
});
