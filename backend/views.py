from django.shortcuts import render
from django.http import HttpResponse
import json
from deepPath.src.DFS import dfs
from django.conf import settings
import os

# Create your views here.


def get_sub_graph(request):
    if request.method == 'GET':
        sourceNode = request.GET.get("sourceEntity")
        relation = request.GET.get("relation")
        targetNode = request.GET.get("targetEntity")
        hop = request.GET.get("hop")
        try:
            paths, subGraph = dfs(sourceNode, relation, targetNode, int(hop))
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


def get_path_stats(request):
    if request.method == 'GET':
        relation = request.GET.get("task")
        stats = []
        relation = '_'.join(relation.split(':'))
        f = open(os.path.join(settings.BASE_DIR, 'deepPath/NELL-995/tasks/' + relation + '/path_stats.txt'))
        path_freq = f.readlines()
        f.close()
        for line in path_freq:
            path = line.split('\t')[0]
            num = int(line.split('\t')[1])
            stats.append({"path": path, "weight": num})
        try:

            return HttpResponse(json.dumps({'state': 200, 'data': list(stats)}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 500, 'data': None}), content_type='application/json')