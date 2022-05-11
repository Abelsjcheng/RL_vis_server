#!/usr/bin/python
from queue import Queue

import numpy as np
from django.conf import settings
from deepPath.src.BFS.KB import *
import os


class factPrediction(object):
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
		self.kb_inv = KB()

		f = open(os.path.join(dataPath_ + '/graph.txt'))
		kb_lines = f.readlines()
		f.close()

		for line in kb_lines:
			e1 = line.split()[0]
			rel = line.split()[1]
			e2 = line.split()[2]
			self.kb.addRelation(e1, rel, e2)
			self.kb_inv.addRelation(e2, rel, e1)

	def prediction(self, sample, statsPaths):
		nodes = set()
		links = set()
		existPath = []
		for index, path in enumerate(statsPaths):
			pathName = []
			relations = path.split(' -> ')

			for rel in relations:
				pathName.append(rel)
			entity_list1, path_list1 = self.BFS(self.kb, sample["sourceEntity"], sample["targetEntity"], pathName)
			if entity_list1 is not None and path_list1 is not None:
				nodes = nodes | entity_list1
				links = links | path_list1
				existPath.append(index)
		nodes.remove(self.entity2id[sample["sourceEntity"]])
		nodes.remove(self.entity2id[sample["targetEntity"]])
		return list(nodes), list(links), existPath

	def BFS(self, kb, entity1, entity2, path):
		res = foundPaths(kb)
		res.markFound(entity1, None, None)
		start = 0
		q = [[entity1]]
		while start < len(path):
			left_step = path[start]
			if start + 1 >= len(q):
				q.append([])
			while len(q[start]) > 0:
				curNode = q[start].pop()
				for path_ in kb.getPathsFrom(curNode):
					nextEntity = path_.connected_entity
					connectRelation = path_.relation
					if not res.isFound(nextEntity) and left_step == connectRelation:
						res.markFound(nextEntity, curNode, connectRelation)
						q[start+1].append(nextEntity)
			start += 1
			if entity2 in q[start] and start == len(path):
				entity_list, path_list = res.reconstructPath(entity1, entity2, self.entity2id, self.relation2id)
				return entity_list, path_list

		return None, None


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
