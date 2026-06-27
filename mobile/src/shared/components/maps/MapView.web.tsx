import React from "react";

interface MapViewProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  onPress?: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
}

const MapView: React.FC<MapViewProps> & {
  Marker: React.FC<{ coordinate: { latitude: number; longitude: number }; title?: string; description?: string }>;
  Polyline: React.FC<{ coordinates: { latitude: number; longitude: number }[]; strokeWidth?: number; strokeColor?: string }>;
  Callout: React.FC<{ children?: React.ReactNode }>;
} = ({ children, style }) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        fontSize: 14,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <div>Mapa no disponible en web</div>
      </div>
      {children}
    </div>
  );
};

const Marker: React.FC<{ coordinate: { latitude: number; longitude: number }; title?: string; description?: string }> = () => null;
const Polyline: React.FC<{ coordinates: { latitude: number; longitude: number }[]; strokeWidth?: number; strokeColor?: string }> = () => null;
const Callout: React.FC<{ children?: React.ReactNode }> = () => null;

MapView.Marker = Marker;
MapView.Polyline = Polyline;
MapView.Callout = Callout;

export default MapView;
export { Marker, Polyline, Callout };
