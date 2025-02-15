// General interface for Markdown nodes before conversion to atoms/contexts.
export interface INode {
  id: string;
  type: string;
  content: string;
  children: INode[];
}