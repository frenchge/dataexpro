
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
        source: String(record.source || ""),
        extractedAt: new Date().toISOString(),
      };

      // Check if this bike already exists
      const existing = await ctx.db
        .query("dirtbikes")
        .withIndex("by_bikeId", (q) => q.eq("bikeId", bikeId))
        .first();

      if (existing) {
        // Update existing record with latest data
        await ctx.db.patch(existing._id, data);
        updated++;
      } else {
        // Insert new record
        await ctx.db.insert("dirtbikes", data);
        inserted++;
      }
    }

    return { success: true, inserted, updated };
  },
});

// Query all dirtbikes from the database
export const getAllRecords = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dirtbikes").order("desc").collect();
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

// Delete a record
export const deleteRecord = mutation({
  args: {
    id: v.id("dirtbikes"),
  },
  handler: async (ctx, args) => {
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
