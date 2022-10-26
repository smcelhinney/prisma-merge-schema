import { Command, flags } from "@oclif/command";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import * as glob from "glob";
import * as isGlob from "is-glob";

const fileReducer = (acc: string[], cur: string): string[] => {
  if (isGlob(cur)) {
    acc = [...acc, ...glob.sync(cur).map((item) => resolve(item))];
  } else {
    acc = [...acc, resolve(cur)];
  }
  return acc;
};

const fileWriterReducer = (acc: string, cur: string) =>
  acc + readFileSync(cur, "utf-8");

class PrismaMergeSchema extends Command {
  static description =
    "Merges a prisma datasource schema with a postfix schema";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    datasource: flags.string({ char: "d", required: true, multiple: true }),
    decorators: flags.string({ char: "e", multiple: true }),
    outputFile: flags.string({ char: "o" }),
    // flag with a value (-n, --name=VALUE)
  };

  applyExtensions = (str: string, extendsDecorations: any[] = []) => {
    extendsDecorations.forEach((extension) => {
      const [_, extendsTo, extendsWith] = extension.match(
        /extends ([^ ]* [^ ]*) \{([^}]*)/
      ) as string[];
      const extendsToRegExp = new RegExp(`${extendsTo}[^}]*}`);
      const extendsToNext = str
        .match(extendsToRegExp)![0]
        .replace("}", extendsWith + "}");
      str = str.replace(extendsToRegExp, extendsToNext);
    });

    return str;
  };

  applyRemovals = (str: string, removeDecorations: any[] = []) => {
    removeDecorations.forEach((extension) => {
      let [_, modelToRemoveFrom, itemsToRemove]: any = extension.match(
        /remove ([^ ]* [^ ]*) \{([^}]*)/
      ) as string[];

      itemsToRemove = itemsToRemove
        .split("\n")
        .filter((i: string) => i !== "")
        .map((i: string) => i.trim())
        .filter((i) => i !== "");

      // Find the line inside the appropriate model
      const splitStr: string[] = str.split("\n");

      // Create a trimmed, cloned version of the schema to compare against, and remove items from the
      // array based on this index
      [
        ...splitStr.map((i) => {
          i = i.replace(/^\s+/, "");
          if (!i.startsWith("model") && !i.startsWith("generator") && !i.startsWith("datasource")) {
            i = i.substring(0, i.indexOf(" "));
          }
          return i;
        }),
      ].forEach((line, idx, thisArray) => {
        if (line.trim().startsWith(modelToRemoveFrom)) {
          for (const itemToRemove of itemsToRemove) {
            let lineToRemove: any = thisArray.indexOf(itemToRemove, idx);
            if (lineToRemove > -1) {
              delete splitStr[lineToRemove];
            }
          }
        }
      });

      str = splitStr.filter((item) => item && item !== "").join("\n");
    });

    return str;
  };

  applyReplacements = (str: string, replaceDecorations: any[] = []) => {
    replaceDecorations.forEach((extension) => {
      let [_, modelToReplaceIn, replacements]: any = extension.match(
        /replaces ([^ ]* [^ ]*) \{([^}]*)/
      ) as string[];

      replacements = replacements
        .split("\n")
        .filter((i: string) => i !== "")
        .map((i: string) => {
          const content = i.trim();
          return {
            linePrefix: content.substring(0, content.indexOf(" ")),
            content,
          };
        })
        .filter((i) => i.content !== "");

      // Find the line inside the appropriate model
      const splitStr = str.split("\n");

      const leftTrimmed = [
        ...splitStr.map((i) => {
          i = i.replace(/^\s+/, "");
          if (!i.startsWith("model") && !i.startsWith("generator") && !i.startsWith("datasource")) {
            i = i.substring(0, i.indexOf(" "));
          }
          return i;
        }),
      ];

      // find the index of the model to replace in
      const modelIndex = leftTrimmed.findIndex((line) =>
        line.startsWith(modelToReplaceIn)
      );

      if (modelIndex > -1) {
        for (const replacement of replacements) {
          const lineIndex = leftTrimmed.indexOf(
            replacement.linePrefix,
            modelIndex
          );
          if (lineIndex > -1) {
            splitStr[lineIndex] = replacement.content;
          }
        }
      }
      str = splitStr.join("\n");
    });

    return str;
  };

  prismaSchemaMerge = (schema: string): string => {
    const removeDecorators = schema
      .replace(/extends [^{]*[^}]*\}/gs, "")
      .replace(/replaces [^{]*[^}]*\}/gs, "")
      .replace(/remove [^{]*[^}]*\}/gs, "");

    const extensions = schema.match(/extends [^{]*[^}]*\}/gs) || [];
    const removals = schema.match(/remove [^{]*[^}]*\}/gs) || [];
    const replacements = schema.match(/replaces [^{]*[^}]*\}/gs) || [];

    let merged: any = removeDecorators;

    // FIXME: Conditionally apply these based on flags
    merged = this.applyExtensions(merged, extensions);
    merged = this.applyRemovals(merged, removals);
    merged = this.applyReplacements(merged, replacements);

    return merged;
  };

  async run() {
    const { args, flags } = this.parse(PrismaMergeSchema);
    let decoratorFiles: any = [];
    let decoratorFileAsString: string = "";
    const datasourceFiles = flags.datasource.reduce(fileReducer, []);

    if (!datasourceFiles.length) {
      this.error("No datasource files found");
    }

    if (flags.decorators) {
      decoratorFiles = flags.decorators.reduce(fileReducer, []);
      decoratorFileAsString = decoratorFiles.reduce(fileWriterReducer, "");
    }

    const datasourceFileAsString = datasourceFiles.reduce(
      fileWriterReducer,
      ""
    );

    const outputPath = resolve(flags.outputFile || "./prisma/schema.prisma");
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      this.error(
        `Directory ${outputDir} does not exist. If you don't specify --output-file the CLI defaults to ./prisma/schema.prisma`
      );
    }

    const schemaRaw: any =
      datasourceFileAsString.toString() + decoratorFileAsString.toString();

    const schemaMerged: any =
      "// This file was generated by prisma-merge-schema (https://www.npmjs.com/package/prisma-merge-schema)\n" +
      this.prismaSchemaMerge(schemaRaw);

    writeFileSync(outputPath, schemaMerged, "utf-8");
    this.log(`File ${outputPath} created.`);
  }
}

export = PrismaMergeSchema;
