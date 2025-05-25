import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8080";

export const useWebSocket = (
  organizationId,
  onServiceUpdate,
  onIncidentCreated,
  onIncidentUpdated
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!organizationId) return;

    // Create socket connection
    socketRef.current = io(WEBSOCKET_URL);

    // Join organization room
    socketRef.current.emit("join-organization", organizationId);

    // Listen for service updates
    socketRef.current.on("service-updated", (service) => {
      console.log("Service updated:", service);
      if (onServiceUpdate) onServiceUpdate(service);
    });

    // Listen for incident created
    socketRef.current.on("incident-created", (incident) => {
      console.log("Incident created:", incident);
      if (onIncidentCreated) onIncidentCreated(incident);
    });

    // Listen for incident updated
    socketRef.current.on("incident-updated", (incident) => {
      console.log("Incident updated:", incident);
      if (onIncidentUpdated) onIncidentUpdated(incident);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [organizationId, onServiceUpdate, onIncidentCreated, onIncidentUpdated]);

  return socketRef.current;
};
