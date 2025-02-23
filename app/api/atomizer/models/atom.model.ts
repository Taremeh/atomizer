// New interface representing a single flattened node ("atom").
// It includes all properties of a MarkdownNode except for the children.
export interface IAtom {
  id: string;
  type: string;
  content: string;
  embedding?: number[];
  created_at?: string;
}