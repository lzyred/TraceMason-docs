from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
root=Path(__file__).resolve().parents[1]
for p in root.glob('*.json'):json.loads(p.read_text())
spec=json.loads((root/'openapi.json').read_text())
ops=[]
def walk(obj):
 if isinstance(obj,dict):
  if '$ref' in obj:
   key=obj['$ref'];assert key.startswith('#/'),key
   value=spec
   for part in key[2:].split('/'):value=value[part]
  for value in obj.values():walk(value)
 elif isinstance(obj,list):
  for value in obj:walk(value)
walk(spec)
for path,methods in spec['paths'].items():
 assert path.startswith('/api/privacy/')
 for method,operation in methods.items():
  ops.append(operation['operationId']);assert operation['responses']
assert len(ops)==len(set(ops))==12
class LinkCheck(HTMLParser):
 def __init__(self,path):super().__init__();self.path=path
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('href','src') and v:
    link=urlsplit(v)
    if link.scheme or not link.path:continue
    assert (self.path.parent/unquote(link.path)).exists(),f'{self.path.name}: missing {v}'
for p in [*root.glob('*.html'),*root.joinpath('prototype').glob('*.html')]:LinkCheck(p).feed(p.read_text())
release=json.loads((root/'release.json').read_text());contract=json.loads((root/'contract.json').read_text())
assert release['navigation']==contract['navigation']==['风险记录','脱敏策略','脱敏验证']
assert release['production_changed'] is False
assert 'gateway.js' not in (root/'prototype/index.html').read_text()
assert not list(root.glob('verification-*'))
accept=json.loads((root/'acceptance.json').read_text());coverage=json.loads((root/'coverage.json').read_text())
assert {x['id']for x in accept['cases']}=={x['id']for x in coverage['items']}
print('PASS: JSON, 12 unique operations, schema references, local HTML links, navigation,11 acceptance mappings, old verification removed from active version.')
