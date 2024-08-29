from rest_framework import serializers
from .models import *

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['school_name', 'school_address', 'contact_number', 'contact_email', 'school_admin_first_name']

class SchoolAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = School_admin
        fields = ['School_admin_name', 'school_id']