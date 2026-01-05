import { supabase } from '../utils/supabase.client';
import { 
  IStage, 
  ICreateStage, 
  IUpdateStage, 
  IStageFilters,
  IPipelineData 
} from '../interfaces/stage.interface';

export class StageRepository {
  private tableName = 'pipeline_stages';

  async create(stageData: ICreateStage): Promise<IStage> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...stageData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as IStage;
  }

  async findById(id: string): Promise<IStage | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as IStage;
  }

  async findAll(filters: IStageFilters = {}): Promise<IStage[]> {
    let query = supabase.from(this.tableName).select('*');
    
    // Search by name
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    // Filter by created_by
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    
    // Sorting
    if (filters.sort_by) {
      query = query.order(filters.sort_by, { 
        ascending: filters.order === 'asc' || filters.order === undefined 
      });
    } else {
      query = query.order('position', { ascending: true });
    }
    
    // Pagination
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as IStage[];
  }

  async update(id: string, stageData: IUpdateStage): Promise<IStage> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...stageData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IStage;
  }

  async delete(id: string): Promise<boolean> {
    // First, check if stage has any leads
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('stage', id)
      .limit(1);

    if (leadsError) throw leadsError;
    
    if (leadsData && leadsData.length > 0) {
      throw new Error(`Cannot delete stage with ${leadsData.length} leads. Move leads to another stage first.`);
    }

    // Delete the stage
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getPipelineStats(userId?: string): Promise<IPipelineData> {
    // Get all stages
    const stages = await this.findAll({ created_by: userId });
    const pipelineData: IPipelineData = {};
    
    // For each stage, get lead count and total value
    for (const stage of stages) {
      let query = supabase
        .from('leads')
        .select('budget', { count: 'exact', head: false })
        .eq('stage', stage.id);
      
      if (userId) {
        query = query.eq('assigned_to', userId);
      }
      
      const { data: leads, count, error } = await query;
      
      if (error) throw error;
      
      const totalValue = leads?.reduce((sum, lead) => sum + (lead.budget || 0), 0) || 0;
      
      pipelineData[stage.id] = {
        count: count || 0,
        total_value: totalValue
      };
    }
    
    return pipelineData;
  }

  async count(filters: IStageFilters = {}): Promise<number> {
    let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true });
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  }

  async getDefaultStages(): Promise<IStage[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_default', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return data as IStage[];
  }
}