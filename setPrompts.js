import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const setPrompts = async (__dirname) => {
  let prompts = {};
  const promptOptions = [];
  const promptsPath = path.join(__dirname, "prompts");
  const promptsFiles = fs.readdirSync(promptsPath).filter(file => file.endsWith(".js"));

  console.log(`Started refreshing ${promptsFiles.length} prompts...`);
  for (const file of promptsFiles) {
    const filePath = path.join(promptsPath, file);
    const prompt = await import(pathToFileURL(filePath).href);

    if ("id" in prompt.default && "name" in prompt.default && "prompt" in prompt.default) {
      prompts = {
        ...prompts,
        [prompt.default.id]: {...prompt.default}
      };
      promptOptions.push({ name: prompt.default.name, value: prompt.default.id });
    }
  }
  global.prompts = prompts;
  global.promptOptions = promptOptions;
  console.log(`\u001b[1;32mSuccessfully reloaded ${promptOptions.length} prompts.\u001b[0m`);
};

export default setPrompts;