import { chromium } from "playwright";
const b = await chromium.launch({args:["--no-sandbox"]});
const p = await (await b.newContext({viewport:{width:420,height:860}})).newPage();
p.on("pageerror", e => console.log("PAGEERROR:", e.message));
await p.goto("http://localhost:4173", {waitUntil:"networkidle"});
await p.evaluate(()=>localStorage.clear());
await p.goto("http://localhost:4173", {waitUntil:"networkidle"});
await p.waitForSelector("#screen-onboarding .ob-step[data-step='1']");
await p.click("#ob-next"); await p.waitForTimeout(150);
await p.click("#ob-level .ob-opt[data-value='beginner']");
await p.click("#ob-next"); await p.waitForTimeout(150);
await p.click("#ob-start");
await p.waitForSelector("#screen-home:not(.hidden) .scenario-card");
await p.click('#scenario-list .scenario-card');
await p.waitForSelector("#screen-chat:not(.hidden) #chat-log .tutor-row .bubble");
console.log("rows before send:", await p.locator("#chat-log .tutor-row").count());
console.log("chat hidden:", await p.locator("#screen-chat").evaluate(el=>el.classList.contains("hidden")));
await p.fill("#chat-text","I want pierogi, how much cost?");
await p.click("#btn-send");
await p.waitForTimeout(30000);
console.log("rows after send:", await p.locator("#chat-log .tutor-row").count());
for (let i=0;i<await p.locator("#chat-log .tutor-row").count();i++){
  console.log(i, "visible:", await p.locator("#chat-log .tutor-row").nth(i).isVisible());
}
await p.screenshot({path:"/tmp/dbg2.png"});
await b.close();
