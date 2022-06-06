#!/usr/bin/python
from queue import Queue

import numpy as np
from django.conf import settings
from deepPath.src.BFS.KB import *
import json
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

		with open(os.path.join(dataPath_ + '/graph.txt')) as f:
			content = f.readlines()
			for line in content:
				ent1, rel, ent2 = line.rsplit()
				self.kb.addRelation(ent1, rel, ent2)

	def prediction(self, sample, statsPaths):
		nodes = set()
		links = set()
		existPaths = {}
		existNodes = {}
		existLinks = {}
		existPathsDetails = {}
		for index, path in enumerate(statsPaths):
			pathName = []
			relations = path.split(' -> ')
			for rel in relations:
				pathName.append(rel)
			# 目前3跳子图只能支持3跳路径
			if len(pathName) > 3:
				continue
			entity_list, link_list, path_count, path_all = self.BFS(sample["sourceEntity"], sample["targetEntity"], pathName)

			if len(entity_list) and len(link_list):
				entity_list.remove(sample["sourceEntity"])
				entity_list.remove(sample["targetEntity"])
				nodes = nodes | entity_list
				links = links | link_list
				existNodes[path] = list(entity_list)
				existLinks[path] = list(link_list)
				existPaths[path] = path_count
				existPathsDetails[path] = path_all

		prediction_link = {
			'id': str(self.entity2id[sample["sourceEntity"]]) + '-' + str(
				self.relation2id[sample["relation"]]) + '-' + str(
				self.entity2id[sample["targetEntity"]]),
			'name': sample["relation"],
			'rel_id': self.relation2id[sample["relation"]],
			'source': self.entity2id[sample["sourceEntity"]],
			'target': self.entity2id[sample["targetEntity"]],
			'es_name': sample["sourceEntity"],
			'et_name': sample["targetEntity"],
		}
		if len(nodes) and len(links):
			return existPaths, existNodes, existLinks, prediction_link, existPathsDetails
		else:
			return None, None, None, prediction_link, None

	def BFS(self, sourceEntity, targetEntity, path):
		res = foundPaths(self.kb)
		res.markFound(sourceEntity, None, None)
		entity_all = set()
		link_all = set()
		path_all = []
		path_count = 0
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
							res.markFound(nextEntity, curNode, connectRelation)
							entity_list, link_list = res.reconstructPath(sourceEntity, targetEntity, self.entity2id, self.relation2id)
							entity_all = entity_all | set(entity_list)
							link_all = link_all | link_list
							path_all.append(entity_list)
							path_count = path_count + 1
							res.markNoFound(nextEntity)
						else:
							res.markFound(nextEntity, curNode, connectRelation)
							q[start + 1].append(nextEntity)

		return entity_all, link_all, path_count, path_all
	# def BFS(self, kb, entity1, entity2, path):
	# 	res = foundPaths(kb)
	# 	res.markFound(entity1, None, None)
	# 	start = 0
	# 	q = [[entity1]]
	# 	while start < len(path):
	# 		left_step = path[start]
	# 		if start + 1 >= len(q):
	# 			q.append([])
	# 		while len(q[start]) > 0:
	# 			curNode = q[start].pop()
	# 			for path_ in kb.getPathsFrom(curNode):
	# 				nextEntity = path_.connected_entity
	# 				connectRelation = path_.relation
	# 				if not res.isFound(nextEntity) and left_step == connectRelation:
	# 					res.markFound(nextEntity, curNode, connectRelation)
	# 					q[start+1].append(nextEntity)
	# 		start += 1
	# 		if entity2 in q[start] and start == len(path):
	# 			entity_list, link_list = res.reconstructPath(entity1, entity2, self.entity2id, self.relation2id)
	# 			return entity_list, link_list
	#
	# 	return None, None


class foundPaths(object):
	def __init__(self, kb):
		self.entities = {}
		for entity, relations in kb.entities.items():
			self.entities[entity] = (False, "", "")

	def isFound(self, entity):
		return self.entities[entity][0]

	def markFound(self, entity, prevNode, relation):
		self.entities[entity] = (True, prevNode, relation)

	def markNoFound(self, entity):
		self.entities[entity] = (False, "", "")

	def reconstructPath(self, entity1, entity2, entity2id, relation2id):
		entity_list = []
		link_list = set()
		curNode = entity2
		while curNode != entity1:
			entity_list.append(curNode)
			preNode = self.entities[curNode][1]
			preRelation = self.entities[curNode][2]
			# link.append(preRelation)
			link_list.add(json.dumps({
				"es_name": preNode,
				"rel_id": relation2id[preRelation],
				"et_name": curNode
			}))
			# if not preRelation.endswith('_inv'):
			# 	link_list.add(json.dumps({
			# 		"es_name": preNode,
			# 		"rel_id": relation2id[preRelation],
			# 		"et_name": curNode
			# 	}))
			# else:
			# 	link_list.add(json.dumps({
			# 		"es_name": curNode,
			# 		"rel_id": relation2id[preRelation],
			# 		"et_name": preNode
			# 	}))
			curNode = preNode
		entity_list.append(curNode)
		entity_list.reverse()
		return entity_list, link_list

	def __str__(self):
		res = ""
		for entity, status in self.entities.items():
			res += entity + "[{},{},{}]".format(status[0], status[1], status[2])
		return res
