import numpy as np
import os
import json
from django.conf import settings

path = [[1,2],[3,4]]
embeddings = [rel for rel in path]
embeddings = np.reshape(embeddings, (-1, 2))
path_encoding = np.sum(embeddings, axis=0)
print(embeddings)
print(path_encoding)