import { err } from "./auth";
export type Role="admin"|"manager"|"sales"|"support"|"finance"|string;
const PERMS: Record<string,string[]> = {
  "team.manage":["admin"],
  "settings.manage":["admin","manager"],
  "audit.view":["admin","manager"],
  "finance.write":["admin","manager","finance","sales"],
  "payment.write":["admin","manager","finance"],
  "payment.allocate":["admin","manager","finance"],
  "credit.write":["admin","manager","finance"],
  "expense.approve":["admin","manager","finance"],
  "expense.write":["admin","manager","finance","sales","support"],
  "delete.finance":["admin","manager"],
  "delete.crm":["admin","manager","sales"],
  "vendor.write":["admin","manager","finance","sales"],
};
export function can(role:string, perm:string){ return (PERMS[perm]||[]).includes(role); }
export function forbid(user:{role:string}, perm:string){ return can(user.role,perm)? null : err(`Forbidden: your role (${user.role}) lacks permission ${perm}`,403); }
