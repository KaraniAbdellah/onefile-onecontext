export interface ContextResult {
  context: string;
  prompt_suggestion: string;
}

export default function getFullContext(final_prompt: string, user_prompt: string): ContextResult {
  console.log("final_Prompt: ", final_prompt);
  console.log("user_prompt: ", user_prompt);

  const promptLower = user_prompt.toLowerCase().trim();

  // If no files or prompt is empty, return helpful demo context matching requirements
  if (!final_prompt || !final_prompt.includes("======== FILES ========")) {
    return {
      context: "Source: sample_document.pdf\n[Match 1 - Overview]\nNo files uploaded or prompt is empty. Please upload files and enter a prompt to filter context.",
      prompt_suggestion: "Extract core project architecture and setup instructions"
    };
  }

  // Extract sections/files from final_prompt
  // final_prompt format: '======== FILES ========\n*** path ***\ncontent\n\n'
  const fileSections = final_prompt.split('*** ').filter(Boolean);
  const matchedSnippets: string[] = [];

  const keywords = promptLower.split(/\s+/).filter(w => w.length > 2);

  let matchIndex = 1;
  for (const section of fileSections) {
    const lines = section.split('\n');
    const filePath = lines[0].replace(' ***', '').trim();
    const fileContent = lines.slice(1).join('\n');

    // Search paragraphs or lines for keywords
    const paragraphs = fileContent.split(/\n\s*\n/);
    for (const para of paragraphs) {
      const paraLower = para.toLowerCase();
      const isMatch = keywords.length === 0 || keywords.some(kw => paraLower.includes(kw));
      if (isMatch && para.trim().length > 0) {
        const snippetTitle = keywords.length > 0 ? keywords[0].toUpperCase() : "RELEVANT SECTION";
        matchedSnippets.push(
          `Source: ${filePath}\n[Match ${matchIndex} - ${snippetTitle}]\n${para.trim().slice(0, 400)}`
        );
        matchIndex++;
        if (matchedSnippets.length >= 4) break;
      }
    }
    if (matchedSnippets.length >= 4) break;
  }

  if (matchedSnippets.length === 0) {
    matchedSnippets.push(
      `Source: uploaded_files\n[Match 1 - General Context]\n${final_prompt.slice(0, 600)}`
    );
  }

  const contextText = matchedSnippets.join("\n\n");

  // Generate prompt suggestion
  let suggestion = "Extract key functions and implementation details";
  if (promptLower.includes("computer vision") || promptLower.includes("yolo") || promptLower.includes("detection")) {
    suggestion = "Extract detection metrics and YOLO model configuration details";
  } else if (promptLower.includes("test") || promptLower.includes("api")) {
    suggestion = "Extract API endpoints and test coverage reports";
  } else if (promptLower.length > 0) {
    suggestion = `Refine prompt to focus on: ${user_prompt} and key dependencies`;
  }

  return {
    context: contextText,
    prompt_suggestion: suggestion
  };
}
