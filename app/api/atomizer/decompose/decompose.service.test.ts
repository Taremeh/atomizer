import { parseMarkdown } from "./decompose.service";

describe("Markdown to JSON Parser", () => {
  test("parses a single H1 heading", () => {
    const markdown = "# Heading 1";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      { id: expect.any(String), type: "h1", content: "Heading 1", children: [] },
    ]);
  });

  test("parses a single H2 heading", () => {
    const markdown = "## Heading 2";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      { id: expect.any(String), type: "h2", content: "Heading 2", children: [] },
    ]);
  });

  test("parses paragraphs correctly", () => {
    const markdown = "This is a paragraph.";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      { id: expect.any(String), type: "p", content: "This is a paragraph.", children: [] },
    ]);
  });

  test("parses lists correctly", () => {
    const markdown = "- Item 1\n- Item 2";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      {
        id: expect.any(String),
        type: "ul",
        content: "",
        children: [
          { id: expect.any(String), type: "li", content: "Item 1", children: [] },
          { id: expect.any(String), type: "li", content: "Item 2", children: [] },
        ],
      },
    ]);
  });

  test("parses nested headings correctly", () => {
    const markdown = "# Heading 1\n## Heading 2\nSome text";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      {
        id: expect.any(String),
        type: "h1",
        content: "Heading 1",
        children: [
          {
            id: expect.any(String),
            type: "h2",
            content: "Heading 2",
            children: [
              {
                id: expect.any(String),
                type: "p",
                content: "Some text",
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("parses multiple top-level headings", () => {
    const markdown = "# Heading 1\nSome text\n# Heading 2\nMore text";
    const result = parseMarkdown(markdown);
    expect(result).toEqual([
      {
        id: expect.any(String),
        type: "h1",
        content: "Heading 1",
        children: [
          { id: expect.any(String), type: "p", content: "Some text", children: [] },
        ],
      },
      {
        id: expect.any(String),
        type: "h1",
        content: "Heading 2",
        children: [
          { id: expect.any(String), type: "p", content: "More text", children: [] },
        ],
      },
    ]);
  });
});
