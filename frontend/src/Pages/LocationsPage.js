import React, { useState } from "react";
import { Map, Marker, Overlay } from "pigeon-maps";
import { MapPinHouse } from "lucide-react";
const LocationsPage = () => {
  const [center, setCenter] = useState([50.879, 4.6997]);
  const [zoom, setZoom] = useState(11);
  const [hue, setHue] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const color = `hsl(${hue % 360}deg 39% 70%)`;

  const locations = [
    { id: 1, name: "Tumkur", coords: [13.33451, 77.12022] },
    { id: 2, name: "Gubbi", coords: [13.30547, 76.93903] },
    { id: 3, name: "Kunigal", coords: [13.01195, 77.0283] },
    { id: 4, name: "Sira", coords: [13.74142, 76.90058] },
  ];
  return (
    <>
      <div className="max-w-3xl mx-auto text-center px-4 pb-12 pt-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Discover Your Perfect Neighborhood
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          From bustling downtown districts to peaceful suburban communities,
          explore our featured locations and find the perfect place to call
          home.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-gray-200">
        <Map height={500} defaultCenter={[13.33451, 77.12022]} defaultZoom={9}>
          {locations.map((location, index) => (
            <Marker
              key={location.id}
              width={50}
              anchor={location.coords}
              color={color}
              onClick={() => {
                setHue(hue + 20);
              }}
              onMouseOver={() => {
                setSelectedMarker(true);
                setSelectedLocation(location.name);
                setSelectedMarker(
                  selectedMarker?.id === location.id ? null : location
                );
              }}
              onMouseOut={() => {
                setSelectedMarker(false);
              }}
            />
          ))}
          {selectedMarker && (
            <Overlay anchor={selectedMarker.coords} offset={[50, 0]}>
              <div className="bg-white text-black font-semibold p-2 rounded shadow-md text-sm border-4 border-blue-500">
                {selectedMarker.name}
              </div>
            </Overlay>
          )}
        </Map>
      </div>
    </>
  );
};

export default LocationsPage;
