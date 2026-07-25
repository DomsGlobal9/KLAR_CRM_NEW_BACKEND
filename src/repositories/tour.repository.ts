import { TourQueryModel, PortalSource } from "../models/tour.model";

export const findTourQueriesBySource = async (
  source: PortalSource | string,
  skip: number,
  limit: number
) => {
  const model = TourQueryModel();
  const filter = { source: source as PortalSource };

  const [queries, totalCount] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);

  return { queries, totalCount };
};

export const findTourQueryByIdAndSource = async (
  id: string,
  source: PortalSource | string
) => {
  const model = TourQueryModel();
  const filter = { _id: id, source: source as PortalSource };
  
  return await model.findOne(filter as any).lean();
};