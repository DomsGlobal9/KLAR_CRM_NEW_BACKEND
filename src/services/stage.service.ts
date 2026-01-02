import { StageRepository } from "../repositories/stage.repository";

export const StageService = {
  async createStage(payload: any) {
    return StageRepository.createStage(payload);
  },

  async getStages() {
    return StageRepository.listStagesWithNumbers();
  },

  async deleteStage(id: string) {
    return StageRepository.deleteStage(id);
  }
};

