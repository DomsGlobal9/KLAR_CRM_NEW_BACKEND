import { TourQueryModel } from "../models/tour.model";

export const findTourQueriesBySource = async (
  source: string,
  skip: number,
  limit: number
) => {
  const model = TourQueryModel();
  const filter = { source };

  const [queries, totalCount] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);

  return { queries, totalCount };
};

export const findTourQueryByIdAndSource = async (
  id: string,
  source: string
) => {
  const model = TourQueryModel();
  return await model.findOne({ _id: id, source }).lean();
};