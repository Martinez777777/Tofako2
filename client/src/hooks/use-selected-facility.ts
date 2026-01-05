import { useState, useEffect } from "react";

export function useSelectedFacility() {
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedFacility");
    if (stored) {
      setSelectedFacility(stored);
    }
  }, []);

  const saveFacility = (facility: string) => {
    localStorage.setItem("selectedFacility", facility);
    setSelectedFacility(facility);
  };

  const clearFacility = () => {
    localStorage.removeItem("selectedFacility");
    setSelectedFacility(null);
  };

  return { selectedFacility, saveFacility, clearFacility };
}
