export const JOB_TRANSITIONS = {
  Design: ["Proofing", "Hold"],
  Proofing: ["Production", "Hold"],
  Production: ["Finished", "Hold"],
  Hold: ["Design", "Production"],
  Finished: [], // 🔒 bloqueado
};
