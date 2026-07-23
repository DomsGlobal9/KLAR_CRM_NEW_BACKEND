import * as tourRepo from "../repositories/tour.repository";

export const getTourQueriesByPortal = async (
  portalType: "B2B" | "B2C",
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const { queries, totalCount } = await tourRepo.findTourQueriesBySource(
    portalType,
    skip,
    limit
  );

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    queries,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      rowsPerPage: limit,
    },
  };
};

export const getSingleTourQueryDetails = async (
  id: string,
  portalType: "B2B" | "B2C"
) => {
  // Validate if valid 24-char ObjectId string
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error("Invalid ObjectId format");
  }

  const queryDetails = await tourRepo.findTourQueryByIdAndSource(
    id,
    portalType
  );

  if (!queryDetails) {
    throw new Error(
      `Tour query not found for ${portalType} portal with ID: ${id}`
    );
  }

  return queryDetails;
};