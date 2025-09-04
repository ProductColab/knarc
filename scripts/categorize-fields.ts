#!/usr/bin/env bun
/* eslint-disable @typescript-eslint/no-explicit-any */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

interface KnackFieldRule {
  [key: string]: unknown;
}

interface KnackField {
  key: string;
  name: string;
  description?: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  user?: boolean;
  conditional?: boolean;
  rules?: KnackFieldRule[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    type?: string;
  };
  format?: {
    [key: string]: unknown;
  };
}

interface KnackInflections {
  [key: string]: unknown;
}

interface KnackObjectConnections {
  [key: string]: unknown;
}

interface KnackObjectSort {
  [key: string]: unknown;
}

interface KnackObject {
  _id: string;
  key: string;
  name: string;
  type: string;
  fields: KnackField[];
  inflections: KnackInflections;
  connections: KnackObjectConnections;
  identifier: string;
  schemaChangeInProgress: boolean;
  sort?: KnackObjectSort;
  [key: string]: unknown;
}

interface KnackApplication {
  id: string;
  name: string;
  slug: string;
  objects: KnackObject[];
  scenes: any[];
  home_scene: {
    key: string;
    slug: string;
  };
  account: {
    slug: string;
    name: string;
  };
  logo_url: string;
  [key: string]: unknown;
}

// Function to get all fields from all objects
function getAllFields(
  application: KnackApplication
): (KnackField & { _object_key: string; _object_name: string })[] {
  const allFields: (KnackField & {
    _object_key: string;
    _object_name: string;
  })[] = [];

  application.objects.forEach((object) => {
    if (object.fields && Array.isArray(object.fields)) {
      object.fields.forEach((field) => {
        // Add object context to each field for better categorization
        allFields.push({
          ...field,
          _object_key: object.key,
          _object_name: object.name,
        });
      });
    }
  });

  return allFields;
}

// Function to categorize fields by type
function categorizeFields(
  fields: (KnackField & { _object_key: string; _object_name: string })[]
): Record<
  string,
  (KnackField & { _object_key: string; _object_name: string })[]
> {
  const categories: Record<
    string,
    (KnackField & { _object_key: string; _object_name: string })[]
  > = {};

  fields.forEach((field) => {
    const fieldType = field.type;
    if (!categories[fieldType]) {
      categories[fieldType] = [];
    }
    categories[fieldType].push(field);
  });

  return categories;
}

// Function to categorize objects by type
function categorizeObjects(
  objects: KnackObject[]
): Record<string, KnackObject[]> {
  const categories: Record<string, KnackObject[]> = {};

  objects.forEach((object) => {
    const objectType = object.type;
    if (!categories[objectType]) {
      categories[objectType] = [];
    }
    categories[objectType].push(object);
  });

  return categories;
}

// Function to write categorized files
function writeCategorizedFiles(
  fieldCategories: Record<
    string,
    (KnackField & { _object_key: string; _object_name: string })[]
  >,
  objectCategories: Record<string, KnackObject[]>,
  outputDir: string = "./output/fields/by-type"
): void {
  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      process.exit(1);
    }
  }

  // Write field categories
  Object.entries(fieldCategories).forEach(([type, fields]) => {
    const filename = `fields_${type
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")}.json`;
    const filepath = resolve(outputDir, filename);

    const output = {
      type: type,
      category: "field",
      count: fields.length,
      fields: fields,
    };

    try {
      writeFileSync(filepath, JSON.stringify(output, null, 2), "utf-8");
      console.log(`✅ Created ${filename} with ${fields.length} fields`);
    } catch (error) {
      console.error(`❌ Error writing ${filename}: ${error}`);
    }
  });

  // Write object categories
  Object.entries(objectCategories).forEach(([type, objects]) => {
    const filename = `objects_${type
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")}.json`;
    const filepath = resolve(outputDir, filename);

    const output = {
      type: type,
      category: "object",
      count: objects.length,
      objects: objects,
    };

    try {
      writeFileSync(filepath, JSON.stringify(output, null, 2), "utf-8");
      console.log(`✅ Created ${filename} with ${objects.length} objects`);
    } catch (error) {
      console.error(`❌ Error writing ${filename}: ${error}`);
    }
  });

  // Write summary file
  const summaryFilepath = resolve(outputDir, "summary.json");
  const summary = {
    field_types: Object.keys(fieldCategories).map((type) => ({
      type,
      count: fieldCategories[type].length,
    })),
    object_types: Object.keys(objectCategories).map((type) => ({
      type,
      count: objectCategories[type].length,
    })),
    totals: {
      field_types: Object.keys(fieldCategories).length,
      object_types: Object.keys(objectCategories).length,
      total_fields: Object.values(fieldCategories).flat().length,
      total_objects: Object.values(objectCategories).flat().length,
    },
  };

  try {
    writeFileSync(summaryFilepath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`✅ Created summary.json`);
  } catch (error) {
    console.error(`❌ Error writing summary.json: ${error}`);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: bun categorize-fields.ts <application.json> [output-directory]

Examples:
  bun categorize-fields.ts schema.json
  bun categorize-fields.ts schema.json ./categorized-objects
  bun categorize-fields.ts data/my-app.json ./output

This script will:
1. Read your Knack application JSON file
2. Extract all fields from all objects
3. Categorize fields by their 'type' field (e.g., text, number, date, etc.)
4. Categorize objects by their 'type' field
5. Create separate JSON files for each field type and object type
6. Generate a summary file with counts and statistics
`);
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1] || "./output";

  // Check if input file exists
  if (!existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    // Read and parse the application JSON
    console.log(`📖 Reading ${inputFile}...`);
    const applicationData = readFileSync(inputFile, "utf-8");
    const jsonData = JSON.parse(applicationData);

    const application: KnackApplication = jsonData.application || jsonData;

    console.log(
      `📊 Processing application: ${application.name} (${application.slug})`
    );
    console.log(`📦 Found ${application.objects.length} objects`);

    // Extract all fields
    const allFields = getAllFields(application);
    console.log(`🔍 Extracted ${allFields.length} total fields`);

    // Categorize fields by type
    const fieldCategories = categorizeFields(allFields);
    const fieldTypes = Object.keys(fieldCategories);

    console.log(`📂 Found ${fieldTypes.length} different field types:`);
    fieldTypes.forEach((type) => {
      console.log(`   - ${type}: ${fieldCategories[type].length} fields`);
    });

    // Categorize objects by type
    const objectCategories = categorizeObjects(application.objects);
    const objectTypes = Object.keys(objectCategories);

    console.log(`📦 Found ${objectTypes.length} different object types:`);
    objectTypes.forEach((type) => {
      console.log(`   - ${type}: ${objectCategories[type].length} objects`);
    });

    // Write categorized files
    console.log(`\n💾 Writing categorized files to ${outputDir}:`);
    writeCategorizedFiles(fieldCategories, objectCategories, outputDir);

    // Summary
    console.log(`\n✨ Successfully categorized:`);
    console.log(
      `   - ${allFields.length} fields into ${fieldTypes.length} field type files`
    );
    console.log(
      `   - ${application.objects.length} objects into ${objectTypes.length} object type files`
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON in ${inputFile}: ${error.message}`);
    } else {
      console.error(`❌ Error processing file: ${error}`);
    }
    process.exit(1);
  }
}

// Run the script
main();
