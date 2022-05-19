#!/usr/bin/python
from queue import Queue

import numpy as np
from django.conf import settings
from deepPath.src.BFS.KB import *
import json
import os


class subGraphSupportSort(object):
    """knowledge graph environment definition"""

    def __init__(self, relation):
        dataPath_ = settings.BASE_DIR + '/deepPath/NELL-995/tasks/' + relation
        ent_id_path = settings.BASE_DIR + '/deepPath/NELL-995/entity2id.txt'
        rel_id_path = settings.BASE_DIR + '/deepPath/NELL-995/relation2id.txt'
        f1 = open(os.path.join(ent_id_path))
        f2 = open(os.path.join(rel_id_path))
        content1 = f1.readlines()
        content2 = f2.readlines()
        f1.close()
        f2.close()

        self.entity2id = {}
        self.relation2id = {}
        for line in content1:
            self.entity2id[line.split()[0]] = int(line.split()[1])

        for line in content2:
            self.relation2id[line.split()[0]] = int(line.split()[1])

        self.kb = KB()

        with open(os.path.join(dataPath_ + '/graph.txt')) as f:
            content = f.readlines()
            for line in content:
                ent1, rel, ent2 = line.rsplit()
                self.kb.addRelation(ent1, rel, ent2)

    def get_subgraph_sort(self, entities, targetEntity, feature_paths):
        subGraph_score = []
        for entity in entities:
            support_value = 0
            for index, feature_path in enumerate(feature_paths):
                pathName = []
                feature_path = json.loads(feature_path)
                relations = feature_path["path"].split(' -> ')
                for rel in relations:
                    pathName.append(rel)
                if len(pathName) > 3:
                    continue
                count = self.BFS(entity, targetEntity, pathName)
                support_value += count * feature_path["weight"]
            subGraph_score.append({"entityName": entity, "score": support_value})

        return sorted(subGraph_score, key=lambda x: x["score"], reverse=True)

    def BFS(self, sourceEntity, targetEntity, path):
        res = foundPaths(self.kb)
        res.markFound(sourceEntity, None, None)
        count = 0
        q = [[sourceEntity]]
        for start in range(0, len(path)):
            left_step = path[start]
            if start + 1 >= len(q):
                q.append([])
            while len(q[start]) > 0:
                curNode = q[start].pop()
                for path_ in self.kb.getPathsFrom(curNode):
                    nextEntity = path_.connected_entity
                    connectRelation = path_.relation
                    if not res.isFound(nextEntity) and left_step == connectRelation:
                        if targetEntity == nextEntity and start == len(path) - 1:
                            count += 1
                        else:
                            res.markFound(nextEntity, curNode, connectRelation)
                            q[start + 1].append(nextEntity)
        return count


class foundPaths(object):
    def __init__(self, kb):
        self.entities = {}
        for entity, relations in kb.entities.items():
            self.entities[entity] = (False, "", "")

    def isFound(self, entity):
        return self.entities[entity][0]

    def markFound(self, entity, prevNode, relation):
        self.entities[entity] = (True, prevNode, relation)

    def reconstructPath(self, entity1, entity2, entity2id, relation2id):
        entity_list = set()
        path_list = set()
        link = []
        curNode = entity2
        while curNode != entity1:
            entity_list.add(entity2id[curNode])
            preNode = self.entities[curNode][1]
            preRelation = self.entities[curNode][2]
            link.append(preRelation)
            if not preRelation.endswith('_inv'):
                path_list.add(
                    str(entity2id[preNode]) + '-' + str(relation2id[preRelation]) + '-' + str(
                        entity2id[curNode])
                )
            else:
                path_list.add(
                    str(entity2id[curNode]) + '-' + str(relation2id[preRelation]) + '-' + str(
                        entity2id[preNode])
                )
            curNode = preNode
        entity_list.add(entity2id[curNode])
        print('--------------')
        return entity_list, path_list

    def __str__(self):
        res = ""
        for entity, status in self.entities.items():
            res += entity + "[{},{},{}]".format(status[0], status[1], status[2])
        return res
