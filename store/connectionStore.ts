// import { create } from "zustand";
// import {
//   ConnectionStatus,
//   subscribeConnection,
//   getConnectionStatus,
// } from "../services/socket";

// interface ConnectionState {
//   status: ConnectionStatus;
//   latency: number | null;
//   setConnection: (
//     status: ConnectionStatus,
//     latency: number | null,
//   ) => void;
// }

// export const useConnectionStore = create<ConnectionState>((set) => {
//   const current = getConnectionStatus();

//   subscribeConnection((status, latency) => {
//     set({
//       status,
//       latency,
//     });
//   });

//   return {
//     status: current.status,
//     latency: current.latency,

//     setConnection: (status, latency) => {
//       set({
//         status,
//         latency,
//       });
//     },
//   };
// });