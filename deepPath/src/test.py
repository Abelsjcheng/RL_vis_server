import numpy as np
import os
import json
from django.conf import settings

a = [{'id': 1, 'name': 123}, {'id': 2, 'name': 1234}, {'id': 3, 'name': 1231}]

# print([i for n, i in enumerate(a) if i not in a[:n]])
dataPath = 'NELL-995'
relation = []
with open(os.path.join('deepPath/' + dataPath + '/relation2id.txt')) as f2:
    relation2id = f2.readlines()
    for line in relation2id:
        relation.append(line.split()[0])


with open('relation.json', 'w', encoding='utf-8') as fObj:
    json.dump(relation, fObj, ensure_ascii=False)
