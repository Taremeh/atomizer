import { retrieveNestedContext } from './retrieveNestedContext.service';
import { supabase } from '../helper/supabaseClient';

// Mock the supabase client so that we can control the behavior of rpc().
jest.mock('../helper/supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('retrieveNestedContext', () => {
  // Sample flat data returned by the RPC function.
  // This flat array represents a tree with:
  // A → [B, C] and B → [D, E]
  const flatData = [
    { id: "A", owner: null, children: [{ id: "B" }, { id: "C" }] },
    { id: "B", owner: null, children: [{ id: "D" }, { id: "E" }] },
    { id: "C", owner: null, children: [] },
    { id: "D", owner: null, children: [] },
    { id: "E", owner: null, children: [] },
  ];

  it('rebuilds the nested JSON structure correctly', async () => {
    // Arrange: Set up the RPC mock to return the flatData.
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: flatData, error: null });

    // Act: Retrieve the nested structure starting at root id "A".
    const result = await retrieveNestedContext('A');

    // Assert: Ensure the RPC was called with the correct parameters.
    expect(supabase.rpc).toHaveBeenCalledWith('get_subtree', { root_id: 'A' });

    // Expected nested structure.
    const expected = {
      id: "A",
      owner: null,
      children: [
        {
          id: "B",
          owner: null,
          children: [
            { id: "D", owner: null, children: [] },
            { id: "E", owner: null, children: [] }
          ]
        },
        {
          id: "C",
          owner: null,
          children: []
        }
      ]
    };

    expect(result).toEqual(expected);
  });

  it('returns null if no data is returned', async () => {
    // Arrange: Simulate a scenario where the RPC returns no data.
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

    // Act: Retrieve the nested context.
    const result = await retrieveNestedContext('A');

    // Assert: The result should be null.
    expect(result).toBeNull();
  });

  it('throws an error when supabase.rpc returns an error', async () => {
    // Arrange: Simulate an error returned by the RPC.
    const testError = { message: 'Test error' };
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: testError });

    // Act & Assert: The function should throw the error.
    await expect(retrieveNestedContext('A')).rejects.toEqual(testError);
  });
});
