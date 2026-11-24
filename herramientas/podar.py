"""Poda el vocabulario de multilingual-e5-small a tokens de escritura latina (es/en/fr/de/pt...).
Unigram elige la segmentación entre piezas del vocabulario: quitar piezas que contienen caracteres no latinos
no cambia cómo se tokeniza un texto latino. Se verifica abajo comparando ids y embeddings."""
import json, unicodedata, copy, numpy as np, onnx
from onnx import numpy_helper
SRC='/home/claude/emb/e5/package/'; DST='/home/claude/emb/podado/'
t=json.load(open(SRC+'tokenizer.json'))
vocab=t['model']['vocab']
def latino(s):
    for ch in s:
        if ch=='▁' or ch.isdigit() or ord(ch)<0x250 or unicodedata.category(ch)[0] in 'PSZ' or 0x1E00<=ord(ch)<=0x1EFF: continue
        return False
    return True
specials={a['id'] for a in t['added_tokens']}
keep=[i for i,(p,_) in enumerate(vocab) if i in specials or i<4 or latino(p)]
nuevo={old:new for new,old in enumerate(keep)}
t2=copy.deepcopy(t)
t2['model']['vocab']=[vocab[i] for i in keep]
t2['model']['unk_id']=nuevo[t['model']['unk_id']]
for a in t2['added_tokens']: a['id']=nuevo[a['id']]
pp=t2['post_processor']
for k,v in pp.get('special_tokens',{}).items(): v['ids']=[nuevo[i] for i in v['ids']]
json.dump(t2,open(DST+'tokenizer.json','w'),ensure_ascii=False,separators=(',',':'))
m=onnx.load(SRC+'model_quantized.onnx')
for init in m.graph.initializer:
    if init.name=='embeddings.word_embeddings.weight_quantized':
        W=numpy_helper.to_array(init); W2=W[keep]
        init.CopyFrom(numpy_helper.from_array(W2,init.name))
onnx.save(m,DST+'e5_small_latino.onnx')
json.dump({'keep':len(keep)},open(DST+'info.json','w'))
print('vocab', len(vocab),'->',len(keep))
