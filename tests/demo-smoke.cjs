// Dependency-free smoke tests for the static TraceMason interactive demo.
// Runs in the GitHub Actions Node 24 runner; does not require a browser or network.
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const script = fs.readFileSync("docs/demo/demo.js", "utf8");
new vm.Script(script, {filename:"docs/demo/demo.js"}); // Parse before evaluation.

const elements = new Map();
const handlers = Object.create(null);
function getElement(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id, innerHTML:"", textContent:"", value:id==="policy-input" ? "api_key=sk-demo-12345678" : "",
      style:{width:""}, classList:{add(){},remove(){},toggle(){},contains(){return false;}},
      setAttribute(){},removeAttribute(){},addEventListener(){},focus(){}
    });
  }
  return elements.get(id);
}
const document = {
  getElementById:getElement,
  querySelectorAll(){return [];},
  querySelector(){return {addEventListener(){},focus(){}};},
  addEventListener(type,callback){handlers[type]=callback;}
};
const context={
  document,
  navigator:{},
  window:{scrollTo(){},clearTimeout(){},setTimeout(){return 1;}},
  setTimeout(){return 1;},
  clearTimeout(){}
};
vm.runInNewContext(script,context,{filename:"docs/demo/demo.js",timeout:3000});
const main=getElement("view");

function click(attribute,value) {
  handlers.click({target:{closest(selector){
    if(selector==="["+attribute+"]")return {getAttribute(){return value;}};
    return null;
  }}});
}
function goto(page) {click("data-page",page);}
function action(id) {click("data-action",id);}
function contains(fragment) {assert.ok(main.innerHTML.includes(fragment),"Page missing expected content: "+fragment);}

contains("EVIDENCE-DRIVEN");
goto("audit");
contains("evt-101");
contains("evt-103");
click("data-trace","evt-103");
assert.ok(getElement("audit-inspector").innerHTML.includes("SEC-01"),"Inspector should show policy evidence");

goto("quality");
contains("Task outcomes");
contains("Unknown");

goto("experience");
contains("Verified Code Delivery");
action("approveExperience");
contains("已通过模拟审核");

goto("skills");
contains("Draft");
action("evaluate");
contains("Tested");
contains("12 / 15");
action("approveSkill");
contains("Approved");
action("canary");
contains("Canary");
action("promote");
contains("Active");
action("rollback");
contains("Rolled back");

goto("policies");
contains("Input policy playground");
action("scanPolicy");
contains("Simulated BLOCK");
contains("REDACTED");

goto("integrations");
contains("Gateway adapter");
contains("Fixture only");

action("reset");action("confirmReset");
contains("EVIDENCE-DRIVEN");
console.log("TraceMason demo smoke tests passed: pages, inspection, Skill lifecycle, policy redaction, reset.");
