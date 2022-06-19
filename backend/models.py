from django.db import models

# Create your models here.


class Username(models.Model):
    username = models.CharField(primary_key=True, max_length=50)
    sex = models.CharField(max_length= 10)
    age = models.IntegerField()
    education = models.CharField(max_length=20)
    research = models.CharField(max_length=100)


class pathScore(models.Model):
    s_id = models.AutoField(primary_key=True)
    path_id = models.CharField(max_length=50)
    score = models.FloatField(blank=True, null=True)
    predictionTask = models.CharField(max_length=50)
