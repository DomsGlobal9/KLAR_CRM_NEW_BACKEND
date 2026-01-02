import { supabase, supabaseAdmin } from "../config";

export const StageRepository = {
  // -------------------------
  // Create stage (append or at custom position)
  // -------------------------
  async createStage(payload: {
    name: string;
    description?: string | null;
    is_active?: boolean;
    position?: number | null; // optional explicit position
  }) {
    // use your DB function insert_stage_at_position()
    return supabaseAdmin.rpc("insert_stage_at_position", {
      p_name: payload.name,
      p_description: payload?.description ?? null,
      p_is_active: payload?.is_active ?? true,
      p_position: payload?.position ?? null,
    });
  },

  // -------------------------
  // List all stages ordered by position
  // -------------------------
  async listStages() {
    return supabaseAdmin
      .from("stages")
      .select("*")
      .order("position", { ascending: true });
  },

  // -------------------------
  // Get ordered list with stage_number (your VIEW)
  // -------------------------
  async listStagesWithNumbers() {
    return supabaseAdmin.from("stages_with_numbers").select("*").order("position");
  },

  // -------------------------
  // Get single stage by id
  // -------------------------
  async getStageById(id: string) {
    return supabaseAdmin.from("stages").select("*").eq("id", id).single();
  },

  // -------------------------
  // Update stage fields
  // -------------------------
  async updateStage(id: string, payload: any) {
    return supabaseAdmin
      .from("stages")
      .update({
        name: payload?.name,
        description: payload?.description ?? null,
        is_active: payload?.is_active,
      })
      .eq("id", id)
      .select()
      .single();
  },

  // -------------------------
  // Soft toggle active status
  // -------------------------
  async toggleActive(id: string, is_active: boolean) {
    return supabaseAdmin
      .from("stages")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();
  },

  // -------------------------
  // Delete and reorder positions (your DB function)
  // -------------------------
  async deleteStage(id: string) {
    return supabaseAdmin.rpc("delete_stage_and_reorder", {
      p_stage_id: id,
    });
  },

  // -------------------------
  // Move stage up/down
  // direction: 'up' | 'down'
  // -------------------------
  async moveStage(id: string, direction: "up" | "down") {
    return supabaseAdmin.rpc("move_stage_position", {
      p_stage_id: id,
      p_direction: direction,
    });
  },

  // -------------------------
  // Swap two stages
  // -------------------------
  async swapStages(stageId1: string, stageId2: string) {
    return supabaseAdmin.rpc("swap_stage_positions", {
      p_stage_id_1: stageId1,
      p_stage_id_2: stageId2,
    });
  },

  // -------------------------
  // Increment member count
  // -------------------------
  async incrementMember(stageId: string) {
    return supabaseAdmin.rpc("increment_stage_members", {
      p_stage_id: stageId,
    });
  },

  // -------------------------
  // Decrement member count
  // -------------------------
  async decrementMember(stageId: string) {
    return supabaseAdmin.rpc("decrement_stage_members", {
      p_stage_id: stageId,
    });
  },

  // -------------------------
  // Recalculate all member counts
  // -------------------------
  async recalcMemberCounts() {
    return supabaseAdmin.rpc("recalculate_stage_member_counts");
  },
};
