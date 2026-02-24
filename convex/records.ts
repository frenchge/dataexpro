
// Use the generated server helper for mutation to ensure type safety and correct export
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a unique bikeId from brand + model + year to prevent duplicates
function generateBikeId(record: any): string {
  const brand = String(record.marque_moto || "").trim().toLowerCase();
  const model = String(record.modele_moto || "").trim().toLowerCase();
  const year = String(record.annee_moto || "").trim();
  return `${brand}-${model}-${year}`.replace(/\s+/g, "_");
}

export const saveRecords = mutation({
  args: {
    records: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const record of args.records) {
      const bikeId = generateBikeId(record);
      const sourceContent = String(record.source || "");

      const data = {
        bikeId,
        marque_moto: String(record.marque_moto || ""),
        modele_moto: String(record.modele_moto || ""),
        annee_moto: String(record.annee_moto || ""),
        marque_fourche: String(record.marque_fourche || ""),
        modele_fourche: String(record.modele_fourche || ""),
        comp_fourche: String(record.comp_fourche || ""),
        rebond_fourche: String(record.rebond_fourche || ""),
        ressort_fourche: String(record.ressort_fourche || ""),
        marque_amortisseur: String(record.marque_amortisseur || ""),
        modele_amortisseur: String(record.modele_amortisseur || ""),
        comp_hv_amorto: String(record.comp_hv_amorto || ""),
        comp_bv_amorto: String(record.comp_bv_amorto || ""),
        detente_amorto: String(record.detente_amorto || ""),
        ressort_amorto: String(record.ressort_amorto || ""),
        sag: String(record.sag || ""),
        extractedAt: new Date().toISOString(),
      };

      // Check if this bike already exists
      const existing = await ctx.db
        .query("dirtbikes")
        .withIndex("by_bikeId", (q) => q.eq("bikeId", bikeId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, data);
        updated++;
      } else {
        await ctx.db.insert("dirtbikes", data);
        inserted++;
      }

      // Store source in separate table (upsert)
      if (sourceContent) {
        const existingSource = await ctx.db
          .query("dirtbike_sources")
          .withIndex("by_bikeId", (q) => q.eq("bikeId", bikeId))
          .first();
        if (existingSource) {
          await ctx.db.patch(existingSource._id, { source: sourceContent });
        } else {
          await ctx.db.insert("dirtbike_sources", { bikeId, source: sourceContent });
        }
      }
    }

    return { success: true, inserted, updated };
  },
});

// Query dirtbikes with pagination (20 per page, no source field)
export const getPaginatedRecords = query({
  args: { paginationOpts: v.any() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("dirtbikes")
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map(({ source, ...rest }) => rest),
    };
  },
});

// Get source content for a single record (for re-extraction)
export const getRecordSource = query({
  args: { id: v.id("dirtbikes") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return null;
    // Check new dirtbike_sources table first
    const sourceDoc = await ctx.db
      .query("dirtbike_sources")
      .withIndex("by_bikeId", (q) => q.eq("bikeId", record.bikeId))
      .first();
    if (sourceDoc) return { source: sourceDoc.source };
    // Fallback to legacy source field on dirtbikes table
    return { source: record.source ?? "" };
  },
});

// Update a single record field
export const updateRecord = mutation({
  args: {
    id: v.id("dirtbikes"),
    field: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { [args.field]: args.value });
    return { success: true };
  },
});

// One-time migration: move source data using pagination
export const migrateSourceData = mutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.query("dirtbikes").paginate({
      cursor: args.cursor ?? null,
      numItems: 5,
    });
    let migrated = 0;
    for (const record of result.page) {
      if (record.source && record.source.length > 0) {
        const existing = await ctx.db
          .query("dirtbike_sources")
          .withIndex("by_bikeId", (q) => q.eq("bikeId", record.bikeId))
          .first();
        if (!existing) {
          await ctx.db.insert("dirtbike_sources", {
            bikeId: record.bikeId,
            source: record.source,
          });
        }
        await ctx.db.patch(record._id, { source: "" });
        migrated++;
      }
    }
    return {
      success: true,
      migrated,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// Delete a record (and its source)
export const deleteRecord = mutation({
  args: {
    id: v.id("dirtbikes"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (record) {
      // Delete associated source
      const sourceDoc = await ctx.db
        .query("dirtbike_sources")
        .withIndex("by_bikeId", (q) => q.eq("bikeId", record.bikeId))
        .first();
      if (sourceDoc) await ctx.db.delete(sourceDoc._id);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Patch a record with multiple fields (used for re-extraction)
export const patchRecord = mutation({
  args: {
    id: v.id("dirtbikes"),
    fields: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.fields);
    return { success: true };
  },
});
