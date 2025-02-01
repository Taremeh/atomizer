import { reduceJsonToContext } from './json2context.service';

// You may also need to import the MarkdownNode interface if you want type checking in your tests.
// import { MarkdownNode } from './reduceJsonToContext';

describe('reduceJsonToContext', () => {
  it('should return an empty array when given an empty input', () => {
    const input: any[] = [];
    expect(reduceJsonToContext(input)).toEqual([]);
  });

  it('should filter out a node with no children', () => {
    const input = [
      {
        id: '1',
        type: 'h1',
        content: 'Only node',
        children: []
      }
    ];
    // The only node has an empty children array and should be filtered out.
    expect(reduceJsonToContext(input)).toEqual([]);
  });

  it('should flatten a single node with one child', () => {
    const input = [
      {
        id: 'A',
        type: 'h1',
        content: 'Heading A',
        children: [
          {
            id: 'B',
            type: 'h2',
            content: 'Heading B',
            children: []
          }
        ]
      }
    ];

    // Expected: Only the parent "A" is returned because its child "B" is filtered out (empty children).
    const expected = [
      {
        id: 'A',
        children: [{ id: 'B' }]
      }
    ];

    expect(reduceJsonToContext(input)).toEqual(expected);
  });

  it('should correctly flatten and filter a nested MarkdownNode tree', () => {
    const input = [
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

    // Traversal produces:
    // - "A" with children [{ id: "B" }, { id: "C" }]
    // - "B" with children [{ id: "D" }, { id: "E" }]
    // "C", "D", and "E" have empty children and will be filtered out.
    const expected = [
      {
        id: 'A',
        children: [{ id: 'B' }, { id: 'C' }]
      },
      {
        id: 'B',
        children: [{ id: 'D' }, { id: 'E' }]
      }
    ];

    expect(reduceJsonToContext(input)).toEqual(expected);
  });

  it('should not include the "onwer" property even if present in the input', () => {
    // Even if a node had an "onwer" property, the function doesn't transfer it.
    const input = [
      {
        id: 'A',
        type: 'h1',
        content: 'Heading A',
        children: [
          {
            id: 'B',
            type: 'h2',
            content: 'Heading B',
            // Including an extra property "onwer" here for testing
            onwer: 'someone',
            children: []
          }
        ]
      }
    ];

    const result = reduceJsonToContext(input);
    // Check that none of the flattened nodes have an "onwer" property.
    result.forEach((node:any) => {
      expect((node as any).onwer).toBeUndefined();
    });
  });
});
