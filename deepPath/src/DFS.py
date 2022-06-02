from deepPath.src.BFS.KB import KB, Path
import os
from collections import deque
from django.conf import settings


def dfs(sourceEntity, relation, targetEntity, hop):
    dataPath = 'NELL-995'
    taskName = '_'.join(relation.split(':'))
    graph = os.path.join(settings.BASE_DIR, 'deepPath/'+dataPath+'/tasks/'+taskName+'/graph.txt')
    kb = KB()
    with open(graph) as f:
        content = f.readlines()
        for line in content:
            ent1, rel, ent2 = line.rsplit()
            kb.addRelation(ent1, rel, ent2)

    entity2id_ = {}
    relation2id_ = {}
    with open(os.path.join(settings.BASE_DIR, 'deepPath/' + dataPath + '/entity2id.txt')) as f1:
        entity2id = f1.readlines()
        for line in entity2id:
            entity2id_[line.split()[0]] = int(line.split()[1])
    with open(os.path.join(settings.BASE_DIR, 'deepPath/' + dataPath + '/relation2id.txt')) as f2:
        relation2id = f2.readlines()
        for line in relation2id:
            relation2id_[line.split()[0]] = int(line.split()[1])

    paths = []
    links = []
    nodes = []

    def datafilter(data):
        return [i for n, i in enumerate(data) if i not in data[:n]]

    def insertKgData(path):
        action = path[0]
        es_name = action.connected_entity
        nodes.append({'id': entity2id_[es_name], 'name': es_name})
        for i in range(1, len(path)):
            action = path[i]
            et_name = action.connected_entity
            rel_name = action.relation
            nodes.append({'id': entity2id_[et_name], 'name': et_name})
            links.append({
                'id': str(entity2id_[es_name]) + '-' + str(relation2id_[rel_name]) + '-' + str(
                    entity2id_[et_name]),
                'name': rel_name,
                'rel_id': relation2id_[rel_name],
                'source': entity2id_[es_name],
                'target': entity2id_[et_name],
                'es_name': es_name,
                'et_name': et_name,
                'path_order': i
            })
            # if not rel_name.endswith('_inv'):
            #     links.append({
            #         'id': str(entity2id_[es_name]) + '-' + str(relation2id_[rel_name]) + '-' + str(
            #             entity2id_[et_name]),
            #         'name': rel_name,
            #         'rel_id': relation2id_[rel_name],
            #         'source': entity2id_[es_name],
            #         'target': entity2id_[et_name],
            #         'es_name': es_name,
            #         'et_name': et_name,
            #     })
            # else:
            #     links.append({
            #         'id': str(entity2id_[et_name]) + '-' + str(relation2id_[rel_name]) + '-' + str(
            #             entity2id_[es_name]),
            #         'name': rel_name,
            #         'rel_id': relation2id_[rel_name],
            #         'source': entity2id_[et_name],
            #         'target': entity2id_[es_name],
            #         'es_name': et_name,
            #         'et_name': es_name,
            #     })
            es_name = et_name

    def builddualstack(path, mainStack, neighborStack, visited):
        if path.connected_entity:
            mainStack.append(path)  # 将主节点入栈
            visited[path.connected_entity] = True  # 标记已被访问过
            # 获取 entity 的邻接节点
            neighbors = [action for action in kb.getPathsFrom(path.connected_entity) if
                         not visited.get(action.connected_entity)]
            neighborStack.append(neighbors)

    def cutdowndualstack(mainStack, neighborStack, visited):
        # // 将目标元素从 mainStack 中弹出，
        droppedMain = mainStack.pop()
        # 同时标记当前节点可以再次访问
        if droppedMain.connected_entity:
            visited[droppedMain.connected_entity] = False
        # 同时一并将 neighborStack 弹出元素
        neighborStack.pop()

    def findallpath(start, end):
        visited = {}
        mainStack = deque()
        neighborStack = deque()
        initPath = Path(None, start)
        builddualstack(initPath, mainStack, neighborStack, visited)
        while mainStack:
            curNeighbors = neighborStack.pop()
            if curNeighbors:
                nextPath = curNeighbors.pop(0)
                neighborStack.append(curNeighbors)
                if nextPath and len(mainStack) < hop + 1:
                    builddualstack(nextPath, mainStack, neighborStack, visited)
            else:
                neighborStack.append(curNeighbors)
                cutdowndualstack(mainStack, neighborStack, visited)
                continue
            peekNode = mainStack[-1].connected_entity
            if peekNode == end:
                insertKgData(mainStack)
                paths.append(mainStack)
                cutdowndualstack(mainStack, neighborStack, visited)

    findallpath(sourceEntity, targetEntity)

    return paths, {"nodes": datafilter(nodes), "links": datafilter(links)}


# def dfs(sourceEntity, relation, targetEntity, hop):
#     dataPath = 'NELL-995'
#     taskName = '_'.join(relation.split(':'))
#     graph = os.path.join(settings.BASE_DIR, 'deepPath/'+dataPath+'/tasks/'+taskName+'/graph.txt')
#     i_episode = sourceEntity + " " + targetEntity + " " + relation
#     env = KGEnvironment(dataPath, i_episode)
#
#     kb = KB()
#     with open(graph) as f:
#         content = f.readlines()
#         for line in content:
#             ent1, rel, ent2 = line.rsplit()
#             kb.addRelation(ent1, rel, ent2)
#
#     paths = []
#     links = []
#     nodes = []
#
#     def datafilter(data):
#         return [i for n, i in enumerate(data) if i not in data[:n]]
#
#     def insertKgData(path):
#         es_name = path[0]
#         rel_name = path[1]
#         nodes.append({'id': env.entity2id_[es_name], 'name': es_name})
#         for i in range(2, len(path)):
#             if i % 2 == 0:
#                 et_name = path[i]
#                 nodes.append({'id': env.entity2id_[et_name], 'name': et_name})
#                 if not rel_name.endswith('_inv'):
#                     links.append({
#                         'id': str(env.entity2id_[es_name]) + '-' + str(env.relation2id_[rel_name]) + '-' + str(
#                             env.entity2id_[et_name]),
#                         'name': rel_name,
#                         'rel_id': env.relation2id_[rel_name],
#                         'source': env.entity2id_[es_name],
#                         'target': env.entity2id_[et_name],
#                         'es_name': es_name,
#                         'et_name': et_name,
#                     })
#                 else:
#                     links.append({
#                         'id': str(env.entity2id_[et_name]) + '-' + str(env.relation2id_[rel_name]) + '-' + str(
#                             env.entity2id_[es_name]),
#                         'name': rel_name,
#                         'rel_id': env.relation2id_[rel_name],
#                         'source': env.entity2id_[et_name],
#                         'target': env.entity2id_[es_name],
#                         'es_name': et_name,
#                         'et_name': es_name,
#                     })
#             else:
#                 rel_name = path[i]
#                 es_name = et_name
#
#     def findPaths(start, end, relation=None, path=[]):
#         path = path.copy()
#         if relation:
#             path.append(relation)
#         path.append(start)
#         if start == end:
#             paths.append(path)
#             insertKgData(path)
#             return
#
#         if len(path) < (hop + 1) * 2 - 1:
#             for action in kb.getPathsFrom(start):
#                 nextEntity = action.connected_entity
#                 connectRelation = action.relation
#                 if not nextEntity in path:
#                     findPaths(nextEntity, end, connectRelation, path)
#
#     findPaths(sourceEntity, targetEntity)
#
#     return paths, {"nodes": datafilter(nodes), "links": datafilter(links)}
