from deepPath.src.environment import KGEnvironment
import numpy as np


def cosine_similarity(x, y, norm=False):
    """ 计算两个向量x和y的余弦相似度 """

    assert len(x) == len(y), "len(x) != len(y)"
    zero_list = [0] * len(x)

    if x == zero_list or y == zero_list:
        return float(1) if x == y else float(0)

    # method 1
    res = np.array([[x[i] * y[i], x[i] * x[i], y[i] * y[i]] for i in range(len(x))])
    cos = sum(res[:, 0]) / (np.sqrt(sum(res[:, 1])) * np.sqrt(sum(res[:, 2])))

    return 0.5 * cos + 0.5 if norm else cos  # 归一化到[0, 1]区间内


def get_similar_entities(sourceEntity):
    dataPath = 'NELL-995'
    env = KGEnvironment(dataPath)
    entity_id = env.entity2id_[sourceEntity]
    entity_vec = env.entity2vec[entity_id, :]
    cos_score = []
    for entity, entity_id_ in env.entity2id_.items():
        tmp_entity_vec = env.entity2vec[entity_id_, :]
        cos_similarity = cosine_similarity(entity_vec.tolist(), tmp_entity_vec.tolist())
        cos_score.append({"entityName": entity, "similarity": round(cos_similarity, 2)})

    cos_score_sort = sorted(cos_score, key=lambda x: x["similarity"], reverse=True)
    return cos_score_sort[1:51]

