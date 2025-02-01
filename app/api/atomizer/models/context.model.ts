// Context Interface
export interface IContext {
  id: string;
  onwer?: string;
  children: { id: string }[];
}