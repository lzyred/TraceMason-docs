"use strict";
/* A dependency-free smoke test for the cinematic homepage.
 * Checks HTML structure and executes the Canvas lifecycle with a minimal fake DOM.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const html = fs.readFileSync(path.join("docs","index.md"),"utf8");
const css = fs.readFileSync(path.join("docs","stylesheets","landing.css"),"utf8");
const source = fs.readFileSync(path.join("docs","javascripts","landing.js"),"utf8");
const mkdocs = fs.readFileSync("mkdocs.yml","utf8");

assert.match(html, /<canvas id="tm-scene"/);
assert.match(html, /id="tm-motion-toggle"/);
assert.match(html, /id="tm-copy-command"/);
assert.match(html, /href="runnable-demo\//);
assert.match(html, /href="00-product\/vision\//);
assert.match(html, /runnable local prototype|local Python service/i);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /@media\s*\(max-width:\s*600px\)/);
assert.match(mkdocs, /stylesheets\/landing\.css/);
assert.match(mkdocs, /javascripts\/landing\.js/);
new vm.Script(source, {filename:"landing.js"});

function noop() {}
const methods = [
  "setTransform","clearRect","save","restore","beginPath","arc","fill",
  "stroke","moveTo","lineTo","fillRect","translate","rotate","ellipse","clip",
  "setLineDash"
];
let draws = 0;
let gradients = 0;
const ctx = {createRadialGradient(){gradients++;return {addColorStop:noop};},
             createLinearGradient(){gradients++;return {addColorStop:noop};}};
methods.forEach(k => ctx[k] = function(){if(k==="stroke") draws++;});
const callbacks = {};
const buttonAttrs = {};
const motionLabel = {textContent:""};
const motionIcon = {textContent:""};
const motionButton = {
  dataset:{}, disabled:false, attrs:buttonAttrs,
  setAttribute(key,value){buttonAttrs[key]=value;},
  querySelector(which){return which===".tm-motion-label"?motionLabel:which===".tm-motion-icon"?motionIcon:null;},
  addEventListener(type,cb){callbacks["button:"+type]=cb;},
  removeEventListener:noop
};
const canvas = {
  width:0,height:0,getContext(which){assert.equal(which,"2d");return ctx;}
};
const section = {
  getBoundingClientRect(){return {width:1400,height:800,left:0,top:0};},
  querySelector(which){
    if(which==="#tm-scene")return canvas;
    if(which==="#tm-motion-toggle")return motionButton;
    return null;
  },
  addEventListener(type,cb){callbacks["section:"+type]=cb;},
  removeEventListener:noop
};
const copyButton = {
  dataset:{},
  addEventListener(type,cb){callbacks["copy:"+type]=cb;},
  set textContent(value){this.text=value;},
  get textContent(){return this.text;}
};
const pre = {};
const root = {querySelector(which){
  if(which==="#tm-copy-command")return copyButton;
  if(which===".tm-terminal-code")return pre;
  return null;
}};
let present = true;
let hidden = false;
const doc = {
  readyState:"complete",
  get hidden(){return hidden;},
  querySelector(which){
    if(!present)return null;
    if(which===".tm-landing .tm-universe")return section;
    if(which===".tm-landing")return root;
    return null;
  },
  addEventListener(type,cb){callbacks["document:"+type]=cb;},
  removeEventListener:noop
};
let rafNext = 1;
const frameFns = new Map();
let cancelled = 0;
const media = {
  matches:false,
  addEventListener(type,cb){callbacks["media:"+type]=cb;},
  removeEventListener:noop
};
const windowMock = {
  devicePixelRatio:2,
  matchMedia(query){assert.match(query,/prefers-reduced-motion/);return media;},
  requestAnimationFrame(cb){const id=rafNext++;frameFns.set(id,cb);return id;},
  cancelAnimationFrame(id){cancelled++;frameFns.delete(id);},
  addEventListener:noop, removeEventListener:noop,
  setTimeout:noop
};
let docsSubscription = null;
const context = {
  window:windowMock,
  document:doc,
  document$:{subscribe(fn){docsSubscription=fn;}},
  performance:{now(){return 1000;}},
  navigator:{clipboard:{writeText(text){
    assert.match(text,/python3 prototype\/tracemason\.py/);
    return Promise.resolve();
  }}}
};
vm.runInNewContext(source,context,{filename:"landing.js",timeout:5000});
assert.ok(canvas.width>=1400 && canvas.height>=800,"Canvas dimensions must initialize");
assert.ok(draws>65,"Wireframe lines and signal paths should actually be painted");
assert.ok(gradients>10,"Scene should render core glow and gradient signal beams");
assert.equal(typeof callbacks["button:click"],"function");
assert.equal(buttonAttrs["aria-pressed"],"false");

callbacks["button:click"]();
assert.equal(buttonAttrs["aria-pressed"],"true","Pause button changes state");
assert.ok(cancelled>=1,"Pause cancels animation frames");
assert.match(motionLabel.textContent,/RESUME/);
callbacks["button:click"]();
assert.equal(buttonAttrs["aria-pressed"],"false","Resume button changes state");

media.matches = true;
callbacks["media:change"]();
assert.equal(motionButton.disabled,true,"System reduced motion disables animation control");
assert.equal(buttonAttrs["aria-pressed"],"true");
assert.match(motionLabel.textContent,/REDUCED/);

assert.equal(typeof callbacks["copy:click"],"function");
callbacks["copy:click"]();

present = false;
docsSubscription();
assert.ok(cancelled>=1,"Instant navigation disposes old scene");

console.log("Cinematic landing smoke passed: HTML, assets, rendering, motion, copy, lifecycle.");
