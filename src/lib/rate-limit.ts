const hits=new Map<string,{count:number,reset:number}>();
export function rateLimit(key:string, max=10, windowMs=15*60*1000){ const now=Date.now(); const h=hits.get(key); if(!h||now>h.reset){ hits.set(key,{count:1,reset:now+windowMs}); return true; } if(h.count>=max) return false; h.count++; return true; }
