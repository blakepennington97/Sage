import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  // For now, return false (online) - can enhance with actual network detection later
  return { isOffline };
};
