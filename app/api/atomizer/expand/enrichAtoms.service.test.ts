import { enrichAtoms } from './enrichAtoms.service';
import { supabase } from '../helper/supabaseClient';

// Mock the supabase client so that we can control the behavior of the query chain.
jest.mock('../helper/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('enrichAtoms', () => {
  // Sample nested context structure without type and content.
  const nestedContext = {
    id: 'A',
    children: [
      {
        id: 'B',
        children: [
          { id: 'C', children: [] },
        ],
      },
      {
        id: 'D',
        children: [],
      },
    ],
  };

  // Sample atoms data returned from the "atoms" table.
  const atomsData = [
    { id: 'A', type: 'h1', content: 'Heading A' },
    { id: 'B', type: 'h2', content: 'Heading B' },
    { id: 'C', type: 'p', content: 'Paragraph C' },
    { id: 'D', type: 'h2', content: 'Heading D' },
  ];

  // Create chainable mocks for supabase.from(...).select(...).in(...)
  const inMock = jest.fn();
  const selectMock = jest.fn().mockReturnValue({
    in: inMock,
  });
  const fromMock = jest.fn().mockReturnValue({
    select: selectMock,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Override the supabase.from with our chainable mock.
    (supabase.from as jest.Mock).mockImplementation(fromMock);
  });

  it('enriches the nested context structure with type and content from atoms', async () => {
    // Arrange: simulate a successful query that returns atomsData.
    inMock.mockResolvedValue({ data: atomsData, error: null });

    // Act: Call enrichAtoms to enrich the nested context.
    const result = await enrichAtoms(nestedContext);

    // Assert: Verify that the query chain was called with the expected parameters.
    expect(supabase.from).toHaveBeenCalledWith('atoms');
    expect(selectMock).toHaveBeenCalledWith('id, type, content');
    expect(inMock).toHaveBeenCalledWith('id', expect.arrayContaining(['A', 'B', 'C', 'D']));

    // Expected enriched nested structure.
    const expected = {
      id: 'A',
      type: 'h1',
      content: 'Heading A',
      children: [
        {
          id: 'B',
          type: 'h2',
          content: 'Heading B',
          children: [
            { id: 'C', type: 'p', content: 'Paragraph C', children: [] },
          ],
        },
        {
          id: 'D',
          type: 'h2',
          content: 'Heading D',
          children: [],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it('throws an error when the supabase query returns an error', async () => {
    // Arrange: simulate an error response from the supabase query.
    const testError = { message: 'Test query error' };
    inMock.mockResolvedValue({ data: null, error: testError });

    // Act & Assert: enrichAtoms should throw the error.
    await expect(enrichAtoms(nestedContext)).rejects.toEqual(testError);
  });
});
