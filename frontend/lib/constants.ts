export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x6937F70036E499f56E819eb25658514D7d62C2F6") as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://dream-rpc.somnia.network/";
export const NETWORK_ID = parseInt(process.env.NEXT_PUBLIC_NETWORK_ID ?? "50312", 10);
export const THEME_COLORS = {
  background: "#0D0D0F",
  surface: "#16161A",
  mint: "#00FFC6",
  gold: "#FFD369",
  textPrimary: "#EDEDED",
  textMuted: "#A0A0A0"
};
