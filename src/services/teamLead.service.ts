import { teamLeadRepository } from '../repositories/teamLead.repository';

export const teamLeadService = {
    /**
     *  Get all RMs under a specific TL
     */
    async getRMsUnderTL(tlId: string) {
        if (!tlId) {
            throw new Error("Team Lead ID is required");
        }
        return await teamLeadRepository.findRMsByTL(tlId);
    }
};