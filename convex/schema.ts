
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  dirtbikes: defineTable({
    bikeId: v.string(),
    marque_moto: v.string(),
    modele_moto: v.string(),
    annee_moto: v.string(),
    marque_fourche: v.string(),
    modele_fourche: v.string(),
    comp_fourche: v.string(),
    rebond_fourche: v.string(),
    ressort_fourche: v.string(),
    marque_amortisseur: v.string(),
    modele_amortisseur: v.string(),
    comp_hv_amorto: v.string(),
    comp_bv_amorto: v.string(),
    detente_amorto: v.string(),
    ressort_amorto: v.string(),
    sag: v.string(),
    extractedAt: v.string(),
  }).index("by_bikeId", ["bikeId"]),
});
