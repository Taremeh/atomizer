/**
 * Converts a politician object into a Markdown formatted string.
 * The markdown will have a top-level unordered list item with the full name (firstname and lastname),
 * and a nested list with the remaining key-value pairs.
 *
 * @param politician - The politician object.
 * @returns A markdown formatted string.
 */
export function convertPoliticianToMarkdown(politician: Record<string, any>): string {
    // Destructure to separate firstname and lastname from the rest of the properties.
    const { firstname, lastname, ...otherProps } = politician;
  
    // Start with the top-level list item for the full name.
    let markdown = `- ${firstname} ${lastname}\n`;
  
    // Add a nested list item for each remaining property.
    for (const [key, value] of Object.entries(otherProps)) {
      // If the value is null or undefined, display "null".
      const displayValue = value === null || value === undefined ? 'null' : value;
      markdown += `  - ${key}: ${displayValue}\n`;
    }
  
    return markdown;
  }
  