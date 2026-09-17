from rest_framework import serializers
from .models import Project, Phase
class ProjectSerializer(serializers.ModelSerializer):
    class Meta: model=Project; fields='__all__'
class PhaseSerializer(serializers.ModelSerializer):
    class Meta: model=Phase; fields='__all__'
