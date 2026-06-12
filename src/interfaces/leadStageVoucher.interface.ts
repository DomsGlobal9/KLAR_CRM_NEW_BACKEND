export interface IServiceConfiguration {
  serviceId: string;
  serviceName: string;
  configurations: Record<string, any>;
  configuredAt: string;
}

export interface CreateLeadStageVoucherPayload {
  leadId: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  serviceConfigurations: IServiceConfiguration[];
  createdAt: string;
}