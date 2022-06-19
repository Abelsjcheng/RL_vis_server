from django.contrib import admin
from backend import models
# Register your models here.


class UsernameAdmin(admin.ModelAdmin):
    list_display = ('username', 'sex', 'age', 'education', 'research')
    search_fields = ('username', 'sex', 'age', 'education', 'research')


class pathScoreAdmin(admin.ModelAdmin):
    list_display = ('s_id', 'path_id', 'score', 'predictionTask')
    search_fields = ('s_id', 'path_id', 'score', 'predictionTask')


admin.site.register(models.Username, UsernameAdmin)
admin.site.register(models.pathScore, pathScoreAdmin)
