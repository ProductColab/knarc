#!/usr/bin/env bun
/* eslint-disable @typescript-eslint/no-explicit-any */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

interface KnackViewBase {
  _id: string;
  key: string;
  name: string;
  type: string;
  title?: string;
  source?: any;
  results?: any;
  columns?: any[];
  links?: unknown[];
  inputs?: any[];
  groups?: any[];
  totals?: unknown[];
  description?: string;
  hide_empty?: boolean;
  hide_fields?: boolean;
  label_format?: string;
  results_type?: string;
  allow_exporting?: boolean;
  submit_button_text?: string;
  table_design_active?: boolean;
  keyword_search_fields?: string;
  allowed_profiles?: string[];
  limit_profile_access?: boolean;
}

interface KnackScene {
  _id: string;
  key: string;
  name: string;
  slug: string;
  parent?: string;
  views: KnackViewBase[];
  authenticated?: boolean;
  allowed_profiles?: string[];
  modal?: boolean;
  modal_prevent_background_click_close?: boolean;
  icon?: any;
  print?: boolean;
  object?: string;
}

interface KnackApplication {
  id: string;
  name: string;
  slug: string;
  objects: any[];
  scenes: KnackScene[];
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

// Function to get all views from all scenes
function getAllViews(application: KnackApplication): KnackViewBase[] {
  const allViews: KnackViewBase[] = [];

  application.scenes.forEach((scene) => {
    if (scene.views && Array.isArray(scene.views)) {
      scene.views.forEach((view) => {
        // Add scene context to each view for better categorization
        allViews.push({
          ...view,
          _scene_key: scene.key,
          _scene_name: scene.name,
          _scene_slug: scene.slug,
        } as any);
      });
    }
  });

  return allViews;
}

// Function to categorize views by type
function categorizeViews(
  views: KnackViewBase[]
): Record<string, KnackViewBase[]> {
  const categories: Record<string, KnackViewBase[]> = {};

  views.forEach((view) => {
    const viewType = view.type;
    if (!categories[viewType]) {
      categories[viewType] = [];
    }
    categories[viewType].push(view);
  });

  return categories;
}

// Function to write categorized files
function writeCategorizedFiles(
  categories: Record<string, KnackViewBase[]>,
  outputDir: string = "./output"
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

  Object.entries(categories).forEach(([type, views]) => {
    const filename = `${type.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
    const filepath = resolve(outputDir, filename);

    const output = {
      type: type,
      count: views.length,
      views: views,
    };

    try {
      writeFileSync(filepath, JSON.stringify(output, null, 2), "utf-8");
      console.log(`✅ Created ${filename} with ${views.length} views`);
    } catch (error) {
      console.error(`❌ Error writing ${filename}: ${error}`);
    }
  });
}

// Main function
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: bun categorize-views.ts <application.json> [output-directory]

Examples:
  bun categorize-views.ts application.json
  bun categorize-views.ts application.json ./categorized-views
  bun categorize-views.ts data/my-app.json ./output

This script will:
1. Read your Knack application JSON file
2. Extract all views from all scenes
3. Categorize views by their 'type' field
4. Create separate JSON files for each view type (e.g., forms.json, tables.json)
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
    const { application }: { application: KnackApplication } =
      JSON.parse(applicationData);

    console.log(
      `📊 Processing application: ${application.name} (${application.slug})`
    );
    console.log(`📄 Found ${application.scenes.length} scenes`);

    // Extract all views
    const allViews = getAllViews(application);
    console.log(`🔍 Extracted ${allViews.length} total views`);

    // Categorize views by type
    const categories = categorizeViews(allViews);
    const viewTypes = Object.keys(categories);

    console.log(`📂 Found ${viewTypes.length} different view types:`);
    viewTypes.forEach((type) => {
      console.log(`   - ${type}: ${categories[type].length} views`);
    });

    // Write categorized files
    console.log(`\n💾 Writing categorized files to ${outputDir}:`);
    writeCategorizedFiles(categories, outputDir);

    // Summary
    console.log(
      `\n✨ Successfully categorized ${allViews.length} views into ${viewTypes.length} files!`
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
