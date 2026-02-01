import { supabaseAdmin } from '../config';
import {
  Stage,
  CreateStagePayload,
  UpdateStagePayload,
  StageFilter,
  PipelineStage
} from '../interfaces/stage.interface';

export const stageRepository = {
  /**
   * Create a new stage
   */
  async createStage(payload: CreateStagePayload, userId?: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .insert({
        name: payload.name,
        color: payload.color,
        position: payload.position || await this.getNextPosition(),
        is_default: payload.is_default || false,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create stage: ${error.message}`);
    }

    return data as Stage;
  },

  /**
   * Get all stages
   */
  async getAllStages(filter: StageFilter = {}): Promise<any[]> {
    let query = supabaseAdmin
      .from('stages')
      .select('*')
      .order('position', { ascending: true });

    // Apply filters
    if (filter.search) {
      query = query.ilike('name', `%${filter.search}%`);
    }

    if (filter.is_default !== undefined) {
      query = query.eq('is_default', filter.is_default);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch stages: ${error.message}`);
    }

    return data;
  },

  /**
   * Get stage by ID
   */
  async getStageById(id: string): Promise<Stage | null> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch stage: ${error.message}`);
    }

    return data as Stage;
  },

  /**
   * Get stage name by stage ID
   */
  async getStageNameById(id: string): Promise<string | null> {

    console.time(`getStageNameById- ${id}`);

    const { data, error } = await supabaseAdmin
      .from('stages')
      .select('name')
      .eq('id', id)
      .single();

    console.timeEnd(`getStageNameById- ${id}`);

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Stage name query error for ${id}:`, error.message);
      return null;
    }

    return data?.name || null;
  },

  /**
   * Get minimal stage info
   */
  async getStageBasicInfo(id: string): Promise<{ id: string, name: string } | null> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .select('id, name')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      return null;
    }

    return data;
  },


  /**
   * Update stage
   */
  async updateStage(id: string, payload: UpdateStagePayload): Promise<Stage> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update stage: ${error.message}`);
    }

    return data as Stage;
  },

  /**
   * Delete stage
   */
  async deleteStage(id: string): Promise<boolean> {

    const { data: dealsData } = await supabaseAdmin
      .from('deals')
      .select('id')
      .eq('stage_id', id)
      .limit(1);

    if (dealsData && dealsData.length > 0) {
      throw new Error('Cannot delete stage with active deals');
    }

    const { error } = await supabaseAdmin
      .from('stages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete stage: ${error.message}`);
    }

    return true;
  },

  /**
   * Get next available position
   */
  async getNextPosition(): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 1;
    }

    return data.position + 1;
  },

  /**
   * Reorder stages
   */
  async reorderStages(stages: Array<{ id: string; position: number }>): Promise<Stage[]> {

    const updates = stages.map(stage =>
      supabaseAdmin
        .from('stages')
        .update({ position: stage.position })
        .eq('id', stage.id)
        .select()
        .single()
    );

    const results = await Promise.all(updates);

    // Check for errors
    results.forEach((result, index) => {
      if (result.error) {
        throw new Error(`Failed to update stage ${stages[index].id}: ${result.error.message}`);
      }
    });

    // Return updated stages
    return results.map(result => result.data as Stage);
  },

  /**
   * Get pipeline stages with deal counts
   */
  async getPipelineStages(): Promise<PipelineStage[]> {

    const { data: stages, error: stagesError } = await supabaseAdmin
      .from('stages')
      .select('*')
      .order('position', { ascending: true });

    if (stagesError) {
      throw new Error(`Failed to fetch stages: ${stagesError.message}`);
    }

    // Get deal counts for each stage
    const pipelineStages: PipelineStage[] = [];

    for (const stage of stages) {
      const { data: deals, error: dealsError } = await supabaseAdmin
        .from('deals')
        .select('value')
        .eq('stage_id', stage.id);

      if (dealsError) {
        console.error(`Failed to fetch deals for stage ${stage.id}:`, dealsError.message);
        continue;
      }

      const totalValue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      pipelineStages.push({
        ...stage,
        deal_count: deals?.length || 0,
        total_value: totalValue
      });
    }

    return pipelineStages;
  },

  /**
   * Get default stages
   */
  async getDefaultStages(): Promise<Stage[]> {
    const { data, error } = await supabaseAdmin
      .from('stages')
      .select('*')
      .eq('is_default', true)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch default stages: ${error.message}`);
    }

    return data as Stage[];
  },

  /**
   * Check if stage name already exists
   */
  async stageNameExists(name: string, excludeId?: string): Promise<boolean> {
    let query = supabaseAdmin
      .from('stages')
      .select('id')
      .ilike('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(`Failed to check stage name: ${error.message}`);
    }

    return data && data.length > 0;
  },
};