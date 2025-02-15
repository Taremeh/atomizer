// Context Interface
export interface IContext {
  id: string;
  owner?: string;
  children: { id: string }[];
}