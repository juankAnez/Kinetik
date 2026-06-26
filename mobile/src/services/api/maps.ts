import API from "./client";
import type { GeoPoint } from "../../types/models";

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

export interface AddressDetail {
  road: string;
  neighbourhood: string;
  suburb: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}

export interface ReverseGeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  address: AddressDetail;
}

export interface RouteStep {
  instruction: string;
  distance_km: number;
  duration_min: number;
}

export interface RouteLeg {
  distance_km: number;
  duration_min: number;
  summary: string;
  steps: RouteStep[];
}

export interface RouteResult {
  distance_km: number;
  duration_min: number;
  polyline: Record<string, unknown>;
  legs: RouteLeg[];
}

export const MapsAPI = {
  async geocode(query: string, limit = 5): Promise<GeocodeResult[]> {
    const { data } = await API.get<{ results: GeocodeResult[] }>("/maps/geocode/", {
      params: { q: query, limit },
    });
    return data.results ?? [];
  },

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const { data } = await API.get<ReverseGeocodeResult>("/maps/reverse-geocode/", {
        params: { lat, lng },
      });
      return data;
    } catch {
      return null;
    }
  },

  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoint?: { lat: number; lng: number },
  ): Promise<RouteResult | null> {
    try {
      const params: Record<string, number> = {
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
      };
      if (waypoint) {
        params.waypoint_lat = waypoint.lat;
        params.waypoint_lng = waypoint.lng;
      }
      const { data } = await API.get<RouteResult>("/maps/directions/", { params });
      return data;
    } catch {
      return null;
    }
  },
};
