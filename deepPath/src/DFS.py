from deepPath.src.BFS.KB import KB
import os
from deepPath.src.environment import KGEnvironment
from django.conf import settings


def dfs(sourceEntity, relation, targetEntity, hop):
    dataPath = 'NELL-995'
    taskName = '_'.join(relation.split(':'))
    graph = os.path.join(settings.BASE_DIR, 'deepPath/'+dataPath+'/tasks/'+taskName+'/graph.txt')
    i_episode = sourceEntity + " " + targetEntity + " " + relation
    env = KGEnvironment(dataPath, i_episode)

    kb = KB()
    with open(graph) as f:
        content = f.readlines()
        for line in content:
            ent1, rel, ent2 = line.rsplit()
            kb.addRelation(ent1, rel, ent2)

    paths = []
    relIds = []
    nodeIdS = []
    links = []
    nodes = []

    def linksFilter(n):
        if n["id"] not in relIds:
            relIds.append(n["id"])
            return True
        else:
            return False

    def nodesfilter(n):
        if n["id"] not in nodeIdS:
            nodeIdS.append(n["id"])
            return True
        else:
            return False

    def insertKgData(path):
        es_name = path[0]
        rel_name = path[1]
        nodes.append({'id': env.entity2id_[es_name], 'name': es_name})
        for i in range(2, len(path)):
            if i % 2 == 0:
                et_name = path[i]
                nodes.append({'id': env.entity2id_[et_name], 'name': et_name})
                if not rel_name.endswith('_inv'):
                    links.append({
                        'id': str(env.entity2id_[es_name]) + '-' + str(env.relation2id_[rel_name]) + '-' + str(
                            env.entity2id_[et_name]),
                        'name': rel_name,
                        'rel_id': env.relation2id_[rel_name],
                        'source': env.entity2id_[es_name],
                        'target': env.entity2id_[et_name],
                        'es_name': es_name,
                        'et_name': et_name,
                    })
                else:
                    links.append({
                        'id': str(env.entity2id_[et_name]) + '-' + str(env.relation2id_[rel_name]) + '-' + str(
                            env.entity2id_[es_name]),
                        'name': rel_name,
                        'rel_id': env.relation2id_[rel_name],
                        'source': env.entity2id_[et_name],
                        'target': env.entity2id_[es_name],
                        'es_name': et_name,
                        'et_name': es_name,
                    })
            else:
                rel_name = path[i]
                es_name = et_name

    def findPaths(start, end, relation=None, path=[]):
        path = path.copy()
        if relation:
            path.append(relation)
        path.append(start)
        if start == end:
            paths.append(path)
            insertKgData(path)
            return

        if len(path) < (hop + 1) * 2 - 1:
            for action in kb.getPathsFrom(start):
                nextEntity = action.connected_entity
                connectRelation = action.relation
                if not nextEntity in path:
                    findPaths(nextEntity, end, connectRelation, path)

    findPaths(sourceEntity, targetEntity)

    return paths, {"nodes": list(filter(nodesfilter, nodes)), "links": list(filter(linksFilter, links))}
