#!/usr/bin/env node
/**
 * Migration: relink dirtbike_sources with dirtbikeId (proper FK) and add sourceType.
 * Run: node migrate-relink.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = "https://adjoining-kookabura-150.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function migrate() {
  let cursor = undefined;
  let totalRelinked = 0;
  let batch = 0;

  while (true) {
    batch++;
    const result = await client.mutation(api.records.relinkSources, { cursor });
    totalRelinked += result.relinked;
    console.log(`Batch ${batch}: relinked ${result.relinked} sources (total: ${totalRelinked})`);

    if (result.isDone) {
      console.log(`\n✅ Migration complete! ${totalRelinked} sources relinked with dirtbikeId.`);
      break;
    }
    cursor = result.continueCursor;
  }
}

migrate().catch(console.error);
