from django.shortcuts import render
from django.http import HttpResponse
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from deepPath.src.DFS import dfs
from deepPath.src.find_entity_similar import get_similar_entities
from deepPath.src.fact_prediction import factPrediction
from deepPath.src.subgraph_support_sort import subGraphSupportSort
from django.conf import settings
import os
# Create your views here.


def get_sub_graph(request):
    if request.method == 'GET':
        sourceNode = request.GET.get("sourceEntity")
        relation = request.GET.get("relation")
        targetNode = request.GET.get("targetEntity")
        hop = request.GET.get("hop")
        paths, subGraph = dfs(sourceNode, relation, targetNode, int(hop))
        try:
            return HttpResponse(json.dumps({'state': 200, 'data': subGraph}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')


def get_test_data(request):
    if request.method == 'GET':
        relation = request.GET.get("task")
        try:
            relation = '_'.join(relation.split(':'))
            f = open(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/tasks/' + relation + '/sort_test.pairs'))
            test_data = f.readlines()
            f.close()
            test_pairs = []
            for line in test_data:
                e1 = line.split(',')[0].replace('thing$', '')
                e2 = line.split(',')[1].split(':')[0].replace('thing$', '')
                label = 1 if line[-2] == '+' else 0
                test_pairs.append((e1, e2, label))
            return HttpResponse(json.dumps({'state': 200, 'data': list(test_pairs)}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')


def get_rulePaths(request):
    if request.method == 'GET':
        relation = request.GET.get("task")
        stats = {}
        rulePaths = []
        supports = []
        relation = '_'.join(relation.split(':'))
        f = open(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/tasks/' + relation + '/path_stats.txt'))
        path_freq = f.readlines()
        f.close()
        f2 = open(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/tasks/' + relation + '/path_to_use.txt'))
        paths_to_use = f2.readlines()
        f2.close()

        # f3 = open(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/' + 'relation2id.txt'))
        # content2 = f3.readlines()
        # f3.close()
        # relation2id = {}
        # for line in content2:
        #     relation2id[line.split()[0]] = int(line.split()[1])
        # relation2vec = np.loadtxt(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/' + '/relation2vec.bern'))

        # def path_embedding(path):
        #     embeddings = [relation2vec[relation2id[rel], :] for rel in path]
        #     embeddings = np.reshape(embeddings, (-1, 100))
        #     path_encoding = np.sum(embeddings, axis=0)
        #     return np.reshape(path_encoding, (-1, 100))

        for line in path_freq:
            path = line.split('\t')[0]
            num = int(line.split('\t')[1])
            stats[path] = num
        # use_path_sim = {}
        for line in paths_to_use:
            path = line.rstrip()
            length = len(path.split(' -> '))
            if length <= 3:
                if path in stats:
                    rulePaths.append({"path": path, "weight": stats[path]})
                    supports.append({"path": path, "weight": stats[path]})
                else:
                    # sim_sort = []
                    # use_path_embedding = path_embedding(path.split(' -> '))
                    # for stats_path in stats:
                    #     stats_path_embedding = path_embedding(stats_path.split(' -> '))
                    #     cos_sim = cosine_similarity(use_path_embedding, stats_path_embedding)
                    #     cos_sim = round(cos_sim[0][0], 2)
                    #     _weight = cos_sim * stats[stats_path]
                    #     sim_sort.append([stats_path, cos_sim, _weight])
                    #     sim_sort.sort(key=lambda x: x[1], reverse=True)
                    #     use_path_sim[path] = sim_sort
                    supports.append({"path": path, "weight": 0})
        rulePaths.sort(key = lambda x:x["weight"], reverse=True)
        supports.sort(key = lambda x:x["weight"], reverse=True)
        try:
            return HttpResponse(json.dumps({'state': 200, 'data': {"rulePaths": list(rulePaths), "supportPaths": list(supports)}}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')


def get_similar_json(request):
    if request.method == 'GET':
        entity_name = request.GET.get("sourceEntity")
        cos_score_sort = get_similar_entities(entity_name)
        try:
            return HttpResponse(json.dumps({'state': 200, 'data': cos_score_sort}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')


def get_prediction_result(request):
    if request.method == 'GET':
        sample = request.GET.get("sample")
        sample = json.loads(sample)
        relation = sample["relation"]
        feature_paths = request.GET.getlist("path_stats[]")
        relation = '_'.join(relation.split(':'))
        fact_prediction = factPrediction(relation)
        existPaths, existNodes, existLinks, prediction_link, existPathsDetails = fact_prediction.prediction(sample,feature_paths)
        try:
            return HttpResponse(json.dumps({'state': 200, 'data': {"existPaths": existPaths, "prediction_link": prediction_link, "existNodes": existNodes, "existLinks": existLinks, "existPathsDetails": existPathsDetails}}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')


def get_subgraph_support_sort(request):
    if request.method == 'GET':
        entities = request.GET.getlist("entities[]")
        feature_paths = request.GET.getlist("path_stats[]")
        relation = request.GET.get("relation")
        relation = '_'.join(relation.split(':'))
        targetEntity = request.GET.get("targetEntity")
        subGraph_support_sort = subGraphSupportSort(relation)
        subGraph_score_sort = subGraph_support_sort.get_subgraph_sort(entities, targetEntity, feature_paths)
        try:
            return HttpResponse(json.dumps({'state': 200, 'data': subGraph_score_sort}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')
