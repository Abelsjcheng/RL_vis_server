from django.http import HttpResponse
import json

from backend import models


def saveScore(request):
    if request.method == 'POST':
        params = json.loads(request.body)
        try:
            models.pathScore.objects.create(path_id=params['path_id'], score=params['score'], predictionTask=params['predictionTask'])
            return HttpResponse(json.dumps({'state': 'success'}), content_type='application/json')
        except:
            return HttpResponse(json.dumps({'state': 'fail'}), content_type='application/json')
