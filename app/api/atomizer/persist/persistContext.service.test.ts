// persistContexts.test.ts

import { supabase } from '../helper/supabaseClient';
import { IContext } from '../models/context.model';
import { persistContexts } from './persistContext.service';

// We'll use Jest to create mocks for the chained .from() and .insert() methods.
// First, prepare a mock for supabase.from().
const insertMock = jest.fn();
const fromMock = jest.fn(() => ({
  insert: insertMock,
}));

// Override the supabase.from method with our mock.
jest.mock('../helper/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// In our tests, we can set the implementation of supabase.from.
describe('persistContexts', () => {
  const testContexts: IContext[] = [
    { id: 'A', children: [{ id: 'B' }, { id: 'C' }] },
    { id: 'B', children: [{ id: 'D' }, { id: 'E' }] },
  ];

  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockImplementation(fromMock);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log success when contexts are inserted successfully', async () => {
    // Arrange: Set up the insert mock to resolve with successful data.
    const mockData = [{ id: 'A' }, { id: 'B' }];
    insertMock.mockResolvedValue({ data: mockData, error: null });

    // Act: Call the function to persist contexts.
    await persistContexts(testContexts);

    // Assert:
    expect(supabase.from).toHaveBeenCalledWith('contexts');
    expect(insertMock).toHaveBeenCalledWith(testContexts);
    expect(consoleLogSpy).toHaveBeenCalledWith('Successfully inserted contexts.');
  });

  it('should log an error when insertion fails', async () => {
    // Arrange: Set up the insert mock to simulate an error.
    const mockError = { message: 'Insertion failed' };
    insertMock.mockResolvedValue({ data: null, error: mockError });

    // Act: Call the function to persist contexts.
    await persistContexts(testContexts);

    // Assert:
    expect(supabase.from).toHaveBeenCalledWith('contexts');
    expect(insertMock).toHaveBeenCalledWith(testContexts);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error inserting contexts:', mockError);
  });
});
