import { Schema, Document } from "mongoose";
import { getDB } from "../config/mongodbDatabase.config";

export enum DestinationType {
  DOMESTIC = "Domestic Travel",
  INTERNATIONAL = "International Travel",
}

export enum PortalSource {
  B2B = "B2B",
  B2C = "B2C",
}

export interface ITourQueryDocument extends Document {
  destinationType: DestinationType;
  fullName: string;
  contactNumber: string;
  email: string;
  destinationName: string;
  travelDate: Date;
  numberOfTravellers: number;
  specialRequirements?: string;
  source: PortalSource;
  createdAt?: Date;
  updatedAt?: Date;
}

const tourQuerySchema = new Schema<ITourQueryDocument>(
  {
    destinationType: {
      type: String,
      enum: Object.values(DestinationType),
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    destinationName: {
      type: String,
      required: true,
      trim: true,
    },
    travelDate: {
      type: Date,
      required: true,
    },
    numberOfTravellers: {
      type: Number,
      required: true,
      min: 1,
    },
    specialRequirements: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      enum: Object.values(PortalSource),
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Dynamic Model Getter targeting:
 * Connection: "b2b"
 * Database: "tour-package-service"
 * Collection: "tour_package_service"
 */
export const TourQueryModel = () => {
  const conn = getDB("b2b");
  const tourDb = conn.useDb("tour-package-service");
  return tourDb.model<ITourQueryDocument>(
    "TourQuery",
    tourQuerySchema,
    "tour_package_service"
  );
};