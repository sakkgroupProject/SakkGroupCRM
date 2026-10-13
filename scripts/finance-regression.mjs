// Live API finance regression — run against a disposable local server DB.
// Usage: BASE=http://127.0.0.1:3000 node scripts/finance-regression.mjs
const BASE = process.env.BASE || "http://127.0.0.1:3000";
let cookie = "";
async function req(path, opts={}){ const r=await fetch(BASE+path,{...opts,headers:{"Content-Type":"application/json",cookie,...(opts.headers||{})}}); const set=r.headers.get("set-cookie"); if(set) cookie=set.split(";")[0]; const j=await r.json().catch(()=>({})); return {status:r.status, j}; }
function assert(c,m){ if(!c){ console.error("FAIL:",m); process.exitCode=1; throw new Error(m);} console.log("PASS:",m); }
const email=`fin-${Date.now()}@test.local`;
// NOTE: if DB already has users, this account will be 'sales' and payment.write will 403.
// For a clean disposable DB it is admin. Script detects and reports that precondition.
let r=await req("/api/auth/register",{method:"POST",body:JSON.stringify({name:"Finance Tester",email,password:"Test@1234"})});
assert(r.status===201&&r.j.success,"register tester");
if(r.j.data.role!=="admin"){ console.log("SKIP finance allocation: tester is not admin (DB not empty). Run on disposable DB."); process.exit(0); }
r=await req("/api/companies",{method:"POST",body:JSON.stringify({name:"Alloc Test Co",status:"active"})}); const comp=r.j.data.id; assert(comp,"company created");
r=await req("/api/invoices",{method:"POST",body:JSON.stringify({title:"Invoice A",amount:100000,quantity:1,taxRate:0,companyId:comp,status:"sent",currency:"INR"})}); const A=r.j.data.id; assert(A,"invoice A 100000");
r=await req("/api/invoices",{method:"POST",body:JSON.stringify({title:"Invoice B",amount:50000,quantity:1,taxRate:0,companyId:comp,status:"sent",currency:"INR"})}); const B=r.j.data.id; assert(B,"invoice B 50000");
r=await req("/api/payments",{method:"POST",body:JSON.stringify({amount:120000,currency:"INR",method:"bank",companyId:comp})}); const pay=r.j.data.id; assert(pay,"receipt 120000 recorded");
r=await req(`/api/payments/${pay}/allocate`,{method:"POST",body:JSON.stringify({invoiceId:A,amount:100000})}); assert(r.status===200,"allocate 100000 -> A"); assert(Number(r.j.data.invoiceBalance.outstanding)===0,"A outstanding = 0");
r=await req(`/api/payments/${pay}/allocate`,{method:"POST",body:JSON.stringify({invoiceId:B,amount:20000})}); assert(r.status===200,"allocate 20000 -> B"); assert(Number(r.j.data.invoiceBalance.outstanding)===30000,"B outstanding = 30000");
r=await req("/api/payments"); const mine=r.j.data.items.find(p=>p.id===pay); assert(Number(mine.unallocated)===0,"receipt unallocated = 0");
r=await req(`/api/payments/${pay}/allocate`,{method:"POST",body:JSON.stringify({invoiceId:B,amount:1})}); assert(r.status===400,"over-allocation beyond receipt rejected");
r=await req("/api/payments",{method:"POST",body:JSON.stringify({amount:99999,currency:"INR",allocations:[{invoiceId:B,amount:40000}]})}); assert(r.status===400,"allocation exceeding invoice outstanding rejected at payment creation");
r=await req("/api/credit-notes",{method:"POST",body:JSON.stringify({invoiceId:B,amount:5000,reason:"test credit"})}); assert(r.status===201&&Number(r.j.data.newOutstanding)===25000,"credit note: B outstanding 30000 -> 25000");
r=await req(`/api/invoices/${A}`); assert(r.j.data.derivedStatus==="paid","A derived status paid");
console.log("FINANCE REGRESSION: ALL PASS");
