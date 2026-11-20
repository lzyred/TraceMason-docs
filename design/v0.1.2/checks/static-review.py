from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
root=Path(__file__).resolve().parents[1]
for p in root.glob('*.json'):json.loads(p.read_text())
spec=json.loads((root/'openapi.json').read_text())
def walk(x):
 if isinstance(x,dict):
  if '$ref'in x:
   assert x['$ref'].startswith('#/')
   v=spec
   for k in x['$ref'][2:].split('/'):v=v[k]
  for v in x.values():walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
walk(spec)
ops=[o['operationId']for methods in spec['paths'].values()for o in methods.values()]
assert len(ops)==len(set(ops))==21
class Check(HTMLParser):
 def __init__(self,p):super().__init__();self.p=p
 def handle_starttag(self,t,a):
  for k,v in a:
   if k not in ('href','src')or not v:continue
   u=urlsplit(v)
   if u.scheme or not u.path:continue
   assert (self.p.parent/unquote(u.path)).exists(),str(self.p)+' -> '+v
for p in [*root.glob('*.html'),*root.joinpath('prototype').glob('*.html')]:Check(p).feed(p.read_text())
release=json.loads((root/'release.json').read_text());contract=json.loads((root/'contract.json').read_text())
assert release['revision']==contract['revision']==9
assert release['navigation']==contract['navigation']==['防护工作台','外发记录','防护边界']
assert release['production_changed']is True
assert release['navigation_tree']==contract['navigation_tree']
assert [n['label'] for n in release['navigation_tree']]==['API 接入','隐私外发防护']
assert [n['label'] for n in release['navigation_tree'][1]['children']]==release['navigation']
cases=json.loads((root/'acceptance.json').read_text())['cases'];coverage=json.loads((root/'coverage.json').read_text())['items']
assert {c['id']for c in cases}=={c['id']for c in coverage}
assert len(cases)==17
assert not list(root.glob('verification-*'))
for p in root.rglob('*'):
 if p.suffix in ('.html','.js','.json','.css'):assert '\ufffd'not in p.read_text(),str(p)
print('PASS:21 unique operations, all schema references/local links,17 scenarios, revision9 navigation and explicit production limits.')

report=json.loads((root/"reliability.json").read_text())
assert report["passed"] and report["matrix_passed"]==report["matrix_expected"]==75
assert report["ruleset"]==release["ruleset"]=="local-context-3"
assert release["stage"]==contract["stage"]=="released"
assert spec["components"]["schemas"]["Record"]["properties"]["policy_revision"]["minimum"]==0
print("PASS: reliability evidence and release decision and documented limits agree.")

assert release["release_decision"]["authority"]=="user"
assert release["release_decision"]["known_limitations"]
assert json.loads((root/"verification.json").read_text())["production_verified"] is False
